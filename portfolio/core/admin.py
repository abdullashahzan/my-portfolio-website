from django.contrib import admin
from django.utils.html import format_html
from . import models

@admin.action(description='Publish selected')
def publish(modeladmin, request, queryset):
    queryset.update(is_published=True)

@admin.action(description='Unpublish selected')
def unpublish(modeladmin, request, queryset):
    queryset.update(is_published=False)

class ContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_published', 'audience')
    list_editable = ('order', 'is_published')
    list_filter = ('is_published', 'audience')
    search_fields = ('title',)
    save_on_top = True
    actions = (publish, unpublish)

for model in (models.Research, models.Project, models.Achievement, models.TimelineEntry):
    admin.site.register(model, ContentAdmin)

@admin.register(models.Certificate)
class CertificateAdmin(ContentAdmin):
    list_display = ('title', 'preview', 'issuer', 'category', 'order', 'is_published')
    list_filter = ('category', 'issuer', 'is_published', 'audience')
    search_fields = ('title', 'issuer', 'credential_id')
    readonly_fields = ('preview', 'width', 'height', 'thumb', 'display')

    @admin.display(description='Thumbnail')
    def preview(self, obj):
        if obj and (obj.thumb or obj.image):
            return format_html('<img src="{}" alt="" width="100">', (obj.thumb or obj.image).url)
        return ''

class FixedAdmin(admin.ModelAdmin):
    save_on_top = True

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(models.SiteSettings)
class SiteAdmin(FixedAdmin):
    list_display = ('first_name', 'last_name', 'default_persona')
    search_fields = ('first_name', 'last_name')

@admin.register(models.Persona, models.Section)
class KeyAdmin(FixedAdmin):
    list_display = ('key',)
    readonly_fields = ('key',)
    search_fields = ('key',)

@admin.register(models.SocialLink)
class SocialAdmin(admin.ModelAdmin):
    list_display = ('label', 'url', 'order', 'visible')
    list_editable = ('order', 'visible')
    list_filter = ('visible',)
    search_fields = ('label', 'url')
    save_on_top = True

for model in list(admin.site._registry):
    if model._meta.app_label == 'main':
        admin.site.unregister(model)

get_app_list = admin.site.get_app_list

def grouped_apps(request, app_label=None):
    apps = get_app_list(request, app_label)
    for app in list(apps):
        if app['app_label'] == 'core':
            apps.remove(app)
            site_names = {'SiteSettings', 'Persona', 'Section', 'SocialLink'}
            for title, site_group in [('Site', True), ('Content', False)]:
                entries = [m for m in app['models'] if (m['object_name'] in site_names) == site_group]
                if entries:
                    apps.append({**app, 'name': title, 'models': entries})
    return apps

admin.site.get_app_list = grouped_apps
