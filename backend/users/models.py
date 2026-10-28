from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class Permiso(models.Model):
    nombre_permiso = models.CharField(max_length=100)
    modulo = models.CharField(max_length=100)

    class Meta:
        db_table = 'permiso'
        unique_together = ('nombre_permiso', 'modulo')

    def __str__(self):
        return f"{self.nombre_permiso} ({self.modulo})"


class Rol(models.Model):
    ADMINISTRADOR = 'Administrador'
    BODEGUERO = 'Bodeguero'
    TALLER = 'Taller'
    LOGISTICA = 'Logística'

    ROLES_CHOICES = [
        (ADMINISTRADOR, 'Administrador'),
        (BODEGUERO, 'Bodeguero'),
        (TALLER, 'Taller'),
        (LOGISTICA, 'Logística'),
    ]

    nombre = models.CharField(max_length=50, choices=ROLES_CHOICES, unique=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    permisos = models.ManyToManyField(Permiso, through='RolPermiso', related_name='roles')

    class Meta:
        db_table = 'rol'

    def __str__(self):
        return self.nombre


class RolPermiso(models.Model):
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='id_rol')
    permiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, db_column='id_permiso')

    class Meta:
        db_table = 'rol_permiso'
        unique_together = ('rol', 'permiso')

    def __str__(self):
        return f"{self.rol.nombre} - {self.permiso.nombre_permiso}"


class UsuarioManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('El nombre de usuario es obligatorio')
        user = self.model(username=username, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('activo', True)

        admin_rol, _ = Rol.objects.get_or_create(
            nombre=Rol.ADMINISTRADOR,
            defaults={'descripcion': 'Acceso total al sistema'}
        )
        extra_fields.setdefault('rol', admin_rol)

        return self.create_user(username, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, related_name='usuarios', null=True, blank=True, db_column='id_rol')
    
    # Soft delete field
    activo = models.BooleanField(default=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    creado_por = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios_creados')

    is_staff = models.BooleanField(default=False)
    cambio_temporal = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['nombre', 'apellido']

    class Meta:
        db_table = 'usuario'

    def __str__(self):
        return f"{self.nombre} {self.apellido} ({self.username})"

    def soft_delete(self):
        self.activo = False
        self.save()


class SolicitudRestablecimiento(models.Model):
    ESTADO_CHOICES = [
        ('Pendiente', 'Pendiente'),
        ('Aprobado', 'Aprobado'),
        ('Completado', 'Completado'),
        ('Rechazado', 'Rechazado'),
    ]

    id_solicitud = models.AutoField(primary_key=True)
    numero_ticket = models.CharField(max_length=50, unique=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='solicitudes_restablecimiento',
        db_column='id_usuario'
    )
    motivo = models.TextField(blank=True, null=True, default='Solicitud de restablecimiento de contraseña')
    pin_temporal = models.CharField(max_length=50, blank=True, null=True)
    estado = models.CharField(max_length=50, choices=ESTADO_CHOICES, default='Pendiente')
    autorizado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes_autorizadas',
        db_column='id_autorizado_por'
    )
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_autorizacion = models.DateTimeField(null=True, blank=True)
    fecha_completado = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'solicitud_restablecimiento'
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"Ticket {self.numero_ticket} - {self.usuario.username} ({self.estado})"

