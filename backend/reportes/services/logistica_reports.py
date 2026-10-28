from django.db.models import Sum, Count, Q
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import datetime, date, timedelta
from logistica.models import Cliente, Conductor, Viaje, Rollo
from taller.models import Vehiculo


def get_viajes_report(fecha_desde=None, fecha_hasta=None, estado=None, cliente_id=None, conductor_id=None, vehiculo_id=None):
    """
    Reporte consolidado de viajes, despachos y carga movilizada.
    """
    qs = Viaje.objects.select_related('cliente', 'conductor', 'vehiculo').all()

    if fecha_desde:
        qs = qs.filter(fecha_envio__gte=parse_date(fecha_desde))
    if fecha_hasta:
        qs = qs.filter(fecha_envio__lte=parse_date(fecha_hasta))
    if estado:
        qs = qs.filter(estado__iexact=estado)
    if cliente_id:
        qs = qs.filter(cliente_id=cliente_id)
    if conductor_id:
        qs = qs.filter(conductor_id=conductor_id)
    if vehiculo_id:
        qs = qs.filter(vehiculo_id=vehiculo_id)

    data = []
    total_peso = 0.0
    total_rollos = 0

    for v in qs:
        peso = float(v.peso_carga_kg)
        total_peso += peso
        total_rollos += v.cantidad_rollos

        data.append({
            'id_viaje': v.id_viaje,
            'numero_viaje': v.numero_viaje,
            'fecha_envio': v.fecha_envio,
            'hora_envio': v.hora_envio.strftime('%H:%M') if v.hora_envio else '-',
            'cliente': f"{v.cliente.numero_cliente} - {v.cliente.nombre}" if v.cliente else 'Sin cliente',
            'conductor': v.conductor.nombre if v.conductor else 'Sin conductor',
            'vehiculo': f"{v.vehiculo.placa} ({v.vehiculo.unidad or 'Unidad'})" if v.vehiculo else 'Sin vehículo',
            'peso_kg': peso,
            'toneladas': round(peso / 1000.0, 2),
            'cantidad_rollos': v.cantidad_rollos,
            'estado': v.estado
        })

    summary = {
        'total_viajes': len(data),
        'viajes_abiertos': sum(1 for d in data if d['estado'] == 'Abierta'),
        'viajes_cerrados': sum(1 for d in data if d['estado'] == 'Cerrada'),
        'total_toneladas': round(total_peso / 1000.0, 2),
        'total_rollos_movilizados': total_rollos
    }

    return {
        'summary': summary,
        'data': data
    }


def get_trazabilidad_rollos_report(estado=None, tipo_alambre=None):
    """
    Trazabilidad de rollos de alambre producidos/almacenados y en despacho.
    """
    qs = Rollo.objects.select_related('viaje').all()

    if estado:
        qs = qs.filter(estado__iexact=estado)
    if tipo_alambre:
        qs = qs.filter(tipo_alambre__icontains=tipo_alambre)

    data = []
    peso_total = 0.0

    for r in qs:
        p = float(r.peso_kg)
        peso_total += p
        data.append({
            'id_rollo': r.id_rollo,
            'codigo_rollo': r.codigo_rollo,
            'tipo_alambre': r.tipo_alambre,
            'peso_kg': p,
            'ubicacion': r.ubicacion,
            'estado': r.estado,
            'viaje_asignado': r.viaje.numero_viaje if r.viaje else '-',
            'fecha_ingreso': r.fecha_ingreso
        })

    summary = {
        'total_rollos': len(data),
        'disponibles': sum(1 for d in data if d['estado'] == 'Disponible'),
        'en_viaje': sum(1 for d in data if d['estado'] == 'En Viaje'),
        'entregados': sum(1 for d in data if d['estado'] == 'Entregado'),
        'peso_total_kg': round(peso_total, 2)
    }

    return {
        'summary': summary,
        'data': data
    }


def get_licencias_conductores_report():
    """
    Semáforo preventivo de vencimiento de licencias de choferes.
    - VENCIDA: fecha < hoy
    - POR VENCER: hoy <= fecha <= hoy + 30 días
    - VIGENTE: fecha > hoy + 30 días
    """
    conductores = Conductor.objects.all().order_by('nombre')
    hoy = date.today()
    limite_alerta = hoy + timedelta(days=30)

    data = []
    vigentes = 0
    por_vencer = 0
    vencidas = 0

    for c in conductores:
        fv = c.fecha_vencimiento_licencia
        if not fv:
            estado_semaforo = 'SIN REGISTRO'
            dias_restantes = None
        elif fv < hoy:
            estado_semaforo = 'VENCIDA'
            dias_restantes = (fv - hoy).days
            vencidas += 1
        elif fv <= limite_alerta:
            estado_semaforo = 'POR VENCER'
            dias_restantes = (fv - hoy).days
            por_vencer += 1
        else:
            estado_semaforo = 'VIGENTE'
            dias_restantes = (fv - hoy).days
            vigentes += 1

        data.append({
            'id_conductor': c.id_conductor,
            'codigo_carnet': c.codigo_carnet or '-',
            'nombre': c.nombre,
            'fecha_vencimiento': fv,
            'dias_restantes': dias_restantes,
            'semaforo': estado_semaforo,
            'activo': 'Sí' if c.activo else 'No'
        })

    summary = {
        'total_conductores': len(data),
        'licencias_vigentes': vigentes,
        'licencias_por_vencer': por_vencer,
        'licencias_vencidas': vencidas
    }

    return {
        'summary': summary,
        'data': data
    }
