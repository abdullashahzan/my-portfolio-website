from django.db import migrations


def seed_paths(apps, schema_editor):
    Path = apps.get_model('main', 'PortfolioPath')
    Section = apps.get_model('main', 'PathSection')
    Link = apps.get_model('main', 'PathNavigation')
    Presentation = apps.get_model('main', 'PortfolioPresentation')
    sections = ('journey', 'achievements', 'research', 'projects', 'work', 'about', 'community', 'contact')
    navigation = (
        ('world', 'The map', True), ('achievements', 'Achievements', True),
        ('research', 'Research', True), ('projects', 'Projects', False),
        ('work', 'Work & internships', False), ('journey', 'Milestones', False),
        ('community', 'Dress Nori', False), ('resume', 'The résumé ↗', True),
    )
    paths = (
        ('hiring', 'I’m considering Abdulla for a role', 'Work, projects, achievements.', '↗', 'job', 'research'),
        ('research', 'I’m exploring research', 'Research, methods, collaboration.', '⌬', 'research', 'work'),
        ('explore', 'I’m just looking around', 'See the complete portfolio.', '✳', 'all', None),
    )
    for position, (slug, title, description, icon, audience, excluded) in enumerate(paths, 1):
        path = Path.objects.create(slug=slug, title=title, description=description, icon=icon,
                                   legacy_audience=audience, order=position * 10, published=True,
                                   default=audience == 'all')
        Section.objects.bulk_create([
            Section(path=path, section=section, order=index * 10)
            for index, section in enumerate(sections, 1) if section != excluded
        ])
        Link.objects.bulk_create([
            Link(path=path, target=target, label=label, desktop=desktop, order=index * 10)
            for index, (target, label, desktop) in enumerate(navigation, 1) if target != excluded
        ])
    Presentation.objects.create(hero_accent='Curious')


class Migration(migrations.Migration):
    dependencies = [('main', '0032_portfolio_path_controls')]
    operations = [migrations.RunPython(seed_paths, migrations.RunPython.noop)]
