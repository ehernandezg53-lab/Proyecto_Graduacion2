from django.db.models import F, Sum, Count, DecimalField, ExpressionWrapper
from django.utils.dateparse import parse_date
from datetime import datetime, time
from bodega.models import Repuesto, OrdenIngreso, DetalleOrdenIngreso, SalidaRepuesto


def get_kardex_report(fecha_desde=None, fecha_hasta=None, repuesto_id=None):
    """
    Kardex consolidado de movimientos: Entradas (Órdenes de Ingreso recibidas) y Salidas de repuestos.
    """
    movimientos = []

    # 1. Ingresos
    ingresos_qs = DetalleOrdenIngreso.objects.select_related(
        'orden_ingreso', 'repuesto', 'orden_ingreso__ingresado_por'
    ).filter(orden_ingreso__estado__iexact='Ingresado')

    if repuesto_id:
        ingresos_qs = ingresos_qs.filter(repuesto_id=repuesto_id)

    if fecha_desde:
        ingresos_qs = ingresos_qs.filter(orden_ingreso__fecha_ingreso__date__gte=parse_date(fecha_desde))
    if fecha_hasta:
        ingresos_qs = ingresos_qs.filter(orden_ingreso__fecha_ingreso__date__lte=parse_date(fecha_hasta))

    for det in ingresos_qs:
        fec = det.orden_ingreso.fecha_ingreso or det.orden_ingreso.fecha_creacion
        usr = det.orden_ingreso.ingresado_por.username if det.orden_ingreso.ingresado_por else 'Sistema'
        movimientos.append({
            'fecha': fec,
            'tipo': 'INGRESO',
            'documento': f"OI #{det.orden_ingreso.numero_orden}",
            'repuesto_id': det.repuesto.id_repuesto,
            'repuesto_codigo': det.repuesto.codigo or f"REP-{det.repuesto.id_repuesto}",
            'repuesto_nombre': det.repuesto.nombre,
            'cantidad_entrada': det.cantidad,
            'cantidad_salida': 0,
            'precio_unitario': float(det.precio_unitario),
            'total_movimiento': float(det.cantidad * det.precio_unitario),
            'responsable': usr,
            'observaciones': det.orden_ingreso.proveedor or det.orden_ingreso.observaciones or '-'
        })

    # 2. Salidas
    salidas_qs = SalidaRepuesto.objects.select_related(
        'repuesto', 'orden_trabajo', 'registrado_por'
    ).all()

    if repuesto_id:
        salidas_qs = salidas_qs.filter(repuesto_id=repuesto_id)

    if fecha_desde:
        salidas_qs = salidas_qs.filter(fecha__date__gte=parse_date(fecha_desde))
    if fecha_hasta:
        salidas_qs = salidas_qs.filter(fecha__date__lte=parse_date(fecha_hasta))

    for sal in salidas_qs:
        usr = sal.registrado_por.username if sal.registrado_por else 'Taller'
        ot_num = sal.orden_trabajo.numero_orden if sal.orden_trabajo else '-'
        pu = float(sal.repuesto.precio_unitario)
        movimientos.append({
            'fecha': sal.fecha,
            'tipo': 'SALIDA',
            'documento': f"OT #{ot_num}",
            'repuesto_id': sal.repuesto.id_repuesto,
            'repuesto_codigo': sal.repuesto.codigo or f"REP-{sal.repuesto.id_repuesto}",
            'repuesto_nombre': sal.repuesto.nombre,
            'cantidad_entrada': 0,
            'cantidad_salida': sal.cantidad,
            'precio_unitario': pu,
            'total_movimiento': float(sal.cantidad * pu),
            'responsable': usr,
            'observaciones': sal.observacion or f"Asignado a OT #{ot_num}"
        })

    # Ordenar por fecha descendente
    movimientos.sort(key=lambda x: x['fecha'] if x['fecha'] else datetime.min, reverse=True)

    total_entradas = sum(m['cantidad_entrada'] for m in movimientos)
    total_salidas = sum(m['cantidad_salida'] for m in movimientos)
    monto_entradas = sum(m['total_movimiento'] for m in movimientos if m['tipo'] == 'INGRESO')
    monto_salidas = sum(m['total_movimiento'] for m in movimientos if m['tipo'] == 'SALIDA')

    summary = {
        'total_movimientos': len(movimientos),
        'total_unidades_ingresadas': total_entradas,
        'total_unidades_egresadas': total_salidas,
        'monto_ingresos_usd': round(monto_entradas, 2),
        'monto_salidas_usd': round(monto_salidas, 2),
    }

    return {
        'summary': summary,
        'data': movimientos
    }


def get_stock_critico_report():
    """
    Listado de repuestos en alerta: stock actual menor o igual a 2 unidades (alerta única de Stock Bajo).
    """
    qs = Repuesto.objects.filter(stock__lte=2).order_by('stock')

    data = []
    costo_reposicion_total = 0.0

    for rep in qs:
        min_threshold = rep.stock_minimo if rep.stock_minimo else 2
        deficit = max(0, min_threshold - rep.stock)
        pu = float(rep.precio_unitario)
        costo_reponer = deficit * pu
        costo_reposicion_total += costo_reponer

        data.append({
            'id_repuesto': rep.id_repuesto,
            'codigo': rep.codigo or f"REP-{rep.id_repuesto}",
            'nombre': rep.nombre,
            'stock_actual': rep.stock,
            'stock_minimo': min_threshold,
            'deficit': deficit,
            'nivel': 'Stock Bajo',
            'precio_unitario': pu,
            'costo_estimado_reponer': round(costo_reponer, 2)
        })

    summary = {
        'total_alertas': len(data),
        'costo_total_reposicion_usd': round(costo_reposicion_total, 2)
    }

    return {
        'summary': summary,
        'data': data
    }


def get_valorizacion_report():
    """
    Valorización total del inventario disponible en bodega.
    """
    repuestos = Repuesto.objects.all().order_by('nombre')
    data = []
    total_unidades = 0
    total_valor = 0.0

    for r in repuestos:
        pu = float(r.precio_unitario)
        subtotal = round(r.stock * pu, 2)
        total_unidades += r.stock
        total_valor += subtotal

        data.append({
            'id_repuesto': r.id_repuesto,
            'codigo': r.codigo or f"REP-{r.id_repuesto}",
            'nombre': r.nombre,
            'stock': r.stock,
            'stock_minimo': r.stock_minimo,
            'precio_unitario': pu,
            'valor_total': subtotal
        })

    summary = {
        'total_items_registrados': len(data),
        'total_unidades_almacen': total_unidades,
        'valor_total_inventario_usd': round(total_valor, 2)
    }

    return {
        'summary': summary,
        'data': data
    }
