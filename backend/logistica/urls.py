from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClienteViewSet,
    ConductorViewSet,
    ViajeViewSet,
    VehiculoLogisticaViewSet,
    RolloViewSet,
    TipoAlambreViewSet
)

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'conductores', ConductorViewSet, basename='conductor')
router.register(r'viajes', ViajeViewSet, basename='viaje')
router.register(r'vehiculos', VehiculoLogisticaViewSet, basename='vehiculo')
router.register(r'rollos', RolloViewSet, basename='rollo')
router.register(r'tipos-alambre', TipoAlambreViewSet, basename='tipo-alambre')

urlpatterns = [
    path('', include(router.urls)),
]
