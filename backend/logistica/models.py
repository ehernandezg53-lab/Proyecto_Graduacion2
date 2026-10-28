from django.db import models
from taller.models import Vehiculo

class Cliente(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    numero_cliente = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=150)
    direccion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cliente'
        ordering = ['numero_cliente']

    def __str__(self):
        return f"{self.numero_cliente} - {self.nombre}"


class Conductor(models.Model):
    id_conductor = models.AutoField(primary_key=True)
    codigo_carnet = models.CharField(max_length=50, blank=True, null=True)
    nombre = models.CharField(max_length=150)
    fecha_vencimiento_licencia = models.DateField(null=True, blank=True, db_index=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'conductor'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Viaje(models.Model):
    ESTADO_CHOICES = [
        ('Abierta', 'Abierta'),
        ('Cerrada', 'Cerrada'),
    ]

    id_viaje = models.AutoField(primary_key=True)
    numero_viaje = models.CharField(max_length=50, unique=True)
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE, db_column='id_vehiculo', null=True, blank=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, db_column='id_cliente', null=True, blank=True)
    conductor = models.ForeignKey(Conductor, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_envio = models.DateField(db_index=True)
    hora_envio = models.TimeField(null=True, blank=True)
    peso_carga_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cantidad_rollos = models.IntegerField(default=0)
    estado = models.CharField(max_length=50, choices=ESTADO_CHOICES, default='Abierta', db_index=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'viaje'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Viaje #{self.numero_viaje}"


class TipoAlambre(models.Model):
    id_tipo = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=150)
    peso_estandar_kg = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    ubicacion_defecto = models.CharField(max_length=100, default='Bodega Central - Bahía A')
    activo = models.BooleanField(default=True, db_index=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tipo_alambre'
        ordering = ['codigo']

    def __str__(self):
        return f"[{self.codigo}] {self.nombre}"


class Rollo(models.Model):
    ESTADO_CHOICES = [
        ('Disponible', 'Disponible'),
        ('En Viaje', 'En Viaje'),
        ('Entregado', 'Entregado'),
    ]

    id_rollo = models.AutoField(primary_key=True)
    codigo_rollo = models.CharField(max_length=50, unique=True)
    tipo_alambre = models.CharField(max_length=100, default='Alambre Galvanizado')
    peso_kg = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    ubicacion = models.CharField(max_length=100, default='Bodega Central - Bahía A')
    estado = models.CharField(max_length=50, choices=ESTADO_CHOICES, default='Disponible', db_index=True)
    viaje = models.ForeignKey(Viaje, on_delete=models.SET_NULL, null=True, blank=True, related_name='rollos')
    fecha_ingreso = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rollo'
        ordering = ['-id_rollo']

    def __str__(self):
        return f"{self.codigo_rollo} ({self.tipo_alambre} - {self.peso_kg} kg)"
