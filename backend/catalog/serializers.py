from rest_framework import serializers
from .models import Hotels, Restaurants, Activities, Transports


class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotels
        fields = '__all__'


class HotelListSerializer(serializers.ModelSerializer):
    """Serializer for hotel list with essential fields"""
    class Meta:
        model = Hotels
        fields = ['hotel_id', 'name', 'city', 'country', 'stars', 'price_per_night', 'rating']


class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurants
        fields = '__all__'


class RestaurantListSerializer(serializers.ModelSerializer):
    """Serializer for restaurant list with essential fields"""
    class Meta:
        model = Restaurants
        fields = ['restaurant_id', 'name', 'city', 'country', 'cuisine_type', 'price_avg', 'rating']


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activities
        fields = '__all__'


class ActivityListSerializer(serializers.ModelSerializer):
    """Serializer for activity list with essential fields"""
    class Meta:
        model = Activities
        fields = ['activity_id', 'name', 'type', 'city', 'country', 'price', 'duration_hr', 'rating']


class TransportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transports
        fields = '__all__'


class TransportListSerializer(serializers.ModelSerializer):
    """Serializer for transport list with essential fields"""
    class Meta:
        model = Transports
        fields = ['transport_id', 'type', 'city', 'country', 'avg_price_per_km', 'min_price', 'rating']
