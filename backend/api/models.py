# models.py
from django.db import models

class UserDetails(models.Model):
    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    user_details = models.TextField()

    class Meta:
        db_table = 'UserDetails'
        indexes = [
            models.Index(fields=['name', 'email', 'password_hash', 'profile_image', 'user_details'], name='user_details_idx'),
        ]

    def __str__(self):
        return self.name