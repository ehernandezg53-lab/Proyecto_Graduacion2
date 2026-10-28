from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    current_user_view,
    RolViewSet,
    UsuarioViewSet,
    SolicitudRestablecimientoViewSet,
    solicitar_restablecimiento_view,
    cambiar_password_obligatorio_view
)

router = DefaultRouter()
router.register(r'roles', RolViewSet, basename='rol')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'solicitudes_restablecimiento', SolicitudRestablecimientoViewSet, basename='solicitud_restablecimiento')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', current_user_view, name='current_user'),
    path('auth/solicitar_restablecimiento/', solicitar_restablecimiento_view, name='solicitar_restablecimiento'),
    path('auth/cambiar_password_obligatorio/', cambiar_password_obligatorio_view, name='cambiar_password_obligatorio'),
    path('', include(router.urls)),
]

