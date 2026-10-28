from django.db import migrations

def create_system_roles_and_permissions(apps, schema_editor):
    Permiso = apps.get_model('users', 'Permiso')
    Rol = apps.get_model('users', 'Rol')
    RolPermiso = apps.get_model('users', 'RolPermiso')

    # 1. Permisos base
    permisos_config = [
        ('ver_usuarios', 'Usuarios'),
        ('ver_bodega', 'Bodega'),
        ('ver_taller', 'Taller'),
        ('ver_logistica', 'Logística'),
    ]
    permisos_map = {}
    for nombre, modulo in permisos_config:
        permiso, _ = Permiso.objects.get_or_create(
            nombre_permiso=nombre,
            defaults={'modulo': modulo}
        )
        permisos_map[nombre] = permiso

    # 2. Roles estructurales
    roles_config = [
        ('Administrador', 'Acceso completo a todos los módulos y configuración del sistema', [
            permisos_map['ver_usuarios'],
            permisos_map['ver_bodega'],
            permisos_map['ver_taller'],
            permisos_map['ver_logistica'],
        ]),
        ('Bodeguero', 'Acceso exclusivo al módulo de bodega de repuestos e ingresos', [
            permisos_map['ver_bodega'],
        ]),
        ('Taller', 'Acceso exclusivo al módulo de taller y órdenes de trabajo', [
            permisos_map['ver_taller'],
        ]),
        ('Logística', 'Acceso exclusivo al módulo de logística, conductores y viajes', [
            permisos_map['ver_logistica'],
        ]),
    ]

    for nombre_rol, desc, perms in roles_config:
        rol, _ = Rol.objects.get_or_create(
            nombre=nombre_rol,
            defaults={'descripcion': desc}
        )
        for p in perms:
            RolPermiso.objects.get_or_create(rol=rol, permiso=p)


def revert_roles_and_permissions(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_rename_debe_cambiar_password_usuario_cambio_temporal'),
    ]

    operations = [
        migrations.RunPython(create_system_roles_and_permissions, revert_roles_and_permissions),
    ]
