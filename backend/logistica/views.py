from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum, Count
from django.db import transaction
from .models import Cliente, Conductor, Viaje, Rollo, TipoAlambre
from .serializers import ClienteSerializer, ConductorSerializer, ViajeSerializer, RolloSerializer, TipoAlambreSerializer
from taller.models import Vehiculo
from taller.serializers import VehiculoSerializer

class IsLogisticaOrAdmin(permissions.BasePermission):
    """
    Permite acceso a usuarios autenticados con rol Administrador o Logística,
    o que posean el permiso 'ver_logistica'.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser or request.user.is_staff:
            return True

        rol = getattr(request.user, 'rol', None)
        if not rol:
            return False

        rol_nombre = getattr(rol, 'nombre', None)
        if rol_nombre in ['Administrador', 'Logística']:
            return True

        return rol.permisos.filter(nombre_permiso='ver_logistica').exists()

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('numero_cliente')
    serializer_class = ClienteSerializer
    permission_classes = [IsLogisticaOrAdmin]

    def get_queryset(self):
        queryset = Cliente.objects.all().order_by('numero_cliente')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(numero_cliente__icontains=search) |
                Q(nombre__icontains=search) |
                Q(direccion__icontains=search)
            )
        return queryset


class ConductorViewSet(viewsets.ModelViewSet):
    queryset = Conductor.objects.all().order_by('nombre')
    serializer_class = ConductorSerializer
    permission_classes = [IsLogisticaOrAdmin]

    def get_queryset(self):
        queryset = Conductor.objects.all().order_by('nombre')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) |
                Q(codigo_carnet__icontains=search)
            )
        return queryset


class VehiculoLogisticaViewSet(viewsets.ModelViewSet):
    queryset = Vehiculo.objects.all().order_by('-id_vehiculo')
    serializer_class = VehiculoSerializer
    permission_classes = [IsLogisticaOrAdmin]

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


class ViajeViewSet(viewsets.ModelViewSet):
    queryset = Viaje.objects.all().select_related('vehiculo', 'cliente', 'conductor').prefetch_related('rollos').order_by('-fecha_creacion')
    serializer_class = ViajeSerializer
    permission_classes = [IsLogisticaOrAdmin]

    def get_queryset(self):
        queryset = Viaje.objects.all().select_related('vehiculo', 'cliente', 'conductor').prefetch_related('rollos').order_by('-fecha_creacion')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(numero_viaje__icontains=search) |
                Q(cliente__nombre__icontains=search) |
                Q(cliente__numero_cliente__icontains=search) |
                Q(vehiculo__placa__icontains=search)
            )

        prog_desde = self.request.query_params.get('prog_desde')
        hasta = self.request.query_params.get('hasta')
        if prog_desde:
            queryset = queryset.filter(fecha_envio__gte=prog_desde)
        if hasta:
            queryset = queryset.filter(fecha_envio__lte=hasta)

        return queryset

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        prev_estado = instance.estado
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Si el viaje se cierra, los rollos pasan a estado 'Entregado'
        if prev_estado != 'Cerrada' and serializer.instance.estado == 'Cerrada':
            serializer.instance.rollos.filter(estado='En Viaje').update(estado='Entregado')

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def siguiente_correlativo(self, request):
        numeros = Viaje.objects.exclude(numero_viaje__isnull=True).exclude(numero_viaje='').values_list('numero_viaje', flat=True)
        correlativos = []
        for v in numeros:
            clean_num = str(v).replace('VJ-', '').strip()
            if clean_num.isdigit():
                correlativos.append(int(clean_num))
        if correlativos:
            siguiente = max(correlativos) + 1
        else:
            siguiente = 612150
        return Response({'siguiente_correlativo': str(siguiente)})


class RolloViewSet(viewsets.ModelViewSet):
    queryset = Rollo.objects.all().select_related('viaje', 'viaje__cliente').order_by('-id_rollo')
    serializer_class = RolloSerializer
    permission_classes = [IsLogisticaOrAdmin]

    def get_queryset(self):
        queryset = Rollo.objects.all().select_related('viaje', 'viaje__cliente').order_by('-id_rollo')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(codigo_rollo__icontains=search) |
                Q(tipo_alambre__icontains=search) |
                Q(ubicacion__icontains=search) |
                Q(viaje__numero_viaje__icontains=search)
            )

        estado = self.request.query_params.get('estado')
        if estado and estado != 'Todos':
            queryset = queryset.filter(estado=estado)

        return queryset

    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """Retorna únicamente los rollos disponibles para asignar a viajes."""
        rollos = Rollo.objects.filter(estado='Disponible').order_by('codigo_rollo')
        return Response(RolloSerializer(rollos, many=True).data)

    @action(detail=False, methods=['get'])
    def siguientes_correlativos(self, request):
        """Devuelve el siguiente código sugerido para un nuevo rollo (ej: AL-1026)."""
        codigos = Rollo.objects.exclude(codigo_rollo__isnull=True).exclude(codigo_rollo='').values_list('codigo_rollo', flat=True)
        correlativos = []
        for r in codigos:
            clean = str(r).replace('AL-', '').replace('RL-', '').replace('ROL-', '').strip()
            if clean.isdigit():
                correlativos.append(int(clean))
        siguiente = max(correlativos) + 1 if correlativos else 1001
        return Response({'siguiente_codigo': f"AL-{siguiente}"})

    @action(detail=False, methods=['get'])
    def metricas(self, request):
        """Devuelve métricas rápidas del inventario de rollos usando agregación SQL en una sola consulta."""
        stats = Rollo.objects.aggregate(
            total_rollos=Count('id_rollo'),
            disponibles=Count('id_rollo', filter=Q(estado='Disponible')),
            en_viaje=Count('id_rollo', filter=Q(estado='En Viaje')),
            entregados=Count('id_rollo', filter=Q(estado='Entregado')),
            peso_disponible=Sum('peso_kg', filter=Q(estado='Disponible'))
        )

        return Response({
            'total_rollos': stats['total_rollos'] or 0,
            'disponibles': stats['disponibles'] or 0,
            'en_viaje': stats['en_viaje'] or 0,
            'entregados': stats['entregados'] or 0,
            'peso_disponible_kg': round(float(stats['peso_disponible'] or 0.0), 2)
        })

    @action(detail=False, methods=['post'])
    def ingreso_lote(self, request):
        """Permite ingresar un lote de rollos con especificaciones comunes."""
        try:
            cantidad = int(request.data.get('cantidad', 1))
            if cantidad < 1:
                return Response({'detail': 'La cantidad debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'detail': 'Cantidad inválida.'}, status=status.HTTP_400_BAD_REQUEST)

        tipo_alambre = request.data.get('tipo_alambre', 'Alambre Galvanizado')
        peso_kg = float(request.data.get('peso_kg', 50.00))
        ubicacion = request.data.get('ubicacion', 'Bodega Central - Bahía A')

        correlativos = []
        numeros = Rollo.objects.exclude(codigo_rollo__isnull=True).exclude(codigo_rollo='').values_list('codigo_rollo', flat=True)
        for r in numeros:
            clean = str(r).replace('AL-', '').replace('RL-', '').replace('ROL-', '').strip()
            if clean.isdigit():
                correlativos.append(int(clean))
        base = max(correlativos) + 1 if correlativos else 1001

        nuevos = []
        with transaction.atomic():
            for i in range(cantidad):
                codigo = f"AL-{base + i}"
                rollo = Rollo.objects.create(
                    codigo_rollo=codigo,
                    tipo_alambre=tipo_alambre,
                    peso_kg=peso_kg,
                    ubicacion=ubicacion,
                    estado='Disponible'
                )
                nuevos.append(rollo)

        return Response({
            'mensaje': f'Se registraron exitosamente {cantidad} rollos al inventario de logística.',
            'total_creados': len(nuevos),
            'primer_codigo': nuevos[0].codigo_rollo,
            'ultimo_codigo': nuevos[-1].codigo_rollo
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def ingreso_existente(self, request):
        """
        Ingreso a bodega de rollos a partir de un código de alambre pre-registrado.
        Toma el código existente del alambre, autocompleta el tipo y peso estándar,
        y genera los rollos disponibles en la ubicación indicada.
        """
        codigo_alambre = request.data.get('codigo_alambre')
        if not codigo_alambre:
            return Response({'detail': 'Debe seleccionar un código de alambre existente.'}, status=status.HTTP_400_BAD_REQUEST)

        tipo_obj = TipoAlambre.objects.filter(codigo=codigo_alambre, activo=True).first()
        if not tipo_obj:
            return Response({'detail': f"No se encontró el tipo de alambre con código '{codigo_alambre}'."}, status=status.HTTP_404_NOT_FOUND)

        try:
            cantidad = int(request.data.get('cantidad', 1))
            if cantidad < 1:
                return Response({'detail': 'La cantidad debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'detail': 'Cantidad inválida.'}, status=status.HTTP_400_BAD_REQUEST)

        ubicacion = request.data.get('ubicacion') or tipo_obj.ubicacion_defecto or 'Bodega Central - Bahía A'
        peso_kg = float(tipo_obj.peso_estandar_kg)

        correlativos = []
        numeros = Rollo.objects.exclude(codigo_rollo__isnull=True).exclude(codigo_rollo='').values_list('codigo_rollo', flat=True)
        for r in numeros:
            clean = str(r).replace('AL-', '').replace('RL-', '').replace('ROL-', '').strip()
            if clean.isdigit():
                correlativos.append(int(clean))
        base = max(correlativos) + 1 if correlativos else 1001

        nuevos = []
        with transaction.atomic():
            for i in range(cantidad):
                codigo_rollo = f"AL-{base + i}"
                rollo = Rollo.objects.create(
                    codigo_rollo=codigo_rollo,
                    tipo_alambre=tipo_obj.nombre,
                    peso_kg=peso_kg,
                    ubicacion=ubicacion,
                    estado='Disponible'
                )
                nuevos.append(rollo)

        return Response({
            'mensaje': f"Se ingresaron exitosamente {cantidad} rollos de [{tipo_obj.codigo}] {tipo_obj.nombre} a {ubicacion}.",
            'total_creados': len(nuevos),
            'primer_codigo': nuevos[0].codigo_rollo,
            'ultimo_codigo': nuevos[-1].codigo_rollo,
            'peso_total_kg': round(cantidad * peso_kg, 2)
        }, status=status.HTTP_201_CREATED)


class TipoAlambreViewSet(viewsets.ModelViewSet):
    """
    Catálogo de tipos de alambre pre-registrados para control de inventario y rollos.
    """
    queryset = TipoAlambre.objects.filter(activo=True).order_by('codigo')
    serializer_class = TipoAlambreSerializer
    permission_classes = [IsLogisticaOrAdmin]

    @action(detail=False, methods=['get'])
    def siguiente_codigo(self, request):
        """Retorna el siguiente código sugerido para un nuevo tipo de alambre con formato AL-XXXXX (ej: AL-72156)."""
        codigos = TipoAlambre.objects.exclude(codigo__isnull=True).exclude(codigo='').values_list('codigo', flat=True)
        correlativos = []
        for c in codigos:
            clean = str(c).replace('AL-', '').replace('ALM-', '').replace('RL-', '').strip()
            if clean.isdigit():
                correlativos.append(int(clean))
        siguiente = max(correlativos) + 1 if correlativos else 72150
        if siguiente < 72150:
            siguiente = 72150
        return Response({'siguiente_codigo': f"AL-{siguiente}"})
