# api/views.py
import uuid
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.middleware.csrf import CsrfViewMiddleware, get_token
from .models import (WorkspaceDetail,
                     UserDetails,
                     WorkspaceMembers)
from .serializers import (WorkspaceCreateSerializer,
                          UserRegistrationSerializer,
                          UserLoginSerializer,
                          ProfileUpdateSerializer,
                          InvitationLinkSerializer)


class UserRegistrationView(generics.CreateAPIView):
    queryset = UserDetails.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]  


class UserLoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]  # Allow any user to access this view

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

    def put(self, request, *args, **kwargs):
        # Verify CSRF token
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

    def create(self, request, *args, **kwargs):
        # Verify CSRF token
        csrf_middleware = CsrfViewMiddleware()
        csrf_middleware.process_view(request, None, (), {})

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class GenerateInvitationLinkView(generics.GenericAPIView):
    serializer_class = InvitationLinkSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, *args, **kwargs):
        user = request.user
        workspace_id = request.data.get('workspace_id')
        workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)

        # Check if the user is an admin of the workspace
        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user, workspace_role='2').exists():
            return Response({"detail": "You do not have permission to generate an invitation link for this workspace."}, status=status.HTTP_403_FORBIDDEN)

        # Generate the invitation token
        workspace.generate_invitation_token()
        serializer = self.get_serializer(workspace)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class JoinWorkspaceView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, *args, **kwargs):
        token = request.data.get('token')
        try:
            workspace = WorkspaceDetail.objects.get(invitation_token=token)
        except WorkspaceDetail.DoesNotExist:
            return Response({"detail": "Invalid invitation link."}, status=status.HTTP_400_BAD_REQUEST)

        if workspace.is_token_expired():
            return Response({"detail": "This invitation link has expired."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        # Add the user to the workspace
        WorkspaceMembers.objects.create(
            workspace_id=workspace, user_id=user, workspace_role='1')  # Role 1 indicates member
        return Response({"detail": "You have successfully joined the workspace."}, status=status.HTTP_200_OK)
