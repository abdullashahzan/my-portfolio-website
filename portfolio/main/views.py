# Hello, World!
from django.shortcuts import render
from .models import *
from django.db.models import Prefetch
from django.http import JsonResponse, HttpResponse
from django.template.loader import render_to_string
import weasyprint
from pathlib import Path
import os
from django.views.decorators.csrf import csrf_exempt
from groq import Groq
from dotenv import load_dotenv
import json
import subprocess

# Create your views here.
def home(request):
    # Fetch the single profile instance
    me = Me.objects.first()
    
    # Fetch lists for the various sections
    research_items = Research.objects.all().order_by('updated_at')
    research_published = Research.objects.filter(status='PB').order_by('updated_at')
    top_projects = TopProject.objects.prefetch_related('tags').all().order_by('-created_at')
    skills = Skill.objects.all()
    experiences = Experience.objects.all()
    
    # Get the specific Huawei category for the Internship section
    # Using icontains is safer in case of slight naming differences
    huawei_category = AchievementCategory.objects.filter(name__icontains="Huawei").first()
    
    # Fetch all categories with their linked achievements (certificates)
    # We use 'achievements' because that is the related_name in your ForeignKey
    categories = AchievementCategory.objects.prefetch_related("achievements").all()

    context = {
        "me": me,
        "research_items": research_items,
        "research_published":research_published,
        "top_projects": top_projects,
        "skills": skills,
        "experiences": experiences,
        "huawei_category": huawei_category,
        "categories": categories,
    }
    
    return render(request, "main/home.html", context)


# Initialize Groq Client
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@csrf_exempt
def chat_api(request):
    """API endpoint for the Groq-powered AI Assistant."""
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_message = data.get("message", "")

            # Gather dynamic data for the System Prompt
            me = Me.objects.first()
            projects = TopProject.objects.all()[:5]
            research = Research.objects.filter(status='PB')
            experiences = Experience.objects.all()
            skills = Skill.objects.all()
            categories = AchievementCategory.objects.all()
            education = Education.objects.all()

            project_lines = "\n".join([f"- {p.name}: {p.description[:200]}" for p in projects])
            research_lines = "\n".join([f"- {r.name}: {r.description[:200]}" for r in research])
            experience_lines = "\n".join([f"- {e.title}: {e.description[:300]}" for e in experiences])
            skill_list = ", ".join([s.name for s in skills])
            achievement_lines = "\n".join([f"- {cat.name}: {cat.achievements.count()} certificate(s)" for cat in categories])
            education_lines = "\n".join(
                [f"- {e.degree} at {e.institution} ({e.start_year}–{e.end_year})" + (f", GPA: {e.gpa}" if e.gpa else "") for e in education]
            )

            dynamic_data = {
                "about": (
                    f"- Name: {me.name if me else 'Abdulla Shahzan'}\n"
                    f"- Role: {me.main_title if me else 'AI Researcher & Developer'}\n"
                    f"- Tagline: {me.sub_title if me else ''}\n"
                    f"- GPA: {me.gpa if me else 'N/A'} / 5.0\n"
                    f"- Bio: {(me.description[:500] if me and me.description else '')}"
                ),
                "skills": skill_list,
                "projects": project_lines or "No projects listed.",
                "research": research_lines or "No published research yet.",
                "experiences": experience_lines or "No experience listed.",
                "achievements": achievement_lines or "No achievements listed.",
                "education": education_lines or "No education listed.",
            }

            config = ChatConfig.objects.first()
            system_prompt = config.system_prompt.format(**dynamic_data) if config else ""

            completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.65,
                max_tokens=500,
            )

            return JsonResponse({"response": completion.choices[0].message.content})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)


def _cv_context(request):
    me = Me.objects.first()
    research = Research.objects.all().order_by('status', 'updated_at')
    top_projects = TopProject.objects.prefetch_related('tags').all().order_by('-created_at')
    skills = Skill.objects.all()
    experiences = Experience.objects.all()
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
        'categories': categories,
        'education': education,
    }


def cv(request):
    context = _cv_context(request)
    return render(request, 'main/cv.html', context)


def cv_download(request):
    context = _cv_context(request)
    html_string = render_to_string('main/cv_pdf.html', context, request=request)
    pdf = weasyprint.HTML(string=html_string, base_url=request.build_absolute_uri('/')).write_pdf()
    response = HttpResponse(pdf, content_type='application/pdf')
    me = context.get('me')
    filename = f"{me.name.replace(' ', '_')}_CV.pdf" if me else 'CV.pdf'
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def update_website(request):
    script_path = "/home/MyPortfolioShahzan/deploy.sh"
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