# models.py
import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserDetailsManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, name, password, **extra_fields)


class UserDetails(AbstractBaseUser, PermissionsMixin):
    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    # Rename password_hash to password
    password = models.CharField(max_length=255)
    profile_image = models.ImageField(
        upload_to='profile_images/', null=True, blank=True)
    user_details = models.TextField()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = UserDetailsManager()

    class Meta:
        db_table = 'UserDetails'
        indexes = [
            models.Index(fields=['name', 'email', 'password',
                         'profile_image', 'user_details'], name='user_details_idx'),
        ]

    def __str__(self):
        return self.name


class WorkspaceDetail(models.Model):
    workspace_name = models.CharField(max_length=255)
    workspace_logo_image = models.ImageField(
        upload_to='workspace_logos/', null=True, blank=True)
    workspace_description = models.TextField()
    workspace_id = models.AutoField(primary_key=True)
    invitation_token = models.CharField(
        max_length=255, unique=True, null=True, blank=True)
    token_created_at = models.DateTimeField(null=True, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'WorkspaceDetail'
        indexes = [
            models.Index(fields=['workspace_name', 'workspace_logo_image',
                         'workspace_description', 'workspace_id'], name='workspace_detail_idx'),
        ]

    def __str__(self):
        return self.workspace_name

    def generate_invitation_token(self):
        self.invitation_token = str(uuid.uuid4())
        self.token_created_at = timezone.now()
        self.token_expires_at = self.token_created_at + timedelta(days=1)
        self.save()

    def is_token_expired(self):
        return timezone.now() > self.token_expires_at


class WorkspaceMembers(models.Model):
    workspace_id = models.ForeignKey(
        WorkspaceDetail, on_delete=models.CASCADE, db_column='workspace_id')
    user_id = models.ForeignKey(
        UserDetails, on_delete=models.CASCADE, db_column='user_id')
    workspace_role = models.CharField(max_length=255)

    class Meta:
        db_table = 'WorkspaceMembers'
        indexes = [
            models.Index(fields=['workspace_id', 'user_id',
                         'workspace_role'], name='workspace_members_idx'),
        ]

    def __str__(self):
        return f"{self.workspace_id} - {self.user_id} - {self.workspace_role}"


class GroupDetails(models.Model):
    groupID = models.AutoField(primary_key=True)
    GroupName = models.CharField(max_length=255)
    description = models.TextField()
    groupProfileImage = models.ImageField(
        upload_to='group_profile_images/', null=True, blank=True)

    class Meta:
        db_table = 'GroupDetails'
        indexes = [
            models.Index(fields=['groupID', 'GroupName', 'description',
                         'groupProfileImage'], name='group_details_idx'),
        ]

    def __str__(self):
        return self.GroupName


class GroupMembers(models.Model):
    userID = models.ForeignKey(
        UserDetails, on_delete=models.CASCADE, db_column='userID')
    groupID = models.ForeignKey(
        GroupDetails, on_delete=models.CASCADE, db_column='groupID')

    class Meta:
        db_table = 'GroupMembers'
        indexes = [
            models.Index(fields=['userID', 'groupID'],
                         name='group_members_idx'),
        ]

    def __str__(self):
        return f"{self.userID} - {self.groupID}"
