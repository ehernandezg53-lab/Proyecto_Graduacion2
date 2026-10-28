import json
import logging
from django.utils.deprecation import MiddlewareMixin
from .models import RegistroBitacora

logger = logging.getLogger('bitacora')

SENSITIVE_KEYS = {
    'password', 'contrasena', 'password_actual', 'password_nueva',
    'password_confirmar', 'pin_temporal', 'token', 'access', 'refresh', 'secret'
}

def enmascarar_datos(data):
    """
    Enmascara recursivamente cualquier dato confidencial (ISO/IEC 27001 / ISO/IEC 27701).
    """
    if isinstance(data, dict):
        return {
            k: ("********" if any(s in k.lower() for s in SENSITIVE_KEYS) else enmascarar_datos(v))
            for k, v in data.items()
        }
    elif isinstance(data, list):
        return [enmascarar_datos(elem) for elem in data]
    return data


class BitacoraMiddleware(MiddlewareMixin):
    """
    Middleware no intrusivo de bitácora y trazabilidad para el estándar ISO/IEC 27001 (A.8.15).
    Intercepta silenciosamente todas las transacciones de modificación e intentos de autenticación.
    """
    def __init__(self, get_response=None):
        super().__init__(get_response)
        self.get_response = get_response

    def __call__(self, request):
        # 1. Capturar payload antes de procesar la vista
        payload = None
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            try:
                if request.content_type and 'application/json' in request.content_type:
                    if request.body:
                        raw = json.loads(request.body.decode('utf-8'))
                        payload = enmascarar_datos(raw)
                elif request.POST:
                    payload = enmascarar_datos(dict(request.POST))
            except Exception:
                payload = None

        # 2. Ejecutar la vista de negocio normalmente
        response = self.get_response(request)

        # 3. Interceptar rutas auditables de la API
        path = request.path
        if path.startswith('/api/') and not path.endswith('/auth/me/') and not path.endswith('/auth/refresh/'):
            # Ignorar consultas GET de la propia bitácora
            if '/bitacora/' in path and request.method == 'GET':
                return response

            # Evaluar si es un evento registrable
            is_mutating = request.method in ['POST', 'PUT', 'PATCH', 'DELETE']
            is_login = '/auth/login/' in path

            if is_mutating or is_login:
                try:
                    self._registrar_evento(request, response, path, payload, is_login)
                except Exception as err:
                    # Garantiza que un error en bitácora nunca interrumpa la operación del usuario
                    logger.error(f"Error al registrar bitácora: {err}")

        return response

    def _registrar_evento(self, request, response, path, payload, is_login):
        # Resolver usuario autenticado
        user = getattr(request, 'user', None)
        is_auth = user and user.is_authenticated

        # Obtener IP cliente (compatible con proxies y balanceadores)
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        ip_origen = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')

        # Obtener User-Agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:250]

        # Clasificación del Módulo
        if '/taller/' in path:
            modulo = 'Taller'
        elif '/bodega/' in path:
            modulo = 'Bodega'
        elif '/logistica/' in path:
            modulo = 'Logística'
        elif any(k in path for k in ['/auth/', '/usuarios/', '/roles/', '/solicitudes_restablecimiento/']):
            modulo = 'Seguridad y Usuarios'
        else:
            modulo = 'General'

        # Determinar Acción y Username histórico
        if is_login:
            if 200 <= response.status_code < 300:
                accion = 'LOGIN_EXITOSO'
            else:
                accion = 'LOGIN_FALLIDO'
            username_historico = payload.get('username') if payload else (user.username if is_auth else 'Anónimo')
        elif 'restablecimiento' in path or 'cambiar_password' in path:
            accion = 'RESTABLECIMIENTO'
            username_historico = user.username if is_auth else (payload.get('username') if payload else 'Anónimo')
        else:
            mapa = {
                'POST': 'CREAR',
                'PUT': 'MODIFICAR',
                'PATCH': 'MODIFICAR',
                'DELETE': 'ELIMINAR'
            }
            accion = mapa.get(request.method, 'OTRO')
            username_historico = user.username if is_auth else 'Anónimo'

        # Guardar en base de datos
        RegistroBitacora.objects.create(
            usuario=user if is_auth else None,
            username_historico=username_historico,
            accion=accion,
            metodo=request.method,
            ruta=path,
            modulo=modulo,
            ip_origen=ip_origen,
            user_agent=user_agent,
            codigo_respuesta=response.status_code,
            datos_enviados=payload
        )

        # Log a nivel de archivo del sistema (ISO 27001 A.8.15)
        log_msg = f"[{accion}] {username_historico} ({modulo}) {request.method} {path} - Status: {response.status_code} - IP: {ip_origen}"
        if response.status_code >= 400:
            logger.warning(log_msg)
        else:
            logger.info(log_msg)
