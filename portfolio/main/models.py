from django.db import models

# Me
class Me(models.Model):
    name = models.CharField(max_length=200)
    gpa = models.DecimalField(max_digits=4, decimal_places=2)
    main_title = models.CharField(max_length=255) # e.g., "Cortical Visual Prosthetics..."
    sub_title = models.CharField(max_length=255)  # e.g., "Building the bridge..."
    description = models.TextField()
    linkedin_link = models.URLField(max_length=500)
    github_link = models.URLField(max_length=500)

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
    title = models.CharField(max_length=200)
    # This allows one category to have multiple certificates
    category = models.ForeignKey(
        AchievementCategory, 
        on_delete=models.CASCADE, 
        related_name="achievements"
    )
    image_file = models.ImageField(upload_to='achievements/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    date_earned = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.title} ({self.category.name})"

    @property
    def display_image(self):
        return self.image_file.url if self.image_file else self.image_url

# Experience
class Experience(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    image_file = models.ImageField(upload_to='experience/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.title
