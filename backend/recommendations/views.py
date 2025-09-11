from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg, Count, Min, Max
from .models import TourRecommendations
from .serializers import (
    TourRecommendationsSerializer, TourRecommendationsCreateSerializer,
    TourRecommendationsListSerializer, TourRecommendationsDetailSerializer
)


class TourRecommendationsViewSet(viewsets.ModelViewSet):
    queryset = TourRecommendations.objects.all()
    serializer_class = TourRecommendationsSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return TourRecommendationsCreateSerializer
        elif self.action == 'list':
            return TourRecommendationsListSerializer
        elif self.action == 'retrieve':
            return TourRecommendationsDetailSerializer
        return TourRecommendationsSerializer

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search tour recommendations by various criteria"""
        user_id = request.query_params.get('user_id', '')
        start_city = request.query_params.get('start_city', '')
        destination_city = request.query_params.get('destination_city', '')
        min_cost = request.query_params.get('min_cost', '')
        max_cost = request.query_params.get('max_cost', '')
        currency = request.query_params.get('currency', '')
        
        queryset = TourRecommendations.objects.all()
        
        if user_id:
            queryset = queryset.filter(option__user_id=user_id)
            
        if start_city:
            queryset = queryset.filter(option__start_city__name__icontains=start_city)
            
        if destination_city:
            queryset = queryset.filter(option__destination_city__name__icontains=destination_city)
            
        if min_cost:
            queryset = queryset.filter(total_estimated_cost__gte=min_cost)
            
        if max_cost:
            queryset = queryset.filter(total_estimated_cost__lte=max_cost)
            
        if currency:
            queryset = queryset.filter(currency__iexact=currency)
        
        serializer = TourRecommendationsListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_user(self, request):
        """Get tour recommendations by user ID"""
        user_id = request.query_params.get('user_id', '')
        if user_id:
            recommendations = TourRecommendations.objects.filter(option__user_id=user_id)
            serializer = TourRecommendationsListSerializer(recommendations, many=True)
            return Response(serializer.data)
        return Response({'error': 'User ID required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def by_destination(self, request):
        """Get tour recommendations by destination city"""
        destination = request.query_params.get('destination', '')
        if destination:
            recommendations = TourRecommendations.objects.filter(
                option__destination_city__name__icontains=destination
            )
            serializer = TourRecommendationsListSerializer(recommendations, many=True)
            return Response(serializer.data)
        return Response({'error': 'Destination required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def budget_range(self, request):
        """Get tour recommendations within budget range"""
        min_budget = request.query_params.get('min_budget', '')
        max_budget = request.query_params.get('max_budget', '')
        
        queryset = TourRecommendations.objects.all()
        
        if min_budget:
            queryset = queryset.filter(total_estimated_cost__gte=min_budget)
        if max_budget:
            queryset = queryset.filter(total_estimated_cost__lte=max_budget)
            
        serializer = TourRecommendationsListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get statistics about tour recommendations"""
        stats = TourRecommendations.objects.aggregate(
            total_recommendations=Count('tour_id'),
            avg_cost=Avg('total_estimated_cost'),
            min_cost=Min('total_estimated_cost'),
            max_cost=Max('total_estimated_cost')
        )
        return Response(stats)

    @action(detail=False, methods=['get'])
    def popular_destinations(self, request):
        """Get most popular destinations"""
        destinations = TourRecommendations.objects.values(
            'option__destination_city__name'
        ).annotate(
            count=Count('tour_id')
        ).order_by('-count')[:10]
        
        return Response(destinations)

    @action(detail=True, methods=['get'])
    def tour_days(self, request, pk=None):
        """Get tour days for a specific recommendation"""
        from tours.models import TourDays
        from tours.serializers import TourDaysSerializer
        
        tour_days = TourDays.objects.filter(tour_id=pk).order_by('day_number')
        serializer = TourDaysSerializer(tour_days, many=True)
        return Response(serializer.data)