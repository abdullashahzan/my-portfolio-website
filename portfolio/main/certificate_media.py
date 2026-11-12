"""Generate previews from uploaded media; remote imports are explicit and bounded."""
import io
from django.core.files.base import ContentFile
from PIL import Image, ImageOps


def prepare_certificate(record, fetch_remote=False):
    image = None
    if record.original_pdf and not record.image_file:
        import pymupdf as fitz
        with record.original_pdf.open('rb') as source:
            pdf = fitz.open(stream=source.read(), filetype='pdf')
            if not len(pdf): raise ValueError('Certificate PDF has no pages')
            page=pdf[0]
            pix=page.get_pixmap(matrix=fitz.Matrix(1600/max(page.rect.width,page.rect.height),1600/max(page.rect.width,page.rect.height)),alpha=False)
            image=Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
            pdf.close()
            rendered=io.BytesIO();image.save(rendered,'PNG')
            record.image_file.save(f'{record.pk}-pdf-page.png',ContentFile(rendered.getvalue()),save=False)
    elif record.image_file:
        with record.image_file.open('rb') as source:
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
    width,height=image.size
    display=image.copy();display.thumbnail((1600,1600))
    display_output=io.BytesIO();display.save(display_output,'WEBP',quality=80,method=6)
    record.display_preview.save(f'{record.pk}.webp',ContentFile(display_output.getvalue()),save=False)
    image.thumbnail((640,640))
    for quality in range(85,9,-5):
        output=io.BytesIO();image.save(output,'WEBP',quality=quality,method=6)
        if output.tell()<60000:break
    record.thumbnail.save(f'{record.pk}.webp',ContentFile(output.getvalue()),save=False)
    # QuerySet.update prevents recursive saves and preserves uploaded originals.
    values={'display_preview':record.display_preview.name,'thumbnail':record.thumbnail.name,'image_width':width,'image_height':height}
    if record.image_file:values['image_file']=record.image_file.name
    type(record).objects.filter(pk=record.pk).update(**values)
    return True
