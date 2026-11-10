"""Map existing admin-managed records to the editorial portfolio."""
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.html import strip_tags
from .models import Me, Research, TopProject, WorkExperience, Education


@ensure_csrf_cookie
def home(request):
    me = Me.objects.first()
    plain = lambda value: strip_tags(value or '').strip()
    data = {
        'name': me.name if me else 'Abdulla Shahzan',
        'location': 'Abha, Saudi Arabia',
        'roles': ['Computer Engineering student', 'Cortical visual prosthetics researcher', 'IT engineer'],
        'tagline': plain(me.sub_title) if me else '[ONE LINE ABOUT THE WORK]',
        'about': plain(me.description) if me else '[ABOUT STATEMENT]',
        'focus': ['Cortical visual prosthetics', 'Computer engineering', 'Infrastructure'],
        'research': [{'title': r.name, 'summary': plain(r.description), 'status': r.get_status_display(), 'link': r.github_link} for r in Research.objects.order_by('updated_at')],
        'projects': [{'title': p.name, 'summary': plain(p.description), 'tags': ' / '.join(t.name for t in p.tags.all()), 'year': '[YEAR]', 'link': None} for p in TopProject.objects.prefetch_related('tags').order_by('-created_at')],
        'credentials': [{'role': w.role, 'institution': w.company, 'description': plain(w.description), 'dates': w.period, 'kind': 'Experience'} for w in WorkExperience.objects.all()] + [{'role': e.degree, 'institution': e.institution, 'description': e.field_of_study, 'dates': ' – '.join(filter(None, [e.start_year, e.end_year])), 'kind': 'Education'} for e in Education.objects.all()],
        'email': None,
        'socials': [{'label': 'GitHub', 'url': me.github_link if me else None}, {'label': 'LinkedIn', 'url': me.linkedin_link if me else None}, {'label': 'View CV', 'url': '/cv/'}, {'label': 'Explore archive', 'url': '/explore/'}],
    }
    return render(request, 'main/phosphene.html', {'portfolio_content': data})
