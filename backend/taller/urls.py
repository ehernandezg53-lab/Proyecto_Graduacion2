from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehiculoViewSet,
    MecanicoViewSet,
    OrdenTrabajoViewSet
)

router = DefaultRouter()
router.register(r'vehiculos', VehiculoViewSet, basename='vehiculo')
router.register(r'mecanicos', MecanicoViewSet, basename='mecanico')
router.register(r'ordenes-trabajo', OrdenTrabajoViewSet, basename='orden-trabajo')

urlpatterns = [
    path('', include(router.urls)),
]
