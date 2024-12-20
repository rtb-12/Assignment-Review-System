# api/views.py
from datetime import timezone
import json
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.response import Response
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
from django.db.models import Sum
from django.utils import timezone
from .models import (AssignmentDetails, AssignmentRoles, AssignmentStatus, GroupDetails, WorkspaceDetail,
                     UserDetails,
                     WorkspaceMembers,
                     GroupMembers)
from .serializers import (AddGroupMemberSerializer, AssignmentCreateSerializer, AssignmentDetailsSerializer, AssignmentDetailsViewSerializer, AssignmentFeedbackSerializer, AssignmentRevieweeViewSerializer, AssignmentRoleSerializer, AssignmentStatusDetailSerializer, AssignmentSubmissionSerializer, AssignmentSubtaskUpdateSerializer, BaseAssignmentSerializer, GroupSerializer, LeaderboardSerializer, RevieweeSubmissionSerializer, RevieweeSubtaskSerializer, SubtaskStatusUpdateSerializer, WorkspaceCreateSerializer,
                          UserRegistrationSerializer,
                          UserLoginSerializer,
                          ProfileUpdateSerializer,
                          InvitationLinkSerializer,
                          TokenRefreshSerializer,
                          UserProfileSerializer,
                          GroupCreateSerializer)

import logging

logger = logging.getLogger(__name__)


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
        authorization_url = f"{self.authorization_url}?client_id={
            self.client_id}&redirect_uri={self.redirect_uri}&state={state}"
        print("authorization_url", authorization_url)
        return redirect(authorization_url)

    def oauth_callback(self, request):
        code = request.GET.get('code')
        state = request.GET.get('state')
        stored_state = request.session.get('oauth_state')

    # # Check for state mismatch
    # if state != stored_state:
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
                'profile_image':  urllib.parse.unquote(user.profile_image.url).replace('/media/', '', 1) if user.profile_image else None,
                'refresh': tokens['refresh'],
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
                            secure=True, httponly=False, samesite='None')
        response.set_cookie('access', tokens['access'],
                            secure=True, httponly=False, samesite='None')
        response.set_cookie('refresh', tokens['refresh'],
                            secure=True, httponly=False, samesite='None')

        response['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response['Access-Control-Allow-Credentials'] = 'true'

        return response


class UserDetailsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def clean_profile_pic_url(self, url: str) -> str:
        if url.startswith("/media/"):
            url = url[len("/media/"):]

        url = urllib.parse.unquote(url)

        return url

    def get(self, request):
        user = request.user
        profile_pic_url = user.profile_image.url if user.profile_image else None
        cleaned_profile_pic_url = self.clean_profile_pic_url(
            profile_pic_url) if profile_pic_url else None

        user_details = {
            "user_id": user.user_id,
            "username": user.name,
            "profile_pic": cleaned_profile_pic_url,
        }
        return Response(user_details, status=status.HTTP_200_OK)


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


class UserWorkspacesView(generics.ListAPIView):
    serializer_class = WorkspaceCreateSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        workspace_ids = WorkspaceMembers.objects.filter(
            user_id=user).values_list('workspace_id', flat=True)
        return WorkspaceDetail.objects.filter(workspace_id__in=workspace_ids)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


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

        # Check if user is workspace admin
        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user, workspace_role='2').exists():
            return Response({"detail": "You do not have permission to create a group in this workspace."}, status=status.HTTP_403_FORBIDDEN)

        # Get members list from request
        members = request.data.get('members', [])
        if not isinstance(members, list):
            try:
                members = json.loads(members)
            except json.JSONDecodeError:
                return Response({"detail": "Invalid members format"}, status=status.HTTP_400_BAD_REQUEST)

        # Create group
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = serializer.save(workspace_id=workspace)

        # Add members to group
        for member_id in members:
            try:
                user_to_add = UserDetails.objects.get(user_id=member_id)
                if WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user_to_add).exists():
                    GroupMembers.objects.create(
                        userID=user_to_add, groupID=group)
            except UserDetails.DoesNotExist:
                continue  # Skip if user doesn't exist

        # Add the creator as a member if not already in the list
        if user.user_id not in members:
            GroupMembers.objects.create(userID=user, groupID=group)

        # Get updated group data with members
        group_serializer = GroupSerializer(group)
        headers = self.get_success_headers(serializer.data)
        return Response(group_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class AddGroupMemberView(generics.CreateAPIView):
    serializer_class = AddGroupMemberSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def create(self, request, group_id):
        user = request.user
        groupID = request.data.get('groupID')
        userID = request.data.get('userID')

        try:
            group = GroupDetails.objects.get(groupID=groupID)
            user_to_add = UserDetails.objects.get(user_id=userID)
        except GroupDetails.DoesNotExist:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        except UserDetails.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        workspace = group.workspace_id

        # Check if requesting user is workspace admin
        if not WorkspaceMembers.objects.filter(
            workspace_id=workspace,
            user_id=user,
            workspace_role='2'
        ).exists():
            return Response(
                {"detail": "You do not have permission to add members to this group."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if user to be added is a workspace member
        if not WorkspaceMembers.objects.filter(
            workspace_id=workspace,
            user_id=user_to_add
        ).exists():
            return Response(
                {"detail": "User is not a member of this workspace."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is already a group member
        if GroupMembers.objects.filter(groupID=group, userID=user_to_add).exists():
            return Response(
                {"detail": "User is already a member of this group."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create new group member
        group_member = GroupMembers.objects.create(
            groupID=group,
            userID=user_to_add
        )

        serializer = self.get_serializer(group_member)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class RemoveGroupMemberView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def delete(self, request, group_id):
        user = request.user
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"detail": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            group = GroupDetails.objects.get(groupID=group_id)
        except GroupDetails.DoesNotExist:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        workspace = group.workspace_id

        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user, workspace_role='2').exists():
            return Response({"detail": "You do not have permission to remove members from this group."}, status=status.HTTP_403_FORBIDDEN)

        try:
            member_to_remove = UserDetails.objects.get(user_id=user_id)
        except UserDetails.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            group_member = GroupMembers.objects.get(
                groupID=group, userID=member_to_remove)
            group_member.delete()
            return Response({"detail": "Member removed from group successfully."}, status=status.HTTP_204_NO_CONTENT)
        except GroupMembers.DoesNotExist:
            return Response({"detail": "Member not found in this group."}, status=status.HTTP_404_NOT_FOUND)


class CreateAssignment(generics.CreateAPIView):
    serializer_class = AssignmentCreateSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def create(self, request, workspace_id):
        user = request.user
        data = request.data

        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user).exists():
            return Response({"detail": "You are not a member of this workspace."}, status=status.HTTP_403_FORBIDDEN)

        # Get individual members and group IDs from request
        individual_members = request.data.getlist('individual_members', [])
        group_ids = request.data.getlist('group_ids', [])

        # Get all members from the specified groups
        group_members = []
        for group_id in group_ids:
            try:
                members = GroupMembers.objects.filter(
                    groupID=group_id
                ).values_list('userID', flat=True)
                group_members.extend(list(members))
            except Exception as e:
                logger.error(f"Error fetching members for group {
                             group_id}: {e}")

        all_members = list(set(individual_members + group_members))

        assignment_serializer = self.get_serializer(
            data=data,
            context={
                'workspace_id': workspace_id,
                'request': request,
                'individual_members': all_members
            }
        )

        if not assignment_serializer.is_valid():
            return Response(assignment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        assignment_serializer.save()
        return Response(assignment_serializer.data, status=status.HTTP_201_CREATED)


class UpdateAssignment(generics.UpdateAPIView):
    serializer_class = AssignmentCreateSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def update(self, request, workspace_id, assignment_id):
        user = request.user
        data = request.data

        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user).exists():
            return Response({"detail": "You are not a member of this workspace."}, status=status.HTTP_403_FORBIDDEN)

        if not AssignmentRoles.objects.filter(user=user, role_id=2).exists():
            return Response({"detail": "You do not have permission to update this assignment."}, status=status.HTTP_403_FORBIDDEN)

        try:
            assignment = AssignmentDetails.objects.get(
                workspace_id=workspace, assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        individual_members = request.data.get('individual_members', [])

        assignment_serializer = self.get_serializer(assignment, data=data, context={
                                                    'workspace_id': workspace_id, 'request': request, 'individual_members': individual_members}, partial=True)
        if not assignment_serializer.is_valid():
            return Response(assignment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        assignment_serializer.save()

        return Response(assignment_serializer.data, status=status.HTTP_200_OK)


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

    def update(self, request, *args, **kwargs):
        user = request.user
        assignment_id = kwargs.get('assignment_id')
        assignment_statuses = AssignmentStatus.objects.filter(
            assignment_id=assignment_id, user=user)

        if not assignment_statuses.exists():
            return Response({"detail": "Submission not found or you do not have permission to update this submission."}, status=status.HTTP_404_NOT_FOUND)

        for assignment_status in assignment_statuses:
            serializer = self.get_serializer(
                assignment_status, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            # Update the status to "started"
            assignment_status.status = "started"
            assignment_status.save()

        return Response(serializer.data, status=status.HTTP_200_OK)


class LeaderboardView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = LeaderboardSerializer

    def get(self, request, workspace_id):
        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response(
                {"detail": "Workspace not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        user_ids = WorkspaceMembers.objects.filter(
            workspace_id=workspace_id
        ).values_list('user_id', flat=True)

        workspace_assignments = AssignmentDetails.objects.filter(
            workspace_id=workspace_id
        ).values_list('assignment_id', flat=True)

        leaderboard_data = AssignmentStatus.objects.filter(
            user_id__in=user_ids,
            assignment_id__in=workspace_assignments
        ).select_related('user').values(
            'user__name',
            'user__profile_image'
        ).annotate(
            points=Sum('points_assign')
        ).order_by('-points')

        leaderboard = [
            {
                'name': data['user__name'],
                'image': data['user__profile_image'],
                'points': data['points'] or 0
            }
            for data in leaderboard_data
        ]

        serializer = self.get_serializer(leaderboard, many=True)
        return Response(serializer.data)


class OngoingAssignmentsView(generics.ListAPIView):
    serializer_class = BaseAssignmentSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        workspace_id = self.kwargs.get('workspace_id')
        now = timezone.now()

        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return AssignmentDetails.objects.none()

        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user).exists():
            return AssignmentDetails.objects.none()

        assigned_assignments = AssignmentRoles.objects.filter(
            user=user,
            role_id=1,
            assignment__workspace_id=workspace
        ).values_list('assignment', flat=True)

        if not assigned_assignments.exists():
            return AssignmentDetails.objects.none()

        ongoing_assignments = AssignmentStatus.objects.filter(
            user=user,
            assignment__deadline__gt=now,
            assignment__in=assigned_assignments,
            assignment__workspace_id=workspace
        ).select_related('assignment')

        filtered_assignments = set()
        for assignment_status in ongoing_assignments:
            # Check if any subtask is not completed
            subtask_statuses = AssignmentStatus.objects.filter(
                assignment=assignment_status.assignment,
                user=user
            ).values_list('status', flat=True)

            # If any subtask is not 'completed', add to ongoing assignments
            if any(status.lower() != 'completed' for status in subtask_statuses):
                filtered_assignments.add(assignment_status.assignment)

        return list(filtered_assignments)


class CompletedAssignmentsView(generics.ListAPIView):
    serializer_class = BaseAssignmentSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        workspace_id = self.kwargs.get('workspace_id')
        logger.debug(f"Fetching completed assignments for user {
                     user.user_id} in workspace {workspace_id}")

        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
            logger.debug(f"Found workspace: {workspace.workspace_name}")
        except WorkspaceDetail.DoesNotExist:
            logger.error(f"Workspace {workspace_id} not found")
            return AssignmentDetails.objects.none()

        # Check if user is workspace member
        is_member = WorkspaceMembers.objects.filter(
            workspace_id=workspace, user_id=user).exists()
        logger.debug(f"User is workspace member: {is_member}")
        if not is_member:
            logger.warning(
                f"User {user.user_id} is not a member of workspace {workspace_id}")
            return AssignmentDetails.objects.none()

        # Get assignments where user is assigned with role value 1 (student)
        assigned_assignments = AssignmentRoles.objects.filter(
            user=user,
            role_id=1,
            assignment__workspace_id=workspace
        ).values_list('assignment', flat=True)

        logger.debug(
            f"Found {assigned_assignments.count()} assigned assignments")
        if not assigned_assignments.exists():
            logger.debug("No assignments found for user")
            return AssignmentDetails.objects.none()

        # Filter assignments where all subtasks are completed
        filtered_assignments = []
        for assignment_id in assigned_assignments:
            logger.debug(f"Checking completion status for assignment {
                         assignment_id}")

            subtask_statuses = AssignmentStatus.objects.filter(
                user=user,
                assignment_id=assignment_id
            ).values_list('status', flat=True)

            logger.debug(f"Assignment {assignment_id} subtask statuses: {
                         list(subtask_statuses)}")

            # Check if all subtasks are marked as "completed" (case-insensitive)
            if subtask_statuses and all(status.lower() == 'completed' for status in subtask_statuses):
                logger.debug(f"Assignment {assignment_id} is completed")
                filtered_assignments.append(assignment_id)
            else:
                logger.debug(f"Assignment {assignment_id} is not completed")

        logger.debug(f"Found {len(filtered_assignments)
                              } completed assignments")

        # Return the completed assignments
        completed_assignments = AssignmentDetails.objects.filter(
            assignment_id__in=filtered_assignments,
            workspace_id=workspace
        )
        logger.debug(
            f"Returning {completed_assignments.count()} completed assignments")

        return completed_assignments


class CrossedDeadlineAssignmentsView(generics.ListAPIView):
    serializer_class = BaseAssignmentSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()

        # Filter assignments where the deadline is crossed
        crossed_deadline_assignments = AssignmentStatus.objects.filter(
            user=user,
            assignment__deadline__lte=now
        ).select_related('assignment')

        return crossed_deadline_assignments


class AssignmentStatusDetailView(generics.RetrieveAPIView):
    serializer_class = AssignmentStatusDetailSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, user_id, assignment_id):
        try:
            user = UserDetails.objects.get(user_id=user_id)
        except UserDetails.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            assignment = AssignmentDetails.objects.get(
                assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            assignment_status = AssignmentStatus.objects.get(
                user=user, assignment=assignment)
        except AssignmentStatus.DoesNotExist:
            return Response({"detail": "Assignment status not found for this user."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(assignment_status)
        return Response(serializer.data)


# class ViewAssignmentDetailsView(generics.RetrieveAPIView):
#     serializer_class = AssignmentDetailsSerializer
#     permission_classes = [IsAuthenticated]
#     authentication_classes = [JWTAuthentication]
#     lookup_field = 'assignment_id'
#     queryset = AssignmentDetails.objects.all()

#     def get(self, request, assignment_id):
#         try:
#             assignment = AssignmentDetails.objects.get(
#                 assignment_id=assignment_id)
#         except AssignmentDetails.DoesNotExist:
#             return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

#         serializer = self.get_serializer(assignment)
#         return Response(serializer.data)


class ListGroupsInWorkspaceView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = GroupSerializer

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        return GroupDetails.objects.filter(workspace_id=workspace_id)


class ListMembersInWorkspaceView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        user_ids = WorkspaceMembers.objects.filter(
            workspace_id=workspace_id).values_list('user_id', flat=True)
        return UserDetails.objects.filter(user_id__in=user_ids)


class RemoveMemberFromAssignmentView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def delete(self, request, *args, **kwargs):
        user_id = request.data.get('userID')
        assignment_id = request.data.get('assignment_id')

        try:
            assignment = AssignmentDetails.objects.get(
                assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            user_to_remove = UserDetails.objects.get(user_id=user_id)
        except UserDetails.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            assignment_role = AssignmentRoles.objects.get(
                assignment=assignment, user=user_to_remove)
            assignment_role.delete()
            return Response({"detail": "Member removed from assignment successfully."}, status=status.HTTP_204_NO_CONTENT)
        except AssignmentRoles.DoesNotExist:
            return Response({"detail": "Member not assigned to this assignment."}, status=status.HTTP_404_NOT_FOUND)


class ListAssignmentForReviwerView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, *args, **kwargs):
        user = request.user
        workspace_id = kwargs.get('workspace_id')

        try:
            assignments = AssignmentDetails.objects.filter(
                assignor=user, workspace_id=workspace_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignmnet not found in this workspace"}, status=status.HTTP_404_NOT_FOUND)

        serializer = BaseAssignmentSerializer(assignments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListReveiweeForAssignmentView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, *args, **kwargs):
        user = request.user
        workspace_id = kwargs.get('workspace_id')
        assignment_id = kwargs.get('assignment_id')

        try:
            assignment = AssignmentDetails.objects.get(
                assignor=user, workspace_id=workspace_id, assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found in this workspace"}, status=status.HTTP_404_NOT_FOUND)

        try:
            reviewers = AssignmentRoles.objects.filter(
                assignment=assignment, role_id=2, user=user)
        except AssignmentRoles.DoesNotExist:
            return Response({"detail": "No reviewers found for this assignment"}, status=status.HTTP_404_NOT_FOUND)

        if not reviewers.exists():
            return Response({"detail": "You are not a reviewer for this assignment"}, status=status.HTTP_403_FORBIDDEN)

        students = AssignmentRoles.objects.filter(
            assignment=assignment, role_id=1).values_list('user_id', flat=True)
        students = UserDetails.objects.filter(user_id__in=students)

        serializer = AssignmentRevieweeViewSerializer(
            students, many=True, context={'assignment_id': assignment_id})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AssignmentDescriptionView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, *args, **kwargs):
        user = request.user
        workspace_id = kwargs.get('workspace_id')
        assignment_id = kwargs.get('assignment_id')

        try:
            assignment = AssignmentDetails.objects.get(
                workspace_id=workspace_id, assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found in this workspace"}, status=status.HTTP_404_NOT_FOUND)

        user_exists = AssignmentRoles.objects.filter(
            assignment=assignment, user=user).exists()
        if not user_exists:
            return Response({"detail": "Assignment does not exist for this user"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AssignmentDetailsViewSerializer(assignment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateSubtaskStatusView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = AssignmentSubtaskUpdateSerializer

    def update(self, request, *args, **kwargs):
        user = request.user
        workspace_id = kwargs.get('workspace_id')
        assignment_id = kwargs.get('assignment_id')
        reviewee_id = kwargs.get('reviewee_id')

        try:
            reviewee = UserDetails.objects.get(user_id=reviewee_id)
        except UserDetails.DoesNotExist:
            return Response({"detail": "Reviewee not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            assignment = AssignmentDetails.objects.get(
                workspace_id=workspace_id, assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found in this workspace"}, status=status.HTTP_404_NOT_FOUND)

        try:
            reviewer = AssignmentRoles.objects.get(
                assignment=assignment, user=user, role_id=2)
        except AssignmentRoles.DoesNotExist:
            return Response({"detail": "You are not a reviewer for this assignment"}, status=status.HTTP_403_FORBIDDEN)

        try:
            reviewee_assignment = AssignmentStatus.objects.get(
                assignment=assignment, user=reviewee)
        except AssignmentStatus.DoesNotExist:
            return Response({"detail": "Reviewee assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(
            reviewee_assignment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateSubtaskFeedbackView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = AssignmentFeedbackSerializer

    def update(self, request, *args, **kwargs):
        user = request.user
        workspace_id = kwargs.get('workspace_id')
        assignment_id = kwargs.get('assignment_id')
        reviewee_id = kwargs.get('reviewee_id')

        try:
            reviewee = UserDetails.objects.get(user_id=reviewee_id)
        except UserDetails.DoesNotExist:
            return Response({"detail": "Reviewee not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            assignment = AssignmentDetails.objects.get(
                workspace_id=workspace_id, assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found in this workspace"}, status=status.HTTP_404_NOT_FOUND)

        try:
            reviewer = AssignmentRoles.objects.get(
                assignment=assignment, user=user, role_id=2)
        except AssignmentRoles.DoesNotExist:
            reviewer = None

        if not reviewer and user != reviewee:
            return Response({"detail": "You do not have permission to comment on this assignment"}, status=status.HTTP_403_FORBIDDEN)

        reviewee_assignments = AssignmentStatus.objects.filter(
            assignment=assignment, user=reviewee)

        if not reviewee_assignments.exists():
            return Response({"detail": "Reviewee assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        for reviewee_assignment in reviewee_assignments:
            serializer = self.get_serializer(
                reviewee_assignment, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        return Response({"detail": "All matching records updated successfully."}, status=status.HTTP_200_OK)


class ListFeedbackView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = AssignmentFeedbackSerializer

    def list(self, request, *args, **kwargs):
        user = request.user
        workspace_id = kwargs.get('workspace_id')
        assignment_id = kwargs.get('assignment_id')
        reviewee_id = kwargs.get('reviewee_id')
        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            reviewee = UserDetails.objects.get(user_id=reviewee_id)
        except UserDetails.DoesNotExist:
            return Response({"detail": "Reviewee not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            assignment = AssignmentDetails.objects.get(
                workspace_id=workspace_id, assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found in this workspace"}, status=status.HTTP_404_NOT_FOUND)

        feedback_view = AssignmentStatus.objects.filter(
            assignment=assignment, user=reviewee)
        feedback_view = feedback_view.first()
        serializer = self.get_serializer(feedback_view)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListMembersInWorkspaceView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        user_ids = WorkspaceMembers.objects.filter(
            workspace_id=workspace_id).values_list('user_id', flat=True)
        return UserDetails.objects.filter(user_id__in=user_ids)


class ListGroupsInWorkspaceView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = GroupSerializer

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        user = self.request.user

        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return []

        try:
            membership = WorkspaceMembers.objects.get(
                workspace_id=workspace, user_id=user)
        except WorkspaceMembers.DoesNotExist:
            return []

        return GroupDetails.objects.filter(workspace_id=workspace_id).prefetch_related(
            'groupmembers_set',
            'groupmembers_set__userID'
        )


class FetchSubmissionOfReviwee(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = RevieweeSubmissionSerializer

    def get(self, request, *args, **kwargs):
        user = request.user
        workspace_id = kwargs.get('workspace_id')
        assignment_id = kwargs.get('assignment_id')
        reviwee_id = kwargs.get('reviwee_id')

        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            assignment = AssignmentDetails.objects.get(
                workspace_id=workspace, assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            reviewer = AssignmentRoles.objects.get(
                assignment=assignment, user=user, role_id=2)
        except AssignmentRoles.DoesNotExist:
            return Response({"detail": "You are not a reviewer for this assignment"}, status=status.HTTP_403_FORBIDDEN)

        try:
            reviwee = UserDetails.objects.get(user_id=reviwee_id)
        except UserDetails.DoesNotExist:
            return Response({"detail": "Reviwee not found"}, status=status.HTTP_404_NOT_FOUND)

        reviwee_assignments = AssignmentStatus.objects.filter(
            assignment=assignment, user=reviwee)

        if not reviwee_assignments.exists():
            return Response({"detail": "Reviwee assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        reviwee_assignment = reviwee_assignments.first()

        serializer = self.get_serializer(reviwee_assignment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListRevieweeSubtasksView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = RevieweeSubtaskSerializer

    def get(self, request, *args, **kwargs):
        user = request.user
        workspace_id = kwargs.get('workspace_id')
        assignment_id = kwargs.get('assignment_id')
        reviewee_id = kwargs.get('reviewee_id')

        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            assignment = AssignmentDetails.objects.get(
                workspace_id=workspace, assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            reviewer = AssignmentRoles.objects.get(
                assignment=assignment, user=user, role_id=2)
        except AssignmentRoles.DoesNotExist:
            return Response({"detail": "You are not a reviewer for this assignment"}, status=status.HTTP_403_FORBIDDEN)

        try:
            reviewee = UserDetails.objects.get(user_id=reviewee_id)
        except UserDetails.DoesNotExist:
            return Response({"detail": "Reviewee not found"}, status=status.HTTP_404_NOT_FOUND)

        reviewee_subtasks = AssignmentStatus.objects.filter(
            assignment=assignment, user=reviewee)

        serializer = self.get_serializer(reviewee_subtasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateSubtaskStatusView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = SubtaskStatusUpdateSerializer

    def update(self, request, *args, **kwargs):
        user = request.user
        workspace_id = kwargs.get('workspace_id')
        assignment_id = kwargs.get('assignment_id')
        reviewee_id = kwargs.get('reviewee_id')
        task_id = kwargs.get('task_id')

        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            assignment = AssignmentDetails.objects.get(
                workspace_id=workspace, assignment_id=assignment_id)
        except AssignmentDetails.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            reviewer = AssignmentRoles.objects.get(
                assignment=assignment, user=user, role_id=2)
        except AssignmentRoles.DoesNotExist:
            return Response({"detail": "You are not a reviewer for this assignment"}, status=status.HTTP_403_FORBIDDEN)

        try:
            reviewee = UserDetails.objects.get(user_id=reviewee_id)
        except UserDetails.DoesNotExist:
            return Response({"detail": "Reviewee not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            reviewee_assignment = AssignmentStatus.objects.get(
                assignment=assignment, user=reviewee, task_id=task_id)
        except AssignmentStatus.DoesNotExist:
            return Response({"detail": "Reviewee assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(
            reviewee_assignment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)
