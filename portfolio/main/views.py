# Hello, World!
from django.shortcuts import render
from .models import *
from .paths import path_context
from django.db.models import Prefetch
from django.http import JsonResponse, HttpResponse
from django.template.loader import render_to_string
import weasyprint
from pathlib import Path
import os
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
from django.db.models import Count, F, Q
from django.utils import timezone
from django.core.cache import cache
from django.utils.crypto import salted_hmac
import uuid
import logging
from .guide import portfolio_context, guide_prompt, ZONES, ROLES, EVENTS
from groq import Groq
from dotenv import load_dotenv
import json
import subprocess

# Create your views here.
@ensure_csrf_cookie
def home(request):
    request.session.setdefault("explorer_token", str(uuid.uuid4()))
    # Fetch the single profile instance
    me = Me.objects.first()
    
    # Fetch lists for the various sections
    research_items = Research.objects.all().order_by('updated_at')
    research_published = Research.objects.filter(status='PB').order_by('updated_at')
    top_projects = TopProject.objects.prefetch_related('tags').all().order_by('-created_at')
    skills = Skill.objects.all()
    experiences = Experience.objects.filter(workexperience__isnull=True).order_by("pk")
    
    context = {
        "me": me,
        "research_items": research_items,
        "research_published":research_published,
        "top_projects": top_projects,
        "skills": skills,
        "experiences": experiences,
        "work_experiences": WorkExperience.objects.prefetch_related("certificates"),
        "education": Education.objects.all(),
    }
    
    context.update(path_context(request, experiences, top_projects))
    return render(request, "main/home.html", context)


# Initialize Groq Client
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _explorer(request):
    token = request.session.setdefault('explorer_token', str(uuid.uuid4()))
    return ExplorerSession.objects.get_or_create(token=token)[0]


def _payload(request):
    if len(request.body) > 16000:
        raise ValueError('Request too large.')
    data = json.loads(request.body)
    if not isinstance(data, dict):
        raise ValueError('Expected an object.')
    return data


def _visitor_totals():
    return {row['role']: row['total'] for row in
            ExplorerSession.objects.exclude(role='').values('role').annotate(total=Count('id'))}


@require_POST
def explorer_visit(request):
    try:
        data = _payload(request)
        role = data.get('role')
        if role not in ROLES:
            return JsonResponse({'error': 'Choose a valid visitor path.'}, status=400)
    except (ValueError, TypeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Invalid request.'}, status=400)
    visitor = _explorer(request)
    # Count once per session. Switching paths does not inflate the totals.
    ExplorerSession.objects.filter(pk=visitor.pk, role='').update(role=role)
    return JsonResponse({'counts': _visitor_totals(), 'label': 'Self-selected visits'})


@require_POST
def chat_api(request):
    try:
        data = _payload(request)
        message = data.get('message', '')
        event = data.get('event', 'chat')
        if not isinstance(message, str) or len(message) > 1200 or event not in EVENTS:
            raise ValueError('Invalid message.')
        if event == 'chat' and not message.strip():
            raise ValueError('A message is required.')
        context = data.get('context', {})
        if not isinstance(context, dict):
            raise ValueError('Invalid context.')
        visited = context.get('visited', [])
        if not isinstance(visited, list):
            raise ValueError('Invalid discoveries.')
        safe_context = {
            'role': context.get('role') if context.get('role') in ROLES else 'explorer',
            'zone': context.get('zone') if context.get('zone') in ZONES else 'welcome',
            'visited': [v for v in visited[:7] if isinstance(v, str) and v in ZONES],
            'event': event,
        }
        from .nori_profiles import own_profile
        companion = own_profile(request)
        if companion:
            safe_context['returning_visitor'] = True
            safe_context['companion_outfit'] = companion.outfit
        history = data.get('history', [])
        if not isinstance(history, list):
            raise ValueError('Invalid history.')
        messages = []
        for item in history[-8:]:
            if not isinstance(item, dict) or item.get('role') not in ('user', 'assistant') or not isinstance(item.get('content'), str):
                raise ValueError('Invalid history item.')
            messages.append({'role': item['role'], 'content': item['content'][:1200]})
    except (ValueError, TypeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Please send a shorter, valid message.'}, status=400)

    # Anonymous session limit persists across workers. No chat text is stored.
    visitor = _explorer(request)
    today = timezone.localdate()
    ExplorerSession.objects.filter(pk=visitor.pk).filter(Q(guide_day__isnull=True) | ~Q(guide_day=today)).update(guide_day=today, guide_requests=0)
    if not ExplorerSession.objects.filter(pk=visitor.pk, guide_requests__lt=40).update(guide_requests=F('guide_requests') + 1):
        return JsonResponse({'error': 'Nori needs a recharge. The map and games still work; try chatting tomorrow.'}, status=429)
    # Additional short burst limit; only a salted digest is retained in cache.
    fingerprint = salted_hmac('guide-burst', request.META.get('REMOTE_ADDR', '')).hexdigest()
    key = 'guide-burst:' + fingerprint
    cache.add(key, 0, 60)
    try:
        burst = cache.incr(key)
    except ValueError:
        burst = 1
        cache.set(key, burst, 60)
    if burst > 15:
        return JsonResponse({'error': 'A tiny breather! Please try again in a minute.'}, status=429)
    try:
        client = Groq(api_key=os.getenv('GROQ_API_KEY'), timeout=12.0, max_retries=0)
        model = os.getenv('GROQ_MODEL', '').strip() or 'openai/gpt-oss-120b'
        # Reasoning models need room for internal tokens as well as the short reply.
        options = ({'reasoning_effort': 'low', 'include_reasoning': False,
                    'max_completion_tokens': 1024}
                   if model in ('openai/gpt-oss-120b', 'openai/gpt-oss-20b')
                   else {'max_completion_tokens': 160})
        completion = client.chat.completions.create(
            messages=[{'role': 'system', 'content': guide_prompt(portfolio_context())},
                      *messages,
                      {'role': 'user', 'content': 'Visitor context: ' + json.dumps(safe_context) + '\nVisitor message: ' + message[:1200]}],
            model=model, temperature=0.75, **options,
        )
        reply = completion.choices[0].message.content
        if not isinstance(reply, str) or not reply.strip():
            raise ValueError('Empty guide completion')
        return JsonResponse({'response': reply.strip()})
    except Exception as exc:
        # Log only diagnostic categories, never keys, request bodies or provider text.
        logging.getLogger(__name__).warning(
            'Portfolio guide provider unavailable: type=%s status=%s key_configured=%s',
            type(exc).__name__, getattr(exc, 'status_code', None),
            bool(os.getenv('GROQ_API_KEY')),
        )
        return JsonResponse({'error': 'Nori’s AI connection is taking a nap. The guided tour still works.'}, status=503)


def _cv_context(request):
    me = Me.objects.first()
    research = Research.objects.all().order_by('status', 'updated_at')
    top_projects = TopProject.objects.prefetch_related('tags').all().order_by('-created_at')
    skills = Skill.objects.all()
    experiences = Experience.objects.filter(workexperience__isnull=True)
    categories = AchievementCategory.objects.prefetch_related(
        Prefetch('achievements', queryset=Achievement.objects.filter(display=True))
    ).all()
    education = Education.objects.all()
    languages = [lang.strip() for lang in me.languages.split(',') if lang.strip()] if me and me.languages else []
    return {
        'me': me,
        'research': research,
        'top_projects': top_projects,
        'skills': skills,
        'languages': languages,
        'experiences': experiences,
        'work_experiences': WorkExperience.objects.prefetch_related('certificates'),
        'categories': categories,
        'education': education,
    }


def cv(request):
    from .resumes import tailor_context
    context = tailor_context(_cv_context(request), request.GET)
    return render(request, 'main/resume.html' if context.get('tailored') else 'main/cv.html', context)


def cv_download(request):
    from .resumes import tailor_context
    context = tailor_context(_cv_context(request), request.GET)
    context['pdf'] = True
    html_string = render_to_string('main/resume.html' if context.get('tailored') else 'main/cv_pdf.html', context, request=request)
    pdf = weasyprint.HTML(string=html_string, base_url=request.build_absolute_uri('/')).write_pdf()
    response = HttpResponse(pdf, content_type='application/pdf')
    me = context.get('me')
    filename = f"{me.name.replace(' ', '_')}_CV.pdf" if me else 'CV.pdf'
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def update_website(request):
    script_path = str(Path(__file__).resolve().parents[2] / "scripts" / "deploy.sh")
    try:
        result = subprocess.run(
            ["bash", script_path],
            capture_output=True,
            text=True,
            timeout=120,
        )
        output = result.stdout + result.stderr
        return HttpResponse(f"<pre>Return code: {result.returncode}\n\n{output}</pre>")
    except FileNotFoundError:
        return HttpResponse("Script not found at " + script_path, status=404)
    except subprocess.TimeoutExpired:
        return HttpResponse("Script timed out after 120 seconds", status=504)
    except Exception as e:
        return HttpResponse(f"Error: {e}", status=500)