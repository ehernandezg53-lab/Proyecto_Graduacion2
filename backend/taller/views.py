from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Vehiculo, Mecanico, OrdenTrabajo
from .serializers import (
    VehiculoSerializer,
    MecanicoSerializer,
    OrdenTrabajoSerializer
)
from .permissions import IsTallerOrAdmin, IsTallerOrBodegueroOrAdmin

class VehiculoViewSet(viewsets.ModelViewSet):
    queryset = Vehiculo.objects.all().order_by('-id_vehiculo')
    serializer_class = VehiculoSerializer
    permission_classes = [IsTallerOrBodegueroOrAdmin]

    def get_queryset(self):
        queryset = Vehiculo.objects.all().order_by('-id_vehiculo')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(placa__icontains=search) |
                Q(unidad__icontains=search) |
                Q(modelo__icontains=search)
            )
        return queryset


class MecanicoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de mecánicos de taller y sus áreas de especialidad.
    Permite acceso a los roles Taller y Administrador.
    """
    queryset = Mecanico.objects.filter(activo=True).order_by('nombre')
    serializer_class = MecanicoSerializer
    permission_classes = [IsTallerOrAdmin]

    def get_queryset(self):
        queryset = Mecanico.objects.filter(activo=True).order_by('nombre')
        search = self.request.query_params.get('search')
        area = self.request.query_params.get('area')
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) |
                Q(area__icontains=search)
            )
        if area:
            queryset = queryset.filter(area=area)
        return queryset


class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    queryset = OrdenTrabajo.objects.select_related('vehiculo', 'mecanico').prefetch_related(
        'salidas_repuesto__repuesto',
        'salidas_repuesto__registrado_por'
    ).order_by('-fecha_creacion')
    serializer_class = OrdenTrabajoSerializer
    permission_classes = [IsTallerOrBodegueroOrAdmin]

    def get_queryset(self):
        queryset = OrdenTrabajo.objects.select_related('vehiculo', 'mecanico').prefetch_related(
            'salidas_repuesto__repuesto',
            'salidas_repuesto__registrado_por'
        ).order_by('-fecha_creacion')

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(numero_orden__icontains=search) |
                Q(descripcion__icontains=search) |
                Q(mecanico_asignado__icontains=search) |
                Q(area_asignada__icontains=search) |
                Q(vehiculo__placa__icontains=search)
            )
        return queryset

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.estado == 'Cerrada':
            nuevo_estado = request.data.get('estado')
            if nuevo_estado and nuevo_estado != 'Cerrada':
                return Response(
                    {"estado": ["Una orden de trabajo que ya fue cerrada no puede volver a ser abierta."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def siguiente_correlativo(self, request):
        """
        Retorna el siguiente número correlativo sugerido para Órdenes de Trabajo (ej: OT-1001).
        """
        numeros = OrdenTrabajo.objects.exclude(numero_orden__isnull=True).exclude(numero_orden='').values_list('numero_orden', flat=True)
        correlativos_numericos = []
        for num in numeros:
            clean_num = str(num).replace('OT-', '').strip()
            if clean_num.isdigit():
                correlativos_numericos.append(int(clean_num))
        if correlativos_numericos:
            siguiente = max(correlativos_numericos) + 1
        else:
            siguiente = 1001
        return Response({'siguiente_correlativo': f"OT-{siguiente}"})
