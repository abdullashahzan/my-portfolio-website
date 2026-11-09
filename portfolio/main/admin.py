from django.contrib import admin
from django.utils.html import format_html
from .models import *

@admin.action(description="Include selected certificates on CV")
def include_on_cv(modeladmin, request, queryset):
    count = queryset.update(display=True)
    modeladmin.message_user(request, f"{count} certificate(s) included on CV.")


@admin.action(description="Exclude selected certificates from CV")
def exclude_from_cv(modeladmin, request, queryset):
    count = queryset.update(display=False)
    modeladmin.message_user(request, f"{count} certificate(s) excluded from CV.")



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
    search_fields = ('name', 'description', 'tags__name')
    list_filter = ('tags', 'audience')
    filter_horizontal = ('tags',)
    list_display = ('name', 'icon', 'audience', 'created_at')
    list_editable = ('audience',)

@admin.register(Achievement)
class AchievementAdmin(PrevNextMixin, admin.ModelAdmin):
    search_fields = ('title', 'category__name')
    date_hierarchy = 'date_earned'
    list_select_related = ('category',)
    actions = (include_on_cv, exclude_from_cv)
    list_display = ('title', 'category', 'image_preview', 'display', 'order', 'show_research', 'show_job', 'date_earned')
    list_filter = ('category', 'display', 'show_research', 'show_job', 'date_earned')
    list_editable = ('display', 'order', 'show_research', 'show_job')
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
    search_fields = ('name', 'description')
    list_display = ('name', 'status', 'updated_at')
    list_filter = ('status',)

@admin.register(Experience)
class ExperienceAdmin(PrevNextMixin, admin.ModelAdmin):
    search_fields = ('title', 'description')
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
    search_fields = ('institution', 'degree', 'field_of_study')
    list_editable = ('order',)
    list_display = ('degree', 'institution', 'start_year', 'end_year', 'order')

@admin.register(Skill)
class SkillAdmin(PrevNextMixin, admin.ModelAdmin):
    search_fields = ('name',)
    list_display = ('name',)

admin.site.register(Tag)
admin.site.register(AchievementCategory)
admin.site.register(ChatConfig)


admin.site.site_header = 'Portfolio studio'
admin.site.site_title = 'Portfolio studio'
admin.site.index_title = 'Manage your work, research & achievements'


@admin.register(ExplorerSession)
class ExplorerSessionAdmin(admin.ModelAdmin):
    list_display = ('role', 'created_at', 'guide_day', 'guide_requests')
    list_filter = ('role', 'created_at')
    readonly_fields = ('token', 'role', 'created_at', 'guide_day', 'guide_requests')
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False


@admin.register(WorkExperience)
class WorkExperienceAdmin(admin.ModelAdmin):
    list_display = ('company', 'role', 'period', 'order')
    list_editable = ('order',)
    search_fields = ('company', 'role', 'description')
    filter_horizontal = ('certificates',)

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == 'certificates':
            kwargs['help_text'] = (
                'Choose the certificates from your library that belong to this role. '
                'Selected certificates appear as images in its portfolio entry.'
            )
        return super().formfield_for_manytomany(db_field, request, **kwargs)



@admin.register(NoriProfile)
class NoriProfileAdmin(admin.ModelAdmin):
    list_display = ('nickname', 'outfit', 'accessory', 'public', 'hidden', 'created_at')
    list_filter = ('public', 'hidden', 'outfit')
    list_editable = ('hidden',)
    search_fields = ('nickname',)
    readonly_fields = ('id', 'created_at', 'updated_at')
