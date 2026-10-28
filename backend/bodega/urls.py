from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RepuestoViewSet,
    OrdenIngresoViewSet,
    SalidaRepuestoViewSet,
    # ViewSets de Taller re-exportados por compatibilidad
    VehiculoViewSet,
    MecanicoViewSet,
    OrdenTrabajoViewSet
)

router = DefaultRouter()
# Rutas propias del módulo Bodega
router.register(r'repuestos', RepuestoViewSet, basename='repuesto')
router.register(r'ordenes-ingreso', OrdenIngresoViewSet, basename='orden-ingreso')
router.register(r'salidas-repuestos', SalidaRepuestoViewSet, basename='salida-repuesto')

# Rutas de enlace por compatibilidad histórica
router.register(r'vehiculos', VehiculoViewSet, basename='bodega-vehiculo')
router.register(r'mecanicos', MecanicoViewSet, basename='bodega-mecanico')
router.register(r'ordenes-trabajo', OrdenTrabajoViewSet, basename='bodega-orden-trabajo')

urlpatterns = [
    path('', include(router.urls)),
]
