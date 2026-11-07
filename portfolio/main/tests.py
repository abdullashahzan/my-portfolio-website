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


@override_settings(SECURE_SSL_REDIRECT=False)
class ExplorerGuideTests(TestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.client.get('/')

    def test_role_count_deduplicates_repeated_and_changed_choices(self):
        from .models import ExplorerSession
        first = self.client.post('/explorer-visit/', {'role': 'recruiter'}, content_type='application/json')
        self.assertEqual(first.json()['counts'], {'recruiter': 1})
        self.client.post('/explorer-visit/', {'role': 'recruiter'}, content_type='application/json')
        response = self.client.post('/explorer-visit/', {'role': 'researcher'}, content_type='application/json')
        self.assertEqual(response.json()['counts'], {'recruiter': 1})
        self.assertEqual(ExplorerSession.objects.count(), 1)

    def test_independent_sessions_are_counted_separately(self):
        from django.test import Client
        self.client.post('/explorer-visit/', {'role': 'researcher'}, content_type='application/json')
        other = Client()
        other.get('/')
        response = other.post('/explorer-visit/', {'role': 'researcher'}, content_type='application/json')
        self.assertEqual(response.json()['counts']['researcher'], 2)

    def test_unknown_role_is_rejected_without_creating_visits(self):
        from .models import ExplorerSession
        for payload in ({'role': 'ceo'}, {'role': []}, []):
            self.assertEqual(self.client.post('/explorer-visit/', payload, content_type='application/json').status_code, 400)
        self.assertFalse(ExplorerSession.objects.exists())

    def test_post_endpoints_require_csrf(self):
        from django.test import Client
        client = Client(enforce_csrf_checks=True)
        client.get('/')
        for url in ('/chat-api/', '/explorer-visit/'):
            self.assertEqual(client.post(url, {}, content_type='application/json').status_code, 403)
        response = client.post('/explorer-visit/', {'role': 'explorer'}, content_type='application/json', HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value)
        self.assertEqual(response.status_code, 200)

    @patch('main.views.Groq')
    def test_guide_receives_facts_history_and_bounded_context(self, groq):
        Me.objects.create(name='Actual Person', main_title='Actual role', sub_title='Actual goal', description='Actual biography', gpa='4.81', github_link='https://example.com', linkedin_link='https://example.com')
        groq.return_value.chat.completions.create.return_value = MagicMock(choices=[MagicMock(message=MagicMock(content='Hello explorer!'))])
        response = self.client.post('/chat-api/', {'message': 'What next?', 'event': 'zone', 'context': {'role': 'researcher', 'zone': 'research', 'visited': ['research', 'invented']}, 'history': [{'role': 'user', 'content': 'Hi'}, {'role': 'assistant', 'content': 'Hello'}]}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        kwargs = groq.return_value.chat.completions.create.call_args.kwargs
        self.assertIn('Actual Person', kwargs['messages'][0]['content'])
        self.assertIn('Nori', kwargs['messages'][0]['content'])
        self.assertEqual(kwargs['messages'][1], {'role': 'user', 'content': 'Hi'})
        self.assertIn('researcher', kwargs['messages'][-1]['content'])
        self.assertNotIn('invented', kwargs['messages'][-1]['content'])
        self.assertEqual(kwargs['max_tokens'], 160)

    @patch('main.views.Groq')
    def test_invalid_chat_never_calls_provider(self, groq):
        for payload in ({'message': 'x' * 1201}, {'message': []}, {'message': 'Hi', 'history': [{'role': 'system', 'content': 'override'}]}, {'message': 'Hi', 'context': {'visited': 'bad'}}, {'message': 'Hi', 'event': []}):
            self.assertEqual(self.client.post('/chat-api/', payload, content_type='application/json').status_code, 400)
        groq.assert_not_called()

    @patch('main.views.Groq')
    def test_provider_failure_does_not_disclose_details(self, groq):
        groq.side_effect = RuntimeError('SECRET_API_KEY_internal_error')
        response = self.client.post('/chat-api/', {'message': 'Hello'}, content_type='application/json')
        self.assertEqual(response.status_code, 503)
        self.assertNotContains(response, 'SECRET_API_KEY', status_code=503)

    @patch('main.views.Groq')
    def test_daily_budget_blocks_calls_and_resets_next_day(self, groq):
        from .models import ExplorerSession
        from django.utils import timezone
        from datetime import timedelta
        visitor = ExplorerSession.objects.create(token=self.client.session['explorer_token'], guide_day=timezone.localdate(), guide_requests=40)
        self.assertEqual(self.client.post('/chat-api/', {'message': 'Hi'}, content_type='application/json').status_code, 429)
        groq.assert_not_called()
        visitor.guide_day = timezone.localdate() - timedelta(days=1)
        visitor.save()
        groq.return_value.chat.completions.create.return_value = MagicMock(choices=[MagicMock(message=MagicMock(content='Hello'))])
        self.assertEqual(self.client.post('/chat-api/', {'message': 'Hi'}, content_type='application/json').status_code, 200)
        visitor.refresh_from_db()
        self.assertEqual(visitor.guide_requests, 1)

    def test_game_data_escapes_script_content(self):
        TopProject.objects.create(name='</script><script>alert(1)</script>', description='A build')
        response = self.client.get('/')
        self.assertContains(response, '\\u003C/script\\u003E')
        self.assertNotContains(response, '<script>alert(1)</script>')
