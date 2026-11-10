from django.db import migrations


def set_email(apps, schema_editor):
    Me = apps.get_model('main', 'Me')
    Me.objects.using(schema_editor.connection.alias).filter(
        name__iexact='Abdulla Shahzan', email=''
    ).update(email='abdullashahzan@gmail.com')


class Migration(migrations.Migration):
    dependencies = [('main', '0038_me_email')]
    operations = [migrations.RunPython(set_email, migrations.RunPython.noop)]
