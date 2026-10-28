from rest_framework import serializers
from .models import Vehiculo, Mecanico, OrdenTrabajo

class MecanicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mecanico
        fields = '__all__'


class VehiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehiculo
        fields = '__all__'

    def create(self, validated_data):
        unidad = validated_data.get('unidad')
        modelo = validated_data.get('modelo')
        if unidad and not modelo:
            validated_data['modelo'] = unidad
        elif modelo and not unidad:
            validated_data['unidad'] = modelo
        if 'activo' in validated_data and 'estado' not in validated_data:
            validated_data['estado'] = 'Disponible' if validated_data['activo'] else 'Inactivo'
        return super().create(validated_data)

    def update(self, instance, validated_data):
        unidad = validated_data.get('unidad', instance.unidad)
        modelo = validated_data.get('modelo', instance.modelo)
        if 'unidad' in validated_data and not validated_data.get('modelo'):
            validated_data['modelo'] = unidad
        elif 'modelo' in validated_data and not validated_data.get('unidad'):
            validated_data['unidad'] = modelo
        if 'activo' in validated_data and 'estado' not in validated_data:
            validated_data['estado'] = 'Disponible' if validated_data['activo'] else 'Inactivo'
        return super().update(instance, validated_data)


class SalidaRepuestoTallerSerializer(serializers.ModelSerializer):
    """
    Representación resumida de los repuestos despachados desde Bodega para esta orden de trabajo.
    """
    repuesto_nombre = serializers.ReadOnlyField(source='repuesto.nombre')
    repuesto_codigo = serializers.ReadOnlyField(source='repuesto.codigo')
    precio_unitario = serializers.ReadOnlyField(source='repuesto.precio_unitario')
    registrado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        from bodega.models import SalidaRepuesto
        model = SalidaRepuesto
        fields = [
            'id_salida', 'repuesto', 'repuesto_nombre', 'repuesto_codigo', 'precio_unitario',
            'cantidad', 'observacion', 'fecha', 'registrado_por', 'registrado_por_nombre'
        ]

    def get_registrado_por_nombre(self, obj):
        if obj.registrado_por:
            return f"{obj.registrado_por.nombre} {obj.registrado_por.apellido}".strip()
        return "Sistema"


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    vehiculo_detail = VehiculoSerializer(source='vehiculo', read_only=True)
    mecanico_detail = MecanicoSerializer(source='mecanico', read_only=True)
    salidas_repuesto = SalidaRepuestoTallerSerializer(many=True, read_only=True)
    total_repuestos_q = serializers.SerializerMethodField()

    class Meta:
        model = OrdenTrabajo
        fields = [
            'id_orden', 'numero_orden', 'vehiculo', 'vehiculo_detail',
            'mecanico', 'mecanico_detail',
            'descripcion', 'mecanico_asignado', 'area_asignada', 'estado',
            'fecha_creacion', 'salidas_repuesto', 'total_repuestos_q'
        ]

    def validate(self, attrs):
        if self.instance and self.instance.estado == 'Cerrada':
            nuevo_estado = attrs.get('estado')
            if nuevo_estado and nuevo_estado != 'Cerrada':
                raise serializers.ValidationError({
                    "estado": "Una orden de trabajo que ya fue cerrada no puede volver a ser abierta."
                })
        return attrs

    def get_total_repuestos_q(self, obj):
        total = 0.00
        for salida in obj.salidas_repuesto.all():
            if salida.repuesto and salida.repuesto.precio_unitario:
                total += float(salida.cantidad * salida.repuesto.precio_unitario)
        return round(total, 2)
