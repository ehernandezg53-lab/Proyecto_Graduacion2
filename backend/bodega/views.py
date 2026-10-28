from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Repuesto, OrdenIngreso, SalidaRepuesto
from .serializers import (
    RepuestoSerializer,
    OrdenIngresoSerializer,
    SalidaRepuestoSerializer
)
from .permissions import IsBodegueroOrAdmin, IsAdminUserOnly
# Importar ViewSets de Taller para re-exportar compatibilidad si se consulta vía bodega
from taller.views import OrdenTrabajoViewSet, VehiculoViewSet, MecanicoViewSet

class RepuestoViewSet(viewsets.ModelViewSet):
    queryset = Repuesto.objects.all()
    serializer_class = RepuestoSerializer
    permission_classes = [IsBodegueroOrAdmin]

    def get_queryset(self):
        queryset = Repuesto.objects.all().order_by('-id_repuesto')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) |
                Q(codigo__icontains=search) |
                Q(descripcion__icontains=search)
            )
        return queryset

    @action(detail=False, methods=['get'])
    def siguiente_codigo(self, request):
        codigos = Repuesto.objects.exclude(codigo__isnull=True).exclude(codigo='').values_list('codigo', flat=True)
        codigos_numericos = [int(c) for c in codigos if c.isdigit()]
        if codigos_numericos:
            siguiente = max(max(codigos_numericos) + 1, 100192)
        else:
            siguiente = 100192
        return Response({
            'siguiente_codigo': str(siguiente),
            'siguiente_sku': str(siguiente)
        })

    @action(detail=False, methods=['get'])
    def siguiente_sku(self, request):
        return self.siguiente_codigo(request)


class OrdenIngresoViewSet(viewsets.ModelViewSet):
    queryset = OrdenIngreso.objects.all().prefetch_related('detalles__repuesto').select_related('creado_por').order_by('-fecha_creacion')
    serializer_class = OrdenIngresoSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUserOnly()]
        return [IsBodegueroOrAdmin()]

    def get_queryset(self):
        queryset = OrdenIngreso.objects.all().prefetch_related('detalles__repuesto').select_related('creado_por', 'ingresado_por').order_by('-fecha_creacion')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(numero_orden__icontains=search) |
                Q(proveedor__icontains=search) |
                Q(detalles__descripcion_repuesto__icontains=search) |
                Q(detalles__repuesto__nombre__icontains=search)
            ).distinct()
        return queryset

    @action(detail=False, methods=['get'])
    def siguiente_correlativo(self, request):
        numeros = OrdenIngreso.objects.exclude(numero_orden__isnull=True).exclude(numero_orden='').values_list('numero_orden', flat=True)
        correlativos_numericos = [int(o) for o in numeros if o.isdigit()]
        if correlativos_numericos:
            siguiente = max(correlativos_numericos) + 1
        else:
            siguiente = 61635500
        return Response({'siguiente_correlativo': str(siguiente)})

    @action(detail=True, methods=['post'], permission_classes=[IsBodegueroOrAdmin])
    def procesar_ingreso(self, request, pk=None):
        """
        Permite a un Bodeguero (o Administrador) procesar el ingreso físico de los repuestos al stock.
        """
        from django.db import transaction
        from django.utils import timezone

        orden = self.get_object()
        if orden.estado == 'Ingresado':
            return Response(
                {"detail": f"La orden #{orden.numero_orden} ya fue ingresada a bodega anteriormente."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            for detalle in orden.detalles.all():
                repuesto = detalle.repuesto
                repuesto.stock += detalle.cantidad
                if detalle.precio_unitario > 0:
                    repuesto.precio_unitario = detalle.precio_unitario
                repuesto.save()

            orden.estado = 'Ingresado'
            orden.ingresado_por = request.user
            orden.fecha_ingreso = timezone.now()
            orden.save()

        serializer = self.get_serializer(orden)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SalidaRepuestoViewSet(viewsets.ModelViewSet):
    queryset = SalidaRepuesto.objects.all().select_related('repuesto', 'orden_trabajo', 'registrado_por').order_by('-fecha')
    serializer_class = SalidaRepuestoSerializer
    permission_classes = [IsBodegueroOrAdmin]

    def get_queryset(self):
        queryset = SalidaRepuesto.objects.all().select_related('repuesto', 'orden_trabajo', 'registrado_por').order_by('-fecha')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(repuesto__nombre__icontains=search) |
                Q(orden_trabajo__numero_orden__icontains=search) |
                Q(observacion__icontains=search)
            )
        return queryset
