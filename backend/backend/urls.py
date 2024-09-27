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
    OAuth2Handler,
    WorkspaceListView,
    TokenRefreshView,
    WorkspaceAccessView,
)

oauth_handler = OAuth2Handler()


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/register/', UserRegistrationView.as_view(), name='register'),
    path('api/user/login/', UserLoginView.as_view(), name='login'),
    path('api/user/update-profile/',
         ProfileUpdateView.as_view(), name='update-profile'),
    path('api/workspace/create/', WorkspaceCreateView.as_view(),
         name='create-workspace'),
    path('api/workspace/generate-invitation/<int:workspace_id>/',
         GenerateInvitationLinkView.as_view(), name='generate-invitation'),
    path('api/workspace/join/', JoinWorkspaceView.as_view(), name='join-workspace'),
    path('api/workspace/list/', WorkspaceListView.as_view(), name='list-workspaces'),
    path('api/workspace/access/<int:workspace_id>/',
         WorkspaceAccessView.as_view(), name='workspace-access'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('oauth/authorize/', oauth_handler.authorize_user, name='authorize_user'),
    path('callback/', oauth_handler.oauth_callback, name='oauth_callback'),

]
