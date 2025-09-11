# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Hotels(models.Model):
    hotel_id = models.CharField(primary_key=True, max_length=24)
    name = models.CharField(max_length=89, blank=True, null=True)
    city_id = models.IntegerField(blank=True, null=True)
    city = models.CharField(max_length=66, blank=True, null=True)
    country = models.CharField(max_length=64, blank=True, null=True)
    stars = models.IntegerField(blank=True, null=True)
    price_per_night = models.IntegerField(blank=True, null=True)
    rating = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    description = models.CharField(max_length=153, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'hotels'


class Restaurants(models.Model):
    restaurant_id = models.CharField(primary_key=True, max_length=24)
    name = models.CharField(max_length=84, blank=True, null=True)
    city_id = models.IntegerField(blank=True, null=True)
    city = models.CharField(max_length=66, blank=True, null=True)
    country = models.CharField(max_length=64, blank=True, null=True)
    price_avg = models.IntegerField(blank=True, null=True)
    cuisine_type = models.CharField(max_length=67, blank=True, null=True)
    rating = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    description = models.CharField(max_length=248, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'restaurants'


class Activities(models.Model):
    activity_id = models.CharField(primary_key=True, max_length=24)
    name = models.CharField(max_length=99, blank=True, null=True)
    description = models.CharField(max_length=173, blank=True, null=True)
    type = models.CharField(max_length=69, blank=True, null=True)
    city_id = models.IntegerField(blank=True, null=True)
    city = models.CharField(max_length=66, blank=True, null=True)
    country = models.CharField(max_length=64, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    duration_hr = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    rating = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'activities'


class Transports(models.Model):
    transport_id = models.CharField(primary_key=True, max_length=24)
    type = models.CharField(max_length=64, blank=True, null=True)
    avg_price_per_km = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    city_id = models.IntegerField(blank=True, null=True)
    city = models.CharField(max_length=66, blank=True, null=True)
    country = models.CharField(max_length=64, blank=True, null=True)
    operating_hours = models.CharField(max_length=61, blank=True, null=True)
    min_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    max_capacity = models.IntegerField(blank=True, null=True)
    rating = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'transports'
