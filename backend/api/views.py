# api/views.py
from datetime import timezone
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
from .serializers import (AddGroupMemberSerializer, AssignmentCreateSerializer, AssignmentDetailsSerializer, AssignmentDetailsViewSerializer, AssignmentFeedbackSerializer, AssignmentRevieweeViewSerializer, AssignmentRoleSerializer, AssignmentStatusDetailSerializer, AssignmentSubmissionSerializer, AssignmentSubtaskUpdateSerializer, BaseAssignmentSerializer, GroupSerializer, LeaderboardSerializer, WorkspaceCreateSerializer,
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
        serializer.save(groupID=group)

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
            member_to_remove = UserDetails.objects.get(userID=user_id)
        except UserDetails.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            group_member = GroupMembers.objects.get(
                groupID=group, userID=member_to_remove)
            group_member.delete()
            return Response({"detail": "Member removed from group successfully."}, status=status.HTTP_204_NO_CONTENT)
        except GroupMembers.DoesNotExist:
            return Response({"detail": "Member not found in this group."}, status=status.HTTP_404_NOT_FOUND)


class CreateAssignmentWithMembersView(generics.CreateAPIView):
    serializer_class = AssignmentCreateSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['workspace_id'] = self.kwargs['workspace_id']
        return context

    def create(self, request, workspace_id):
        user = request.user
        data = request.data

        # Create the assignment
        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user).exists():
            return Response({"detail": "You are not a member of this workspace."}, status=status.HTTP_403_FORBIDDEN)

        assignment_serializer = self.get_serializer(data=data)
        assignment_serializer.is_valid(raise_exception=True)
        assignment = assignment_serializer.save(
            assignor=user, workspace_id=workspace)

        # Add individual members to the assignment
        individual_members = data.get('individual_members', [])
        for member in individual_members:
            user_id = member.get('user_id')
            role = member.get('role')
            try:
                user_to_add = UserDetails.objects.get(user_id=user_id)
            except UserDetails.DoesNotExist:
                return Response({"detail": f"User with ID {user_id} not found."}, status=status.HTTP_404_NOT_FOUND)

            assignment_role = AssignmentRoles(
                assignment=assignment, user=user_to_add, role_id=role)
            assignment_role.save()

        # Add group members to the assignment
        group_ids = data.get('group_ids', [])
        for group_id in group_ids:
            try:
                group = GroupDetails.objects.get(groupID=group_id)
            except GroupDetails.DoesNotExist:
                return Response({"detail": f"Group with ID {group_id} not found."}, status=status.HTTP_404_NOT_FOUND)

            group_members = GroupMembers.objects.filter(groupID=group)
            if not group_members.exists():
                return Response({"detail": f"No members found in group with ID {group_id}."}, status=status.HTTP_404_NOT_FOUND)

            assignment_roles = []
            for member in group_members:
                assignment_role = AssignmentRoles(
                    assignment=assignment,
                    user=member.userID,
                    role_id=member.roleID
                )
                assignment_roles.append(assignment_role)

            AssignmentRoles.objects.bulk_create(assignment_roles)

        return Response(assignment_serializer.data, status=status.HTTP_201_CREATED)


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


class LeaderboardView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, workspace_id):
        try:
            workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        # Get the list of users who are members of the workspace
        user_ids = WorkspaceMembers.objects.filter(
            workspace_id=workspace_id).values_list('user_id', flat=True)

        # Filter the AssignmentStatus entries based on these users
        leaderboard_data = AssignmentStatus.objects.filter(user_id__in=user_ids).select_related('user').values(
            'user__name', 'user__profile_image').annotate(points=Sum('points_assign')).order_by('-points')

        leaderboard = [
            {
                'name': data['user__name'],
                'image': data['user__profile_image'],
                'points': data['points']
            }
            for data in leaderboard_data
        ]

        serializer = LeaderboardSerializer(leaderboard, many=True)
        return Response(serializer.data)


class OngoingAssignmentsView(generics.ListAPIView):
    serializer_class = BaseAssignmentSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()

        # Filter assignments where the deadline is not crossed
        ongoing_assignments = AssignmentStatus.objects.filter(
            user=user,
            assignment__deadline__gt=now
        ).select_related('assignment')

        # Filter assignments where not all subtasks are completed
        filtered_assignments = []
        for assignment_status in ongoing_assignments:
            subtask_statuses = AssignmentStatus.objects.filter(
                assignment=assignment_status.assignment,
                user=user
            ).values_list('status', flat=True)

            if 'completed' not in subtask_statuses:
                filtered_assignments.append(assignment_status)

        return filtered_assignments


class CompletedAssignmentsView(generics.ListAPIView):
    serializer_class = BaseAssignmentSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user

        # Filter assignments where all subtasks are completed
        completed_assignments = AssignmentStatus.objects.filter(
            user=user
        ).select_related('assignment')

        filtered_assignments = []
        for assignment_status in completed_assignments:
            subtask_statuses = AssignmentStatus.objects.filter(
                assignment=assignment_status.assignment,
                user=user
            ).values_list('status', flat=True)

            if all(status == 'completed' for status in subtask_statuses):
                filtered_assignments.append(assignment_status)

        return filtered_assignments


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
            assignment=assignment, role_id=1).values_list('user', flat=True)
        students = UserDetails.objects.filter(id__in=students)

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
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            membership = WorkspaceMembers.objects.get(
                workspace_id=workspace, user_id=user)
        except WorkspaceMembers.DoesNotExist:
            return Response({"detail": "You are not a member of this workspace."}, status=status.HTTP_403_FORBIDDEN)

        if membership.workspace_role != '2':
            return Response({"detail": "You do not have permission to view groups in this workspace."}, status=status.HTTP_403_FORBIDDEN)

        return GroupDetails.objects.filter(workspace_id=workspace_id)
