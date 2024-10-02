from django.contrib import admin  # type: ignore
from django.urls import path, include  # type: ignore
from django.conf import settings  # type: ignore
from django.conf.urls.static import static  # type: ignore

from api.views import (
    AddGroupMemberView,
    AssignmentSubmissionView,
    CreateAssignmentView,
    ManageAssignmentRolesView,
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
    GroupCreateView
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
    path('api/workspace/<int:workspace_id>/create-group/',
         GroupCreateView.as_view(), name='create-group'),
    path('api/group/<int:group_id>/add-member/',
         AddGroupMemberView.as_view(), name='add-group-member'),
    path('api/workspace/<int:workspace_id>/create-assignment/',
         CreateAssignmentView.as_view(), name='create-assignment'),
    path('api/assignment/<int:assignment_id>/manage-roles/',
         ManageAssignmentRolesView.as_view(), name='manage-assignment-roles'),
    path('submissions/<str:submission_id>/',
         AssignmentSubmissionView.as_view(), name='assignment-submission'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
