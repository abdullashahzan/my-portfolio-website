"""Generate previews from uploaded media; remote imports are explicit and bounded."""
import io
from django.core.files.base import ContentFile
from PIL import Image, ImageOps


def prepare(record, fetch_remote=False):
    image = None
    if record.pdf and not record.image:
        import pymupdf as fitz
        with record.pdf.open('rb') as source:
            pdf = fitz.open(stream=source.read(), filetype='pdf')
            if not len(pdf): raise ValueError('Certificate PDF has no pages')
            page=pdf[0]
            pix=page.get_pixmap(matrix=fitz.Matrix(1600/max(page.rect.width,page.rect.height),1600/max(page.rect.width,page.rect.height)),alpha=False)
            image=Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
            pdf.close()
            rendered=io.BytesIO();image.save(rendered,'PNG')
            record.image.save(f'{record.pk}-pdf-page.png',ContentFile(rendered.getvalue()),save=False)
    elif record.image:
        with record.image.open('rb') as source:
            image=ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    elif fetch_remote and record.image_url:
        import requests, socket, ipaddress
        from urllib.parse import urlsplit
        url=record.image_url
        for _ in range(5):
            parsed=urlsplit(url)
            if parsed.scheme not in {'http','https'} or not parsed.hostname: raise ValueError('Unsupported image URL')
            if any(not ipaddress.ip_address(item[4][0]).is_global for item in socket.getaddrinfo(parsed.hostname,None)): raise ValueError('Image URL must be public')
            with requests.get(url,timeout=20,stream=True,allow_redirects=False) as response:
                if response.is_redirect:
                    from urllib.parse import urljoin
                    url=urljoin(url,response.headers['Location']);continue
                response.raise_for_status();data=bytearray()
                for chunk in response.iter_content(65536):
                    data.extend(chunk)
                    if len(data)>20*1024*1024:raise ValueError('Image exceeds 20 MB')
                image=ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert('RGB');break
        if image is None: raise ValueError('Too many image redirects')
    if image is None:return False
    if fetch_remote and not record.image and not record.pdf:
        downloaded=io.BytesIO();image.save(downloaded,'PNG')
        record.image.save(f'{record.pk}-remote.png',ContentFile(downloaded.getvalue()),save=False)
    width,height=image.size
    display=image.copy();display.thumbnail((1600,1600))
    display_output=io.BytesIO();display.save(display_output,'WEBP',quality=80,method=6)
    record.display.save(f'{record.pk}.webp',ContentFile(display_output.getvalue()),save=False)
    image.thumbnail((640,640))
    for quality in range(85,9,-5):
        output=io.BytesIO();image.save(output,'WEBP',quality=quality,method=6)
        if output.tell()<60000:break
    record.thumb.save(f'{record.pk}.webp',ContentFile(output.getvalue()),save=False)
    # QuerySet.update prevents recursive saves and preserves uploaded originals.
    values={'display':record.display.name,'thumb':record.thumb.name,'width':width,'height':height}
    if record.image:values['image']=record.image.name
    type(record).objects.filter(pk=record.pk).update(**values)
    return True


def needs_preview(record):
    if not (record.width and record.height and record.thumb and record.display):
        return True
    source = record.image or record.pdf
    try:
        return any(
            not preview.storage.exists(preview.name)
            or (source and source.storage.get_modified_time(source.name) > preview.storage.get_modified_time(preview.name))
            for preview in (record.thumb, record.display)
        )
    except (OSError, NotImplementedError):
        return True
