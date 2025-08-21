from django.shortcuts import render
from .models import *
# Create your views here.
def home(request):
	about_me = aboutMe.objects.all()
	experiences = aboutMeExperiences.objects.all()
	huawei_category = CertificationCategory.objects.filter(name__iexact="Huawei").first()
	return render(request, "main/home.html",{
		"about_me":about_me,
		'experiences': experiences,
		"huawei_category": huawei_category
	})

def projects(request):
	all_projects = Project.objects.all().order_by('-last_updated')  # newest first
	context = {
        'projects': all_projects
    }
	return render(request, "main/projects.html", context)

def achievements(request):
	categories = CertificationCategory.objects.prefetch_related("certifications").all()
	context = {"categories":categories}
	return render(request, "main/achievements.html", context)