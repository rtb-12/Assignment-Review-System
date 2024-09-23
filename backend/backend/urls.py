# backend/urls.py
from django.contrib import admin
from django.urls import path, include

from api.views import (
    UserRegistrationView,
    UserLoginView,
    ProfileUpdateView,
    WorkspaceCreateView,
    GenerateInvitationLinkView,
    JoinWorkspaceView,
    OAuth2Handler
)

oauth_handler = OAuth2Handler()


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/register/', UserRegistrationView.as_view(), name='register'),
    path('api/user/login/', UserLoginView.as_view(), name='login'),
    path('api/user/update-profile/', ProfileUpdateView.as_view(), name='update-profile'),
    path('api/workspace/create/', WorkspaceCreateView.as_view(), name='create-workspace'),
    path('api/workspace/generate-invitation/', GenerateInvitationLinkView.as_view(), name='generate-invitation'),
    path('api/workspace/join/', JoinWorkspaceView.as_view(), name='join-workspace'),
    path('oauth/authorize/', oauth_handler.authorize_user, name='authorize_user'),
    path('callback/', oauth_handler.oauth_callback, name='oauth_callback'),
]