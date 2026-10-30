import re
import random
import string
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.db.models import Q

from .models import Usuario, Rol, Permiso, RolPermiso, SolicitudRestablecimiento
from .serializers import (
    UsuarioSerializer,
    RolSerializer,
    CustomTokenObtainPairSerializer,
    SolicitudRestablecimientoSerializer
)

class LoginRateThrottle(AnonRateThrottle):
    """
    Control de tasa para mitigar ataques de fuerza bruta en login (OWASP A07 / ISO A.5.17).
    Restringe a un máximo de 5 intentos por minuto por dirección IP.
    """
    scope = 'login'
    rate = '5/minute'


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def logout_view(request):
    """
    Revoca formalmente el refresh_token de sesión colocándolo en la lista negra (Blacklist)
    en cumplimiento con el Control A.5.15 de ISO/IEC 27001 y OWASP A07:2025.
    """
    refresh_token = request.data.get('refresh_token')
    if not refresh_token:
        return Response(
            {"detail": "El refresh_token es requerido para revocar la sesión."},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(
            {"detail": "Sesión cerrada y token revocado en lista negra exitosamente."},
            status=status.HTTP_200_OK
        )
    except TokenError:
        return Response(
            {"detail": "El token ya ha sido revocado o no es válido."},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"detail": f"Error al procesar la revocación: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_view(request):
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def solicitar_restablecimiento_view(request):
    """
    Permite a un usuario solicitar el restablecimiento de su contraseña desde la pantalla de login.
    Genera un ticket de solicitud correlativo (TKT-XXXXX) para ser presentado al administrador.
    """
    username = request.data.get('username', '').strip()
    motivo = request.data.get('motivo', '').strip()

    if not username:
        return Response(
            {"detail": "Debe ingresar su nombre de usuario para solicitar el restablecimiento."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = Usuario.objects.get(username__iexact=username)
    except Usuario.DoesNotExist:
        return Response(
            {"detail": "No se encontró ningún usuario registrado con ese nombre de usuario."},
            status=status.HTTP_404_NOT_FOUND
        )

    if not user.activo:
        return Response(
            {"detail": "Esta cuenta se encuentra deshabilitada en el sistema. Contacte directamente a la administración."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Verificar si ya tiene una solicitud pendiente reciente
    solicitud_existente = SolicitudRestablecimiento.objects.filter(
        usuario=user,
        estado='Pendiente'
    ).first()

    if solicitud_existente:
        return Response({
            "message": f"Ya tienes una solicitud pendiente activa con el ticket {solicitud_existente.numero_ticket}.",
            "ticket": solicitud_existente.numero_ticket,
            "usuario": f"{user.nombre} {user.apellido}",
            "fecha_solicitud": solicitud_existente.fecha_solicitud
        }, status=status.HTTP_200_OK)

    # Generar correlativo de ticket: TKT-10001, etc.
    tickets = SolicitudRestablecimiento.objects.exclude(numero_ticket__isnull=True).exclude(numero_ticket='').values_list('numero_ticket', flat=True)
    correlativos = []
    for s in tickets:
        if s.startswith('TKT-'):
            clean = s.replace('TKT-', '').strip()
            if clean.isdigit():
                correlativos.append(int(clean))
    next_num = max(correlativos) + 1 if correlativos else 10001
    ticket = f"TKT-{next_num}"

    solicitud = SolicitudRestablecimiento.objects.create(
        numero_ticket=ticket,
        usuario=user,
        motivo=motivo or "Solicitud de restablecimiento por olvido o bloqueo de contraseña",
        estado='Pendiente'
    )

    return Response({
        "message": "Solicitud de restablecimiento registrada exitosamente.",
        "ticket": ticket,
        "usuario": f"{user.nombre} {user.apellido}",
        "fecha_solicitud": solicitud.fecha_solicitud
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cambiar_password_obligatorio_view(request):
    """
    Exigido en el primer ingreso cuando el usuario entra con un PIN / pase temporal.
    Valida la clave temporal actual, verifica los requisitos de seguridad y actualiza la contraseña.
    """
    password_actual = request.data.get('password_actual', '').strip()
    password_nueva = request.data.get('password_nueva', '').strip()
    password_confirmar = request.data.get('password_confirmar', '').strip()
    user = request.user

    # Validar contraseña temporal actual
    if not password_actual:
        return Response(
            {"detail": "Debe ingresar su contraseña temporal actual."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not user.check_password(password_actual):
        return Response(
            {"detail": "La contraseña temporal actual no es correcta."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not password_nueva or not password_confirmar:
        return Response(
            {"detail": "Debe ingresar y confirmar su nueva contraseña personal."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Requisito: Las contraseñas coinciden
    if password_nueva != password_confirmar:
        return Response(
            {"detail": "Las contraseñas ingresadas no coinciden."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Requisito: Mínimo 8 caracteres
    if len(password_nueva) < 8:
        return Response(
            {"detail": "La nueva contraseña debe tener como mínimo 8 caracteres."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Requisito: Mayúsculas y minúsculas
    if not re.search(r'[A-Z]', password_nueva) or not re.search(r'[a-z]', password_nueva):
        return Response(
            {"detail": "La nueva contraseña debe contener tanto letras mayúsculas como minúsculas."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Requisito: Al menos un número
    if not re.search(r'\d', password_nueva):
        return Response(
            {"detail": "La nueva contraseña debe contener al menos un número."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Requisito: No ser solo números
    if password_nueva.isdigit():
        return Response(
            {"detail": "La nueva contraseña no puede estar compuesta solo de números."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Requisito: Sin coincidencia con tu nombre / usuario
    nombre = (user.nombre or '').strip().lower()
    apellido = (user.apellido or '').strip().lower()
    username = (user.username or '').strip().lower()
    pwd_lower = password_nueva.lower()

    if (len(nombre) >= 3 and nombre in pwd_lower) or \
       (len(apellido) >= 3 and apellido in pwd_lower) or \
       (len(username) >= 3 and username in pwd_lower):
        return Response(
            {"detail": "Por seguridad, la contraseña no debe contener tu nombre, apellido ni usuario."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # No permitir que la nueva sea igual a la actual
    if user.check_password(password_nueva):
        return Response(
            {"detail": "La nueva contraseña no puede ser idéntica a la contraseña temporal actual."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(password_nueva)
    user.cambio_temporal = False
    user.save()

    # Marcar solicitudes aprobadas pendientes de este usuario como Completadas
    SolicitudRestablecimiento.objects.filter(
        usuario=user,
        estado='Aprobado'
    ).update(
        estado='Completado',
        fecha_completado=timezone.now()
    )

    return Response({
        "message": "Contraseña actualizada exitosamente. Ya puedes utilizar el sistema con normalidad."
    }, status=status.HTTP_200_OK)


class RolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Rol.objects.all().order_by('id')
    serializer_class = RolSerializer
    permission_classes = [permissions.IsAuthenticated]


class UsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Usuario.objects.all().select_related('rol', 'creado_por').order_by('-id')
        incluir_inactivos = self.request.query_params.get('incluir_inactivos', 'true')
        
        # Admin can view all or filter, non-admins see active users
        if incluir_inactivos.lower() != 'true':
            queryset = queryset.filter(activo=True)
            
        rol_filter = self.request.query_params.get('rol')
        if rol_filter:
            queryset = queryset.filter(rol__nombre__iexact=rol_filter)
            
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) |
                Q(apellido__icontains=search) |
                Q(username__icontains=search)
            )
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete: deshabilita al usuario sin borrarlo físicamente
        """
        instance = self.get_object()
        if instance == request.user:
            return Response(
                {"detail": "No puedes deshabilitar tu propio usuario activamente."},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.soft_delete()
        return Response(
            {"message": f"Usuario {instance.username} deshabilitado correctamente (soft-delete).", "activo": False},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def toggle_activo(self, request, pk=None):
        """
        Alterna el estado activo/deshabilitado de un usuario
        """
        instance = self.get_object()
        if instance == request.user and instance.activo:
            return Response(
                {"detail": "No puedes deshabilitar tu propia cuenta."},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.activo = not instance.activo
        instance.save()
        estado_txt = "activado" if instance.activo else "deshabilitado"
        return Response({
            "message": f"Usuario {instance.username} {estado_txt} correctamente.",
            "activo": instance.activo
        })


class SolicitudRestablecimientoViewSet(viewsets.ModelViewSet):
    """
    Apartado para que el Administrador gestione las solicitudes de restablecimiento de contraseña.
    """
    serializer_class = SolicitudRestablecimientoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = SolicitudRestablecimiento.objects.all().select_related(
            'usuario', 'usuario__rol', 'autorizado_por'
        ).order_by('-fecha_solicitud')

        estado = self.request.query_params.get('estado')
        if estado and estado != 'Todos':
            queryset = queryset.filter(estado=estado)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(numero_ticket__icontains=search) |
                Q(usuario__username__icontains=search) |
                Q(usuario__nombre__icontains=search) |
                Q(usuario__apellido__icontains=search)
            )

        return queryset

    @action(detail=True, methods=['post'])
    def autorizar(self, request, pk=None):
        """
        El administrador genera un PIN o clave temporal para que el usuario establezca su nueva clave.
        El usuario deberá cambiarla obligatoriamente en el primer ingreso.
        """
        solicitud = self.get_object()

        if solicitud.estado == 'Completado':
            return Response(
                {"detail": "Esta solicitud ya fue completada por el usuario anteriormente."},
                status=status.HTTP_400_BAD_REQUEST
            )

        pin_temporal = request.data.get('pin_temporal', '').strip()
        if not pin_temporal:
            # Generar un PIN temporal únicamente numérico de 6 dígitos
            pin_temporal = ''.join(random.choices(string.digits, k=6))

        usuario = solicitud.usuario
        usuario.set_password(pin_temporal)
        usuario.cambio_temporal = True
        usuario.save(update_fields=['password', 'cambio_temporal'])

        solicitud.pin_temporal = pin_temporal
        solicitud.estado = 'Aprobado'
        solicitud.autorizado_por = request.user
        solicitud.fecha_autorizacion = timezone.now()
        solicitud.save(update_fields=['pin_temporal', 'estado', 'autorizado_por', 'fecha_autorizacion'])

        return Response({
            "message": f"Clave temporal generada exitosamente para {usuario.nombre} {usuario.apellido}.",
            "pin_temporal": pin_temporal,
            "ticket": solicitud.numero_ticket,
            "solicitud": SolicitudRestablecimientoSerializer(solicitud).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """
        Rechaza la solicitud de restablecimiento.
        """
        solicitud = self.get_object()
        solicitud.estado = 'Rechazado'
        solicitud.autorizado_por = request.user
        solicitud.fecha_autorizacion = timezone.now()
        solicitud.save(update_fields=['estado', 'autorizado_por', 'fecha_autorizacion'])

        return Response({
            "message": f"La solicitud {solicitud.numero_ticket} ha sido rechazada.",
            "solicitud": SolicitudRestablecimientoSerializer(solicitud).data
        }, status=status.HTTP_200_OK)

