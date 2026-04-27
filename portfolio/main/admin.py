from django.contrib import admin
from .models import *

@admin.register(Me)
class MeAdmin(admin.ModelAdmin):
    list_display = ('name', 'main_title', 'gpa')

@admin.register(TopProject)
class ProjectAdmin(admin.ModelAdmin):
    filter_horizontal = ('tags',)
    list_display = ('name', 'icon', 'created_at')

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'date_earned')
    list_filter = ('category',)

@admin.register(Research)
class ResearchAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'updated_at')
    list_filter = ('status',)

# Register the rest simply
admin.site.register(Skill)
admin.site.register(Experience)
admin.site.register(Tag)
admin.site.register(AchievementCategory)