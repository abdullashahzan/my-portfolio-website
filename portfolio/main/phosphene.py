"""Database-backed editorial portfolio. No fixture or content-file fallback."""
from django.shortcuts import render
from django.template.loader import render_to_string
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.html import strip_tags
from .models import SiteSettings, PersonaContent, SectionHeading, Research, TopProject, Certificate, Experience, WorkExperience, Education

ORDER=['about','research','projects','achievements','certificates','experience','contact']

def plain(value):return strip_tags(value or '').strip()

def description(row):
    shared=plain(getattr(row,'description',getattr(row,'summary',getattr(row,'field_of_study',''))))
    return {p:plain(getattr(row,'desc_'+p,'')) or shared for p in ['researcher','engineer']}

def base(row):
    return {'id':row.pk,'order':row.order,'for':{'research':'researcher','job':'engineer'}.get(row.audience,row.audience),'desc':description(row)}

def relevance(rows,persona):
    return sorted(rows,key=lambda r:(0 if r['for']==persona else 1 if r['for']=='both' else 2,r['order'],r['id']))

@ensure_csrf_cookie
def home(request):
    site=SiteSettings.objects.get(pk=1)
    personas={r.key:{'label':r.label,'tagline':r.tagline,'roleLine':r.role_line,'about':r.about,'heroMeta':r.hero_meta.splitlines(),'focus':list(r.phrases.values_list('text',flat=True))} for r in PersonaContent.objects.prefetch_related('phrases')}
    selected=request.GET.get('as')
    if selected not in personas:selected=request.COOKIES.get('portfolio-persona')
    if selected not in personas:selected=site.default_persona
    headings={r.key:r for r in SectionHeading.objects.all()}
    research=[dict(base(r),title=r.name,summary=plain(r.description),status=r.get_status_display(),link=r.github_link) for r in Research.objects.filter(is_published=True).order_by('order','pk')]
    projects=[dict(base(r),title=r.name,year=r.year,tags=[t.name for t in r.tags.all()],link=r.link) for r in TopProject.objects.filter(is_published=True).prefetch_related('tags').order_by('order','pk')]
    achievements=[dict(base(r),title=r.title,event=r.event,level=r.level,year=r.year,link=r.link,image=r.image_file.url if r.image_file else r.image_url) for r in Experience.objects.filter(is_published=True,workexperience__isnull=True).order_by('order','pk')]
    certificates=[]
    for r in Certificate.objects.filter(is_published=True).select_related('category').order_by('order','pk'):
        has_media=bool(r.image_file or r.image_url or r.original_pdf)
        certificates.append(dict(base(r),title=r.title,issuer=r.issuer,date=r.date_earned.isoformat() if r.date_earned else '',credentialId=r.credential_id,url=r.credential_url,image=r.image_file.url if r.image_file else r.image_url,original=r.original_pdf.url if r.original_pdf else '',thumbnail=r.thumbnail.url if r.thumbnail else '',ratio=r.image_width/r.image_height if r.image_width and r.image_height else (None if has_media else 1.414),has_media=has_media,width=r.image_width,height=r.image_height))
    credentials=[dict(base(r),role=r.role,institution=r.company,dates=r.period,kind=site.labels.get('experience','')) for r in WorkExperience.objects.filter(is_published=True).order_by('order','pk')]
    credentials += [dict(base(r),role=r.degree,institution=r.institution,dates=' / '.join(filter(None,[r.start_year,r.end_year])),kind=site.labels.get('education','')) for r in Education.objects.filter(is_published=True).order_by('order','pk')]
    socials=list(site.socials.filter(visible=True).values('label','url'))
    data={'persona':selected,'defaultPersona':site.default_persona,'personas':personas,'alterEgoLabel':site.alter_ego_label,'switchHint':site.switch_hint,'name':f'{site.first_name} {site.last_name}'.strip(),'firstName':site.first_name,'lastName':site.last_name,'location':site.location,'email':site.email,'labels':site.labels,'accents':{'researcher':site.accent_researcher,'engineer':site.accent_engineer},'socials':socials,'research':research,'projects':projects,'achievements':achievements,'certificates':certificates,'credentials':credentials,'views':{},'active':{}}
    for key in personas:
        active={'about':bool(personas[key]['about']),'research':bool(research),'projects':bool(projects),'achievements':bool(achievements),'certificates':bool(certificates),'experience':bool(credentials),'contact':bool(site.email or socials)}
        active={k:bool(v and k in headings and headings[k].enabled) for k,v in active.items()}
        data['active'][key]=active
        ctx={'site':site,'persona':key,'profile':personas[key],'personas':personas,'headings':headings,'active':active,'research':research,'projects':relevance(projects,key),'achievements':relevance(achievements,key),'certificates':relevance(certificates,key),'credentials':credentials,'socials':socials}
        data['views'][key]=render_to_string('main/editorial_body.html',ctx)
    navigation=[{'key':k,'label':headings[k].nav_label} for k in ORDER if k in headings and headings[k].show_in_nav and any(data['active'][p][k] for p in personas)]
    data['navigation']=navigation
    response=render(request,'main/phosphene.html',{'site':site,'selected':selected,'personas':personas,'navigation':navigation,'portfolio_content':data,'initial_html':data['views'][selected]})
    response.set_cookie('portfolio-persona',selected,max_age=31536000,samesite='Lax',secure=request.is_secure())
    return response
