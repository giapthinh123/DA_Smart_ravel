from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('check-admin/', UserViewSet.as_view({'get': 'check_admin'}), name='check_admin'),
]
