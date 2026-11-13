from io import StringIO
from unittest.mock import patch

from django.core.management import call_command, CommandError
from django.test import TestCase

from core import models
from main import models as legacy

class ImportTests(TestCase):
    def test_import_maps_legacy_entities_and_preserves_sources(self):
        milestone = legacy.Experience.objects.create(title='Milestone', description='Source copy')
        legacy.WorkExperience.objects.create(company='Studio', role='Engineer', source=milestone, period='2020 / 2022')
        project = legacy.TopProject.objects.create(name='Project', audience='job')
        project.tags.add(legacy.Tag.objects.create(name='Zebra'), legacy.Tag.objects.create(name='Alpha'))
        category = legacy.AchievementCategory.objects.create(name='Training')
        legacy.Achievement.objects.create(title='Course', category=category, display=False)
        call_command('import_legacy', stdout=StringIO())
        self.assertFalse(models.Project.objects.exists())
        with patch('core.management.commands.import_legacy.Command.backup', return_value=None):
            call_command('import_legacy', commit=True, stdout=StringIO())
        self.assertEqual(models.Project.objects.get().tags, 'Alpha, Zebra')
        self.assertEqual(models.Project.objects.get().audience, 'engineer')
        self.assertEqual(models.Certificate.objects.get().category, 'Training')
        self.assertTrue(models.Certificate.objects.get().is_published)
        self.assertEqual(models.TimelineEntry.objects.get(title='Engineer').description, 'Source copy')
        self.assertEqual(models.TimelineEntry.objects.get(title='Engineer').start.isoformat(), '2020-01-01')
        self.assertFalse(models.Achievement.objects.exists())
        self.assertTrue(legacy.Experience.objects.filter(pk=milestone.pk).exists())
        with self.assertRaises(CommandError):
            call_command('import_legacy', stdout=StringIO())
