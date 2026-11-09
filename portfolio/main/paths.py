"""Build the public page from the published path and its ordered admin rows."""
from django.urls import reverse

from .models import Achievement, PortfolioPath, PortfolioPresentation, PortfolioSection


SECTION_ICONS = dict(journey='⚑', achievements='♜', research='⌬', projects='⚒',
                     work='▣', about='✿', community='✧', contact='↗')


def path_context(request, experiences, projects):
    paths = list(PortfolioPath.objects.filter(published=True))
    slug = request.GET.get('path')
    default = next((path for path in paths if path.default), paths[0] if paths else None)
    active = next((path for path in paths if path.slug == slug), default)
    sections = []
    navigation = []
    certificates = Achievement.objects.select_related('category')
    audience = active.legacy_audience if active else 'all'

    if active:
        for row in active.pathsection_set.all():
            if row.section in SECTION_ICONS:
                sections.append(section(row.section, row.label, row.summary, row.heading))
        targets = {item['id'] for item in sections} | {'world', 'resume', 'external'}
        for row in active.pathnavigation_set.all():
            if row.target not in targets:
                continue
            if row.target == 'external':
                href = row.url
            elif row.target == 'resume':
                href = reverse('main:cv')
            else:
                href = '#' + row.target
            navigation.append({'label': row.label, 'href': href, 'desktop': row.desktop,
                               'mobile': row.mobile, 'resume': row.target == 'resume'})
        if active.curated_milestones:
            experiences = [row.experience or row.certificate for row in
                           active.pathmilestone_set.select_related('experience', 'certificate')]
        if active.curated_certificates:
            certificates = [row.certificate for row in
                            active.pathcertificate_set.select_related('certificate__category')]
        elif audience in ('job', 'research'):
            certificates = certificates.filter(**{'show_' + audience: True})
        if active.curated_projects:
            projects = [row.project for row in active.pathproject_set.select_related('project')
                        .prefetch_related('project__tags')]
        elif audience in ('job', 'research'):
            projects = projects.filter(audience__in=['both', audience])
    elif not PortfolioPath.objects.exists():
        # A fresh database without configured paths still renders the portfolio.
        sections = [section(key) for key in SECTION_ICONS]

    certificates = list(certificates)
    for index, certificate in enumerate(certificates):
        certificate.portfolio_order = index
    return {
        'paths': paths, 'active_path': active, 'sections': sections, 'navigation': navigation,
        'has_mobile_navigation': any(link['mobile'] for link in navigation),
        'presentation': PortfolioPresentation.objects.first() or PortfolioPresentation(),
        'path_audience': audience,
        'visit_role': (
            {'job': 'recruiter', 'research': 'researcher'}.get(audience, 'explorer')
            if active and slug == active.slug else ''
        ), 'experiences': experiences, 'top_projects': projects,
        'show_community': any(item['id'] == 'community' for item in sections),
        'show_research': any(item['id'] == 'research' for item in sections),
        'archive_certificates': certificates, 'certificate_count': len(certificates),
    }


def section(key, label='', summary='', heading=''):
    return {'id': key, 'label': label or PortfolioSection(key).label, 'summary': summary, 'heading': heading,
            'icon': SECTION_ICONS[key], 'template': f'main/sections/{key}.html'}
