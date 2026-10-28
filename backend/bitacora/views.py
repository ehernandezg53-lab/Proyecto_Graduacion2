from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from .models import RegistroBitacora
from .serializers import RegistroBitacoraSerializer

class IsAdminOnly(permissions.BasePermission):
    """
    ISO 27001: La bitácora solo puede ser consultada por usuarios con privilegios de Administrador / Auditor.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_staff:
            return True
        rol = getattr(request.user, 'rol', None)
        rol_nombre = getattr(rol, 'nombre', None)
        return rol_nombre == 'Administrador'


class RegistroBitacoraViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de Solo Lectura para Bitácora (ISO/IEC 27001 Control A.8.33 - No repudio e Inmutabilidad).
    No permite POST, PUT, PATCH ni DELETE desde la API.
    """
    queryset = RegistroBitacora.objects.all().select_related('usuario').order_by('-fecha_hora')
    serializer_class = RegistroBitacoraSerializer
    permission_classes = [IsAdminOnly]

    def get_queryset(self):
        queryset = RegistroBitacora.objects.all().select_related('usuario').order_by('-fecha_hora')

        modulo = self.request.query_params.get('modulo')
        if modulo and modulo != 'Todos':
            queryset = queryset.filter(modulo=modulo)

        accion = self.request.query_params.get('accion')
        if accion and accion != 'Todas':
            queryset = queryset.filter(accion=accion)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username_historico__icontains=search) |
                Q(ip_origen__icontains=search) |
                Q(ruta__icontains=search) |
                Q(usuario__nombre__icontains=search) |
                Q(usuario__apellido__icontains=search)
            )

        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_hora__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_hora__lte=fecha_hasta)

        return queryset

    @action(detail=False, methods=['get'])
    def metricas(self, request):
        """
        Resumen cuantitativo para reportes de control interno y auditoría ISO.
        """
        total = RegistroBitacora.objects.count()
        por_modulo = RegistroBitacora.objects.values('modulo').annotate(total=Count('id_bitacora')).order_by('-total')
        por_accion = RegistroBitacora.objects.values('accion').annotate(total=Count('id_bitacora')).order_by('-total')
        logins_fallidos = RegistroBitacora.objects.filter(accion='LOGIN_FALLIDO').count()

        return Response({
            'total_eventos': total,
            'logins_fallidos': logins_fallidos,
            'eventos_por_modulo': por_modulo,
            'eventos_por_accion': por_accion,
        })
