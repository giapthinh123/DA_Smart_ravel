# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from accounts.views import UserViewSet, AuthLoginView, AuthRegisterView, AuthLogoutView, AuthMeView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/locations/", include("locations.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/tours/", include("tours.urls")),
    path("api/recommendations/", include("recommendations.urls")),
    
    # Auth endpoints
    path("api/auth/login", AuthLoginView.as_view(), name='auth_login'),
    path("api/auth/register", AuthRegisterView.as_view(), name='auth_register'),
    path("api/auth/logout", AuthLogoutView.as_view(), name='auth_logout'),
    path("api/auth/me", AuthMeView.as_view(), name='auth_me'),
    
    # Admin check
    path("api/check-admin", UserViewSet.as_view({'get': 'check_admin'}), name='check_admin_direct'),
]
