from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HotelViewSet, RestaurantViewSet, ActivityViewSet, TransportViewSet

router = DefaultRouter()
router.register(r'hotels', HotelViewSet)
router.register(r'restaurants', RestaurantViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'transports', TransportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
