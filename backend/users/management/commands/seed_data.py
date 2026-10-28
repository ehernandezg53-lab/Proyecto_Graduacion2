from django.core.management.base import BaseCommand
from users.models import Rol, Usuario, Permiso, RolPermiso

class Command(BaseCommand):
    help = 'Crea los permisos, roles, relaciones rol-permiso y el usuario administrador inicial'

    def handle(self, *args, **kwargs):
        # 1. Crear Permisos del Sistema
        permisos_data = [
            ('ver_usuarios', 'Usuarios', 'Permiso para visualizar y gestionar cuentas de usuario'),
            ('ver_bodega', 'Bodega', 'Permiso para visualizar y registrar ingresos/salidas de bodega'),
            ('ver_taller', 'Taller', 'Permiso para crear y gestionar órdenes de trabajo en taller'),
            ('ver_logistica', 'Logística', 'Permiso para coordinar rutas, viajes y conductores'),
        ]

        created_permisos = {}
        for code, modulo, desc in permisos_data:
            permiso, created = Permiso.objects.get_or_create(
                nombre_permiso=code,
                modulo=modulo
            )
            created_permisos[code] = permiso
            status = 'creado' if created else 'existente'
            self.stdout.write(self.style.SUCCESS(f'Permiso "{code}" ({modulo}) -> {status}'))

        # 2. Crear Roles del Sistema
        roles_data = [
            (Rol.ADMINISTRADOR, 'Acceso completo a todos los módulos y configuración del sistema'),
            (Rol.BODEGUERO, 'Acceso exclusivo al módulo de bodega de repuestos e ingresos'),
            (Rol.TALLER, 'Acceso exclusivo al módulo de taller y órdenes de trabajo'),
            (Rol.LOGISTICA, 'Acceso exclusivo al módulo de logística, conductores y viajes'),
        ]

        created_roles = {}
        for nombre, desc in roles_data:
            rol, created = Rol.objects.get_or_create(
                nombre=nombre,
                defaults={'descripcion': desc}
            )
            created_roles[nombre] = rol
            status = 'creado' if created else 'existente'
            self.stdout.write(self.style.SUCCESS(f'Rol "{nombre}" -> {status}'))

        # 3. Asignar Permisos a Roles (Rol_Permiso)
        relaciones = {
            Rol.ADMINISTRADOR: ['ver_usuarios', 'ver_bodega', 'ver_taller', 'ver_logistica'],
            Rol.BODEGUERO: ['ver_bodega'],
            Rol.TALLER: ['ver_taller'],
            Rol.LOGISTICA: ['ver_logistica'],
        }

        for rol_nombre, permisos_codes in relaciones.items():
            rol_obj = created_roles[rol_nombre]
            for p_code in permisos_codes:
                permiso_obj = created_permisos[p_code]
                rp, created = RolPermiso.objects.get_or_create(
                    rol=rol_obj,
                    permiso=permiso_obj
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Asociado: Rol "{rol_nombre}" -> Permiso "{p_code}"'))

        # 4. Crear Usuario Administrador de Prueba
        admin_username = 'admin'
        if not Usuario.objects.filter(username=admin_username).exists():
            admin_user = Usuario.objects.create_superuser(
                username=admin_username,
                password='admin123',
                nombre='Admin',
                apellido='Sistema',
                telefono='7000-0000',
                rol=created_roles[Rol.ADMINISTRADOR]
            )
            self.stdout.write(self.style.SUCCESS(f'Usuario Admin creado: {admin_username} / admin123'))
        else:
            self.stdout.write(self.style.WARNING(f'Usuario Admin {admin_username} ya existe'))

        # 5. Crear Usuarios de prueba para roles
        test_users = [
            ('bodega', 'Juan', 'Pérez', Rol.BODEGUERO),
            ('taller', 'Carlos', 'Gómez', Rol.TALLER),
            ('logistica', 'María', 'López', Rol.LOGISTICA),
        ]

        for username, nombre, apellido, rol_nombre in test_users:
            if not Usuario.objects.filter(username=username).exists():
                Usuario.objects.create_user(
                    username=username,
                    password='user123',
                    nombre=nombre,
                    apellido=apellido,
                    telefono='7777-8888',
                    rol=created_roles[rol_nombre],
                    activo=True
                )
                self.stdout.write(self.style.SUCCESS(f'Usuario de prueba creado: {username} ({rol_nombre})'))

        self.stdout.write(self.style.SUCCESS('¡Datos iniciales sembrados con éxito!'))
