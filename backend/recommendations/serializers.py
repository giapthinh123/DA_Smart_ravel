from rest_framework import serializers
from .models import TourRecommendations


class TourRecommendationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourRecommendations
        fields = '__all__'


class TourRecommendationsCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourRecommendations
        fields = ['tour_id', 'option', 'total_estimated_cost', 'currency']


class TourRecommendationsListSerializer(serializers.ModelSerializer):
    """Serializer for tour recommendations list with option details"""
    option_user_name = serializers.CharField(source='option.user.name', read_only=True)
    option_start_city = serializers.CharField(source='option.start_city.name', read_only=True)
    option_destination_city = serializers.CharField(source='option.destination_city.name', read_only=True)
    option_duration = serializers.IntegerField(source='option.duration_days', read_only=True)
    option_guest_count = serializers.IntegerField(source='option.guest_count', read_only=True)
    
    class Meta:
        model = TourRecommendations
        fields = ['tour_id', 'option', 'option_user_name', 'option_start_city', 
                 'option_destination_city', 'option_duration', 'option_guest_count',
                 'total_estimated_cost', 'currency']


class TourRecommendationsDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with full option information"""
    option_details = serializers.SerializerMethodField()
    
    class Meta:
        model = TourRecommendations
        fields = ['tour_id', 'option', 'option_details', 'total_estimated_cost', 'currency']
    
    def get_option_details(self, obj):
        if obj.option:
            return {
                'option_id': obj.option.option_id,
                'user_name': obj.option.user.name if obj.option.user else None,
                'start_city': obj.option.start_city.name if obj.option.start_city else None,
                'destination_city': obj.option.destination_city.name if obj.option.destination_city else None,
                'guest_count': obj.option.guest_count,
                'duration_days': obj.option.duration_days,
                'target_budget': obj.option.target_budget,
                'currency': obj.option.currency,
                'rating': obj.option.rating
            }
        return None
