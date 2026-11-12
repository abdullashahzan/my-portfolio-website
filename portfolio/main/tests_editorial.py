import io, tempfile
from django.test import TestCase, override_settings
from django.core.exceptions import ValidationError
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import SiteSettings, PersonaContent, SectionHeading, AchievementCategory, Certificate, Experience, Research, TopProject
from .templatetags.editorial import emphasis

@override_settings(SECURE_SSL_REDIRECT=False)
class EditorialDatabaseTests(TestCase):
    def setUp(self):
        self.site=SiteSettings.objects.get(pk=1)
        self.site.first_name='Abdulla';self.site.last_name='Shahzan';self.site.email='contact@example.com';self.site.save()
        PersonaContent.objects.filter(key='researcher').update(about='Research biography',tagline='Research tagline')
        PersonaContent.objects.filter(key='engineer').update(about='Engineering biography',tagline='Engineering tagline')
    def test_server_renders_selected_cookie_and_url_personas(self):
        self.client.cookies['portfolio-persona']='engineer'
        response=self.client.get('/')
        self.assertEqual(response.context['selected'],'engineer')
        self.assertIn('Engineering biography',response.context['initial_html'])
        self.assertNotIn('Research biography',response.context['initial_html'])
        self.assertEqual(self.client.get('/?as=researcher').context['selected'],'researcher')
        self.assertEqual(response.cookies['portfolio-persona']['samesite'],'Lax')
        self.assertEqual(int(response.cookies['portfolio-persona']['max-age']),31536000)
    def test_no_placeholder_and_no_empty_section_or_navigation(self):
        response=self.client.get('/')
        self.assertNotIn('id="research"',response.context['initial_html'])
        self.assertFalse(any(n['key']=='research' for n in response.context['navigation']))
        self.assertNotRegex(response.context['initial_html'],r'\[[A-Z][^\]]+\]')
    def test_homepage_certificates_are_independent_of_cv_visibility(self):
        category=AchievementCategory.objects.create(name='Existing category')
        for i in range(29):Certificate.objects.create(title=f'Real certificate {i}',category=category,display=False)
        Certificate.objects.create(title='Unpublished record',category=category,is_published=False)
        response=self.client.get('/')
        self.assertEqual(len(response.context['portfolio_content']['certificates']),29)
        self.assertNotIn('Unpublished record',response.context['initial_html'])
        self.assertContains(response,'Real certificate 28')
    def test_admin_edits_are_visible_immediately(self):
        research=Research.objects.create(name='Current research',description='Original description')
        self.assertContains(self.client.get('/'),'Original description')
        research.description='Updated description';research.save()
        self.assertContains(self.client.get('/'),'Updated description')
        research.is_published=False;research.save()
        self.assertNotIn('id="research"',self.client.get('/').context['initial_html'])
    def test_relevance_reorders_without_hiding_and_preserves_authored_order(self):
        for title,audience,order in [('Shared','both',0),('Engineer','job',2),('Research','research',3)]:
            TopProject.objects.create(name=title,description='Project',audience=audience,order=order)
        html=self.client.get('/?as=engineer').context['initial_html']
        self.assertLess(html.index('<h3>Engineer</h3>'),html.index('<h3>Shared</h3>'))
        self.assertIn('<h3>Research</h3>',html)
    def test_heading_filter_only_formats_asterisks_and_escapes_html(self):
        self.assertEqual(str(emphasis('<script>x</script> *Evidence*')),'&lt;script&gt;x&lt;/script&gt; <em>Evidence</em>')
    def test_invalid_accents_and_duplicate_personas_are_rejected(self):
        self.site.accent_engineer='red; color:white'
        with self.assertRaises(ValidationError):self.site.full_clean()
        p=PersonaContent(key='third',label='Third')
        with self.assertRaises(ValidationError):p.full_clean()
    def test_upload_dimensions_and_webp_preview(self):
        category=AchievementCategory.objects.create(name='Certificates')
        image=Image.new('RGB',(1600,2400),'white');buf=io.BytesIO();image.save(buf,'PNG')
        with tempfile.TemporaryDirectory() as directory,override_settings(MEDIA_ROOT=directory):
            cert=Certificate.objects.create(title='Portrait original',category=category,image_file=SimpleUploadedFile('portrait.png',buf.getvalue(),content_type='image/png'))
            cert.refresh_from_db()
            self.assertEqual((cert.image_width,cert.image_height),(1600,2400))
            self.assertFalse(Certificate._meta.get_field('display_preview').editable)
            with cert.display_preview.open('rb') as f:
                display=Image.open(f);self.assertEqual(max(display.size),1600);self.assertEqual(display.format,'WEBP')
            with cert.thumbnail.open('rb') as f:
                raw=f.read();self.assertLess(len(raw),60000)
                preview=Image.open(io.BytesIO(raw));self.assertEqual(preview.height,640)
            self.assertAlmostEqual(self.client.get('/').context['portfolio_content']['certificates'][0]['ratio'],2/3)
    def test_pdf_preview_keeps_original(self):
        import pymupdf as fitz
        doc=fitz.open();doc.new_page(width=595,height=842);pdf=doc.tobytes();doc.close()
        category=AchievementCategory.objects.create(name='PDF certificates')
        with tempfile.TemporaryDirectory() as directory,override_settings(MEDIA_ROOT=directory):
            cert=Certificate.objects.create(title='PDF original',category=category,original_pdf=SimpleUploadedFile('certificate.pdf',pdf,content_type='application/pdf'))
            cert.refresh_from_db()
            self.assertTrue(cert.original_pdf.name.endswith('.pdf'))
            self.assertTrue(cert.thumbnail.name.endswith('.webp'))
            self.assertTrue(cert.display_preview.name.endswith('.webp'))
            self.assertLess(cert.image_width,cert.image_height)
