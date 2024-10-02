# api/views.py
import uuid
import requests
import urllib.parse
from django.shortcuts import redirect  # type: ignore
from django.conf import settings  # type: ignore
from django.http import JsonResponse  # type: ignore
from rest_framework import generics, status  # type: ignore
from rest_framework.permissions import IsAuthenticated, AllowAny  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework_simplejwt.authentication import JWTAuthentication  # type: ignore
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore
from django.middleware.csrf import CsrfViewMiddleware, get_token  # type: ignore
from .models import (AssignmentDetails, AssignmentRoles, AssignmentStatus, GroupDetails, WorkspaceDetail,
                     UserDetails,
                     WorkspaceMembers,
                     GroupMembers)
from .serializers import (AddGroupMemberSerializer, AssignmentCreateSerializer, AssignmentRoleSerializer, AssignmentSubmissionSerializer, WorkspaceCreateSerializer,
                          UserRegistrationSerializer,
                          UserLoginSerializer,
                          ProfileUpdateSerializer,
                          InvitationLinkSerializer,
                          TokenRefreshSerializer,
                          UserProfileSerializer,
                          GroupCreateSerializer)


class OAuth2Handler:
    def __init__(self):
        self.authorization_url = settings.AUTHORIZATION_URL
        self.client_id = settings.CLIENT_ID
        self.redirect_uri = settings.REDIRECT_URI
        self.client_secret = settings.CLIENT_SECRET
        self.token_url = settings.TOKEN_URL
        self.user_info_url = settings.USER_INFO_URL

    def authorize_user(self, request):
        state = str(uuid.uuid4())
        request.session['oauth_state'] = state
        request.session.save()
        authorization_url = f"{self.authorization_url}?client_id={self.client_id}&redirect_uri={self.redirect_uri}&state={state}"
        return redirect(authorization_url)

    def oauth_callback(self, request):
        code = request.GET.get('code')
        state = request.GET.get('state')
        stored_state = request.session.get('oauth_state')

        # if state != stored_state:
        #     print(state, " ", stored_state)
        #     return JsonResponse({'error': 'State mismatch'}, status=400)

        # # Remove the state from the session after the check
        # request.session.pop('oauth_state', None)

        # Exchange the authorization code for an access token
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
        }

        response = requests.post(self.token_url, data=data)
        token_data = response.json()

        if 'access_token' in token_data:
            access_token = token_data['access_token']

            user_info_response = requests.get(self.user_info_url, headers={
                'Authorization': f'Bearer {access_token}'
            })
            user_info = user_info_response.json()
            print("user_info: ", user_info)

            email = user_info['contactInformation']['emailAddress']
            name = user_info['person']['fullName']
            profile_image = "https://channeli.in" + \
                user_info['person'].get('displayPicture', '')

            user, created = UserDetails.objects.update_or_create(
                email=email,
                defaults={
                    'name': name,
                    'profile_image': profile_image,
                }
            )

            refresh = RefreshToken.for_user(user)
            tokens = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }

            return JsonResponse({
                'user_id': user.user_id,
                'name': user.name,
                'email': user.email,
                'profile_image': urllib.parse.unquote(user.profile_image.url) if user.profile_image else None, 'refresh': tokens['refresh'],
                'access': tokens['access'],
            })
        else:
            return JsonResponse({'error': 'Failed to obtain access token'}, status=400)


class UserRegistrationView(generics.CreateAPIView):
    queryset = UserDetails.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class UserLoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        tokens = serializer.create(user)
        csrf_token = get_token(request)
        response = Response({
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "refresh": tokens['refresh'],
            "access": tokens['access'],
            "csrf_token": csrf_token,
        }, status=status.HTTP_200_OK)
        response.set_cookie('csrftoken', csrf_token,
                            secure=True, httponly=True)
        response.set_cookie(
            'access', tokens['access'], secure=True, httponly=True)
        response.set_cookie(
            'refresh', tokens['refresh'], secure=True, httponly=True)
        return response


class ProfileUpdateView(generics.UpdateAPIView):
    queryset = UserDetails.objects.all()
    serializer_class = ProfileUpdateSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_object(self):
        return self.request.user

    def put(self, request):
        csrf_middleware = CsrfViewMiddleware()
        csrf_middleware.process_view(request, None, (), {})

        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspaceCreateView(generics.CreateAPIView):
    queryset = WorkspaceDetail.objects.all()
    serializer_class = WorkspaceCreateSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class GenerateInvitationLinkView(generics.GenericAPIView):
    serializer_class = InvitationLinkSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, workspace_id):
        user = request.user
        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user, workspace_role='2').exists():
            return Response({"detail": "You do not have permission to generate an invitation link for this workspace."}, status=status.HTTP_403_FORBIDDEN)

        workspace.generate_invitation_token()
        serializer = self.get_serializer(workspace)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class JoinWorkspaceView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        token = request.data.get('token')
        try:
            workspace = WorkspaceDetail.objects.get(invitation_token=token)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Invalid invitation link."}, status=status.HTTP_400_BAD_REQUEST)

        if workspace.is_token_expired():
            return Response({"detail": "This invitation link has expired."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        WorkspaceMembers.objects.create(
            workspace_id=workspace, user_id=user, workspace_role='1')
        return Response({"detail": "You have successfully joined the workspace."}, status=status.HTTP_200_OK)


class WorkspaceListView(generics.ListAPIView):
    queryset = WorkspaceDetail.objects.all()
    serializer_class = WorkspaceCreateSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]


class TokenRefreshView(generics.GenericAPIView):
    serializer_class = TokenRefreshSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class WorkspaceAccessView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, workspace_id):
        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        try:
            membership = WorkspaceMembers.objects.get(
                workspace_id=workspace, user_id=user)
        except WorkspaceMembers.DoesNotExist:
            return Response({"detail": "You are not a member of this workspace."}, status=status.HTTP_403_FORBIDDEN)

        user_details = UserProfileSerializer(user).data
        workspace_details = WorkspaceCreateSerializer(workspace).data

        if membership.workspace_role == '2':  # Role 2 indicates admin
            return Response({"detail": "Admin view", "workspace": workspace_details, "user": user_details}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Member view", "workspace": workspace_details, "user": user_details}, status=status.HTTP_200_OK)


class GroupCreateView(generics.CreateAPIView):
    serializer_class = GroupCreateSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def create(self, request, workspace_id):
        user = request.user
        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user, workspace_role='2').exists():
            return Response({"detail": "You do not have permission to create a group in this workspace."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = serializer.save()

        GroupMembers.objects.create(userID=user, groupID=group)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class AddGroupMemberView(generics.CreateAPIView):
    serializer_class = AddGroupMemberSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def create(self, request, group_id):
        user = request.user
        try:
            group = GroupDetails.objects.get(groupID=group_id)
        except GroupDetails.DoesNotExist:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        workspace = group.workspace_id

        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user, workspace_role='2').exists():
            return Response({"detail": "You do not have permission to add members to this group."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class CreateAssignmentView(generics.CreateAPIView):
    serializer_class = AssignmentCreateSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['workspace_id'] = self.kwargs['workspace_id']
        return context

    def create(self, request, workspace_id):
        user = request.user
        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user).exists():
            return Response({"detail": "You are not a member of this workspace."}, status=status.HTTP_403_FORBIDDEN)

        return super().create(request)


class ManageAssignmentRolesView(generics.CreateAPIView):
    serializer_class = AssignmentRoleSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def create(self, request, assignment_id):
        user = request.user
        try:
            assignment = AssignmentDetails.objects.get(
                assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        if not AssignmentRoles.objects.filter(assignment=assignment, user=user, role_id='2').exists():
            return Response({"detail": "You do not have permission to manage roles for this assignment."}, status=status.HTTP_403_FORBIDDEN)

        return super().create(request)


class AssignmentSubmissionView(generics.UpdateAPIView):
    queryset = AssignmentStatus.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    lookup_field = 'submission_id'

    def update(self, request, *args, **kwargs):
        user = request.user
        submission_id = kwargs.get('submission_id')
        try:
            assignment_status = AssignmentStatus.objects.get(
                submission_id=submission_id, user=user)
        except AssignmentStatus.DoesNotExist:
            return Response({"detail": "Submission not found or you do not have permission to update this submission."}, status=status.HTTP_404_NOT_FOUND)

        return super().update(request, *args, **kwargs)
