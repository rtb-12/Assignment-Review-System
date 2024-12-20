from .models import AssignmentDetails
import json
import uuid
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
        fields = [
            "assignment_name",
            "assignment_description",
            "deadline",
            "subtask_details",
            "attachments"
        ]

    def update(self, instance, validated_data):
        attachments = validated_data.pop('attachments', None)
        subtask_details = validated_data.pop('subtask_details', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if attachments is not None:
            instance.attachments = []
            # Save new attachments
            for attachment in attachments:
                relative_path = self.save_attachment(attachment)
                instance.attachments.append(relative_path)

        if subtask_details is not None:
            instance.subtask_details = subtask_details

        instance.save()
        return instance

    def create(self, validated_data):
        user = self.context['request'].user
        assignor = UserDetails.objects.get(user_id=user.user_id)
        workspace_id = self.context['workspace_id']
        workspace = WorkspaceDetail.objects.get(workspace_id=workspace_id)
        attachments = validated_data.pop('attachments', [])
        subtask_details = validated_data.get('subtask_details', [])
        individual_members = self.context['individual_members']
        assignment = AssignmentDetails.objects.create(
            assignor=assignor, workspace_id=workspace, **validated_data)

        assignment.attachments = []

        # Save attachments with sanitized filenames
        for attachment in attachments:
            relative_path = self.save_attachment(attachment)
            assignment.attachments.append(relative_path)

        assignment.subtask_details = subtask_details
        assignment.save()

        assignor_role = AssignmentRoles.objects.create(
            assignment=assignment, user=assignor, role_id='2')

        for member_id in individual_members:
            try:
                user_to_add = UserDetails.objects.get(user_id=member_id)
                AssignmentRoles.objects.create(
                    assignment=assignment, user=user_to_add, role_id='1')
            except UserDetails.DoesNotExist:
                raise serializers.ValidationError(
                    f"User with ID {member_id} not found.")

        # Populate AssignmentStatus for each assigned member and each subtask
        for member_id in individual_members:
            try:
                member = UserDetails.objects.get(user_id=member_id)
                for subtask in subtask_details:
                    AssignmentStatus.objects.create(
                        user=member,
                        assignment=assignment,
                        task_id=subtask['subtask_id'],
                        status='not_started',
                        reviewer=assignor_role,
                        submission_id='',
                        submission_link='',
                        submission_doc='',
                        points_assign=0,
                        feedback_details=[],
                        submission_attachments=[]
                    )
            except UserDetails.DoesNotExist:
                continue  # Skip if the user does not exist

        return assignment

    def save_attachment(self, attachment):
        # Sanitize filename
        original_name = attachment.name
        filename = ''.join(
            e for e in original_name if e.isalnum() or e in '._-')

        # Create a relative path in assignments folder
        relative_path = f'assignments/{filename}'

        # Save using default storage
        saved_path = default_storage.save(relative_path, attachment)
        return saved_path


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    submission_attachments = serializers.ListField(
        child=serializers.FileField(), required=False)

    class Meta:
        model = AssignmentStatus
        fields = ['submission_link', 'submission_doc',
                  'submission_attachments']

    def update(self, instance, validated_data):
        submission_attachments = validated_data.pop(
            'submission_attachments', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.submission_attachments = []
        for attachment in submission_attachments:
            relative_path = self.save_attachment(attachment)
            instance.submission_attachments.append(relative_path)

        instance.save()
        return instance

    def save_attachment(self, attachment):
        original_name = attachment.name
        filename = ''.join(
            e for e in original_name if e.isalnum() or e in '._-')
        relative_path = f'submissions/{filename}'
        saved_path = default_storage.save(relative_path, attachment)
        return saved_path


class LeaderboardSerializer(serializers.Serializer):
    name = serializers.CharField()
    profile_image = serializers.CharField(source='image', allow_null=True)
    points = serializers.IntegerField()


class BaseAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentDetails
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


class GroupMemberSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='userID.name')
    profile_image = serializers.ImageField(source='userID.profile_image')
    user_id = serializers.IntegerField(source='userID.user_id')

    class Meta:
        model = GroupMembers
        fields = ['name', 'profile_image', 'user_id']


class GroupSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()

    class Meta:
        model = GroupDetails
        fields = ['groupID', 'GroupName', 'workspace_id',
                  'description', 'groupProfileImage', 'members']

    def get_members(self, obj):
        group_members = GroupMembers.objects.filter(groupID=obj)
        return GroupMemberSerializer(group_members, many=True).data


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
        fields = ['user_id', 'name', 'profile_img',
                  'points', 'status']  # Include user_id

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
            'assignor',
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
    feedback_details = serializers.JSONField()

    class Meta:
        model = AssignmentStatus
        fields = ['feedback_details']

    def update(self, instance, validated_data):
        feedback_details = validated_data.get(
            'feedback_details', instance.feedback_details)
        instance.feedback_details = feedback_details
        instance.save()
        return instance


class RevieweeSubmissionSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.user_id')
    submission_link = serializers.URLField()
    submission_doc = serializers.CharField()
    submission_attachments = serializers.JSONField()

    class Meta:
        model = AssignmentStatus
        fields = ['user_id', 'submission_link',
                  'submission_doc', 'submission_attachments']


class RevieweeSubtaskSerializer(serializers.ModelSerializer):
    subtask_name = serializers.SerializerMethodField()
    subtask_max_points = serializers.SerializerMethodField()
    status = serializers.CharField()
    points_assigned = serializers.IntegerField(source='points_assign')
    subtask_id = serializers.CharField(
        source='task_id')  # Add subtask_id field

    class Meta:
        model = AssignmentStatus
        fields = ['subtask_id', 'subtask_name',
                  'subtask_max_points', 'status', 'points_assigned']

    def get_subtask_name(self, obj):
        assignment = obj.assignment
        subtask = next(
            (sub for sub in assignment.subtask_details if sub['subtask_id'] == obj.task_id), None)
        return subtask['description'] if subtask else None

    def get_subtask_max_points(self, obj):
        assignment = obj.assignment
        subtask = next(
            (sub for sub in assignment.subtask_details if sub['subtask_id'] == obj.task_id), None)
        return subtask['points'] if subtask else None


class SubtaskStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentStatus
        fields = ['status', 'points_assign']

    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.points_assign = validated_data.get(
            'points_assign', instance.points_assign)
        instance.save()
        return instance
