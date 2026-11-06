from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings, RequestFactory
from django.contrib.admin.sites import AdminSite
from .models import Me, Experience, Research, TopProject, AchievementCategory, Achievement
from .admin import AchievementAdmin, include_on_cv, exclude_from_cv


@override_settings(SECURE_SSL_REDIRECT=False)
class PortfolioContentTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.profile = Me.objects.create(name='Test Researcher', main_title='Engineering', sub_title='A dynamic introduction', description='<p>Biography</p>', gpa='4.50', github_link='https://github.com/test-profile', linkedin_link='https://linkedin.com/in/test-profile')
        cls.category = AchievementCategory.objects.create(name='Cloud "Advanced" & AI')

    def test_new_content_is_rendered_without_template_changes(self):
        Experience.objects.create(title='New experience', description='<p>New experience detail</p>', image_file='experience/upload.png')
        Research.objects.create(name='New publication', description='Research detail', status='PB')
        TopProject.objects.create(name='New project', description='Project detail')
        Achievement.objects.create(title='New certificate', category=self.category, image_url='https://example.com/certificate.png')
        response = self.client.get('/')
        for value in ['Test Researcher', 'New experience', 'New publication', 'New project', 'New certificate', 'experience/upload.png', 'https://github.com/test-profile', 'data-status="PB"', 'certificateSearch']:
            self.assertContains(response, value)
        self.assertNotContains(response, 'Year — Computer Engineering')

    def test_cv_respects_bulk_visibility(self):
        cert = Achievement.objects.create(title='Visible certificate', category=self.category, display=True)
        modeladmin = AchievementAdmin(Achievement, AdminSite())
        with patch.object(modeladmin, 'message_user'):
            exclude_from_cv(modeladmin, RequestFactory().get('/'), Achievement.objects.filter(pk=cert.pk))
            self.assertNotContains(self.client.get('/cv/'), cert.title)
            include_on_cv(modeladmin, RequestFactory().get('/'), Achievement.objects.filter(pk=cert.pk))
            self.assertContains(self.client.get('/cv/'), cert.title)

    def test_empty_portfolio_and_missing_certificate_image(self):
        Me.objects.all().delete()
        Achievement.objects.create(title='No image certificate', category=self.category)
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Image not added')
        self.assertNotContains(response, 'src="None"')
        self.assertEqual(self.client.get('/cv/').status_code, 200)

    @patch('main.views.Groq')
    def test_chat_still_uses_provider_and_portfolio(self, groq):
        groq.return_value.chat.completions.create.return_value = MagicMock(choices=[MagicMock(message=MagicMock(content='Test response'))])
        response = self.client.post('/chat-api/', {'message': 'Hello'}, content_type='application/json')
        self.assertEqual(response.json(), {'response': 'Test response'})

    @patch('main.views.weasyprint.HTML')
    def test_pdf_download_route_is_preserved(self, html):
        html.return_value.write_pdf.return_value = b'%PDF-test'
        response = self.client.get('/cv/download/')
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('Test_Researcher_CV.pdf', response['Content-Disposition'])
