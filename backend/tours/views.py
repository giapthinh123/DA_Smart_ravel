from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import TourOptions, TourDays, TourScheduleItems, TourOptionsHotels, TourOptionsActivities, TourOptionsRestaurants, TourOptionsTransports
from .serializers import (
    TourOptionsSerializer, TourOptionsCreateSerializer, TourOptionsListSerializer,
    TourDaysSerializer, TourScheduleItemsSerializer, TourScheduleItemsDetailSerializer,
    TourOptionsHotelsSerializer, TourOptionsActivitiesSerializer, 
    TourOptionsRestaurantsSerializer, TourOptionsTransportsSerializer
)


class TourOptionsViewSet(viewsets.ModelViewSet):
    queryset = TourOptions.objects.all()
    serializer_class = TourOptionsSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return TourOptionsCreateSerializer
        elif self.action == 'list':
            return TourOptionsListSerializer
        return TourOptionsSerializer

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search tour options by various criteria"""
        user_id = request.query_params.get('user_id', '')
        start_city = request.query_params.get('start_city', '')
        destination_city = request.query_params.get('destination_city', '')
        min_budget = request.query_params.get('min_budget', '')
        max_budget = request.query_params.get('max_budget', '')
        duration_days = request.query_params.get('duration_days', '')
        
        queryset = TourOptions.objects.all()
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        if start_city:
            queryset = queryset.filter(start_city__name__icontains=start_city)
            
        if destination_city:
            queryset = queryset.filter(destination_city__name__icontains=destination_city)
            
        if min_budget:
            queryset = queryset.filter(target_budget__gte=min_budget)
            
        if max_budget:
            queryset = queryset.filter(target_budget__lte=max_budget)
            
        if duration_days:
            queryset = queryset.filter(duration_days=duration_days)
        
        serializer = TourOptionsListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def hotels(self, request, pk=None):
        """Get hotels for a specific tour option"""
        hotels = TourOptionsHotels.objects.filter(option_id=pk)
        serializer = TourOptionsHotelsSerializer(hotels, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        """Get activities for a specific tour option"""
        activities = TourOptionsActivities.objects.filter(option_id=pk)
        serializer = TourOptionsActivitiesSerializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def restaurants(self, request, pk=None):
        """Get restaurants for a specific tour option"""
        restaurants = TourOptionsRestaurants.objects.filter(option_id=pk)
        serializer = TourOptionsRestaurantsSerializer(restaurants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def transports(self, request, pk=None):
        """Get transports for a specific tour option"""
        transports = TourOptionsTransports.objects.filter(option_id=pk)
        serializer = TourOptionsTransportsSerializer(transports, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_hotel(self, request, pk=None):
        """Add hotel to tour option"""
        hotel_id = request.data.get('hotel_id')
        if hotel_id:
            TourOptionsHotels.objects.get_or_create(option_id=pk, hotel_id=hotel_id)
            return Response({'status': 'Hotel added to tour option'})
        return Response({'error': 'Hotel ID required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_activity(self, request, pk=None):
        """Add activity to tour option"""
        activity_id = request.data.get('activity_id')
        if activity_id:
            TourOptionsActivities.objects.get_or_create(option_id=pk, activity_id=activity_id)
            return Response({'status': 'Activity added to tour option'})
        return Response({'error': 'Activity ID required'}, status=status.HTTP_400_BAD_REQUEST)


class TourDaysViewSet(viewsets.ModelViewSet):
    queryset = TourDays.objects.all()
    serializer_class = TourDaysSerializer

    @action(detail=False, methods=['get'])
    def by_tour(self, request):
        """Get tour days by tour recommendation ID"""
        tour_id = request.query_params.get('tour_id', '')
        if tour_id:
            tour_days = TourDays.objects.filter(tour_id=tour_id).order_by('day_number')
            serializer = TourDaysSerializer(tour_days, many=True)
            return Response(serializer.data)
        return Response({'error': 'Tour ID required'}, status=status.HTTP_400_BAD_REQUEST)


class TourScheduleItemsViewSet(viewsets.ModelViewSet):
    queryset = TourScheduleItems.objects.all()
    serializer_class = TourScheduleItemsSerializer

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return TourScheduleItemsDetailSerializer
        return TourScheduleItemsSerializer

    @action(detail=False, methods=['get'])
    def by_tour_day(self, request):
        """Get schedule items by tour day ID"""
        tour_day_id = request.query_params.get('tour_day_id', '')
        if tour_day_id:
            items = TourScheduleItems.objects.filter(tour_day_id=tour_day_id).order_by('seq')
            serializer = TourScheduleItemsDetailSerializer(items, many=True)
            return Response(serializer.data)
        return Response({'error': 'Tour day ID required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def by_place_type(self, request):
        """Get schedule items by place type"""
        place_type = request.query_params.get('place_type', '')
        if place_type:
            items = TourScheduleItems.objects.filter(place_type__icontains=place_type)
            serializer = TourScheduleItemsDetailSerializer(items, many=True)
            return Response(serializer.data)
        return Response({'error': 'Place type required'}, status=status.HTTP_400_BAD_REQUEST)


class TourOptionsHotelsViewSet(viewsets.ModelViewSet):
    queryset = TourOptionsHotels.objects.all()
    serializer_class = TourOptionsHotelsSerializer


class TourOptionsActivitiesViewSet(viewsets.ModelViewSet):
    queryset = TourOptionsActivities.objects.all()
    serializer_class = TourOptionsActivitiesSerializer


class TourOptionsRestaurantsViewSet(viewsets.ModelViewSet):
    queryset = TourOptionsRestaurants.objects.all()
    serializer_class = TourOptionsRestaurantsSerializer


class TourOptionsTransportsViewSet(viewsets.ModelViewSet):
    queryset = TourOptionsTransports.objects.all()
    serializer_class = TourOptionsTransportsSerializer