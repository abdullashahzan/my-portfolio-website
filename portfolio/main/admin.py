from django.contrib import admin
from django.utils.html import format_html
from .models import *

class PrevNextMixin:
    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}
        all_objs = list(self.model.objects.values_list('pk', flat=True))
        try:
            idx = all_objs.index(int(object_id))
            if idx > 0:
                extra_context['prev_obj'] = all_objs[idx - 1]
            if idx < len(all_objs) - 1:
                extra_context['next_obj'] = all_objs[idx + 1]
        except (ValueError, TypeError):
            pass
        return super().change_view(request, object_id, form_url, extra_context=extra_context)


@admin.register(Me)
class MeAdmin(PrevNextMixin, admin.ModelAdmin):
    list_display = ('name', 'main_title', 'gpa')

@admin.register(TopProject)
class ProjectAdmin(PrevNextMixin, admin.ModelAdmin):
    filter_horizontal = ('tags',)
    list_display = ('name', 'icon', 'created_at')

@admin.register(Achievement)
class AchievementAdmin(PrevNextMixin, admin.ModelAdmin):
    list_display = ('title', 'category', 'image_preview', 'display', 'date_earned')
    list_filter = ('category', 'display')
    list_editable = ('display',)
    readonly_fields = ('image_preview_detail',)

    @admin.display(description='Image')
    def image_preview(self, obj):
        src = obj.image_file.url if obj.image_file else obj.image_url
        if src:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" style="max-height:60px;max-width:100px;border-radius:4px;object-fit:cover;" loading="lazy"></a>',
                src, src
            )
        return '—'

    @admin.display(description='Image')
    def image_preview_detail(self, obj):
        src = obj.image_file.url if obj.image_file else obj.image_url
        if src:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" style="max-height:50vh;max-width:100%;border-radius:8px;object-fit:contain;background:#f0f0f0;padding:6px;" loading="lazy"></a>',
                src, src
            )
        return '—'

@admin.register(Research)
class ResearchAdmin(PrevNextMixin, admin.ModelAdmin):
    list_display = ('name', 'status', 'updated_at')
    list_filter = ('status',)

@admin.register(Experience)
class ExperienceAdmin(PrevNextMixin, admin.ModelAdmin):
    list_display = ('title', 'image_preview')
    readonly_fields = ('image_preview_detail',)

    @admin.display(description='Image')
    def image_preview(self, obj):
        src = obj.image_file.url if obj.image_file else obj.image_url
        if src:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" style="max-height:60px;max-width:100px;border-radius:4px;object-fit:cover;" loading="lazy"></a>',
                src, src
            )
        return '—'

    @admin.display(description='Image')
    def image_preview_detail(self, obj):
        src = obj.image_file.url if obj.image_file else obj.image_url
        if src:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" style="max-height:50vh;max-width:100%;border-radius:8px;object-fit:contain;background:#f0f0f0;padding:6px;" loading="lazy"></a>',
                src, src
            )
        return '—'

@admin.register(Education)
class EducationAdmin(PrevNextMixin, admin.ModelAdmin):
    list_display = ('degree', 'institution', 'start_year', 'end_year')

@admin.register(Skill)
class SkillAdmin(PrevNextMixin, admin.ModelAdmin):
    list_display = ('name',)

admin.site.register(Tag)
admin.site.register(AchievementCategory)
admin.site.register(ChatConfig)
