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
    list_display = ('title', 'category', 'image_preview', 'display', 'featured', 'order', 'show_research', 'show_job', 'date_earned')
    list_filter = ('category', 'display', 'featured', 'show_research', 'show_job', 'date_earned')
    list_editable = ('display', 'featured', 'order', 'show_research', 'show_job')
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


class PathSectionInline(admin.TabularInline):
    model = PathSection
    extra = 0


class PathNavigationInline(admin.TabularInline):
    model = PathNavigation
    extra = 0


class PathMilestoneInline(admin.TabularInline):
    model = PathMilestone
    extra = 0


class PathCertificateInline(admin.TabularInline):
    model = PathCertificate
    extra = 0
    autocomplete_fields = ['certificate']


class PathProjectInline(admin.TabularInline):
    model = PathProject
    extra = 0
    autocomplete_fields = ['project']


@admin.register(PortfolioPath)
class PortfolioPathAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'order', 'published', 'default')
    list_editable = ('order',)
    prepopulated_fields = {'slug': ('title',)}
    inlines = [PathSectionInline, PathNavigationInline, PathMilestoneInline,
               PathCertificateInline, PathProjectInline]


@admin.register(PortfolioPresentation)
class PortfolioPresentationAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not PortfolioPresentation.objects.exists() and super().has_add_permission(request)

# Editorial homepage controls. Legacy admin classes remain available for the archive.
@admin.action(description='Publish selected')
def publish_selected(modeladmin,request,queryset):
    queryset.update(is_published=True)

@admin.action(description='Unpublish selected')
def unpublish_selected(modeladmin,request,queryset):
    queryset.update(is_published=False)

class EditorialAdmin(admin.ModelAdmin):
    save_on_top=True
    actions=(publish_selected,unpublish_selected)
    list_filter=('is_published','audience')
    list_editable=('order','is_published')
    def formfield_for_dbfield(self,db_field,request,**kwargs):
        if not db_field.help_text:
            kwargs['help_text']=f'{db_field.verbose_name.capitalize()} shown in this homepage record.'
        return super().formfield_for_dbfield(db_field,request,**kwargs)
    @admin.display(description='Image')
    def preview(self,obj):
        src=getattr(obj,'thumbnail',None) or getattr(obj,'image_file',None)
        url=src.url if src else getattr(obj,'image_url','')
        return format_html('<img src="{}" alt="" style="max-width:160px;max-height:100px;object-fit:contain">',url) if url else 'No image'

for cls,title in [(Research,'name'),(TopProject,'name'),(WorkExperience,'role'),(Education,'institution')]:
    admin.site.unregister(cls)
    admin.site.register(cls,type(cls.__name__+'EditorialAdmin',(EditorialAdmin,),{'list_display':(title,'order','is_published','audience'),'search_fields':(title,), 'filter_horizontal':('tags',) if cls==TopProject else ()}))

@admin.register(Certificate)
class CertificateAdmin(EditorialAdmin):
    list_display=('title','issuer','preview','order','is_published','audience')
    search_fields=('title','issuer','credential_id')
    readonly_fields=('preview','image_width','image_height','thumbnail')

@admin.register(FeaturedAchievement)
class FeaturedAchievementAdmin(EditorialAdmin):
    list_display=('title','event','year','order','is_published','audience')
    search_fields=('title','event','description')
    readonly_fields=('preview',)

class SocialInline(admin.TabularInline):
    model=SocialLink
    extra=0

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    save_on_top=True
    inlines=(SocialInline,)
    def has_add_permission(self,request):return not SiteSettings.objects.exists()
    def has_delete_permission(self,request,obj=None):return False

class FocusInline(admin.TabularInline):
    model=FocusPhrase
    extra=0

@admin.register(PersonaContent)
class PersonaContentAdmin(admin.ModelAdmin):
    save_on_top=True
    list_display=('label','key','role_line')
    readonly_fields=('key',)
    inlines=(FocusInline,)
    def has_add_permission(self,request):return False
    def has_delete_permission(self,request,obj=None):return False

@admin.register(SectionHeading)
class SectionHeadingAdmin(admin.ModelAdmin):
    save_on_top=True
    list_display=('key','nav_label','title','enabled','show_in_nav')
    list_editable=('nav_label','title','enabled','show_in_nav')
    readonly_fields=('key',)
    def has_add_permission(self,request):return False
    def has_delete_permission(self,request,obj=None):return False
