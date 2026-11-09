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
        self.assertEqual(kwargs['model'], 'openai/gpt-oss-120b')
        self.assertEqual(kwargs['max_completion_tokens'], 1024)
        self.assertFalse(kwargs['include_reasoning'])
        self.assertEqual(kwargs['reasoning_effort'], 'low')

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

    @patch('main.views.Groq')
    def test_empty_provider_reply_uses_unavailable_response(self, groq):
        groq.return_value.chat.completions.create.return_value = MagicMock(choices=[MagicMock(message=MagicMock(content=''))])
        response = self.client.post('/chat-api/', {'message': 'Hello'}, content_type='application/json')
        self.assertEqual(response.status_code, 503)
        self.assertIn('error', response.json())

    @patch.dict('os.environ', {'GROQ_MODEL': ' custom-model '})
    @patch('main.views.Groq')
    def test_custom_model_does_not_receive_gpt_oss_options(self, groq):
        groq.return_value.chat.completions.create.return_value = MagicMock(choices=[MagicMock(message=MagicMock(content='Hello'))])
        self.assertEqual(self.client.post('/chat-api/', {'message': 'Hello'}, content_type='application/json').status_code, 200)
        kwargs = groq.return_value.chat.completions.create.call_args.kwargs
        self.assertEqual(kwargs['model'], 'custom-model')
        self.assertNotIn('include_reasoning', kwargs)
        self.assertEqual(kwargs['max_completion_tokens'], 160)

    def test_game_data_escapes_script_content(self):
        TopProject.objects.create(name='</script><script>alert(1)</script>', description='A build')
        response = self.client.get('/')
        self.assertContains(response, '&lt;/script&gt;')
        self.assertNotContains(response, '<script>alert(1)</script>')


@override_settings(SECURE_SSL_REDIRECT=False)
class NoriCompanionTests(TestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.payload = {'nickname': 'Star Explorer', 'outfit': 'mint', 'accessory': 'cat', 'public': True}

    def save(self, client=None, **changes):
        return (client or self.client).post('/nori-companion/', {**self.payload, **changes}, content_type='application/json')

    def test_save_restore_and_update_one_owned_companion(self):
        from .models import NoriProfile
        first = self.save()
        self.assertEqual(first.status_code, 200)
        self.assertTrue(first.cookies['nori_companion']['httponly'])
        self.assertIn('no-store', first['Cache-Control'])
        self.assertEqual(self.client.get('/nori-companion/').json()['mine']['nickname'], 'Star Explorer')
        self.save(outfit='sunset')
        self.assertEqual(NoriProfile.objects.count(), 1)
        self.assertEqual(NoriProfile.objects.get().outfit, 'sunset')

    def test_gallery_excludes_private_and_moderated_entries(self):
        from .models import NoriProfile
        self.save(public=False)
        self.assertEqual(self.client.get('/nori-companion/').json()['count'], 0)
        self.save(public=True)
        NoriProfile.objects.update(hidden=True)
        self.save(nickname='Changed Name')
        self.assertEqual(self.client.get('/nori-companion/').json()['count'], 0)
        self.assertTrue(NoriProfile.objects.get().hidden)

    def test_another_visitor_cannot_edit_or_delete_my_companion(self):
        from django.test import Client
        from .models import NoriProfile
        self.save()
        mine = NoriProfile.objects.get()
        other = Client()
        self.save(other, nickname='Other', id=str(mine.pk))
        other.post('/nori-companion/', {'action': 'delete'}, content_type='application/json')
        self.assertEqual(NoriProfile.objects.count(), 1)
        self.assertEqual(NoriProfile.objects.get().nickname, 'Star Explorer')

    def test_tampered_cookie_does_not_grant_ownership(self):
        from django.test import Client
        self.save()
        other = Client()
        other.cookies['nori_companion'] = self.client.cookies['nori_companion'].value + 'tampered'
        self.assertIsNone(other.get('/nori-companion/').json()['mine'])

    def test_delete_removes_public_entry_and_cookie(self):
        from .models import NoriProfile
        self.save()
        response = self.client.post('/nori-companion/', {'action': 'delete'}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(NoriProfile.objects.exists())
        self.assertEqual(response.cookies['nori_companion']['max-age'], 0)

    def test_invalid_public_input_and_csrf_are_rejected(self):
        from django.test import Client
        from .models import NoriProfile
        for data in ({'nickname': '<script>alert(1)</script>'}, {'nickname': 'https://spam.test'}, {'outfit': 'injected'}, {'public': 'true'}, {'nickname': 'x' * 25}, {'accessory': []}):
            self.assertEqual(self.save(**data).status_code, 400)
        self.assertFalse(NoriProfile.objects.exists())
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(self.save(client).status_code, 403)

    def test_gallery_pagination_does_not_expose_ownership_ids(self):
        from .models import NoriProfile
        NoriProfile.objects.bulk_create([NoriProfile(nickname=f'Explorer {i}', public=True) for i in range(14)])
        first = self.client.get('/nori-companion/').json()
        self.assertEqual(first['count'], 14)
        self.assertEqual(len(first['creations']), 12)
        self.assertEqual(first['next'], 12)
        self.assertNotIn('id', first['creations'][0])
        self.assertEqual(len(self.client.get('/nori-companion/?offset=12').json()['creations']), 2)

    def test_save_rate_limit(self):
        for i in range(8):
            self.assertEqual(self.save().status_code, 200)
        self.assertEqual(self.save().status_code, 429)


@override_settings(SECURE_SSL_REDIRECT=False)
class WorkExperienceTests(TestCase):
    def test_work_is_separate_from_milestones_and_in_cv_and_ai(self):
        from .models import WorkExperience
        from .guide import portfolio_context
        original = Experience.objects.create(title='Network role', description='Real work description')
        work = WorkExperience.objects.create(company='Test Employer', role='Engineer', description='Real work description', source=original)
        Experience.objects.create(title='Competition award', description='Third prize')
        response = self.client.get('/')
        self.assertIn(work, response.context['work_experiences'])
        self.assertNotIn(original, response.context['experiences'])
        self.assertContains(self.client.get('/cv/'), 'Test Employer')
        self.assertTrue(any(row['company'] == 'Test Employer' for row in portfolio_context()['work_experience']))


@override_settings(SECURE_SSL_REDIRECT=False)
class TailoredJourneyTests(TestCase):
    def setUp(self):
        from .models import WorkExperience, Skill
        self.category = AchievementCategory.objects.create(name='Evidence')
        self.job = Achievement.objects.create(title='Cloud certificate', category=self.category, show_research=False, order=2)
        self.research_cert = Achievement.objects.create(title='Research certificate', category=self.category, show_job=False, order=1)
        Achievement.objects.create(title='Hidden CV record', category=self.category, display=False)
        Research.objects.create(name='Phosphene paper', description='Measured research result')
        WorkExperience.objects.create(company='Team', role='Network technician', description='Verified work')
        TopProject.objects.create(name='Vision experiment', description='Actual project', audience='research')
        TopProject.objects.create(name='Cloud dashboard', description='Actual cloud project', audience='job')
        Skill.objects.create(name='Python')

    def test_job_resume_excludes_research_and_non_job_certificates(self):
        response = self.client.get('/cv/', {'target': 'Cloud engineer', 'track': 'job'})
        for text in ('Cloud certificate', 'Cloud dashboard', 'Network technician'):
            self.assertContains(response, text)
        for text in ('Research certificate', 'Vision experiment', 'Phosphene paper', 'Hidden CV record'):
            self.assertNotContains(response, text)

    def test_research_resume_excludes_employment_and_non_research_certificates(self):
        response = self.client.get('/cv/', {'target': 'Research assistant', 'track': 'research'})
        for text in ('Research certificate', 'Vision experiment', 'Phosphene paper'):
            self.assertContains(response, text)
        for text in ('Cloud certificate', 'Cloud dashboard', 'Network technician'):
            self.assertNotContains(response, text)

    def test_role_text_is_bounded_and_escaped(self):
        response = self.client.get('/cv/', {'target': '<script>alert(1)</script>' + 'x' * 200, 'track': 'invalid'})
        self.assertNotContains(response, '<script>alert(1)</script>')
        self.assertEqual(len(response.context['target']), 120)
        self.assertEqual(response.context['track'], 'job')

    def test_certificate_order_and_route_flags_are_rendered(self):
        self.assertEqual(list(Achievement.objects.filter(pk__in=[self.job.pk, self.research_cert.pk])), [self.research_cert, self.job])
        hiring = self.client.get('/', {'path': 'hiring'})
        research = self.client.get('/', {'path': 'research'})
        self.assertContains(hiring, 'Cloud certificate')
        self.assertNotContains(hiring, 'Research certificate')
        self.assertContains(research, 'Research certificate')
        self.assertNotContains(research, 'Cloud certificate')

    @patch('main.views.weasyprint.HTML')
    def test_tailored_pdf_uses_same_selection_as_preview(self, html):
        html.return_value.write_pdf.return_value = b'%PDF-test'
        response = self.client.get('/cv/download/', {'target': 'Cloud engineer', 'track': 'job'})
        self.assertEqual(response['Content-Type'], 'application/pdf')
        rendered = html.call_args.kwargs['string']
        self.assertIn('Cloud dashboard', rendered)
        self.assertNotIn('Phosphene paper', rendered)

    def test_new_customizations_and_passport_round_trip(self):
        from django.core.cache import cache
        cache.clear()
        payload = {'nickname': 'Explorer', 'outfit': 'ocean', 'accessory': 'beret', 'passport': 'red', 'public': False}
        response = self.client.post('/nori-companion/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get('/nori-companion/').json()['mine']['passport'], 'red')
        payload['passport'] = 'admin'
        self.assertEqual(self.client.post('/nori-companion/', payload, content_type='application/json').status_code, 400)


@override_settings(SECURE_SSL_REDIRECT=False)
class PortfolioPathTests(TestCase):
    def test_custom_path_renders_ordered_sections_content_and_navigation(self):
        from .models import (PortfolioPath, PathSection, PathCertificate, PathMilestone,
                             PathProject, PathNavigation)
        path = PortfolioPath.objects.create(
            slug='engineering', title='Engineering visit', published=True,
            curated_certificates=True, curated_milestones=True, curated_projects=True,
        )
        for order, section in enumerate(['projects', 'journey', 'achievements']):
            PathSection.objects.create(path=path, section=section, order=order)
        PathSection.objects.filter(path=path, section='projects').update(heading='Featured builds')
        category = AchievementCategory.objects.create(name='Training')
        other_category = AchievementCategory.objects.create(name='Awards')
        first = Achievement.objects.create(title='First picked certificate', category=other_category)
        second = Achievement.objects.create(title='Second picked certificate', category=category)
        third = Achievement.objects.create(title='Third picked certificate', category=other_category)
        Achievement.objects.create(title='Unselected certificate', category=category)
        for order, certificate in enumerate([first, second, third]):
            PathCertificate.objects.create(path=path, certificate=certificate, order=order)
        PathMilestone.objects.create(path=path, certificate=second, order=20)
        PathMilestone.objects.create(path=path, certificate=first, order=10)
        for order, name in [(20, 'Second build'), (10, 'First build')]:
            project = TopProject.objects.create(name=name, description='Project description')
            PathProject.objects.create(path=path, project=project, order=order)
        PathNavigation.objects.create(path=path, target='projects', label='Featured work', order=20)
        PathNavigation.objects.create(path=path, target='resume', label='Read CV', order=10, mobile=False)
        PathNavigation.objects.create(path=path, target='research', label='Unavailable menu link')

        response = self.client.get('/', {'path': path.slug})
        html = response.content.decode()
        self.assertEqual(response.context['active_path'], path)
        self.assertLess(html.index('id="projects"'), html.index('id="journey"'))
        self.assertLess(html.index('First build'), html.index('Second build'))
        self.assertLess(html.index('Read CV'), html.index('Featured work'))
        self.assertEqual([row['mobile'] for row in response.context['navigation']], [False, True])
        self.assertEqual(response.context['archive_certificates'], [first, second, third])
        self.assertEqual(response.context['experiences'], [first, second])
        self.assertContains(response, '<h2>Featured builds</h2>', html=True)
        for text in ('id="research"', 'id="community"', 'Unavailable menu link', 'Unselected certificate'):
            self.assertNotContains(response, text)

    def test_draft_path_is_neither_listed_nor_accessible(self):
        from .models import PortfolioPath
        PortfolioPath.objects.create(slug='draft', title='Draft portfolio')
        response = self.client.get('/', {'path': 'draft'})
        self.assertEqual(response.context['active_path'].slug, 'explore')
        self.assertNotContains(response, 'Draft portfolio')
