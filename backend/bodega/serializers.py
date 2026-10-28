from rest_framework import serializers
from django.db import transaction
from .models import Repuesto, OrdenIngreso, DetalleOrdenIngreso, SalidaRepuesto
from taller.models import Vehiculo, Mecanico, OrdenTrabajo
from taller.serializers import VehiculoSerializer, MecanicoSerializer, OrdenTrabajoSerializer

def get_siguiente_codigo_calculado():
    codigos = Repuesto.objects.exclude(codigo__isnull=True).exclude(codigo='').values_list('codigo', flat=True)
    codigos_numericos = [int(r) for r in codigos if r.isdigit()]
    if codigos_numericos:
        return str(max(max(codigos_numericos) + 1, 100192))
    return "100192"

get_siguiente_sku_calculado = get_siguiente_codigo_calculado

class RepuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Repuesto
        fields = '__all__'
        read_only_fields = ['stock']

    def create(self, validated_data):
        codigo = validated_data.get('codigo')
        if not codigo or not str(codigo).strip():
            validated_data['codigo'] = get_siguiente_codigo_calculado()
        
        # Al crear un repuesto directamente, NO ingresa stock (stock inicia en 0)
        validated_data['stock'] = 0
        return super().create(validated_data)


class SalidaRepuestoSerializer(serializers.ModelSerializer):
    repuesto_nombre = serializers.ReadOnlyField(source='repuesto.nombre')
    repuesto_codigo = serializers.ReadOnlyField(source='repuesto.codigo')
    precio_unitario = serializers.ReadOnlyField(source='repuesto.precio_unitario')
    orden_trabajo_numero = serializers.ReadOnlyField(source='orden_trabajo.numero_orden')
    registrado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = SalidaRepuesto
        fields = [
            'id_salida', 'repuesto', 'repuesto_nombre', 'repuesto_codigo', 'precio_unitario',
            'orden_trabajo', 'orden_trabajo_numero',
            'cantidad', 'observacion', 'fecha',
            'registrado_por', 'registrado_por_nombre'
        ]

    def get_registrado_por_nombre(self, obj):
        if obj.registrado_por:
            return f"{obj.registrado_por.nombre} {obj.registrado_por.apellido}".strip()
        return "Sistema"

    def validate(self, data):
        repuesto = data.get('repuesto')
        cantidad = data.get('cantidad')
        orden_trabajo = data.get('orden_trabajo')

        if orden_trabajo and orden_trabajo.estado == 'Cerrada':
            raise serializers.ValidationError(
                "No se pueden registrar salidas de repuestos para una orden de trabajo que ya ha sido cerrada."
            )

        if repuesto and cantidad:
            if repuesto.stock < cantidad:
                raise serializers.ValidationError(
                    f"Stock insuficiente para el repuesto '{repuesto.nombre}'. Disponible: {repuesto.stock}, solicitado: {cantidad}."
                )
        return data

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user if 'request' in self.context else None
        repuesto = validated_data['repuesto']
        cantidad = validated_data['cantidad']

        # Descontar stock del inventario
        repuesto.stock -= cantidad
        repuesto.save()

        salida = SalidaRepuesto.objects.create(
            registrado_por=user,
            **validated_data
        )
        return salida


class DetalleOrdenIngresoSerializer(serializers.ModelSerializer):
    repuesto_nombre = serializers.ReadOnlyField(source='repuesto.nombre')

    class Meta:
        model = DetalleOrdenIngreso
        fields = ['id_detalle', 'orden_ingreso', 'repuesto', 'repuesto_nombre', 'descripcion_repuesto', 'cantidad', 'precio_unitario']
        extra_kwargs = {
            'orden_ingreso': {'required': False}
        }


class OrdenIngresoSerializer(serializers.ModelSerializer):
    detalles = DetalleOrdenIngresoSerializer(many=True)
    creado_por_nombre = serializers.SerializerMethodField()
    ingresado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = OrdenIngreso
        fields = [
            'id_orden_ingreso', 'numero_orden', 'proveedor', 'observaciones',
            'estado', 'creado_por', 'creado_por_nombre', 'ingresado_por',
            'ingresado_por_nombre', 'fecha_creacion', 'fecha_ingreso', 'detalles'
        ]

    def get_creado_por_nombre(self, obj):
        if obj.creado_por:
            return f"{obj.creado_por.nombre} {obj.creado_por.apellido}".strip()
        return "Sistema"

    def get_ingresado_por_nombre(self, obj):
        if obj.ingresado_por:
            return f"{obj.ingresado_por.nombre} {obj.ingresado_por.apellido}".strip()
        return "Pendiente"

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles', [])
        user = self.context['request'].user if 'request' in self.context else None
        procesar_inmediatamente = self.context.get('request').data.get('procesar_inmediatamente', True) if 'request' in self.context else True
        
        from django.utils import timezone
        estado_inicial = 'Ingresado' if procesar_inmediatamente else 'Pendiente'
        fecha_ing = timezone.now() if procesar_inmediatamente else None
        ingresado_p = user if procesar_inmediatamente else None

        orden_ingreso = OrdenIngreso.objects.create(
            creado_por=user,
            estado=estado_inicial,
            ingresado_por=ingresado_p,
            fecha_ingreso=fecha_ing,
            **validated_data
        )

        for detalle_data in detalles_data:
            repuesto = detalle_data['repuesto']
            cantidad = detalle_data['cantidad']
            
            # Incrementar el stock si se procesa inmediatamente
            if procesar_inmediatamente:
                repuesto.stock += cantidad
                if detalle_data.get('precio_unitario'):
                    repuesto.precio_unitario = detalle_data['precio_unitario']
                repuesto.save()

            # Crear el detalle del ingreso
            DetalleOrdenIngreso.objects.create(
                orden_ingreso=orden_ingreso,
                repuesto=repuesto,
                descripcion_repuesto=detalle_data.get('descripcion_repuesto', repuesto.descripcion or repuesto.nombre),
                cantidad=cantidad,
                precio_unitario=detalle_data.get('precio_unitario', 0.00)
            )

        return orden_ingreso
