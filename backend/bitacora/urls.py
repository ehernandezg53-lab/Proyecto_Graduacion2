from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegistroBitacoraViewSet

router = DefaultRouter()
router.register(r'registros', RegistroBitacoraViewSet, basename='bitacora-registro')

urlpatterns = [
    path('', include(router.urls)),
]
