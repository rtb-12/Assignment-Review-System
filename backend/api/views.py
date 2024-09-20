# api/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.middleware.csrf import get_token
from .models import UserDetails
from .serializers import UserRegistrationSerializer, UserLoginSerializer

class UserRegistrationView(generics.CreateAPIView):
    queryset = UserDetails.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]  # Allow any user to access this view

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
        response.set_cookie('csrftoken', csrf_token, secure=True, httponly=True)
        response.set_cookie('access', tokens['access'], secure=True, httponly=True)
        response.set_cookie('refresh', tokens['refresh'], secure=True, httponly=True)
        return response