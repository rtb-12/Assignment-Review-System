# api/views.py
import uuid
import requests
import json
import urllib.parse
from django.shortcuts import redirect
from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django.middleware.csrf import CsrfViewMiddleware, get_token
from .models import (WorkspaceDetail,
                     UserDetails,
                     WorkspaceMembers)
from .serializers import (WorkspaceCreateSerializer,
                          UserRegistrationSerializer,
                          UserLoginSerializer,
                          ProfileUpdateSerializer,
                          InvitationLinkSerializer)

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
        request.session.save()  # Explicitly save the session
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

            # Fetch user data from the OAuth2 provider
            user_info_response = requests.get(self.user_info_url, headers={
                'Authorization': f'Bearer {access_token}'
            })
            user_info = user_info_response.json()
            print("user_info: ", user_info)

            # Extract user information
            email = user_info['contactInformation']['emailAddress']
            name = user_info['person']['fullName']
            profile_image = "https://channeli.in"+user_info['person'].get('displayPicture', '')


            # Check if the user already exists and update or create the user
            user, created = UserDetails.objects.update_or_create(
                email=email,
                defaults={
                    'name': name,
                    'profile_image': profile_image,
                }
            )

            # Authenticate the user (create a session or JWT token)
            refresh = RefreshToken.for_user(user)
            tokens = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }

            # Return the tokens and user info
            return JsonResponse({
                'user_id': user.user_id,
                'name': user.name,
                'email': user.email,
                'profile_image': urllib.parse.unquote(user.profile_image.url) if user.profile_image else None,'refresh': tokens['refresh'],
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

    def post(self, request):
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

    def post(self, request):
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




