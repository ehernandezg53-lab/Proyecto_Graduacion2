from django.contrib import admin
from .models import Usuario, Rol, Permiso, SolicitudRestablecimiento

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('username', 'nombre', 'apellido', 'rol', 'activo', 'is_staff', 'is_superuser')
    search_fields = ('username', 'nombre', 'apellido')
    list_filter = ('rol', 'activo', 'is_staff')

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'descripcion')

@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre_permiso', 'modulo')
    list_filter = ('modulo',)

@admin.register(SolicitudRestablecimiento)
class SolicitudAdmin(admin.ModelAdmin):
    list_display = ('numero_ticket', 'usuario', 'estado', 'fecha_solicitud')
    list_filter = ('estado',)
