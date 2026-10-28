from datetime import date
from rest_framework import serializers
from django.db import transaction
from .models import Cliente, Conductor, Viaje, Rollo, TipoAlambre
from taller.serializers import VehiculoSerializer

class TipoAlambreSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAlambre
        fields = ['id_tipo', 'codigo', 'nombre', 'peso_estandar_kg', 'ubicacion_defecto', 'activo', 'fecha_creacion']


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id_cliente', 'numero_cliente', 'nombre', 'direccion', 'fecha_creacion']


class ConductorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conductor
        fields = ['id_conductor', 'codigo_carnet', 'nombre', 'fecha_vencimiento_licencia', 'activo', 'fecha_creacion']


class RolloSerializer(serializers.ModelSerializer):
    viaje_numero = serializers.ReadOnlyField(source='viaje.numero_viaje')
    cliente_nombre = serializers.ReadOnlyField(source='viaje.cliente.nombre')

    class Meta:
        model = Rollo
        fields = [
            'id_rollo',
            'codigo_rollo',
            'tipo_alambre',
            'peso_kg',
            'ubicacion',
            'estado',
            'viaje',
            'viaje_numero',
            'cliente_nombre',
            'fecha_ingreso'
        ]


def get_siguiente_correlativo_viaje():
    numeros = Viaje.objects.exclude(numero_viaje__isnull=True).exclude(numero_viaje='').values_list('numero_viaje', flat=True)
    correlativos = []
    for v in numeros:
        clean_num = str(v).replace('VJ-', '').strip()
        if clean_num.isdigit():
            correlativos.append(int(clean_num))
    return str(max(correlativos) + 1 if correlativos else 612150)


class ViajeSerializer(serializers.ModelSerializer):
    numero_viaje = serializers.CharField(required=False, allow_blank=True, max_length=50)
    vehiculo_detail = VehiculoSerializer(source='vehiculo', read_only=True)
    cliente_detail = ClienteSerializer(source='cliente', read_only=True)
    conductor_detail = ConductorSerializer(source='conductor', read_only=True)
    rollos_detail = RolloSerializer(source='rollos', many=True, read_only=True)
    rollos_ids = serializers.ListField(child=serializers.IntegerField(), required=False, write_only=True)

    class Meta:
        model = Viaje
        fields = [
            'id_viaje',
            'numero_viaje',
            'vehiculo',
            'vehiculo_detail',
            'cliente',
            'cliente_detail',
            'conductor',
            'conductor_detail',
            'fecha_envio',
            'hora_envio',
            'peso_carga_kg',
            'cantidad_rollos',
            'estado',
            'fecha_creacion',
            'rollos_detail',
            'rollos_ids'
        ]

    def validate(self, attrs):
        # 1. Validar que la unidad vehicular esté seleccionada y activa
        vehiculo = attrs.get('vehiculo') or (self.instance.vehiculo if self.instance else None)
        if not vehiculo:
            raise serializers.ValidationError({
                "vehiculo": "Debe seleccionar una unidad vehicular para el viaje."
            })
        if 'vehiculo' in attrs and not getattr(vehiculo, 'activo', True):
            desc = vehiculo.unidad or vehiculo.modelo or 'Unidad'
            raise serializers.ValidationError({
                "vehiculo": f"La unidad {vehiculo.placa} ({desc}) está inactiva. No se puede generar un viaje con una unidad inactiva."
            })

        # 2. Validar que se asigne un conductor
        conductor = attrs.get('conductor') or (self.instance.conductor if self.instance else None)
        if not conductor:
            raise serializers.ValidationError({
                "conductor": "Debe asignar un conductor/piloto al viaje."
            })

        # 3. Validar estado y licencia de conductor si se crea o cambia conductor
        if 'conductor' in attrs or 'fecha_envio' in attrs:
            if not getattr(conductor, 'activo', True):
                raise serializers.ValidationError({
                    "conductor": f"El conductor {conductor.nombre} no se encuentra activo."
                })

            fecha_envio = attrs.get('fecha_envio') or (self.instance.fecha_envio if self.instance else date.today())
            if not conductor.fecha_vencimiento_licencia:
                raise serializers.ValidationError({
                    "conductor": f"El conductor {conductor.nombre} no tiene fecha de vencimiento de licencia registrada. Debe asignar un piloto con licencia vigente."
                })

            if conductor.fecha_vencimiento_licencia < fecha_envio:
                fecha_venc_str = conductor.fecha_vencimiento_licencia.strftime('%d/%m/%Y')
                raise serializers.ValidationError({
                    "conductor": f"La licencia de {conductor.nombre} está vencida (Caducó el {fecha_venc_str}). No se puede generar el viaje; debe asignar otro piloto con licencia vigente."
                })

        # 5. Validar asignación de rollos (solo en creación o si se envían explícitamente)
        if not self.instance or 'rollos_ids' in self.initial_data:
            rollos_ids = self.initial_data.get('rollos_ids', [])
            cantidad_solicitada = attrs.get('cantidad_rollos', 0)

            if rollos_ids:
                rollos_invalidos = Rollo.objects.filter(id_rollo__in=rollos_ids).exclude(estado='Disponible')
                if rollos_invalidos.exists():
                    codigos = ", ".join(r.codigo_rollo for r in rollos_invalidos)
                    raise serializers.ValidationError({
                        "rollos_ids": f"Los siguientes rollos ya no están disponibles: {codigos}."
                    })
            elif not self.instance and cantidad_solicitada > 0:
                disponibles_count = Rollo.objects.filter(estado='Disponible').count()
                if disponibles_count < cantidad_solicitada:
                    raise serializers.ValidationError({
                        "cantidad_rollos": f"No hay suficientes rollos disponibles en el inventario. Disponibles: {disponibles_count}, solicitados: {cantidad_solicitada}."
                    })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        rollos_ids = validated_data.pop('rollos_ids', None) or self.initial_data.get('rollos_ids', [])
        cantidad_solicitada = validated_data.get('cantidad_rollos', 0)

        if not validated_data.get('numero_viaje'):
            validated_data['numero_viaje'] = get_siguiente_correlativo_viaje()

        # Si se seleccionaron rollos específicos
        if rollos_ids:
            rollos_qs = Rollo.objects.filter(id_rollo__in=rollos_ids, estado='Disponible')
            validated_data['cantidad_rollos'] = rollos_qs.count()
            if not validated_data.get('peso_carga_kg') or float(validated_data.get('peso_carga_kg', 0)) == 0:
                validated_data['peso_carga_kg'] = sum(float(r.peso_kg) for r in rollos_qs)

        viaje = super().create(validated_data)

        if rollos_ids:
            rollos_qs = Rollo.objects.filter(id_rollo__in=rollos_ids, estado='Disponible')
            rollos_qs.update(viaje=viaje, estado='En Viaje')
        elif cantidad_solicitada > 0:
            # Asignar automáticamente los primeros disponibles si no se especificaron IDs
            rollos_disponibles = list(Rollo.objects.filter(estado='Disponible')[:cantidad_solicitada])
            for r in rollos_disponibles:
                r.viaje = viaje
                r.estado = 'En Viaje'
                r.save(update_fields=['viaje', 'estado'])
            viaje.cantidad_rollos = len(rollos_disponibles)
            if not viaje.peso_carga_kg or float(viaje.peso_carga_kg) == 0:
                viaje.peso_carga_kg = sum(float(r.peso_kg) for r in rollos_disponibles)
            viaje.save(update_fields=['cantidad_rollos', 'peso_carga_kg'])

        return viaje
