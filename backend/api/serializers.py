import os
from django.conf import settings  # type: ignore
from django.core.files.storage import default_storage  # type: ignore
from django.core.files.base import ContentFile  # type: ignore
from rest_framework_simplejwt.tokens import RefreshToken  # type: ignore
from django.contrib.auth.hashers import make_password, check_password  # type: ignore
from rest_framework import serializers  # type: ignore
from .models import (AssignmentRoles, AssignmentStatus, UserDetails, WorkspaceDetail,
                     WorkspaceMembers, GroupDetails, GroupMembers,
                     AssignmentDetails)


class UserRegistrationSerializer(serializers.ModelSerializer):
    retype = serializers.CharField(write_only=True)

    class Meta:
        model = UserDetails
        fields = ["user_id", "name", "email", "password", "retype"]
        extra_kwargs = {
            "password": {"write_only": True},
            "retype": {"write_only": True},
        }

    def validate(self, data):
        if data["password"] != data["retype"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop("retype")
        validated_data["password"] = make_password(
            validated_data["password"])
        user = UserDetails.objects.create(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = UserDetails.objects.get(email=data["email"])
        except UserDetails.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        if not check_password(data["password"], user.password):
            raise serializers.ValidationError("Invalid email or password.")

        return user

    def create(self, validated_data):
        user = validated_data
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDetails
        fields = ['name', 'email', 'profile_image']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDetails
        fields = ['profile_image', 'user_details']


class InvitationLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceDetail
        fields = ['workspace_id', 'invitation_token',
                  'token_created_at', 'token_expires_at']


class WorkspaceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceDetail
        fields = ['workspace_id', 'workspace_name',
                  'workspace_logo_image', 'workspace_description']

    def create(self, validated_data):
        user = self.context['request'].user
        workspace = WorkspaceDetail.objects.create(**validated_data)
        WorkspaceMembers.objects.create(
            workspace_id=workspace,
            user_id=user,
            workspace_role='2'  # Role 2 indicates admin
        )
        return workspace


class TokenRefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        refresh = attrs['refresh']
        try:
            refresh_token = RefreshToken(refresh)
            access_token = str(refresh_token.access_token)
            return {'access': access_token}
        except Exception as e:
            raise serializers.ValidationError('Invalid refresh token')


class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupDetails
        fields = ['GroupName', 'description', 'groupProfileImage']

    def create(self, validated_data):
        group = GroupDetails.objects.create(**validated_data)
        return group


class AddGroupMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupMembers
        fields = ['groupID', 'userID']

    def validate(self, data):
        user = data['userID']
        group_id = data['groupID']

        try:
            group = GroupDetails.objects.get(pk=group_id)
        except GroupDetails.DoesNotExist:
            raise serializers.ValidationError("Group not found.")

        workspace = group.workspace_id

        if not WorkspaceMembers.objects.filter(workspace_id=workspace, user_id=user).exists():
            raise serializers.ValidationError(
                "User is not a member of the workspace.")

        return data

    def create(self, validated_data):
        group_member = GroupMembers.objects.create(**validated_data)
        return group_member


class AssignmentCreateSerializer(serializers.ModelSerializer):
    attachments = serializers.ListField(
        child=serializers.FileField(), required=False)
    subtask_details = serializers.JSONField()

    class Meta:
        model = AssignmentDetails
        fields = ['assignment_description', 'deadline',
                  'subtask_details', 'attachments']

    def create(self, validated_data):
        user = self.context['request'].user
        assignor = UserDetails.objects.get(user_id=user.user_id)
        attachments = validated_data.pop('attachments', [])
        assignment = AssignmentDetails.objects.create(
            assignor=assignor, **validated_data)

        for attachment in attachments:
            file_path = self.save_attachment(attachment)
            assignment.attachments.append(file_path)

        assignment.save()

        AssignmentRoles.objects.create(
            assignment=assignment, user=assignor, role_id='2')

        return assignment

    def save_attachment(self, attachment):
        path = os.path.join(settings.MEDIA_ROOT, attachment.name)
        default_storage.save(path, ContentFile(attachment.read()))
        return path


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    submission_attachments = serializers.ListField(
        child=serializers.FileField(), required=False)
    comments = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = AssignmentStatus
        fields = ['task_id', 'status', 'submission_link',
                  'submission_doc', 'comments', 'submission_attachments']

    def update(self, instance, validated_data):
        submission_attachments = validated_data.pop(
            'submission_attachments', [])
        instance = super().update(instance, validated_data)

        # Save submission attachments
        for attachment in submission_attachments:
            file_path = self.save_attachment(attachment)
            instance.submission_attachments.append(file_path)

        instance.save()
        return instance

    def save_attachment(self, attachment):
        path = os.path.join(settings.MEDIA_ROOT, attachment.name)
        default_storage.save(path, ContentFile(attachment.read()))
        return path


class LeaderboardSerializer(serializers.ModelSerializer):
    points = serializers.IntegerField()

    class Meta:
        model = UserDetails
        fields = ['name', 'image', 'points']


class BaseAssignmentSerializer(serializers.ModelSerializer):
    assignment_id = serializers.IntegerField(source='assignment.assignment_id')
    assignment_name = serializers.CharField(
        source='assignment.assignment_description')
    deadline = serializers.DateTimeField(source='assignment.deadline')

    class Meta:
        model = AssignmentStatus
        fields = ['assignment_id', 'assignment_name', 'deadline']


class AssignmentStatusDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentStatus
        fields = '__all__'


class AssignmentDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentDetails
        fields = '__all__'


class AssignmentRoleSerializer(serializers.ModelSerializer):
    assignment_id = serializers.IntegerField(source='assignment.assignment_id')
    user_id = serializers.IntegerField(source='user.user_id')

    class Meta:
        model = AssignmentRoles
        fields = ['assignment_id', 'user_id', 'role_id']


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupDetails
        fields = ['groupID', 'groupName', 'workspace_id']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDetails
        fields = ['user_id', 'name', 'email', 'profile_image']


class AssignmentRevieweeViewSerializer(serializers.ModelSerializer):
    points = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    profile_img = serializers.ImageField(source='profile_image')

    class Meta:
        model = UserDetails
        fields = ['name', 'profile_img', 'points', 'status']

    def get_points(self, obj):
        assignment_id = self.context.get('assignment_id')
        assignment_status = AssignmentStatus.objects.filter(
            user=obj, assignment_id=assignment_id).first()
        return assignment_status.points_assign if assignment_status else None

    def get_status(self, obj):
        assignment_id = self.context.get('assignment_id')
        assignment_status = AssignmentStatus.objects.filter(
            user=obj, assignment_id=assignment_id).first()
        return assignment_status.status if assignment_status else None


class AssignmentDetailsViewSerializer(serializers.ModelSerializer):
    assignor = UserProfileSerializer()
    subtask_details = serializers.JSONField()
    attachments = serializers.JSONField()

    class Meta:
        model = AssignmentDetails
        fields = [
            'assignment_id',
            'assignment_name',
            'assignment_description',
            'subtask_details',
            'deadline',
            'attachments'
        ]


class AssignmentSubtaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentStatus
        fields = ['status', 'points_assign', 'task_id']

    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.points_assign = validated_data.get(
            'points_assign', instance.points_assign)
        instance.task_id = validated_data.get('task_id', instance.task_id)
        instance.save()
        return instance


class AssignmentFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentStatus
        fields = ['feedback_details']

    def update(self, instance, validated_data):
        instance.feedback_details = validated_data.get(
            'feedback_details', instance.feedback_details)
        instance.save()
        return instance
