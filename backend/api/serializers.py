from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import serializers
from .models import UserDetails, WorkspaceDetail, WorkspaceMembers


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
        fields = ['workspace_name', 'workspace_logo_image',
                  'workspace_description']

    def create(self, validated_data):
        user = self.context['request'].user
        workspace = WorkspaceDetail.objects.create(**validated_data)
        WorkspaceMembers.objects.create(
            workspace_id=workspace,
            user_id=user,  # Pass the user instance instead of user.user_id
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
