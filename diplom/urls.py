from rest_framework.authtoken.views import obtain_auth_token
from django.urls import include, path
from .views import *

urlpatterns = [
    path('sponsers/', It_SponserForuser.as_view(), name='sponslist'),
    path('auth/', include('rest_framework.urls')),
    path('sponsers/<int:pk>/', Sponsdel.as_view(), name='spons'),
    path('commenters_user/', Commentuser.as_view(), name='commentaries'),
    path('commentdel/<int:pk>/', commentdel.as_view(), name='del_for_com'),
    path('likes/', likes.as_view(), name="like"),
    path('register/', registrated.as_view(), name='registration'),
    path('like/del/<int:pk>/', likedel.as_view(), name='del_likes'),
    path('login/', obtain_auth_token),
    path('loginsession/', loginsession.as_view(), name='loginsession'),
    path('profile/', profile.as_view(), name='profile'),
    path('users/', userviews.as_view(), name='usersviews'),
    path('profile/update/', profile_update.as_view(), name='profile_update'),
    path('sponserotklik/<int:pk>/', sponserotklikview.as_view(), name='sponserotklik'),
    path('sponserotklik/', sponserotklikview1.as_view(), name='sponserotklik1'),
]
