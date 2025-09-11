from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Cities
from .serializers import CitySerializer, CityCreateSerializer, CityListSerializer


class CityViewSet(viewsets.ModelViewSet):
    queryset = Cities.objects.all()
    serializer_class = CitySerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return CityCreateSerializer
        elif self.action == 'list':
            return CityListSerializer
        return CitySerializer

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search cities by name or country"""
        query = request.query_params.get('q', '')
        if query:
            cities = Cities.objects.filter(
                Q(name__icontains=query) | Q(country__icontains=query)
            )
        else:
            cities = Cities.objects.all()
        
        serializer = CityListSerializer(cities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_country(self, request):
        """Get cities grouped by country"""
        country = request.query_params.get('country', '')
        if country:
            cities = Cities.objects.filter(country__iexact=country)
        else:
            cities = Cities.objects.all()
        
        serializer = CityListSerializer(cities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def countries(self, request):
        """Get list of unique countries"""
        countries = Cities.objects.values_list('country', flat=True).distinct()
        return Response(list(countries))