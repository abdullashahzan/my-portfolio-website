from pathlib import Path
import shutil,re
root=Path(__file__).resolve().parents[1]
dest=root/'portfolio/main/static/main/phosphene'
dest.mkdir(exist_ok=True)
for old in dest.glob('index-*'):old.unlink()
for f in (root/'phosphene/dist/assets').iterdir():shutil.copy(f,dest/f.name)
shutil.copy(root/'phosphene/public/dot.svg',dest/'dot.svg')
s=(root/'phosphene/dist/index.html').read_text()
assets=re.findall(r'<(?:script[^>]+src="/assets/[^>]+></script|link[^>]+href="/assets/[^>]+)>',s)
output='\n'.join(assets)
output=re.sub(r'"/assets/([^"]+)"',lambda m:'"{% static \'main/phosphene/'+m[1]+'\' %}"',output)
(root/'portfolio/main/templates/main/editorial_assets.html').write_text('{% load static %}\n'+output+'\n')
