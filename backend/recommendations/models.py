# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class TourRecommendations(models.Model):
    tour_id = models.CharField(primary_key=True, max_length=24)
    option = models.ForeignKey('tours.TourOptions', models.DO_NOTHING, blank=True, null=True)
    total_estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    currency = models.CharField(max_length=53, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tour_recommendations'
