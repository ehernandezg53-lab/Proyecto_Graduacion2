from django.db import models
from django.conf import settings
# Importar entidades de Taller para mantener relaciones entre módulos
from taller.models import Vehiculo, Mecanico, OrdenTrabajo

class Repuesto(models.Model):
    id_repuesto = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    stock = models.IntegerField(default=0, db_index=True)
    stock_minimo = models.IntegerField(default=2)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'repuesto'
        ordering = ['-id_repuesto']

    def __str__(self):
        return f"{self.nombre} (Stock: {self.stock})"


class OrdenIngreso(models.Model):
    id_orden_ingreso = models.AutoField(primary_key=True)
    numero_orden = models.CharField(max_length=50, unique=True)  # Número correlativo (ej: 61635500)
    proveedor = models.CharField(max_length=150)
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=50, default='Pendiente', db_index=True)  # Pendiente, Ingresado
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordenes_ingreso_creadas'
    )
    ingresado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordenes_ingresadas_bodega'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_ingreso = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'orden_ingreso'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Orden Ingreso Correlativa #{self.numero_orden} - {self.proveedor} ({self.estado})"


class DetalleOrdenIngreso(models.Model):
    id_detalle = models.AutoField(primary_key=True)
    orden_ingreso = models.ForeignKey(OrdenIngreso, related_name='detalles', on_delete=models.CASCADE)
    repuesto = models.ForeignKey(Repuesto, on_delete=models.CASCADE, db_column='id_repuesto')
    descripcion_repuesto = models.TextField()  # Descripción detallada del repuesto
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'detalle_orden_ingreso'

    def __str__(self):
        return f"Detalle #{self.id_detalle} - {self.repuesto.nombre} (Cant: {self.cantidad})"


class SalidaRepuesto(models.Model):
    id_salida = models.AutoField(primary_key=True)
    repuesto = models.ForeignKey(Repuesto, on_delete=models.CASCADE, db_column='id_repuesto', related_name='salidas')
    orden_trabajo = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, db_column='id_orden', related_name='salidas_repuesto')
    cantidad = models.PositiveIntegerField()
    observacion = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True, db_index=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='salidas_repuestos_registradas'
    )

    class Meta:
        db_table = 'salida_repuesto'
        ordering = ['-fecha']

    def __str__(self):
        return f"Salida #{self.id_salida} - {self.repuesto.nombre} (OT: #{self.orden_trabajo.numero_orden})"
