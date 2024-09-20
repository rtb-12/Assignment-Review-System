# backend/urls.py
from django.contrib import admin
from django.urls import path, include
from api.views import UserRegistrationView, UserLoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/register/', UserRegistrationView.as_view(), name='register'),
    path('api/user/login/', UserLoginView.as_view(), name='login'),
]