from django.urls import path
from . import views

app_name = "main"

urlpatterns = [
    path('', views.home, name='home'),
    path('explorer-visit/', views.explorer_visit, name='explorer_visit'),
    path('chat-api/', views.chat_api, name='chat_api'),
    path('cv/', views.cv, name='cv'),
    path('cv/download/', views.cv_download, name='cv_download'),
    path('update-website/', views.update_website, name='update_website'),
]