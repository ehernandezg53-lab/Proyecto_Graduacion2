from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Sum, Count, F, Q
from datetime import date, timedelta

from bodega.models import Repuesto, SalidaRepuesto
from taller.models import OrdenTrabajo
from logistica.models import Viaje, Conductor
from bitacora.models import RegistroBitacora
from .services.exporters import create_export_response
from .services import bodega_reports, taller_reports, logistica_reports, bitacora_reports


def check_module_permission(user, module_name):
    """
    Verifica si el usuario tiene permiso para consultar datos del módulo indicado.
    Administrador siempre tiene acceso total.
    """
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'rol', None) and user.rol.nombre == 'Administrador':
        return True

    permisos_nombres = [p.nombre_permiso for p in user.rol.permisos.all()] if getattr(user, 'rol', None) else []
    
    if module_name == 'bodega':
        return user.rol.nombre == 'Bodeguero' or 'ver_bodega' in permisos_nombres
    elif module_name == 'taller':
        return user.rol.nombre == 'Taller' or 'ver_taller' in permisos_nombres
    elif module_name == 'logistica':
        return user.rol.nombre == 'Logística' or 'ver_logistica' in permisos_nombres
    elif module_name == 'bitacora' or module_name == 'usuarios':
        return 'ver_usuarios' in permisos_nombres
    return False


class DashboardKpiView(APIView):
    """
    KPIs globales para la vista principal del Centro de Reportes.
    Filtra los indicadores según las áreas a las que el usuario tenga permiso.
    Optimizado con agregaciones SQL nativas para evitar sobrecarga en memoria.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        kpis = {}

        # 1. Bodega
        if check_module_permission(user, 'bodega'):
            stats = Repuesto.objects.aggregate(
                total_items=Count('id_repuesto'),
                valor_total=Sum(F('stock') * F('precio_unitario')),
                alertas_criticas=Count('id_repuesto', filter=Q(stock__lte=2))
            )
            kpis['bodega'] = {
                'valor_inventario_usd': round(float(stats['valor_total'] or 0.0), 2),
                'total_items': stats['total_items'] or 0,
                'alertas_stock_critico': stats['alertas_criticas'] or 0,
                'repuestos_agotados': 0
            }

        # 2. Taller
        if check_module_permission(user, 'taller'):
            ot_stats = OrdenTrabajo.objects.aggregate(
                total_ordenes=Count('id_orden'),
                abiertas=Count('id_orden', filter=Q(estado__in=['Abierta', 'Pendiente'])),
                en_proceso=Count('id_orden', filter=Q(estado='En Proceso'))
            )
            costo_rep = SalidaRepuesto.objects.aggregate(
                total_costo=Sum(F('cantidad') * F('repuesto__precio_unitario'))
            )['total_costo'] or 0.0
            kpis['taller'] = {
                'total_ordenes': ot_stats['total_ordenes'] or 0,
                'ordenes_abiertas': ot_stats['abiertas'] or 0,
                'ordenes_en_proceso': ot_stats['en_proceso'] or 0,
                'costo_repuestos_usd': round(float(costo_rep), 2)
            }

        # 3. Logística
        if check_module_permission(user, 'logistica'):
            v_stats = Viaje.objects.aggregate(
                total_viajes=Count('id_viaje'),
                viajes_abiertos=Count('id_viaje', filter=Q(estado='Abierta')),
                total_peso=Sum('peso_carga_kg')
            )
            total_peso = float(v_stats['total_peso'] or 0.0)
            limite_alerta = date.today() + timedelta(days=30)
            lic_vencen = Conductor.objects.filter(
                fecha_vencimiento_licencia__isnull=False,
                fecha_vencimiento_licencia__lte=limite_alerta
            ).count()
            kpis['logistica'] = {
                'total_viajes': v_stats['total_viajes'] or 0,
                'viajes_abiertos': v_stats['viajes_abiertos'] or 0,
                'total_toneladas': round(total_peso / 1000.0, 2),
                'licencias_por_vencer': lic_vencen
            }

        # 4. Auditoría
        if check_module_permission(user, 'bitacora'):
            bit_stats = RegistroBitacora.objects.aggregate(
                total_eventos=Count('id_bitacora'),
                logins_fallidos=Count('id_bitacora', filter=Q(accion='LOGIN_FALLIDO')),
                modificaciones_criticas=Count('id_bitacora', filter=Q(accion__in=['MODIFICAR', 'ELIMINAR']))
            )
            kpis['bitacora'] = {
                'total_eventos': bit_stats['total_eventos'] or 0,
                'logins_fallidos': bit_stats['logins_fallidos'] or 0,
                'modificaciones_criticas': bit_stats['modificaciones_criticas'] or 0
            }

        return Response(kpis)


# =========================================================================
# VISTAS DE REPORTES DE BODEGA
# =========================================================================

class KardexReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not check_module_permission(request.user, 'bodega'):
            return Response({'error': 'No tienes permisos para ver reportes de Bodega.'}, status=status.HTTP_403_FORBIDDEN)

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        repuesto_id = request.query_params.get('repuesto_id')
        export_fmt = request.query_params.get('export')

        result = bodega_reports.get_kardex_report(fecha_desde, fecha_hasta, repuesto_id)

        if export_fmt in ['excel', 'csv']:
            headers = ['Fecha', 'Tipo', 'Documento', 'Código', 'Repuesto', 'Cant. Entrada', 'Cant. Salida', 'Precio Unit (Q)', 'Total (Q)', 'Responsable', 'Observaciones']
            rows = [
                [
                    m['fecha'].strftime('%Y-%m-%d %H:%M') if m['fecha'] else '-',
                    m['tipo'],
                    m['documento'],
                    m['repuesto_codigo'],
                    m['repuesto_nombre'],
                    m['cantidad_entrada'],
                    m['cantidad_salida'],
                    m['precio_unitario'],
                    m['total_movimiento'],
                    m['responsable'],
                    m['observaciones']
                ] for m in result['data']
            ]
            meta = {'Desde': fecha_desde or 'Inicio', 'Hasta': fecha_hasta or 'Hoy', 'Generado por': request.user.username}
            return create_export_response(export_fmt, 'Kardex_Repuestos', 'Kardex de Movimientos de Repuestos', headers, rows, result['summary'], meta)

        return Response(result)


class StockCriticoReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not check_module_permission(request.user, 'bodega'):
            return Response({'error': 'No tienes permisos para ver reportes de Bodega.'}, status=status.HTTP_403_FORBIDDEN)

        export_fmt = request.query_params.get('export')
        result = bodega_reports.get_stock_critico_report()

        if export_fmt in ['excel', 'csv']:
            headers = ['Código', 'Repuesto', 'Stock Actual', 'Déficit a Reponer', 'Nivel de Alerta', 'Precio Unit (Q)', 'Costo Reposición Est. (Q)']
            rows = [
                [
                    r['codigo'],
                    r['nombre'],
                    r['stock_actual'],
                    r['deficit'],
                    r['nivel'],
                    r['precio_unitario'],
                    r['costo_estimado_reponer']
                ] for r in result['data']
            ]
            meta = {'Generado por': request.user.username}
            return create_export_response(export_fmt, 'Stock_Bajo_Bodega', 'Reporte de Alertas de Stock Bajo (≤ 2 unds)', headers, rows, result['summary'], meta)

        return Response(result)


class ValorizacionReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not check_module_permission(request.user, 'bodega'):
            return Response({'error': 'No tienes permisos para ver reportes de Bodega.'}, status=status.HTTP_403_FORBIDDEN)

        export_fmt = request.query_params.get('export')
        result = bodega_reports.get_valorizacion_report()

        if export_fmt in ['excel', 'csv']:
            headers = ['Código', 'Repuesto', 'Stock Disponible', 'Precio Unit (Q)', 'Valorización Total (Q)']
            rows = [
                [
                    r['codigo'],
                    r['nombre'],
                    r['stock'],
                    r['precio_unitario'],
                    r['valor_total']
                ] for r in result['data']
            ]
            meta = {'Generado por': request.user.username}
            return create_export_response(export_fmt, 'Valorizacion_Inventario', 'Valorización Total de Inventario en Bodega', headers, rows, result['summary'], meta)

        return Response(result)


# =========================================================================
# VISTAS DE REPORTES DE TALLER
# =========================================================================

class TallerOrdenesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not check_module_permission(request.user, 'taller'):
            return Response({'error': 'No tienes permisos para ver reportes de Taller.'}, status=status.HTTP_403_FORBIDDEN)

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        estado = request.query_params.get('estado')
        vehiculo_id = request.query_params.get('vehiculo_id')
        mecanico_id = request.query_params.get('mecanico_id')
        export_fmt = request.query_params.get('export')

        result = taller_reports.get_ordenes_report(fecha_desde, fecha_hasta, estado, vehiculo_id, mecanico_id)

        if export_fmt in ['excel', 'csv']:
            headers = ['N° Orden', 'Fecha Creación', 'Placa', 'Unidad', 'Mecánico', 'Área', 'Estado', 'Cant. Repuestos', 'Costo Repuestos (Q)', 'Descripción']
            rows = [
                [
                    o['numero_orden'],
                    o['fecha'].strftime('%Y-%m-%d %H:%M') if o['fecha'] else '-',
                    o['vehiculo_placa'],
                    o['vehiculo_unidad'],
                    o['mecanico'],
                    o['area'],
                    o['estado'],
                    o['repuestos_cantidad'],
                    o['costo_repuestos_usd'],
                    o['descripcion']
                ] for o in result['data']
            ]
            meta = {'Desde': fecha_desde or 'Inicio', 'Hasta': fecha_hasta or 'Hoy', 'Estado': estado or 'Todos', 'Generado por': request.user.username}
            return create_export_response(export_fmt, 'Ordenes_Taller', 'Reporte de Órdenes de Trabajo de Taller', headers, rows, result['summary'], meta)

        return Response(result)


class HistorialVehiculoReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not check_module_permission(request.user, 'taller'):
            return Response({'error': 'No tienes permisos para ver reportes de Taller.'}, status=status.HTTP_403_FORBIDDEN)

        vehiculo_id = request.query_params.get('vehiculo_id')
        export_fmt = request.query_params.get('export')

        result = taller_reports.get_historial_vehiculo_report(vehiculo_id)

        if export_fmt in ['excel', 'csv']:
            headers = ['Placa', 'Unidad', 'Modelo', 'Estado', 'Total Órdenes', 'Repuestos Usados', 'Inversión Total (Q)', 'Último Mantenimiento']
            rows = [
                [
                    v['placa'],
                    v['unidad'],
                    v['modelo'],
                    v['estado_actual'],
                    v['total_ordenes'],
                    v['total_repuestos_usados'],
                    v['costo_total_mantenimientos_usd'],
                    v['ultimo_mantenimiento'].strftime('%Y-%m-%d %H:%M') if v['ultimo_mantenimiento'] else 'Sin intervenciones'
                ] for v in result['data']
            ]
            meta = {'Generado por': request.user.username}
            return create_export_response(export_fmt, 'Historial_Vehiculos', 'Historial de Mantenimientos por Vehículo', headers, rows, result['summary'], meta)

        return Response(result)


class ProductividadMecanicosReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not check_module_permission(request.user, 'taller'):
            return Response({'error': 'No tienes permisos para ver reportes de Taller.'}, status=status.HTTP_403_FORBIDDEN)

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        export_fmt = request.query_params.get('export')

        result = taller_reports.get_productividad_mecanicos_report(fecha_desde, fecha_hasta)

        if export_fmt in ['excel', 'csv']:
            headers = ['Mecánico', 'Especialidad / Área', 'Activo', 'Órdenes Abiertas', 'En Proceso', 'Finalizadas', 'Total Órdenes']
            rows = [
                [
                    m['nombre'],
                    m['area'],
                    m['activo'],
                    m['ordenes_abiertas'],
                    m['ordenes_en_proceso'],
                    m['ordenes_finalizadas'],
                    m['total_ordenes']
                ] for m in result['data']
            ]
            meta = {'Generado por': request.user.username}
            return create_export_response(export_fmt, 'Productividad_Mecanicos', 'Productividad por Mecánico y Especialidad', headers, rows, result['summary'], meta)

        return Response(result)


# =========================================================================
# VISTAS DE REPORTES DE LOGÍSTICA
# =========================================================================

class LogisticaViajesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not check_module_permission(request.user, 'logistica'):
            return Response({'error': 'No tienes permisos para ver reportes de Logística.'}, status=status.HTTP_403_FORBIDDEN)

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        estado = request.query_params.get('estado')
        cliente_id = request.query_params.get('cliente_id')
        conductor_id = request.query_params.get('conductor_id')
        vehiculo_id = request.query_params.get('vehiculo_id')
        export_fmt = request.query_params.get('export')

        result = logistica_reports.get_viajes_report(fecha_desde, fecha_hasta, estado, cliente_id, conductor_id, vehiculo_id)

        if export_fmt in ['excel', 'csv']:
            headers = ['N° Viaje', 'Fecha Envío', 'Hora', 'Cliente', 'Conductor', 'Vehículo', 'Peso Carga (kg)', 'Toneladas', 'Cant. Rollos', 'Estado']
            rows = [
                [
                    v['numero_viaje'],
                    v['fecha_envio'].strftime('%Y-%m-%d') if v['fecha_envio'] else '-',
                    v['hora_envio'],
                    v['cliente'],
                    v['conductor'],
                    v['vehiculo'],
                    v['peso_kg'],
                    v['toneladas'],
                    v['cantidad_rollos'],
                    v['estado']
                ] for v in result['data']
            ]
            meta = {'Desde': fecha_desde or 'Inicio', 'Hasta': fecha_hasta or 'Hoy', 'Generado por': request.user.username}
            return create_export_response(export_fmt, 'Viajes_Despachos', 'Reporte de Viajes y Despachos de Carga', headers, rows, result['summary'], meta)

        return Response(result)


class RollosReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not check_module_permission(request.user, 'logistica'):
            return Response({'error': 'No tienes permisos para ver reportes de Logística.'}, status=status.HTTP_403_FORBIDDEN)

        estado = request.query_params.get('estado')
        tipo_alambre = request.query_params.get('tipo_alambre')
        export_fmt = request.query_params.get('export')

        result = logistica_reports.get_trazabilidad_rollos_report(estado, tipo_alambre)

        if export_fmt in ['excel', 'csv']:
            headers = ['Código Rollo', 'Tipo Alambre', 'Peso (kg)', 'Ubicación', 'Estado', 'N° Viaje Asignado']
            rows = [
                [
                    r['codigo_rollo'],
                    r['tipo_alambre'],
                    r['peso_kg'],
                    r['ubicacion'],
                    r['estado'],
                    r['viaje_asignado']
                ] for r in result['data']
            ]
            meta = {'Generado por': request.user.username}
            return create_export_response(export_fmt, 'Trazabilidad_Rollos', 'Trazabilidad y Control de Rollos de Alambre', headers, rows, result['summary'], meta)

        return Response(result)


class LicenciasConductoresReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not check_module_permission(request.user, 'logistica'):
            return Response({'error': 'No tienes permisos para ver reportes de Logística.'}, status=status.HTTP_403_FORBIDDEN)

        export_fmt = request.query_params.get('export')
        result = logistica_reports.get_licencias_conductores_report()

        if export_fmt in ['excel', 'csv']:
            headers = ['Código Carnet', 'Conductor / Piloto', 'Fecha Vencimiento', 'Días Restantes', 'Estado Semáforo', 'Activo']
            rows = [
                [
                    c['codigo_carnet'],
                    c['nombre'],
                    c['fecha_vencimiento'].strftime('%Y-%m-%d') if c['fecha_vencimiento'] else 'Sin Registro',
                    c['dias_restantes'] if c['dias_restantes'] is not None else '-',
                    c['semaforo'],
                    c['activo']
                ] for c in result['data']
            ]
            meta = {'Generado por': request.user.username}
            return create_export_response(export_fmt, 'Licencias_Conductores', 'Control de Vencimiento de Licencias de Conducir', headers, rows, result['summary'], meta)

        return Response(result)


# =========================================================================
# VISTAS DE REPORTES DE AUDITORÍA / SEGURIDAD
# =========================================================================

class BitacoraReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not check_module_permission(request.user, 'bitacora'):
            return Response({'error': 'No tienes permisos para ver reportes de Auditoría.'}, status=status.HTTP_403_FORBIDDEN)

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        modulo = request.query_params.get('modulo')
        accion = request.query_params.get('accion')
        usuario = request.query_params.get('usuario')
        export_fmt = request.query_params.get('export')

        result = bitacora_reports.get_auditoria_report(fecha_desde, fecha_hasta, modulo, accion, usuario)

        if export_fmt in ['excel', 'csv']:
            headers = ['ID Evento', 'Fecha y Hora', 'Usuario', 'Acción Realizada', 'Módulo', 'Método HTTP', 'Ruta', 'IP Origen', 'Código HTTP']
            rows = [
                [
                    b['id_bitacora'],
                    b['fecha_hora'].strftime('%Y-%m-%d %H:%M:%S') if b['fecha_hora'] else '-',
                    b['usuario'],
                    b['accion'],
                    b['modulo'],
                    b['metodo'],
                    b['ruta'],
                    b['ip_origen'],
                    b['codigo_respuesta']
                ] for b in result['data']
            ]
            meta = {'Desde': fecha_desde or 'Inicio', 'Hasta': fecha_hasta or 'Hoy', 'Generado por': request.user.username}
            return create_export_response(export_fmt, 'Auditoria_Seguridad_ISO27001', 'Informe de Auditoría y Trazabilidad ISO 27001', headers, rows, result['summary'], meta)

        return Response(result)
