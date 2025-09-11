# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class TourOptions(models.Model):
    option_id = models.CharField(primary_key=True, max_length=24)
    user = models.ForeignKey('accounts.Users', models.DO_NOTHING, blank=True, null=True)
    start_city = models.ForeignKey('locations.Cities', models.DO_NOTHING, blank=True, null=True)
    destination_city = models.ForeignKey('locations.Cities', models.DO_NOTHING, related_name='touroptions_destination_city_set', blank=True, null=True)
    guest_count = models.IntegerField(blank=True, null=True)
    duration_days = models.IntegerField(blank=True, null=True)
    target_budget = models.IntegerField(blank=True, null=True)
    currency = models.CharField(max_length=53, blank=True, null=True)
    rating = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tour_options'


class TourDays(models.Model):
    tour_day_id = models.CharField(primary_key=True, max_length=24)
    tour = models.ForeignKey('recommendations.TourRecommendations', models.DO_NOTHING, blank=True, null=True)
    day_number = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tour_days'


class TourScheduleItems(models.Model):
    item_id = models.CharField(primary_key=True, max_length=24)
    tour_day = models.ForeignKey(TourDays, models.DO_NOTHING, blank=True, null=True)
    seq = models.IntegerField(blank=True, null=True)
    start_time = models.CharField(max_length=58, blank=True, null=True)
    end_time = models.CharField(max_length=58, blank=True, null=True)
    place_type = models.CharField(max_length=60, blank=True, null=True)
    place_id = models.CharField(max_length=24, blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tour_schedule_items'


class TourOptionsHotels(models.Model):
    option = models.ForeignKey(TourOptions, models.DO_NOTHING, blank=True, null=True)
    hotel = models.ForeignKey('catalog.Hotels', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tour_options_hotels'
        unique_together = (('option', 'hotel'),)


class TourOptionsActivities(models.Model):
    option = models.ForeignKey(TourOptions, models.DO_NOTHING, blank=True, null=True)
    activity = models.ForeignKey('catalog.Activities', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tour_options_activities'
        unique_together = (('option', 'activity'),)


class TourOptionsRestaurants(models.Model):
    option = models.ForeignKey(TourOptions, models.DO_NOTHING, blank=True, null=True)
    restaurant = models.ForeignKey('catalog.Restaurants', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tour_options_restaurants'
        unique_together = (('option', 'restaurant'),)


class TourOptionsTransports(models.Model):
    option = models.ForeignKey(TourOptions, models.DO_NOTHING, blank=True, null=True)
    transport = models.ForeignKey('catalog.Transports', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tour_options_transports'
        unique_together = (('option', 'transport'),)
