from django.db import models

class aboutMe(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(max_length=255)
    image = models.ImageField(upload_to='static/media', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.title

    def get_image(self):
        if self.image:
            return self.image.url
        return self.image_url


class aboutMeExperiences(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(max_length=512)
    image = models.ImageField(upload_to='static/media', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.title

    def get_image(self):
        if self.image:
            return self.image.url
        return self.image_url


class Project(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    image_url = models.URLField(blank=True, null=True)
    github_link = models.URLField()
    tags = models.CharField(max_length=200, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class CertificationCategory(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = "Certification Categories"

    def __str__(self):
        return self.name


class Certification(models.Model):
    category = models.ForeignKey(CertificationCategory, on_delete=models.CASCADE, related_name="certifications")
    image = models.ImageField(upload_to="static/media", blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.category.name}"

    def get_image(self):
        if self.image:
            return self.image.url
        return self.image_url
