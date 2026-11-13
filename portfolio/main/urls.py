from django.urls import path
from . import views
from core.homepage import home as editorial_home
from .nori_profiles import companion

app_name = "main"

urlpatterns = [
    path('nori-companion/', companion, name='nori_companion'),
    path('', editorial_home, name='home'),
    path('explore/', views.home, name='explore'),
    path('explorer-visit/', views.explorer_visit, name='explorer_visit'),
    path('chat-api/', views.chat_api, name='chat_api'),
    path('cv/', views.cv, name='cv'),
    path('cv/download/', views.cv_download, name='cv_download'),
    path('update-website/', views.update_website, name='update_website'),
]