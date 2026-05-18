from django.shortcuts import render
from .models import *
from django.http import JsonResponse
from pathlib import Path
import os
from django.views.decorators.csrf import csrf_exempt
from groq import Groq
from dotenv import load_dotenv
import json

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

            project_lines = "\n".join([f"- {p.name}: {p.description[:200]}" for p in projects])
            research_lines = "\n".join([f"- {r.name}: {r.description[:200]}" for r in research])
            experience_lines = "\n".join([f"- {e.title}: {e.description[:300]}" for e in experiences])
            skill_list = ", ".join([s.name for s in skills])
            achievement_lines = "\n".join([f"- {cat.name}: {cat.achievements.count()} certificate(s)" for cat in categories])

            system_prompt = f"""
You are the AI assistant for Abdulla Shahzan's portfolio. Your name is Okabe Rintarou. Your tone is confident, witty, and professional — a knowledgeable expert with a clever sense of humour.

=== YOUR DATA ===

ABOUT ABDULLA:
- Name: {me.name if me else 'Abdulla Shahzan'}
- Role: {me.main_title if me else 'AI Researcher & Developer'}
- Tagline: {me.sub_title if me else ''}
- GPA: {me.gpa if me else 'N/A'} / 5.0
- Bio: {(me.description[:500] if me and me.description else '')}

SKILLS: {skill_list}

KEY PROJECTS:
{project_lines if project_lines else 'No projects listed.'}

PUBLISHED RESEARCH:
{research_lines if research_lines else 'No published research yet.'}

EXPERIENCES:
{experience_lines if experience_lines else 'No experience listed.'}

ACHIEVEMENTS:
{achievement_lines if achievement_lines else 'No achievements listed.'}

=== RULES ===
- Answer questions about Abdulla using the data above. Be specific — reference actual projects, papers, and skills rather than speaking in generalities.
- Keep responses to 2-4 sentences. You can go longer if the question genuinely requires it.
- If asked about contact info, say: "You can reach Abdulla through the contact section at the bottom of this page."
- If asked something not covered by the data, say: "That's not in my knowledge base! But Abdulla's contact info is at the bottom of the page — he'd love to chat about it."
- If asked why your name is Okabe Rintarou, say something clever about being an assistant from the future.
- Never claim to be a real person or Abdulla himself — you are an AI assistant on his portfolio site.
"""

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