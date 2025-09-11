from rest_framework import serializers
from .models import Cities


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Cities
        fields = '__all__'


class CityCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cities
        fields = ['name', 'country']


class CityListSerializer(serializers.ModelSerializer):
    """Serializer for city list with minimal fields"""
    class Meta:
        model = Cities
        fields = ['city_id', 'name', 'country']
