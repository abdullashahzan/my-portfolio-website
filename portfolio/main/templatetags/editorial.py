import re
from django import template
from django.utils.html import escape
from django.utils.safestring import mark_safe
register=template.Library()
@register.filter
def emphasis(value):
    return mark_safe(re.sub(r'\*([^*]+)\*',r'<em>\1</em>',str(escape(value))))
@register.filter
def get(mapping,key):
    return mapping.get(key,'') if hasattr(mapping,'get') else ''
@register.filter
def persona_desc(item,key):
    return item.get('desc',{}).get(key,'')
