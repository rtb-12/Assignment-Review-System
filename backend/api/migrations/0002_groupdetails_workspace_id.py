# Generated by Django 5.1.1 on 2024-10-15 18:47

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='groupdetails',
            name='workspace_id',
            field=models.ForeignKey(db_column='workspace_id', default=1, on_delete=django.db.models.deletion.CASCADE, to='api.workspacedetail'),
        ),
    ]
