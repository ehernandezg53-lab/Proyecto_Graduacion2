from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import Rol, Usuario
from bodega.models import Repuesto, Vehiculo, OrdenTrabajo, OrdenIngreso, SalidaRepuesto

class BodegaModuleTests(TestCase):
    def setUp(self):
        # Roles
        self.rol_admin, _ = Rol.objects.get_or_create(nombre=Rol.ADMINISTRADOR, defaults={'descripcion': 'Admin'})
        self.rol_bodega, _ = Rol.objects.get_or_create(nombre=Rol.BODEGUERO, defaults={'descripcion': 'Bodeguero'})
        self.rol_taller, _ = Rol.objects.get_or_create(nombre=Rol.TALLER, defaults={'descripcion': 'Taller'})

        # Usuarios
        self.admin_user = Usuario.objects.create_user(
            username='admin_test',
            password='password123',
            nombre='Admin',
            apellido='Test',
            rol=self.rol_admin,
            is_staff=True,
            is_superuser=True
        )
        self.bodega_user = Usuario.objects.create_user(
            username='bodega_test',
            password='password123',
            nombre='Bodeguero',
            apellido='Test',
            rol=self.rol_bodega
        )
        self.taller_user = Usuario.objects.create_user(
            username='taller_test',
            password='password123',
            nombre='Taller',
            apellido='Test',
            rol=self.rol_taller
        )

        # Repuesto inicial
        self.repuesto = Repuesto.objects.create(
            codigo='REP-TEST-1',
            nombre='Filtro de Aire Test',
            descripcion='Filtro de prueba',
            stock=10,
            stock_minimo=2,
            precio_unitario=25.00
        )

        # Vehículo y OT de prueba
        self.vehiculo = Vehiculo.objects.create(placa='C-11111', modelo='Kenworth 2020')
        self.orden_trabajo = OrdenTrabajo.objects.create(
            numero_orden='OT-TEST-100',
            vehiculo=self.vehiculo,
            descripcion='Prueba de mantenimiento'
        )

        self.client = APIClient()

    def test_administrador_puede_crear_orden_ingreso(self):
        """
        El Administrador puede crear una Orden de Ingreso con número correlativo (ej. 61635500)
        y esto debe incrementar el stock del repuesto.
        """
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'numero_orden': '61635500',
            'proveedor': 'Distribuidora Test S.A.',
            'observaciones': 'Ingreso test',
            'detalles': [
                {
                    'repuesto': self.repuesto.id_repuesto,
                    'descripcion_repuesto': 'Filtro de Aire Test - Lote nuevo',
                    'cantidad': 15,
                    'precio_unitario': 25.00
                }
            ]
        }

        response = self.client.post('/api/bodega/ordenes-ingreso/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_211_CREATED if response.status_code == 211 else status.HTTP_201_CREATED)

        # Verificar stock actualizado (10 + 15 = 25)
        self.repuesto.refresh_from_db()
        self.assertEqual(self.repuesto.stock, 25)

    def test_bodeguero_NO_puede_crear_orden_ingreso(self):
        """
        El Bodeguero NO tiene permiso para crear órdenes de ingreso.
        """
        self.client.force_authenticate(user=self.bodega_user)
        data = {
            'numero_orden': '61635501',
            'proveedor': 'Distribuidora Test S.A.',
            'detalles': [
                {
                    'repuesto': self.repuesto.id_repuesto,
                    'descripcion_repuesto': 'Filtro de Aire Test',
                    'cantidad': 5
                }
            ]
        }

        response = self.client.post('/api/bodega/ordenes-ingreso/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_bodeguero_puede_ver_resumen_orden_ingreso(self):
        """
        El Bodeguero sí puede consultar la lista y el resumen de las órdenes de ingreso.
        """
        # Admin crea la orden primero
        oi = OrdenIngreso.objects.create(
            numero_orden='61635502',
            proveedor='Proveedor Test',
            creado_por=self.admin_user
        )

        # Bodeguero consulta
        self.client.force_authenticate(user=self.bodega_user)
        response = self.client.get(f'/api/bodega/ordenes-ingreso/{oi.id_orden_ingreso}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['numero_orden'], '61635502')
        self.assertEqual(response.data['proveedor'], 'Proveedor Test')

    def test_salida_repuesto_reduce_stock(self):
        """
        Una salida de repuesto vinculada a una Orden de Trabajo reduce el stock del repuesto.
        """
        self.client.force_authenticate(user=self.bodega_user)
        data = {
            'repuesto': self.repuesto.id_repuesto,
            'orden_trabajo': self.orden_trabajo.id_orden,
            'cantidad': 4,
            'observacion': 'Despachado a taller'
        }

        response = self.client.post('/api/bodega/salidas-repuestos/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Stock original 10 - 4 = 6
        self.repuesto.refresh_from_db()
        self.assertEqual(self.repuesto.stock, 6)

    def test_salida_repuesto_falla_si_stock_insuficiente(self):
        """
        Intentar despachar más stock del existente arroja error de validación.
        """
        self.client.force_authenticate(user=self.bodega_user)
        data = {
            'repuesto': self.repuesto.id_repuesto,
            'orden_trabajo': self.orden_trabajo.id_orden,
            'cantidad': 99,
            'observacion': 'Exceso'
        }

        response = self.client.post('/api/bodega/salidas-repuestos/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
