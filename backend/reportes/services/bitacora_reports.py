from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from datetime import datetime
from bitacora.models import RegistroBitacora


def get_auditoria_report(fecha_desde=None, fecha_hasta=None, modulo=None, accion=None, usuario=None):
    """
    Reporte de trazabilidad y eventos de seguridad según estándares ISO/IEC 27001 (A.8.15 y A.8.33).
    """
    qs = RegistroBitacora.objects.select_related('usuario').all()

    if fecha_desde:
        qs = qs.filter(fecha_hora__date__gte=parse_date(fecha_desde))
    if fecha_hasta:
        qs = qs.filter(fecha_hora__date__lte=parse_date(fecha_hasta))
    if modulo:
        qs = qs.filter(modulo__iexact=modulo)
    if accion:
        qs = qs.filter(accion__iexact=accion)
    if usuario:
        qs = qs.filter(Q(usuario__username__icontains=usuario) | Q(username_historico__icontains=usuario))

    data = []
    logins_fallidos = 0
    modificaciones_criticas = 0

    for reg in qs[:500]:  # Limitar a los 500 más recientes para rendimiento
        usr = reg.username_historico or (reg.usuario.username if reg.usuario else 'Anónimo')
        if reg.accion == 'LOGIN_FALLIDO':
            logins_fallidos += 1
        elif reg.accion in ['MODIFICAR', 'ELIMINAR']:
            modificaciones_criticas += 1

        data.append({
            'id_bitacora': reg.id_bitacora,
            'fecha_hora': reg.fecha_hora,
            'usuario': usr,
            'accion': reg.get_accion_display(),
            'modulo': reg.modulo,
            'metodo': reg.metodo,
            'ruta': reg.ruta,
            'ip_origen': reg.ip_origen or 'Local',
            'codigo_respuesta': reg.codigo_respuesta or 200
        })

    total_eventos = qs.count()

    summary = {
        'total_eventos': total_eventos,
        'registros_mostrados': len(data),
        'logins_fallidos': logins_fallidos,
        'modificaciones_criticas': modificaciones_criticas
    }

    return {
        'summary': summary,
        'data': data
    }
