# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Users(models.Model):
    user_id = models.CharField(primary_key=True, max_length=24)
    name = models.CharField(max_length=70, blank=True, null=True)
    email = models.CharField(max_length=78, blank=True, null=True)
    password = models.CharField(max_length=24, blank=True, null=True)
    phone_number = models.CharField(max_length=68, blank=True, null=True)
    city = models.CharField(max_length=66, blank=True, null=True)
    country = models.CharField(max_length=61, blank=True, null=True)
    gender = models.CharField(max_length=56, blank=True, null=True)
    birth_year = models.IntegerField(blank=True, null=True)
    is_admin = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'
