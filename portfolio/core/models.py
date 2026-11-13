from django.db import models
from django.core.validators import RegexValidator

PERSONAS = [(x,x.title()) for x in ("researcher","engineer")]
AUDIENCES = [("both","Both"), *PERSONAS]
SECTION_KEYS = ("about","research","projects","achievements","certificates","experience","contact")

class Publishable(models.Model):
    is_published = models.BooleanField(default=True, help_text='Controls is published in the Publishable content on the portfolio.')
    order = models.IntegerField(default=0, help_text='Controls order in the Publishable content on the portfolio.')
    audience = models.CharField(max_length=12, choices=AUDIENCES, default='both', help_text='Controls audience in the Publishable content on the portfolio.')
    class Meta:
        abstract = True
        ordering = ("order", "id")

    def __str__(self):
        return self.title

class Described(models.Model):
    description = models.TextField(blank=True, help_text='Controls description in the Described content on the portfolio.')
    desc_researcher = models.TextField(blank=True, help_text='Controls desc researcher in the Described content on the portfolio.')
    desc_engineer = models.TextField(blank=True, help_text='Controls desc engineer in the Described content on the portfolio.')
    class Meta:
        abstract = True

    def description_for(self, persona):
        return {"researcher": self.desc_researcher, "engineer": self.desc_engineer}.get(persona) or self.description

LABEL_KEYS = ('scroll', 'back', 'read_research', 'project', 'view_record', 'contact', 'certificates', 'experience', 'education', 'verify', 'original', 'close', 'previous', 'next', 'wall_scroll')

class SiteSettings(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False, help_text='Controls id in the SiteSettings content on the portfolio.')
    first_name = models.CharField(max_length=255, blank=True, help_text='Controls first name in the SiteSettings content on the portfolio.')
    last_name = models.CharField(max_length=255, blank=True, help_text='Controls last name in the SiteSettings content on the portfolio.')
    location = models.CharField(max_length=255, blank=True, help_text='Controls location in the SiteSettings content on the portfolio.')
    switch_label = models.CharField(max_length=255, blank=True, help_text='Controls switch label in the SiteSettings content on the portfolio.')
    switch_hint = models.CharField(max_length=255, blank=True, help_text='Controls switch hint in the SiteSettings content on the portfolio.')
    seo_title = models.CharField(max_length=255, blank=True, help_text='Controls seo title in the SiteSettings content on the portfolio.')
    footer_text = models.CharField(max_length=255, blank=True, help_text='Controls footer text in the SiteSettings content on the portfolio.')
    plate_label = models.CharField(max_length=255, blank=True, help_text='Controls plate label in the SiteSettings content on the portfolio.')
    resolution_label = models.CharField(max_length=255, blank=True, help_text='Controls resolution label in the SiteSettings content on the portfolio.')
    email = models.EmailField(blank=True, help_text='Controls email in the SiteSettings content on the portfolio.')
    portrait = models.ImageField(upload_to='portrait/', blank=True, help_text='Controls portrait in the SiteSettings content on the portfolio.')
    default_persona = models.CharField(max_length=12, choices=PERSONAS, default='researcher', help_text='Controls default persona in the SiteSettings content on the portfolio.')
    seo_description = models.TextField(blank=True, help_text='Controls seo description in the SiteSettings content on the portfolio.')
    accent_researcher = models.CharField(max_length=7, validators=[RegexValidator(r'^#[0-9a-fA-F]{6}$')], help_text='Controls accent researcher in the SiteSettings content on the portfolio.')
    accent_engineer = models.CharField(max_length=7, validators=[RegexValidator(r'^#[0-9a-fA-F]{6}$')], help_text='Controls accent engineer in the SiteSettings content on the portfolio.')
    scroll_label = models.TextField(blank=True, help_text='Controls scroll label in the SiteSettings content on the portfolio.')
    back_label = models.TextField(blank=True, help_text='Controls back label in the SiteSettings content on the portfolio.')
    read_research_label = models.TextField(blank=True, help_text='Controls read research label in the SiteSettings content on the portfolio.')
    project_label = models.TextField(blank=True, help_text='Controls project label in the SiteSettings content on the portfolio.')
    view_record_label = models.TextField(blank=True, help_text='Controls view record label in the SiteSettings content on the portfolio.')
    contact_label = models.TextField(blank=True, help_text='Controls contact label in the SiteSettings content on the portfolio.')
    certificates_label = models.TextField(blank=True, help_text='Controls certificates label in the SiteSettings content on the portfolio.')
    experience_label = models.TextField(blank=True, help_text='Controls experience label in the SiteSettings content on the portfolio.')
    education_label = models.TextField(blank=True, help_text='Controls education label in the SiteSettings content on the portfolio.')
    verify_label = models.TextField(blank=True, help_text='Controls verify label in the SiteSettings content on the portfolio.')
    original_label = models.TextField(blank=True, help_text='Controls original label in the SiteSettings content on the portfolio.')
    close_label = models.TextField(blank=True, help_text='Controls close label in the SiteSettings content on the portfolio.')
    previous_label = models.TextField(blank=True, help_text='Controls previous label in the SiteSettings content on the portfolio.')
    next_label = models.TextField(blank=True, help_text='Controls next label in the SiteSettings content on the portfolio.')
    wall_scroll_label = models.TextField(blank=True, help_text='Controls wall scroll label in the SiteSettings content on the portfolio.')
    class Meta:
        verbose_name_plural = "Site settings"
        constraints = [models.CheckConstraint(condition=models.Q(pk=1), name="core_singleton_site")]

    @property
    def labels(self):
        return {key: getattr(self, key + "_label") for key in LABEL_KEYS}

    @property
    def alter_ego_label(self):
        return self.switch_label

class Persona(models.Model):
    key = models.CharField(max_length=12, choices=PERSONAS, unique=True, help_text='Controls key in the Persona content on the portfolio.')
    label = models.CharField(max_length=255, blank=True, help_text='Controls label in the Persona content on the portfolio.')
    tagline = models.CharField(max_length=255, blank=True, help_text='Controls tagline in the Persona content on the portfolio.')
    role_line = models.CharField(max_length=255, blank=True, help_text='Controls role line in the Persona content on the portfolio.')
    about = models.TextField(blank=True, help_text='Controls about in the Persona content on the portfolio.')
    focus_phrases = models.TextField(blank=True, help_text='Controls focus phrases in the Persona content on the portfolio.')
    hero_meta = models.TextField(blank=True, help_text='Controls hero meta in the Persona content on the portfolio.')
    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(key__in=["researcher","engineer"]), name="core_persona_keys")]

class Section(models.Model):
    key = models.CharField(max_length=20, unique=True, choices=[(k,k.title()) for k in SECTION_KEYS], help_text='Controls key in the Section content on the portfolio.')
    nav_label = models.CharField(max_length=255, blank=True, help_text='Controls nav label in the Section content on the portfolio.')
    title = models.CharField(max_length=255, blank=True, help_text='Controls title in the Section content on the portfolio.')
    intro_researcher = models.CharField(max_length=255, blank=True, help_text='Controls intro researcher in the Section content on the portfolio.')
    intro_engineer = models.CharField(max_length=255, blank=True, help_text='Controls intro engineer in the Section content on the portfolio.')
    show_in_nav = models.BooleanField(default=True, help_text='Controls show in nav in the Section content on the portfolio.')
    enabled = models.BooleanField(default=True, help_text='Controls enabled in the Section content on the portfolio.')
    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(key__in=SECTION_KEYS), name="core_section_keys")]

class SocialLink(models.Model):
    label = models.CharField(max_length=255, blank=True, help_text='Controls label in the SocialLink content on the portfolio.')
    url = models.CharField(max_length=500, help_text='Controls url in the SocialLink content on the portfolio.')
    order = models.IntegerField(default=0, help_text='Controls order in the SocialLink content on the portfolio.')
    visible = models.BooleanField(default=True, help_text='Controls visible in the SocialLink content on the portfolio.')
    class Meta:
        ordering = ("order", "id")

class Research(Publishable, Described):
    title = models.CharField(max_length=255, blank=True, help_text='Controls title in the Research content on the portfolio.')
    status = models.CharField(max_length=12, choices=[('published','Published'),('in_progress','In Progress')], help_text='Controls status in the Research content on the portfolio.')
    url = models.URLField(max_length=500, blank=True, help_text='Controls url in the Research content on the portfolio.')


class Project(Publishable, Described):
    title = models.CharField(max_length=255, blank=True, help_text='Controls title in the Project content on the portfolio.')
    year = models.CharField(max_length=255, blank=True, help_text='Controls year in the Project content on the portfolio.')
    url = models.URLField(max_length=500, blank=True, help_text='Controls url in the Project content on the portfolio.')
    image = models.ImageField(upload_to='project/', blank=True, help_text='Controls image in the Project content on the portfolio.')
    tags = models.TextField(blank=True, help_text='Controls tags in the Project content on the portfolio.')


class Achievement(Publishable, Described):
    title = models.CharField(max_length=255, blank=True, help_text='Controls title in the Achievement content on the portfolio.')
    year = models.CharField(max_length=255, blank=True, help_text='Controls year in the Achievement content on the portfolio.')
    event = models.CharField(max_length=255, blank=True, help_text='Controls event in the Achievement content on the portfolio.')
    level = models.CharField(max_length=255, blank=True, help_text='Controls level in the Achievement content on the portfolio.')
    url = models.URLField(max_length=500, blank=True, help_text='Controls url in the Achievement content on the portfolio.')
    image = models.ImageField(upload_to='achievement/', blank=True, help_text='Controls image in the Achievement content on the portfolio.')
    image_url = models.URLField(max_length=500, blank=True, help_text='Controls image url in the Achievement content on the portfolio.')


class Certificate(Publishable):
    title = models.CharField(max_length=255, blank=True, help_text='Controls title in the Certificate content on the portfolio.')
    issuer = models.CharField(max_length=255, blank=True, help_text='Controls issuer in the Certificate content on the portfolio.')
    category = models.CharField(max_length=255, blank=True, help_text='Controls category in the Certificate content on the portfolio.')
    credential_id = models.CharField(max_length=255, blank=True, help_text='Controls credential id in the Certificate content on the portfolio.')
    earned = models.DateField(null=True, blank=True, help_text='Controls earned in the Certificate content on the portfolio.')
    credential_url = models.URLField(max_length=500, blank=True, help_text='Controls credential url in the Certificate content on the portfolio.')
    image = models.ImageField(upload_to='certificates/', blank=True, width_field="width", height_field="height", help_text='Controls image in the Certificate content on the portfolio.')
    pdf = models.FileField(upload_to="certificates/originals/", blank=True, help_text='Controls pdf in the Certificate content on the portfolio.')
    image_url = models.URLField(max_length=500, blank=True, help_text='Controls image url in the Certificate content on the portfolio.')
    width = models.PositiveIntegerField(null=True, blank=True, editable=False, help_text='Controls width in the Certificate content on the portfolio.')
    height = models.PositiveIntegerField(null=True, blank=True, editable=False, help_text='Controls height in the Certificate content on the portfolio.')
    thumb = models.ImageField(upload_to='certificates/previews/', blank=True, editable=False, help_text='Controls thumb in the Certificate content on the portfolio.')
    display = models.ImageField(upload_to='certificates/display/', blank=True, editable=False, help_text='Controls display in the Certificate content on the portfolio.')
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        from .media import prepare
        prepare(self)

class TimelineEntry(Publishable, Described):
    kind = models.CharField(max_length=12, choices=[('work','Work'),('education','Education')], help_text='Controls kind in the TimelineEntry content on the portfolio.')
    title = models.CharField(max_length=255, blank=True, help_text='Controls title in the TimelineEntry content on the portfolio.')
    organization = models.CharField(max_length=255, blank=True, help_text='Controls organization in the TimelineEntry content on the portfolio.')
    detail = models.CharField(max_length=255, blank=True, help_text='Controls detail in the TimelineEntry content on the portfolio.')
    period_label = models.CharField(max_length=255, blank=True, help_text='Controls period label in the TimelineEntry content on the portfolio.')
    start = models.DateField(null=True, blank=True, help_text='Controls start in the TimelineEntry content on the portfolio.')
    end = models.DateField(null=True, blank=True, help_text='Controls end in the TimelineEntry content on the portfolio.')
    url = models.URLField(max_length=500, blank=True, help_text='Controls url in the TimelineEntry content on the portfolio.')
    show_on_timeline = models.BooleanField(default=True, help_text='Controls show on timeline in the TimelineEntry content on the portfolio.')
    class Meta(Publishable.Meta):
        verbose_name_plural = "Experience and education"
