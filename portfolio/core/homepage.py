"""Database-backed editorial portfolio. No fixture or content-file fallback."""
from django.shortcuts import render
from datetime import date
import re
from django.template.loader import render_to_string
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.html import strip_tags
from .models import SiteSettings, Persona, Section, SocialLink, Research, Project, Achievement, Certificate, TimelineEntry

ORDER=['about','research','projects','achievements','certificates','experience','contact']

def plain(value):return strip_tags(value or '').strip()

def description(row):
    shared=plain(getattr(row,'description',getattr(row,'summary',getattr(row,'field_of_study',''))))
    return {p:plain(getattr(row,'desc_'+p,'')) or shared for p in ['researcher','engineer']}

def base(row):
    return {'id':row.pk,'order':row.order,'for':{'research':'researcher','job':'engineer'}.get(row.audience,row.audience),'desc':description(row)}

def timeline(row):
    return {'start':row.start,'end':row.end,'timeline':bool(row.start and row.show_on_timeline)}

def relevance(rows,persona):
    return sorted(rows,key=lambda r:(0 if r['for']==persona else 1 if r['for']=='both' else 2,r['order'],r['id']))

@ensure_csrf_cookie
def home(request):
    site=SiteSettings.objects.get(pk=1)
    personas={r.key:{'label':r.label,'tagline':r.tagline,'roleLine':r.role_line,'about':r.about,'heroMeta':r.hero_meta.splitlines(),'focus':r.focus_phrases.splitlines()} for r in Persona.objects.all()}
    selected=request.GET.get('as')
    if selected not in personas:selected=request.COOKIES.get('portfolio-persona')
    if selected not in personas:selected=site.default_persona
    headings={r.key:r for r in Section.objects.all()}
    research=[dict(base(r),title=r.title,summary=plain(r.description),status=r.get_status_display(),link=r.url) for r in Research.objects.filter(is_published=True).order_by('order','pk')]
    projects=[dict(base(r),title=r.title,year=r.year,tags=[tag.strip() for tag in r.tags.split(',') if tag.strip()],link=r.url) for r in Project.objects.filter(is_published=True).order_by('order','pk')]
    achievements=[dict(base(r),title=r.title,event=r.event,level=r.level,year=r.year,link=r.url,image=r.image.url if r.image else r.image_url) for r in Achievement.objects.filter(is_published=True).order_by('order','pk')]
    certificates=[]
    for r in Certificate.objects.filter(is_published=True).order_by('order','pk'):
        has_media=bool(r.image or r.image_url or r.pdf)
        certificates.append(dict(base(r),title=r.title,issuer=r.issuer,date=r.earned.isoformat() if r.earned else '',credentialId=r.credential_id,url=r.credential_url,image=r.image.url if r.image else r.image_url,original=r.pdf.url if r.pdf else '',thumbnail=r.thumb.url if r.thumb else '',displayImage=r.display.url if r.display else '',download=r.pdf.url if r.pdf else (r.image.url if r.image else r.image_url),ratio=r.width/r.height if r.width and r.height else (None if has_media else 1.414),has_media=has_media,width=r.width,height=r.height))
    credentials=[dict(base(r), **timeline(r), role=r.title, institution=r.organization,
                      dates=r.period_label or ' / '.join(d.isoformat() for d in (r.start,r.end) if d),
                      year_only=bool(re.fullmatch(r'\s*\d{4}\s*/\s*\d{4}\s*', r.period_label)),
                      kind=site.labels.get('experience' if r.kind=='work' else 'education',''))
                 for kind in ('work','education') for r in TimelineEntry.objects.filter(is_published=True,kind=kind)]
    today=date.today()
    dated=[r for r in credentials if r['timeline'] and r['start']<=today and (not r['end'] or r['end']>=r['start'])]
    first_year=min((r['start'].year for r in dated),default=today.year)
    axis_start=date(first_year,1,1);axis_end=date(today.year+1,1,1);span=(axis_end-axis_start).days
    for r in credentials:
        r['timeline']=r in dated
        if r['timeline']:
            finish=min(r['end'] or today,today)
            r['bar_left']=100*(r['start']-axis_start).days/span
            r['bar_width']=max(.1,100*(finish-r['start']).days/span)
            r['exact_dates']=f"{r['start'].isoformat()} / {r['end'].isoformat() if r['end'] else today.isoformat()}"
            if r['year_only']:
                r['exact_dates']=r['dates']
        r['start']=r['start'].isoformat() if r['start'] else ''
        r['end']=r['end'].isoformat() if r['end'] else ''
    years=[{'year':year,'position':100*(date(year,1,1)-axis_start).days/span} for year in range(first_year,today.year+1)] if dated else []
    socials=list(SocialLink.objects.filter(visible=True).values('label','url'))
    data={'persona':selected,'defaultPersona':site.default_persona,'personas':personas,'alterEgoLabel':site.alter_ego_label,'switchHint':site.switch_hint,'name':f'{site.first_name} {site.last_name}'.strip(),'firstName':site.first_name,'lastName':site.last_name,'location':site.location,'email':site.email,'labels':site.labels,'accents':{'researcher':site.accent_researcher,'engineer':site.accent_engineer},'socials':socials,'research':research,'projects':projects,'achievements':achievements,'certificates':certificates,'credentials':credentials,'views':{},'active':{}}
    for key in personas:
        active={'about':bool(personas[key]['about']),'research':bool(research),'projects':bool(projects),'achievements':bool(achievements),'certificates':bool(certificates),'experience':bool(credentials),'contact':bool(site.email or socials)}
        active={k:bool(v and k in headings and headings[k].enabled) for k,v in active.items()}
        data['active'][key]=active
        ctx={'site':site,'persona':key,'profile':personas[key],'personas':personas,'headings':headings,'active':active,'research':research,'projects':relevance(projects,key),'achievements':relevance(achievements,key),'certificates':relevance(certificates,key),'credentials':credentials,'socials':socials,'timeline_years':years}
        data['views'][key]=render_to_string('main/editorial_body.html',ctx)
    navigation=[{'key':k,'label':headings[k].nav_label} for k in ORDER if k in headings and headings[k].show_in_nav and any(data['active'][p][k] for p in personas)]
    data['navigation']=navigation
    response=render(request,'main/phosphene.html',{'site':site,'selected':selected,'personas':personas,'navigation':navigation,'portfolio_content':data,'initial_html':data['views'][selected]})
    response.set_cookie('portfolio-persona',selected,max_age=31536000,samesite='Lax',secure=request.is_secure())
    return response
