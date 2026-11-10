"""Prepare local originals only; no network downloads. Pillow and Poppler handle media."""
from pathlib import Path
import io, json, subprocess, tempfile
from PIL import Image, ImageOps
root = Path(__file__).resolve().parents[1] / 'phosphene'
folder = root / 'public/certificates'
thumbs = folder / 'thumbs'
thumbs.mkdir(parents=True, exist_ok=True)
manifest = {}
for source in sorted(folder.iterdir()):
    if source.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp', '.pdf'}:
        continue
    if source.suffix.lower() == '.pdf':
        with tempfile.TemporaryDirectory() as temp:
            prefix = str(Path(temp) / 'page')
            subprocess.run(['pdftoppm', '-f', '1', '-singlefile', '-scale-to', '640', '-png', str(source), prefix], check=True, capture_output=True)
            image = Image.open(prefix + '.png').convert('RGB')
    else:
        image = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    image.thumbnail((640, 640))
    for quality in range(85, 14, -5):
        output = io.BytesIO()
        image.save(output, 'WEBP', quality=quality, method=6)
        if output.tell() < 60000:
            break
    if output.tell() >= 60000:
        raise RuntimeError(f'Thumbnail exceeds 60KB: {source.name}')
    target = thumbs / (source.name + '.webp')
    target.write_bytes(output.getvalue())
    manifest['/certificates/' + source.name] = '/certificates/thumbs/' + target.name
(root / 'certificate-media.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Prepared {len(manifest)} certificate thumbnails.')
