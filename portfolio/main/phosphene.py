"""Map existing admin-managed records to the editorial portfolio."""
import json
from pathlib import Path
from django.shortcuts import render
from django.templatetags.static import static
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.html import strip_tags
from .models import Me, Research, TopProject, WorkExperience, Education, Achievement, Experience


@ensure_csrf_cookie
def home(request):
    editorial = json.loads(Path(__file__).with_name('editorial_content.json').read_text())
    me = Me.objects.first()
    plain = lambda value: strip_tags(value or '').strip()
    ego = {'researcher': 'research', 'engineer': 'engineering'}.get(request.GET.get('as'), 'research')
    if ego not in {'research', 'engineering'}:
        ego = 'research'
    descriptions = {
        'research': 'I research cortical visual prosthetics while studying Computer Engineering at King Khalid University. My focus is on visual prostheses that evoke phosphenes through cortical stimulation. This is the research side of my work, alongside my engineering studies and my work in IT.',
        'engineering': 'I study Computer Engineering at King Khalid University and work as an IT Engineer at Saudicast. My work covers infrastructure, networking and procurement. This is the engineering side of my work, alongside my independent research into cortical visual prosthetics.',
    }
    taglines = {'research': 'Investigating cortical visual prosthetics.', 'engineering': 'Computer engineering, infrastructure and networks.'}
    certificates = Achievement.objects.filter(display=True).select_related('category')
    certificate_data = [{'id': a.pk, 'title': a.title, 'category': a.category.name, 'date': a.date_earned.isoformat() if a.date_earned else '', 'image': a.display_image, 'featured': a.featured, 'summary': plain(a.summary)} for a in certificates]
    milestones = [{'title': e.title, 'summary': plain(e.description), 'image': e.image_file.url if e.image_file else e.image_url} for e in Experience.objects.filter(workexperience__isnull=True)]
    milestones += [a for a in certificate_data if a['featured']]
    data = {
        'ego': ego,
        'certificateBase': static('main/phosphene/certificates/'),
        'personas': {
            'researcher': {'about': plain(getattr(me, 'research_description', '')) or editorial['personas']['researcher']['about'], 'tagline': plain(getattr(me, 'research_tagline', '')) or editorial['personas']['researcher']['tagline']},
            'engineer': {'about': plain(getattr(me, 'engineering_description', '')) or editorial['personas']['engineer']['about'], 'tagline': plain(getattr(me, 'engineering_tagline', '')) or editorial['personas']['engineer']['tagline']},
        },
        'certificates': certificate_data,
        'achievements': milestones,
        'name': me.name if me else 'Abdulla Shahzan',
        'location': 'Abha, Saudi Arabia',
        'roles': ['Computer Engineering student', 'Cortical visual prosthetics researcher', 'IT engineer'],
        'tagline': plain(getattr(me, ego + '_tagline', '')) or taglines[ego],
        'about': plain(getattr(me, ego + '_description', '')) or descriptions[ego],
        'focus': ['Cortical visual prosthetics', 'Phosphenes', 'Independent research'] if ego == 'research' else ['Computer engineering', 'Infrastructure', 'Networking'],
        'research': [{'title': r.name, 'summary': plain(r.description), 'status': r.get_status_display(), 'link': r.github_link} for r in Research.objects.order_by('updated_at')],
        'projects': [{'title': p.name, 'summary': plain(p.description), 'tags': ' / '.join(t.name for t in p.tags.all()), 'year': '[YEAR]', 'date': p.created_at.isoformat(), 'for': {'research': 'researcher', 'job': 'engineer'}.get(p.audience, 'both'), 'link': None} for p in TopProject.objects.prefetch_related('tags').order_by('-created_at')],
        'credentials': [{'role': w.role, 'institution': w.company, 'description': plain(w.description), 'dates': w.period, 'kind': 'Experience'} for w in WorkExperience.objects.all()] + [{'role': e.degree, 'institution': e.institution, 'description': e.field_of_study, 'dates': ' – '.join(filter(None, [e.start_year, e.end_year])), 'kind': 'Education'} for e in Education.objects.all()],
        'email': me.email if me else None,
        'socials': [{'label': 'GitHub', 'url': me.github_link if me else None}, {'label': 'LinkedIn', 'url': me.linkedin_link if me else None}, {'label': 'View CV', 'url': '/cv/'}, {'label': 'Explore archive', 'url': '/explore/'}],
    }
    return render(request, 'main/phosphene.html', {'portfolio_content': data})
