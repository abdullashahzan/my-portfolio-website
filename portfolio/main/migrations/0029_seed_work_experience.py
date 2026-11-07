from django.db import migrations


def seed_work(apps, schema_editor):
    Work = apps.get_model('main', 'WorkExperience')
    Experience = apps.get_model('main', 'Experience')
    Achievement = apps.get_model('main', 'Achievement')
    Work.objects.get_or_create(company='Huawei', role='Online intern', defaults={
        'description': 'Completed an online internship with Huawei. This learning experience is separate from the Huawei ICT Competition award.',
        'order': 0,
    })
    source = Experience.objects.filter(title__icontains='IT Network Technician').first()
    Work.objects.get_or_create(company='Saudi Cast', role='IT Network Technician', defaults={
        'description': source.description if source else 'Worked as an IT Network Technician at Saudi Cast through a third-party service provider.',
        'source_id': source.pk if source else None,
        'image_url': (source.image_url or '') if source else '', 'order': 1,
    })
    # Do not guess which generically named Huawei image proves the internship.
    # Certificate links can be selected in the Work Experience admin.


class Migration(migrations.Migration):
    dependencies = [('main', '0028_noriprofile_workexperience')]
    operations = [migrations.RunPython(seed_work, migrations.RunPython.noop)]
