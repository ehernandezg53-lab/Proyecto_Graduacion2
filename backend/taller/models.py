from django.db import models

class Vehiculo(models.Model):
    id_vehiculo = models.AutoField(primary_key=True)
    placa = models.CharField(max_length=20, unique=True)
    unidad = models.CharField(max_length=100, blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=50, default='Disponible')
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'vehiculo'

    def __str__(self):
        desc = self.unidad or self.modelo or 'Unidad'
        return f"{self.placa} ({desc})"


class Mecanico(models.Model):
    AREAS_CHOICES = [
        ('Soldadura', 'Soldadura'),
        ('Electromecánico', 'Electromecánico'),
        ('Tapicería', 'Tapicería'),
        ('Llantero', 'Llantero'),
        ('General', 'General'),
    ]

    id_mecanico = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    area = models.CharField(max_length=100, choices=AREAS_CHOICES, default='General')
    telefono = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True, db_index=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mecanico'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.area})"


class OrdenTrabajo(models.Model):
    id_orden = models.AutoField(primary_key=True)
    numero_orden = models.CharField(max_length=50, unique=True)
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE, db_column='id_vehiculo', null=True, blank=True)
    mecanico = models.ForeignKey(Mecanico, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordenes_trabajo')
    descripcion = models.TextField(blank=True, null=True)
    mecanico_asignado = models.CharField(max_length=150, blank=True, null=True)
    area_asignada = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=50, default='Abierta', db_index=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'orden_trabajo'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Orden Trabajo #{self.numero_orden}"
