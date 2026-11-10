from pathlib import Path
import shutil,re
root=Path(__file__).resolve().parents[1]
dest=root/'portfolio/main/static/main/phosphene';dest.mkdir(exist_ok=True)
for f in (root/'phosphene/dist/assets').iterdir(): shutil.copy(f,dest/f.name)
shutil.copy(root/'phosphene/public/dot.svg',dest/'dot.svg')
s=(root/'phosphene/dist/index.html').read_text()
s=re.sub(r'"/assets/([^"]+)"',lambda m:'"{% static \'main/phosphene/'+m[1]+'\' %}"',s)
s=s.replace('href="/dot.svg"','href="{% static \'main/phosphene/dot.svg\' %}"')
s=s.replace('<main id="app"></main>', '''{{ portfolio_content|json_script:"portfolio-content" }}<main id="app"><section class="hero" id="top"><h1>{{ portfolio_content.name }}</h1><p>{{ portfolio_content.tagline }}</p></section><section id="about"><h2>About</h2><p>{{ portfolio_content.about }}</p></section><section id="research"><h2>Research</h2>{% for r in portfolio_content.research %}<article><h3>{{ r.title }}</h3><p>{{ r.summary }}</p><span>{{ r.status }}</span>{% if r.link %}<a href="{{ r.link }}">Read research</a>{% endif %}</article>{% endfor %}</section><section id="projects"><h2>Projects</h2>{% for p in portfolio_content.projects %}<article><h3>{{ p.title }}</h3><p>{{ p.summary }}</p></article>{% endfor %}</section><section><h2>Experience and education</h2>{% for r in portfolio_content.credentials %}<article><h3>{{ r.role }}</h3><p>{{ r.institution }} / {{ r.dates }}</p><p>{{ r.description }}</p></article>{% endfor %}</section><section id="contact"><h2>Contact</h2>{% for s in portfolio_content.socials %}{% if s.url %}<p><a href="{{ s.url }}">{{ s.label }}</a></p>{% endif %}{% endfor %}</section></main>''')
(root/'portfolio/main/templates/main/phosphene.html').write_text('{% load static %}\n'+s)
