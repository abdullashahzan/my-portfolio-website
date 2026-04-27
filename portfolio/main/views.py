from django.shortcuts import render
from .models import *
from django.http import JsonResponse
from django.template.loader import render_to_string
from weasyprint import HTML
import tempfile
from django.http import HttpResponse
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
load_dotenv() # This looks for the .env file and loads the variables
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
            project_list = ", ".join([p.name for p in TopProject.objects.all()[:5]])
            research_list = ", ".join([r.name for r in Research.objects.filter(status='PB')])

            system_prompt = f"""
            You are the AI Assistant for Abdulla Shahzan. 
            Tone: Professional, minimalist, and witty. 
            
            Context:
            - User Name: {me.name if me else 'Abdulla'}
            - Role: AI Researcher & Developer.
            - Key Projects: {project_list}.
            - Published Research: {research_list}.
            
            Instructions:
            - Answer in the third person (e.g., "Abdulla developed...").
            - Keep responses under 3 sentences unless asked for detail.
            - If asked about contact info, tell them to use the contact section below.
            - If you don't know an answer based on the context, say: "That's a great question. You should ask Abdulla directly—his contact info is at the bottom of the page."
            """

            completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=250,
            )

            return JsonResponse({"response": completion.choices[0].message.content})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)