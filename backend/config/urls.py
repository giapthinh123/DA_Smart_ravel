# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/locations/", include("locations.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/tours/", include("tours.urls")),
    path("api/recommendations/", include("recommendations.urls")),
]
