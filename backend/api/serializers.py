# api/serializers.py
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import serializers
from .models import UserDetails

class UserRegistrationSerializer(serializers.ModelSerializer):
    retype = serializers.CharField(write_only=True)

    class Meta:
        model = UserDetails
        fields = ["user_id", "name", "email", "password_hash", "retype"]
        extra_kwargs = {
            "password_hash": {"write_only": True},
            "retype": {"write_only": True},
        }

    def validate(self, data):
        if data["password_hash"] != data["retype"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop("retype")
        validated_data["password_hash"] = make_password(validated_data["password_hash"])
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

        if not check_password(data["password"], user.password_hash):
            raise serializers.ValidationError("Invalid email or password.")

        return user

    def create(self, validated_data):
        user = validated_data
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }