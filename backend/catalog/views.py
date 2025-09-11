from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Hotels, Restaurants, Activities, Transports
from .serializers import (
    HotelSerializer, HotelListSerializer,
    RestaurantSerializer, RestaurantListSerializer,
    ActivitySerializer, ActivityListSerializer,
    TransportSerializer, TransportListSerializer
)


class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotels.objects.all()
    serializer_class = HotelSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return HotelListSerializer
        return HotelSerializer

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search hotels by name, city, or country"""
        query = request.query_params.get('q', '')
        city = request.query_params.get('city', '')
        min_stars = request.query_params.get('min_stars', '')
        max_price = request.query_params.get('max_price', '')
        
        queryset = Hotels.objects.all()
        
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | 
                Q(city__icontains=query) | 
                Q(country__icontains=query)
            )
        
        if city:
            queryset = queryset.filter(city__iexact=city)
            
        if min_stars:
            queryset = queryset.filter(stars__gte=min_stars)
            
        if max_price:
            queryset = queryset.filter(price_per_night__lte=max_price)
        
        serializer = HotelListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_rating(self, request):
        """Get hotels ordered by rating"""
        hotels = Hotels.objects.filter(rating__isnull=False).order_by('-rating')
        serializer = HotelListSerializer(hotels, many=True)
        return Response(serializer.data)


class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurants.objects.all()
    serializer_class = RestaurantSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return RestaurantListSerializer
        return RestaurantSerializer

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search restaurants by name, city, or cuisine"""
        query = request.query_params.get('q', '')
        city = request.query_params.get('city', '')
        cuisine = request.query_params.get('cuisine', '')
        max_price = request.query_params.get('max_price', '')
        
        queryset = Restaurants.objects.all()
        
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | 
                Q(city__icontains=query) | 
                Q(cuisine_type__icontains=query)
            )
        
        if city:
            queryset = queryset.filter(city__iexact=city)
            
        if cuisine:
            queryset = queryset.filter(cuisine_type__icontains=cuisine)
            
        if max_price:
            queryset = queryset.filter(price_avg__lte=max_price)
        
        serializer = RestaurantListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def cuisines(self, request):
        """Get list of unique cuisine types"""
        cuisines = Restaurants.objects.values_list('cuisine_type', flat=True).distinct()
        return Response([c for c in cuisines if c])


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activities.objects.all()
    serializer_class = ActivitySerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return ActivityListSerializer
        return ActivitySerializer

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search activities by name, type, or city"""
        query = request.query_params.get('q', '')
        city = request.query_params.get('city', '')
        activity_type = request.query_params.get('type', '')
        max_price = request.query_params.get('max_price', '')
        max_duration = request.query_params.get('max_duration', '')
        
        queryset = Activities.objects.all()
        
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | 
                Q(type__icontains=query) | 
                Q(city__icontains=query)
            )
        
        if city:
            queryset = queryset.filter(city__iexact=city)
            
        if activity_type:
            queryset = queryset.filter(type__icontains=activity_type)
            
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
            
        if max_duration:
            queryset = queryset.filter(duration_hr__lte=max_duration)
        
        serializer = ActivityListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def types(self, request):
        """Get list of unique activity types"""
        types = Activities.objects.values_list('type', flat=True).distinct()
        return Response([t for t in types if t])


class TransportViewSet(viewsets.ModelViewSet):
    queryset = Transports.objects.all()
    serializer_class = TransportSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return TransportListSerializer
        return TransportSerializer

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search transports by type or city"""
        city = request.query_params.get('city', '')
        transport_type = request.query_params.get('type', '')
        max_price_per_km = request.query_params.get('max_price_per_km', '')
        
        queryset = Transports.objects.all()
        
        if city:
            queryset = queryset.filter(city__iexact=city)
            
        if transport_type:
            queryset = queryset.filter(type__icontains=transport_type)
            
        if max_price_per_km:
            queryset = queryset.filter(avg_price_per_km__lte=max_price_per_km)
        
        serializer = TransportListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def types(self, request):
        """Get list of unique transport types"""
        types = Transports.objects.values_list('type', flat=True).distinct()
        return Response([t for t in types if t])