import json
import re
import sqlite3
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from core import models
from core.media import prepare, needs_preview

FIXED = (models.SiteSettings, models.Persona, models.Section)
LISTS = (models.SocialLink, models.Research, models.Project, models.Achievement, models.Certificate, models.TimelineEntry)

def dates(start, end, label):
    if start or end:
        return start, end
    match = re.fullmatch(r'\s*(\d{4}(?:-\d{2}-\d{2})?)\s*(?:/|–|—| to | - )\s*(\d{4}(?:-\d{2}-\d{2})?|present|current)\s*', label, re.I)
    if not match:
        return None, None
    a, b = match.groups()
    try:
        first = date.fromisoformat(a if len(a)>4 else a+'-01-01')
        last = None if b.lower() in ('present','current') else date.fromisoformat(b if len(b)>4 else b+'-12-31')
        return (first,last) if not last or last>=first else (None,None)
    except ValueError:
        return None,None

class Command(BaseCommand):
    help = 'Inspect or import legacy portfolio data. Dry run by default.'
    def add_arguments(self, parser):
        mode=parser.add_mutually_exclusive_group()
        mode.add_argument('--dry-run', action='store_true')
        mode.add_argument('--commit', action='store_true')
        parser.add_argument('--replace', action='store_true')
        parser.add_argument('--fetch-remote', action='store_true')

    def handle(self, **opts):
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM django_migrations WHERE app='main' ORDER BY id DESC LIMIT 1")
            latest=cursor.fetchone()
        if not latest or not latest[0].startswith('0043_'):
            raise CommandError('Legacy schema must be at main.0043. Run python manage.py migrate first.')
        self.commit=opts['commit']
        self.mapping=defaultdict(dict)
        self.rows=defaultdict(list)
        self.read_counts={}
        self.used=defaultdict(set)
        self.notes=[]
        self.merged={}
        with transaction.atomic():
            self.collect()
            if any(m.objects.exists() for m in LISTS) or models.SiteSettings.objects.exclude(first_name='',last_name='',seo_title='',email='').exists():
                if not opts['replace']:
                    raise CommandError('Core contains data. Use --replace to discard core admin edits.')
                self.stdout.write(self.style.WARNING('--replace discards core admin edits.'))
            if self.commit:
                map_path=self.backup()
                for model in (*LISTS,*FIXED):
                    model.objects.all().delete()
                for model, rows in self.rows.items():
                    for table, key, values in rows:
                        obj=model(**values)
                        model.objects.bulk_create([obj])
                        self.mapping[table][key]=obj.pk
                        if table == 'workexperience' and key in self.merged:
                            self.mapping['merged_experience_to_timeline'][self.merged[key]]=obj.pk
                        if model is models.Certificate:
                            try:
                                if needs_preview(obj) or (opts['fetch_remote'] and obj.image_url and not obj.image):
                                    prepare(obj,fetch_remote=opts['fetch_remote'])
                            except (OSError,ValueError) as exc:
                                self.notes.append(f'Certificate {key} media: {exc}')
                if map_path:
                    transaction.on_commit(lambda: map_path.write_text(json.dumps(self.mapping,indent=2)))
            transformed = {
                'sitesettings': 'alter_ego_label labels first_name last_name email',
                'me': 'name email github_link linkedin_link website_link',
                'focusphrase': 'id order persona_id text',
                'sociallink': 'site_id',
                'research': 'name status github_link',
                'tag': 'id name',
                'topproject_tags': 'id tag_id topproject_id',
                'topproject': 'name link audience',
                'workexperience': 'company role period start_date end_date description source_id',
                'experience': 'image_file link',
                'achievementcategory': 'id name',
                'achievement': 'category_id date_earned display_preview image_file image_height image_width original_pdf thumbnail',
                'education': 'degree institution field_of_study gpa start_date end_date start_year end_year',
            }
            for table, columns in transformed.items():
                self.used[table].difference_update(columns.split())
            for table,count in self.read_counts.items():
                self.stdout.write(f'Read {table}: {count}; unmapped: {", ".join(sorted(self.used[table])) or "none"}')
            for model,rows in self.rows.items():
                self.stdout.write(f'{model.__name__}: {len(rows)} {"written" if self.commit else "planned"}')
            for note in self.notes:
                self.stdout.write(note)

    def backup(self):
        stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        path=Path(connection.settings_dict['NAME']).resolve()
        folder=path.parent/'backups'
        folder.mkdir(exist_ok=True)
        with sqlite3.connect(path) as source, sqlite3.connect(folder/f'db-before-core-{stamp}.sqlite3') as backup:
            source.backup(backup)
        return folder/f'import_map_{stamp}.json'

    def read(self,table):
        with connection.cursor() as cursor:
            cursor.execute(f'SELECT * FROM main_{table} ORDER BY id')
            rows=[dict(zip([c[0] for c in cursor.description],r)) for r in cursor.fetchall()]
        self.read_counts[table]=len(rows)
        self.used[table].update(rows[0] if rows else [])
        return rows

    def add(self,model,table,row,**mapping):
        fields={f.name:f for f in model._meta.fields if f.name!='id'}
        values={}
        for k,f in fields.items():
            if k in mapping or k in row:
                if k not in mapping:self.used[table].discard(k)
                v=mapping[k] if k in mapping else row[k]
                values[k]=v if v is not None else (None if f.null else f.get_default())
                if hasattr(f,'storage') and v and not f.storage.exists(v):
                    self.notes.append(f'Missing file {table} {row["id"]}: {v}')
        self.used[table].discard('id')
        self.rows[model].append((table,row['id'],values))

    def collect(self):
        site=self.read('sitesettings')[0]
        me=self.read('me')
        me=me[0] if me else {}
        name=me.get('name','').split(maxsplit=1)
        labels=json.loads(site['labels'])
        self.notes.append(f'Unmapped label keys: {sorted(set(labels)-set(models.LABEL_KEYS))}')
        self.add(models.SiteSettings,'sitesettings',site,switch_label=site['alter_ego_label'],
                 first_name=site['first_name'] or (name[0] if name else ''),
                 last_name=site['last_name'] or (name[1] if len(name)>1 else ''),
                 email=site['email'] or me.get('email',''),**{k+'_label':labels.get(k,'') for k in models.LABEL_KEYS})
        phrases=defaultdict(list)
        for r in sorted(self.read('focusphrase'),key=lambda r:(r['order'],r['id'])):
            phrases[r['persona_id']].append(r['text'])
        for r in self.read('personacontent'):
            self.add(models.Persona,'personacontent',r,focus_phrases='\n'.join(phrases[r['id']]))
        for r in self.read('sectionheading'):self.add(models.Section,'sectionheading',r)
        seen=set()
        links=self.read('sociallink')
        for field,label in [('github_link','GitHub'),('linkedin_link','LinkedIn'),('website_link','Website')]:
            if me.get(field):links.append(dict(id=field,url=me[field],label=label,order=len(links),visible=True))
        for r in sorted(links,key=lambda r:r['order']):
            url=r['url'].rstrip('/')
            if url in seen:
                self.notes.append(f'Duplicate social URL skipped: {url}')
                continue
            seen.add(url)
            self.add(models.SocialLink,'sociallink',r)
        for r in self.read('research'):
            self.add(models.Research,'research',r,title=r['name'],url=r['github_link'],status={'PB':'published','IP':'in_progress'}[r['status']])
        tags={r['id']:r['name'] for r in self.read('tag')}
        by_project=defaultdict(list)
        for r in self.read('topproject_tags'):by_project[r['topproject_id']].append(tags[r['tag_id']])
        for r in self.read('topproject'):
            self.add(models.Project,'topproject',r,title=r['name'],url=r['link'],tags=', '.join(sorted(by_project[r['id']],key=str.casefold)),audience={'research':'researcher','job':'engineer'}.get(r['audience'],r['audience']))
        jobs=self.read('workexperience')
        sources={r['source_id'] for r in jobs if r['source_id']}
        milestones={r['id']:r for r in self.read('experience')}
        for key,r in milestones.items():
            if key not in sources:self.add(models.Achievement,'experience',r,url=r['link'],image=r['image_file'])
        categories={r['id']:r['name'] for r in self.read('achievementcategory')}
        for r in self.read('achievement'):
            if r['image_url'] and not r['image_file']:self.notes.append(f'Remote-only certificate {r["id"]}: {r["image_url"]}')
            self.add(models.Certificate,'achievement',r,category=categories[r['category_id']],earned=r['date_earned'],image=r['image_file'],pdf=r['original_pdf'],width=r['image_width'],height=r['image_height'],thumb=r['thumbnail'],display=r['display_preview'])
        for table,kind,records in [('workexperience','work',jobs),('education','education',self.read('education'))]:
            for r in records:
                period=r['period'] if kind=='work' else ' / '.join(filter(None,(r['start_year'],r['end_year'])))
                start,end=dates(r['start_date'],r['end_date'],period)
                self.notes.append(f'{table} {r["id"]}: dates {start or "unparsed"} / {end or ""} ({period})')
                source=milestones.get(r.get('source_id'),{})
                if source:self.merged[r['id']]=source['id']
                if source:self.notes.append(f'Merged milestone {source["id"]} into job {r["id"]}')
                detail='' if kind=='work' else ' / '.join(filter(None,(r['field_of_study'],f'GPA {r["gpa"]}' if r['gpa'] is not None else '')))
                self.add(models.TimelineEntry,table,r,kind=kind,title=r.get('role',r.get('degree')),organization=r.get('company',r.get('institution')),detail=detail,start=start,end=end,period_label=period,description=r.get('description') or source.get('description') or (r.get('field_of_study') or ''),url=source.get('link',''))
