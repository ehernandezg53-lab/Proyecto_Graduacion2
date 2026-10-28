from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/bodega/', include('bodega.urls')),
    path('api/taller/', include('taller.urls')),
    path('api/logistica/', include('logistica.urls')),
    path('api/bitacora/', include('bitacora.urls')),
    path('api/reportes/', include('reportes.urls')),
]
