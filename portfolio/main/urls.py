from django.urls import path
from . import views

app_name = "main"

urlpatterns = [
    path('', views.home, name='home'),
    path('Projects/', views.projects, name='projects'),
    path('Projects/<str:project_id>', views.view_project, name='view_project'),
    path('Achievements/', views.achievements, name='achievements'),
]