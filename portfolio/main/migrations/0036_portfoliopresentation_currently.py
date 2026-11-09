from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('main', '0035_chibi_studio_label')]
    operations = [
        migrations.AddField(model_name='topproject', name='difficulty', field=models.CharField(max_length=40, blank=True)),
        migrations.AddField(model_name='topproject', name='quest_status', field=models.CharField(max_length=60, blank=True)),
        migrations.AddField(
        model_name='portfoliopresentation', name='currently',
        field=models.CharField(blank=True, max_length=240, help_text='What you are reading, building or researching now.'),
    )]
