from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import Rol, Usuario
from logistica.models import Rollo, TipoAlambre, Cliente, Conductor

class LogisticaRollosTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Roles
        self.rol_admin, _ = Rol.objects.get_or_create(nombre=Rol.ADMINISTRADOR, defaults={'descripcion': 'Admin'})

        # Usuario Admin
        self.admin_user, _ = Usuario.objects.get_or_create(
            username='admin_logistica_test',
            defaults={
                'nombre': 'Admin',
                'apellido': 'Logistica',
                'rol': self.rol_admin,
                'is_staff': True,
                'is_superuser': True
            }
        )
        if not self.admin_user.check_password('password123'):
            self.admin_user.set_password('password123')
            self.admin_user.save()

        self.client.force_authenticate(user=self.admin_user)

        # Tipo de alambre (ya puede haber sido creado por las migraciones 0007 y 0008)
        self.tipo_alambre, _ = TipoAlambre.objects.get_or_create(
            codigo='AL-72150',
            defaults={
                'nombre': 'Alambre Galvanizado Calibre 12',
                'peso_estandar_kg': 50.00,
                'ubicacion_defecto': 'Bodega Central - Bahía A'
            }
        )

        # Rollo inicial
        self.rollo, _ = Rollo.objects.get_or_create(
            codigo_rollo='AL-1001',
            defaults={
                'tipo_alambre': 'Alambre Galvanizado Calibre 12',
                'peso_kg': 50.00,
                'ubicacion': 'Bodega Central - Bahía A',
                'estado': 'Disponible'
            }
        )

    def test_rollo_codigo_prefix_al(self):
        """Verifica que el código del rollo comience con el prefijo 'AL-'."""
        self.assertTrue(self.rollo.codigo_rollo.startswith('AL-'))

    def test_siguiente_correlativo_rollo(self):
        """El endpoint debe sugerir el siguiente correlativo numérico con prefijo AL-."""
        response = self.client.get('/api/logistica/rollos/siguientes_correlativos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['siguiente_codigo'].startswith('AL-'))

    def test_ingreso_lote_rollo_al(self):
        """Ingreso de lote debe generar rollos con prefijo AL-."""
        response = self.client.post('/api/logistica/rollos/ingreso_lote/', {
            'cantidad': 3,
            'tipo_alambre': 'Alambre Galvanizado Calibre 12',
            'peso_kg': 50.0,
            'ubicacion': 'Bodega Central - Bahía A'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['primer_codigo'].startswith('AL-'))
        self.assertTrue(response.data['ultimo_codigo'].startswith('AL-'))

    def test_ingreso_existente_rollo_al(self):
        """Ingreso de rollos desde catálogo de alambre debe usar prefijo AL-."""
        response = self.client.post('/api/logistica/rollos/ingreso_existente/', {
            'codigo_alambre': 'AL-72150',
            'cantidad': 2,
            'ubicacion': 'Bodega Central - Bahía B'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['primer_codigo'].startswith('AL-'))
        self.assertTrue(response.data['ultimo_codigo'].startswith('AL-'))

    def test_tipo_alambre_siguiente_codigo(self):
        """El endpoint siguiente_codigo de TipoAlambre debe retornar formato AL-XXXXX."""
        response = self.client.get('/api/logistica/tipos-alambre/siguiente_codigo/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['siguiente_codigo'].startswith('AL-'))
