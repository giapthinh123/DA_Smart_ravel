from rest_framework import serializers
from .models import TourOptions, TourDays, TourScheduleItems, TourOptionsHotels, TourOptionsActivities, TourOptionsRestaurants, TourOptionsTransports


class TourOptionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourOptions
        fields = '__all__'


class TourOptionsCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourOptions
        fields = ['option_id', 'user', 'start_city', 'destination_city', 'guest_count', 
                 'duration_days', 'target_budget', 'currency']


class TourOptionsListSerializer(serializers.ModelSerializer):
    """Serializer for tour options list with essential fields"""
    start_city_name = serializers.CharField(source='start_city.name', read_only=True)
    destination_city_name = serializers.CharField(source='destination_city.name', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = TourOptions
        fields = ['option_id', 'user_name', 'start_city_name', 'destination_city_name', 
                 'guest_count', 'duration_days', 'target_budget', 'currency', 'rating']


class TourDaysSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourDays
        fields = '__all__'


class TourScheduleItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourScheduleItems
        fields = '__all__'


class TourScheduleItemsDetailSerializer(serializers.ModelSerializer):
    tour_day_info = serializers.CharField(source='tour_day.day_number', read_only=True)
    
    class Meta:
        model = TourScheduleItems
        fields = ['item_id', 'tour_day', 'tour_day_info', 'seq', 'start_time', 'end_time', 
                 'place_type', 'place_id', 'cost']


class TourOptionsHotelsSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    hotel_rating = serializers.DecimalField(source='hotel.rating', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = TourOptionsHotels
        fields = ['option', 'hotel', 'hotel_name', 'hotel_rating']


class TourOptionsActivitiesSerializer(serializers.ModelSerializer):
    activity_name = serializers.CharField(source='activity.name', read_only=True)
    activity_type = serializers.CharField(source='activity.type', read_only=True)
    activity_price = serializers.DecimalField(source='activity.price', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = TourOptionsActivities
        fields = ['option', 'activity', 'activity_name', 'activity_type', 'activity_price']


class TourOptionsRestaurantsSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    cuisine_type = serializers.CharField(source='restaurant.cuisine_type', read_only=True)
    
    class Meta:
        model = TourOptionsRestaurants
        fields = ['option', 'restaurant', 'restaurant_name', 'cuisine_type']


class TourOptionsTransportsSerializer(serializers.ModelSerializer):
    transport_type = serializers.CharField(source='transport.type', read_only=True)
    
    class Meta:
        model = TourOptionsTransports
        fields = ['option', 'transport', 'transport_type']
