"""
URL configuration for diplom_work project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from diplom.views import *
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('', index, name='index'),
    path('admin/', admin.site.urls),
    path('api/', include('diplom.urls')),
    path('register/', registration, name='register'),
    path('profile/', profile1, name='profile'),
    path('profile/update/', profile_updatehtml, name='profile_update'),
    path('sponsers/', sponsers, name='sponsers'),
    path('sponser_menu/', sponser_menu, name='sponser_menu'),
    path('login/', login, name='login'),
    path('users/', user_page, name='users'),
    path('otklik/', otklik, name='otklik'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)