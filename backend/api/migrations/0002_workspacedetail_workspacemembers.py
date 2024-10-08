# Generated by Django 5.1.1 on 2024-09-21 17:28

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='WorkspaceDetail',
            fields=[
                ('workspace_name', models.CharField(max_length=255)),
                ('workspace_logo_image', models.ImageField(blank=True, null=True, upload_to='workspace_logos/')),
                ('workspace_description', models.TextField()),
                ('workspace_id', models.AutoField(primary_key=True, serialize=False)),
            ],
            options={
                'db_table': 'WorkspaceDetail',
                'indexes': [models.Index(fields=['workspace_name', 'workspace_logo_image', 'workspace_description', 'workspace_id'], name='workspace_detail_idx')],
            },
        ),
        migrations.CreateModel(
            name='WorkspaceMembers',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('workspace_role', models.CharField(max_length=255)),
                ('user_id', models.ForeignKey(db_column='user_id', on_delete=django.db.models.deletion.CASCADE, to='api.userdetails')),
                ('workspace_id', models.ForeignKey(db_column='workspace_id', on_delete=django.db.models.deletion.CASCADE, to='api.workspacedetail')),
            ],
            options={
                'db_table': 'WorkspaceMembers',
                'indexes': [models.Index(fields=['workspace_id', 'user_id', 'workspace_role'], name='workspace_members_idx')],
            },
        ),
    ]
