import uuid
from django.db import models

# Me
class Me(models.Model):
    research_description = models.TextField(blank=True, help_text="About copy for the Research alter ego.")
    engineering_description = models.TextField(blank=True, help_text="About copy for the Engineering alter ego.")
    research_tagline = models.CharField(max_length=255, blank=True)
    engineering_tagline = models.CharField(max_length=255, blank=True)
    name = models.CharField(max_length=200)
    gpa = models.DecimalField(max_digits=4, decimal_places=2)
    main_title = models.CharField(max_length=255) # e.g., "Cortical Visual Prosthetics..."
    sub_title = models.CharField(max_length=255)  # e.g., "Building the bridge..."
    description = models.TextField()
    linkedin_link = models.URLField(max_length=500)
    github_link = models.URLField(max_length=500)
    website_link = models.URLField(max_length=500, blank=True)
    languages = models.CharField(max_length=500, blank=True, help_text="e.g. English, Tamil, Arabic")

    def __str__(self):
        return self.name

# Research
class Research(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = 'IP', 'In Progress'
        PUBLISHED = 'PB', 'Published'

    name = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=2,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
    )
    github_link = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

# Project
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class TopProject(models.Model):
    difficulty = models.CharField(max_length=40, blank=True)
    quest_status = models.CharField(max_length=60, blank=True)
    audience = models.CharField(max_length=12, default='both', choices=[('both', 'Both paths'), ('research', 'Research'), ('job', 'Job roles')])
    name = models.CharField(max_length=200)
    description = models.TextField()
    # Stores an emoji (e.g., "🚀") or a CSS class (e.g., "fa-code")
    icon = models.CharField(max_length=50, blank=True)
    tags = models.ManyToManyField(Tag, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# Skills
class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        # Sorts skills alphabetically by default
        ordering = ['name']

# Achievements
class AchievementCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name_plural = "Achievement Categories"

    def __str__(self):
        return self.name

class Achievement(models.Model):
    featured = models.BooleanField(default=False, help_text="Also showcase this certificate as a major achievement.")
    summary = models.TextField(blank=True, help_text="Optional context for a featured achievement.")
    order = models.PositiveIntegerField(default=100, help_text='Lower numbers appear first across the whole certificate exhibit.')
    show_research = models.BooleanField(default=True, help_text='Include in the research route and research résumé.')
    show_job = models.BooleanField(default=True, help_text='Include in the hiring route and job résumé.')

    class Meta:
        ordering = ['order', 'pk']

    title = models.CharField(max_length=200)
    # This allows one category to have multiple certificates
    category = models.ForeignKey(
        AchievementCategory, 
        on_delete=models.CASCADE, 
        related_name="achievements"
    )
    display = models.BooleanField(default=True, help_text="Show on CV")
    image_file = models.ImageField(upload_to='achievements/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    date_earned = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.title} ({self.category.name})"

    @property
    def display_image(self):
        return self.image_file.url if self.image_file else self.image_url

# Education
class Education(models.Model):
    institution = models.CharField(max_length=255)
    degree = models.CharField(max_length=255)
    field_of_study = models.CharField(max_length=255, blank=True)
    start_year = models.CharField(max_length=20, blank=True)
    end_year = models.CharField(max_length=20, blank=True)
    gpa = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.degree} — {self.institution}"

# Experience
class Experience(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    image_file = models.ImageField(upload_to='experience/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.title


class ChatConfig(models.Model):
    name = models.CharField(max_length=100, default="default")
    system_prompt = models.TextField(help_text="System prompt for the AI assistant. Use {placeholders} for dynamic data.")

    class Meta:
        verbose_name = "Chat Configuration"
        verbose_name_plural = "Chat Configurations"

    def __str__(self):
        return self.name


class ExplorerSession(models.Model):
    """Anonymous, self-selected visits and a per-session guide usage budget."""
    token = models.UUIDField(unique=True, editable=False)
    role = models.CharField(max_length=16, blank=True, choices=[
        ('recruiter', 'Hiring manager'), ('researcher', 'Research supervisor'),
        ('explorer', 'Curious visitor'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    guide_day = models.DateField(null=True, blank=True)
    guide_requests = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f'{self.get_role_display() or "Unselected"} · {self.created_at:%Y-%m-%d}'


class WorkExperience(models.Model):
    company = models.CharField(max_length=160)
    role = models.CharField(max_length=200)
    period = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    order = models.PositiveIntegerField(default=0)
    certificates = models.ManyToManyField(Achievement, blank=True)
    source = models.OneToOneField(Experience, null=True, blank=True, on_delete=models.SET_NULL,
                                 help_text='Original record, excluded from the milestones section.')
    image_url = models.URLField(max_length=500, blank=True)

    class Meta:
        ordering = ['order', 'pk']
        verbose_name_plural = 'Work experience'

    def __str__(self):
        return f'{self.role} — {self.company}'


class NoriProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nickname = models.CharField(max_length=24)
    outfit = models.CharField(max_length=16, default='lavender')
    accessory = models.CharField(max_length=16, default='none')
    passport = models.CharField(max_length=8, default='none', choices=[('none', 'No passport'), ('red', 'Research'), ('blue', 'Job roles'), ('gold', 'Everything')])
    public = models.BooleanField(default=False)
    hidden = models.BooleanField(default=False, help_text='Moderator: hide this creation from the gallery.')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nickname}'s Nori"


class PortfolioSection(models.TextChoices):
    MILESTONES = 'journey', 'Milestones'
    CERTIFICATES = 'achievements', 'Certificate archive'
    RESEARCH = 'research', 'Research lab'
    PROJECTS = 'projects', 'Workshop'
    WORK = 'work', 'Work & internships'
    ABOUT = 'about', 'Introduction'
    COMMUNITY = 'community', 'Chibi studio'
    CONTACT = 'contact', 'Contact'


class PortfolioPath(models.Model):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=120)
    description = models.CharField(max_length=240, blank=True)
    icon = models.CharField(max_length=12, default='✦')
    order = models.PositiveIntegerField(default=100)
    published = models.BooleanField(default=False)
    default = models.BooleanField(default=False, help_text='Show this path when visitors arrive without choosing one.')
    curated_milestones = models.BooleanField(default=False, help_text='Use only the milestone rows below, in order.')
    curated_certificates = models.BooleanField(default=False, help_text='Use only the archive certificate rows below, in order.')
    curated_projects = models.BooleanField(default=False, help_text='Use only the workshop project rows below, in order.')
    legacy_audience = models.CharField(max_length=10, blank=True, editable=False)

    class Meta:
        ordering = ['order', 'pk']
        constraints = [
            models.UniqueConstraint(fields=['default'], condition=models.Q(default=True, published=True),
                                    name='one_published_default_portfolio_path'),
        ]

    def __str__(self):
        return self.title


class PathItem(models.Model):
    path = models.ForeignKey(PortfolioPath, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=100, help_text='Lower numbers appear first.')

    class Meta:
        abstract = True
        ordering = ['order', 'pk']


class PathSection(PathItem):
    section = models.CharField(max_length=24, choices=PortfolioSection.choices)
    label = models.CharField(max_length=100, blank=True, help_text='Optional label for this stop on the map.')
    summary = models.CharField(max_length=160, blank=True, help_text='Optional description on the map.')
    heading = models.CharField(max_length=160, blank=True, help_text='Overrides the section heading on this path.')

    class Meta(PathItem.Meta):
        constraints = [models.UniqueConstraint(fields=['path', 'section'], name='unique_section_per_path')]


class PathMilestone(PathItem):
    experience = models.ForeignKey(Experience, blank=True, null=True, on_delete=models.CASCADE)
    certificate = models.ForeignKey(Achievement, blank=True, null=True, on_delete=models.CASCADE)

    class Meta(PathItem.Meta):
        constraints = [
            models.CheckConstraint(
                condition=(models.Q(experience__isnull=False, certificate__isnull=True) |
                           models.Q(experience__isnull=True, certificate__isnull=False)),
                name='one_source_per_path_milestone',
            ),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError
        if bool(self.experience_id) == bool(self.certificate_id):
            raise ValidationError('Choose either an existing milestone or a certificate.')


class PathCertificate(PathItem):
    certificate = models.ForeignKey(Achievement, on_delete=models.CASCADE)

    class Meta(PathItem.Meta):
        constraints = [models.UniqueConstraint(fields=['path', 'certificate'], name='unique_certificate_per_path')]


class PathProject(PathItem):
    project = models.ForeignKey(TopProject, on_delete=models.CASCADE)

    class Meta(PathItem.Meta):
        constraints = [models.UniqueConstraint(fields=['path', 'project'], name='unique_project_per_path')]


class PathNavigation(PathItem):
    class Target(models.TextChoices):
        MAP = 'world', 'Route map'
        RESUME = 'resume', 'Résumé'
        EXTERNAL = 'external', 'External URL'

    label = models.CharField(max_length=100)
    target = models.CharField(max_length=24, choices=[*PortfolioSection.choices, *Target.choices])
    url = models.URLField(blank=True, help_text='For external links only.')
    desktop = models.BooleanField(default=True)
    mobile = models.BooleanField(default=True)

    def clean(self):
        from django.core.exceptions import ValidationError
        from urllib.parse import urlsplit
        if self.target == self.Target.EXTERNAL:
            if not self.url or urlsplit(self.url).scheme not in {'http', 'https'}:
                raise ValidationError({'url': 'Enter an HTTP or HTTPS URL.'})
        elif self.url:
            raise ValidationError({'url': 'Leave the URL empty for a built-in destination.'})


class PortfolioPresentation(models.Model):
    currently = models.CharField(max_length=240, blank=True, help_text="What you are reading, building or researching now.")
    hero_title = models.CharField(max_length=120, default='Serious work.')
    hero_accent = models.CharField(max_length=120, default='Curious')
    hero_outline = models.CharField(max_length=120, default='mind.', blank=True)
    header_tagline = models.CharField(max_length=120, default='A field guide to a curious mind', blank=True)
    hero_eyebrow = models.CharField(max_length=120, default='Engineering a little possibility.')
    map_heading = models.CharField(max_length=120, default='What brings you here?')
    map_accent = models.CharField(max_length=120, default='Choose your path.')
    map_description = models.TextField(default='Choose why you’re here and the whole portfolio will adapt. The map shows which sections are on your path. Tap any stop to go straight there, or keep scrolling to see them in order.')
    footer_note = models.CharField(max_length=180, default='Made of curiosity.')
    show_mascot = models.BooleanField(default=True)

    def __str__(self):
        return 'Portfolio presentation'
