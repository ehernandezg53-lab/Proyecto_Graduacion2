from django.db.models import Count, Sum, F, Q, Prefetch
from django.utils.dateparse import parse_date
from datetime import datetime
from taller.models import Vehiculo, Mecanico, OrdenTrabajo
from bodega.models import SalidaRepuesto


def get_ordenes_report(fecha_desde=None, fecha_hasta=None, estado=None, vehiculo_id=None, mecanico_id=None):
    """
    Reporte analítico de órdenes de trabajo con cálculo de insumos/repuestos asociados.
    """
    qs = OrdenTrabajo.objects.select_related('vehiculo', 'mecanico').prefetch_related(
        'salidas_repuesto__repuesto'
    ).all()

    if fecha_desde:
        qs = qs.filter(fecha_creacion__date__gte=parse_date(fecha_desde))
    if fecha_hasta:
        qs = qs.filter(fecha_creacion__date__lte=parse_date(fecha_hasta))
    if estado:
        qs = qs.filter(estado__iexact=estado)
    if vehiculo_id:
        qs = qs.filter(vehiculo_id=vehiculo_id)
    if mecanico_id:
        qs = qs.filter(mecanico_id=mecanico_id)

    data = []
    total_costo_repuestos = 0.0

    for ot in qs:
        # Calcular total repuestos y monto
        salidas = ot.salidas_repuesto.all()
        cant_repuestos = sum(s.cantidad for s in salidas)
        costo_rep = sum(s.cantidad * float(s.repuesto.precio_unitario) for s in salidas)
        total_costo_repuestos += costo_rep

        placa = ot.vehiculo.placa if ot.vehiculo else 'N/A'
        unidad = ot.vehiculo.unidad if ot.vehiculo and ot.vehiculo.unidad else '-'
        mec_nombre = ot.mecanico.nombre if ot.mecanico else (ot.mecanico_asignado or 'Sin asignar')
        area = ot.mecanico.area if ot.mecanico else (ot.area_asignada or 'General')

        data.append({
            'id_orden': ot.id_orden,
            'numero_orden': ot.numero_orden,
            'fecha': ot.fecha_creacion,
            'vehiculo_placa': placa,
            'vehiculo_unidad': unidad,
            'mecanico': mec_nombre,
            'area': area,
            'estado': ot.estado,
            'repuestos_cantidad': cant_repuestos,
            'costo_repuestos_usd': round(costo_rep, 2),
            'descripcion': ot.descripcion or ''
        })

    summary = {
        'total_ordenes': len(data),
        'abiertas': sum(1 for d in data if d['estado'] in ['Abierta', 'Pendiente']),
        'en_proceso': sum(1 for d in data if d['estado'] == 'En Proceso'),
        'finalizadas': sum(1 for d in data if d['estado'] in ['Finalizada', 'Cerrada']),
        'costo_total_repuestos_usd': round(total_costo_repuestos, 2)
    }

    return {
        'summary': summary,
        'data': data
    }


def get_historial_vehiculo_report(vehiculo_id=None):
    """
    Historial consolidado de intervenciones de taller por vehículo.
    Optimizado con Prefetch de órdenes y repuestos para evitar queries N+1.
    """
    v_qs = Vehiculo.objects.prefetch_related(
        Prefetch(
            'ordentrabajo_set',
            queryset=OrdenTrabajo.objects.prefetch_related('salidas_repuesto__repuesto').order_by('-fecha_creacion'),
            to_attr='prefetched_ots'
        )
    ).order_by('placa')

    if vehiculo_id:
        v_qs = v_qs.filter(id_vehiculo=vehiculo_id)

    data = []
    total_inversion_flota = 0.0

    for v in v_qs:
        ots = getattr(v, 'prefetched_ots', [])
        total_ot = len(ots)
        ultima_ot = ots[0] if ots else None

        costo_v = 0.0
        repuestos_v = 0
        for ot in ots:
            for sal in ot.salidas_repuesto.all():
                repuestos_v += sal.cantidad
                costo_v += sal.cantidad * float(sal.repuesto.precio_unitario)

        total_inversion_flota += costo_v

        data.append({
            'id_vehiculo': v.id_vehiculo,
            'placa': v.placa,
            'unidad': v.unidad or '-',
            'modelo': v.modelo or '-',
            'estado_actual': v.estado,
            'total_ordenes': total_ot,
            'total_repuestos_usados': repuestos_v,
            'costo_total_mantenimientos_usd': round(costo_v, 2),
            'ultimo_mantenimiento': ultima_ot.fecha_creacion if ultima_ot else None
        })

    summary = {
        'total_vehiculos_analizados': len(data),
        'total_inversion_flota_usd': round(total_inversion_flota, 2)
    }

    return {
        'summary': summary,
        'data': data
    }


def get_productividad_mecanicos_report(fecha_desde=None, fecha_hasta=None):
    """
    Resumen de carga de trabajo y rendimiento por mecánico y especialidad.
    Optimizado con agregaciones SQL nativas (reduce de 4N consultas a 1 consulta).
    """
    filtro_ot = Q()
    if fecha_desde:
        filtro_ot &= Q(ordenes_trabajo__fecha_creacion__date__gte=parse_date(fecha_desde))
    if fecha_hasta:
        filtro_ot &= Q(ordenes_trabajo__fecha_creacion__date__lte=parse_date(fecha_hasta))

    mecanicos = Mecanico.objects.annotate(
        total=Count('ordenes_trabajo', filter=filtro_ot),
        abiertas=Count('ordenes_trabajo', filter=filtro_ot & Q(ordenes_trabajo__estado__in=['Abierta', 'Pendiente'])),
        en_proceso=Count('ordenes_trabajo', filter=filtro_ot & Q(ordenes_trabajo__estado='En Proceso')),
        finalizadas=Count('ordenes_trabajo', filter=filtro_ot & Q(ordenes_trabajo__estado__in=['Finalizada', 'Cerrada']))
    ).order_by('nombre')

    data = []
    for m in mecanicos:
        data.append({
            'id_mecanico': m.id_mecanico,
            'nombre': m.nombre,
            'area': m.area,
            'activo': 'Sí' if m.activo else 'No',
            'ordenes_abiertas': m.abiertas,
            'ordenes_en_proceso': m.en_proceso,
            'ordenes_finalizadas': m.finalizadas,
            'total_ordenes': m.total
        })

    summary = {
        'total_mecanicos': len(data),
        'total_ordenes_asignadas': sum(d['total_ordenes'] for d in data)
    }

    return {
        'summary': summary,
        'data': data
    }
