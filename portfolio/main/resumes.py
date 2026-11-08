"""Factual, deterministic role-specific selection; no generated qualifications."""
import re
from urllib.parse import urlencode
from django.utils.html import strip_tags
from .models import Achievement


def tailor_context(context, params):
    target = ' '.join(params.get('target', '').split())[:120]
    if not target:
        return context
    track = params.get('track', 'job')
    if track not in ('job', 'research', 'all'):
        track = 'job'
    terms = set(re.findall(r'[a-z0-9+#]+', target.lower())) - {'a', 'an', 'the', 'for', 'role', 'engineer', 'intern', 'senior', 'junior'}
    families = [({'ai', 'ml', 'machine', 'learning'}, {'pytorch', 'tensorflow', 'neural', 'vision', 'learning'}),
                ({'network', 'networking', 'cloud', 'it'}, {'network', 'cloud', 'huawei', 'linux'}),
                ({'data', 'scientist', 'science'}, {'data', 'python', 'statistics', 'learning'}),
                ({'web', 'software', 'backend', 'django'}, {'python', 'django', 'web', 'git', 'docker'})]
    for triggers, words in families:
        if terms & triggers:
            terms |= words
    def score(item):
        text = ' '.join(str(getattr(item, field, '')) for field in ('name', 'title', 'description', 'company', 'role'))
        if hasattr(item, 'tags'):
            text += ' ' + ' '.join(tag.name for tag in item.tags.all())
        words = set(re.findall(r'[a-z0-9+#]+', strip_tags(text).lower()))
        return len(words & terms)
    def ranked(items, limit):
        return sorted(list(items), key=lambda item: (-score(item), 0 if getattr(item, 'status', '') == 'PB' else 1))[:limit]
    projects = [p for p in context['top_projects'] if track == 'all' or p.audience in ('both', track)]
    certs = Achievement.objects.filter(display=True)
    if track != 'all':
        certs = certs.filter(**{'show_' + track: True})
    context.update(target=target, tailored=True, track=track,
                   top_projects=ranked(projects, 4),
                   research=ranked(context['research'], 3) if track != 'job' else [],
                   work_experiences=ranked(context['work_experiences'], 4) if track != 'research' else [],
                   skills=ranked(context['skills'], 14), certificates=ranked(certs, 8),
                   experiences=ranked(context['experiences'], 6),
                   resume_query=urlencode({'target': target, 'track': track}))
    return context
