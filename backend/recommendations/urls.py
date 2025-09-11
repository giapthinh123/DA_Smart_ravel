from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TourRecommendationsViewSet

router = DefaultRouter()
router.register(r'tours', TourRecommendationsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
