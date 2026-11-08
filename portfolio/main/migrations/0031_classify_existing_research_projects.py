from django.db import migrations


def classify(apps, schema_editor):
    Project = apps.get_model('main', 'TopProject')
    Project.objects.filter(name__in=['Noor — Cortical Prosthetics AI', 'Phosphene Simulator (Rebuilt)'], audience='both').update(audience='research')


class Migration(migrations.Migration):
    dependencies = [('main', '0030_alter_achievement_options_achievement_order_and_more')]
    operations = [migrations.RunPython(classify, migrations.RunPython.noop)]
