from django.core.management.base import BaseCommand, CommandError
from main.models import Certificate
from main.certificate_media import prepare_certificate

class Command(BaseCommand):
    help='Backfill certificate dimensions and WebP previews without replacing original media.'
    def add_arguments(self,parser):
        parser.add_argument('--fetch-remote',action='store_true',help='Import public remote image URLs into generated previews.')
        parser.add_argument('--force',action='store_true')
    def handle(self,*args,**options):
        failures=[];count=0
        for row in Certificate.objects.all():
            if row.thumbnail and row.image_width and row.image_height and not options['force']:continue
            try:
                if prepare_certificate(row,fetch_remote=options['fetch_remote']):count+=1
                elif row.image_url:self.stdout.write(f'{row.pk}: remote original needs --fetch-remote')
            except Exception as exc:
                failures.append(row.pk);self.stderr.write(f'{row.pk}: {type(exc).__name__}: {exc}')
        self.stdout.write(f'Prepared {count} certificate previews; {len(failures)} failures.')
        if failures:raise CommandError(f'Failed certificate IDs: {failures}')
