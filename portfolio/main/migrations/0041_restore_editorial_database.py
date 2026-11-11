from django.db import migrations
from django.utils.html import strip_tags


def restore(apps, schema_editor):
    alias = schema_editor.connection.alias
    def model(name):
        return apps.get_model('main', name).objects.using(alias)
    me = model('Me').first()
    name = me.name.split(maxsplit=1) if me else ['', '']
    presentation = model('PortfolioPresentation').first()
    settings, _ = model('SiteSettings').get_or_create(pk=1, defaults={
        'first_name': name[0], 'last_name': name[1] if len(name)>1 else '',
        'location': 'Abha, Saudi Arabia', 'email': me.email if me else '',
        'seo_title': me.name if me else '', 'seo_description': strip_tags(me.sub_title) if me else '',
        'default_persona': 'researcher', 'alter_ego_label': 'Alter ego',
        'switch_hint': 'Same person. Different priorities.', 'accent_researcher': '#FFC247', 'accent_engineer': '#6FF2B5',
        'footer_text': presentation.footer_note if presentation else '',
        'labels': {'scroll':'Scroll to explore', 'back':'Back to top', 'read_research':'Read research', 'project':'View project', 'view_record':'View record', 'certificates':'Certificates', 'experience':'Experience', 'education':'Education', 'verify':'Verify credential', 'original':'Open original', 'close':'Close', 'previous':'Previous', 'next':'Next'},
    })
    if me:
        for i,(label,url) in enumerate([('GitHub',me.github_link),('LinkedIn',me.linkedin_link),('View CV','/cv/'),('Explore archive','/explore/')]):
            if url:model('SocialLink').get_or_create(site_id=1,label=label,defaults={'url':url,'order':i})
    for key,label,prefix in [('researcher','Researcher','research'),('engineer','Engineer','engineering')]:
        about = getattr(me,prefix+'_description','') if me else ''
        if not about and me: about=strip_tags(me.description)
        row,_=model('PersonaContent').get_or_create(key=key,defaults={'label':label,'about':about,'tagline':getattr(me,prefix+'_tagline','') or (me.sub_title if me else ''),'role_line':me.main_title if me else '', 'hero_meta':me.main_title if me else ''})
        phrases = ['Cortical visual prosthetics','Independent research'] if key=='researcher' else ['Computer engineering','Infrastructure','Networking']
        for i,text in enumerate(phrases):model('FocusPhrase').get_or_create(persona_id=row.pk,text=text,defaults={'order':i})
    headings=[('about','About','About',False),('research','Research','Points of *inquiry.*',True),('projects','Projects','Built to *find out.*',True),('achievements','Achievements','Marks of *progress.*',True),('certificates','Certificates','A record of *learning.*',True),('experience','Experience','Groundwork.',False),('contact','Contact','Another point of *view?*',True)]
    for key,nav,title,show in headings:model('SectionHeading').get_or_create(key=key,defaults={'nav_label':nav,'title':title,'show_in_nav':show})
    # Preserve every source row and its legacy CV visibility. Homepage publication is independent.
    for name in ['Me','Research','TopProject','Experience','WorkExperience','Education','Achievement','PersonaContent','SiteSettings','SectionHeading']:
        cls=apps.get_model('main',name)
        fields=[f.name for f in cls._meta.fields if f.get_internal_type() in {'CharField','TextField'}]
        for row in cls.objects.using(alias).all():
            updates={f:getattr(row,f).replace(' — ', ', ').replace('—', ', ') for f in fields if isinstance(getattr(row,f),str) and '—' in getattr(row,f)}
            if updates:cls.objects.using(alias).filter(pk=row.pk).update(**updates)
    for r in model('Experience').filter(title__icontains='Huawei ICT'):
        model('Experience').filter(pk=r.pk).update(event='Huawei ICT Competition 2025-2026',level='Middle East & Central Asia (regional)',year='2025')


class Migration(migrations.Migration):
    dependencies=[('main','0040_sectionheading_certificate_featuredachievement_and_more')]
    operations=[migrations.RunPython(restore,migrations.RunPython.noop)]
