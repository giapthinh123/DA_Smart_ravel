from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TourOptionsViewSet, TourDaysViewSet, TourScheduleItemsViewSet,
    TourOptionsHotelsViewSet, TourOptionsActivitiesViewSet, 
    TourOptionsRestaurantsViewSet, TourOptionsTransportsViewSet
)

router = DefaultRouter()
router.register(r'options', TourOptionsViewSet)
router.register(r'days', TourDaysViewSet)
router.register(r'schedule-items', TourScheduleItemsViewSet)
router.register(r'options-hotels', TourOptionsHotelsViewSet)
router.register(r'options-activities', TourOptionsActivitiesViewSet)
router.register(r'options-restaurants', TourOptionsRestaurantsViewSet)
router.register(r'options-transports', TourOptionsTransportsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
