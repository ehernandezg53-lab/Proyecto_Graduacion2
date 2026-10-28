from django.db import models
from django.conf import settings

class RegistroBitacora(models.Model):
    """
    Bitácora Inmutable según estándares ISO/IEC 27001:2022 (Control A.8.15 y A.8.33)
    e ISO/IEC 25010 (No repudio y Trazabilidad).
    """
    ACCIONES_CHOICES = [
        ('LOGIN_EXITOSO', 'Inicio de Sesión Exitoso'),
        ('LOGIN_FALLIDO', 'Intento de Inicio Fallido'),
        ('CREAR', 'Creación de Registro'),
        ('MODIFICAR', 'Modificación de Registro'),
        ('ELIMINAR', 'Eliminación de Registro'),
        ('RESTABLECIMIENTO', 'Solicitud o Cambio de Clave'),
        ('OTRO', 'Otra Operación'),
    ]

    MODULOS_CHOICES = [
        ('Taller', 'Taller'),
        ('Bodega', 'Bodega'),
        ('Logística', 'Logística'),
        ('Seguridad y Usuarios', 'Seguridad y Usuarios'),
        ('General', 'General'),
    ]

    id_bitacora = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs_bitacora'
    )
    username_historico = models.CharField(max_length=150, blank=True, null=True, help_text="Nombre de usuario al momento de la acción")
    accion = models.CharField(max_length=50, choices=ACCIONES_CHOICES, db_index=True)
    metodo = models.CharField(max_length=10, help_text="Método HTTP: POST, PUT, PATCH, DELETE")
    ruta = models.CharField(max_length=255, help_text="Endpoint accedido")
    modulo = models.CharField(max_length=50, choices=MODULOS_CHOICES, default='General', db_index=True)
    ip_origen = models.GenericIPAddressField(null=True, blank=True, help_text="IP del cliente")
    user_agent = models.CharField(max_length=255, blank=True, null=True, help_text="Navegador o cliente")
    codigo_respuesta = models.IntegerField(null=True, blank=True, help_text="Código de estado HTTP")
    datos_enviados = models.JSONField(null=True, blank=True, help_text="Payload filtrado sin datos confidenciales")
    fecha_hora = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'registro_bitacora'
        ordering = ['-fecha_hora']
        verbose_name = 'Registro de Bitácora'
        verbose_name_plural = 'Registros de Bitácora'

    def __str__(self):
        usr = self.username_historico or (self.usuario.username if self.usuario else "Anónimo")
        return f"[{self.fecha_hora}] {usr} - {self.accion} ({self.modulo})"
