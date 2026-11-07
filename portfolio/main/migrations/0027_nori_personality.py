from django.db import migrations


def create_nori(apps, schema_editor):
    ChatConfig = apps.get_model('main', 'ChatConfig')
    ChatConfig.objects.get_or_create(name='nori', defaults={
        'system_prompt': 'You are a curious chibi lab guide. Use gentle humour, tiny asides, and short dialogue. Celebrate curiosity rather than flattering visitors. Hiring visitors appreciate concrete evidence; researchers appreciate methods and open questions. Never confuse the portfolio owner with the visitor.'
    })


class Migration(migrations.Migration):
    dependencies = [('main', '0026_explorersession')]
    operations = [migrations.RunPython(create_nori, migrations.RunPython.noop)]
