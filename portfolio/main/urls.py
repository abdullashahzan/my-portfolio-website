from django.urls import path
from . import views

app_name = "main"

urlpatterns = [
    path('', views.home, name='home'),
    path('Projects/', views.projects, name='projects'),
    path('Achievements/', views.achievements, name='achievements'),
]