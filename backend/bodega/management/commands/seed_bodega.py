from django.core.management.base import BaseCommand
from bodega.models import Repuesto, Vehiculo, Mecanico, OrdenTrabajo, OrdenIngreso, DetalleOrdenIngreso, SalidaRepuesto
from users.models import Usuario

class Command(BaseCommand):
    help = 'Sembrado de datos de prueba para el módulo de Bodega y Taller'

    def handle(self, *args, **kwargs):
        admin_user = Usuario.objects.filter(username='admin').first()
        bodega_user = Usuario.objects.filter(username='bodega').first()

        # 1. Repuestos de prueba (Código comenzando en 100192)
        repuestos_data = [
            {'codigo': '100192', 'nombre': 'Filtro de Aceite Heavy Duty', 'descripcion': 'Filtro de alta eficiencia para motor diésel', 'stock': 25, 'stock_minimo': 5, 'precio_unitario': 18.50},
            {'codigo': '100193', 'nombre': 'Batería 12V 100Ah', 'descripcion': 'Batería de alto rendimiento para transporte pesado', 'stock': 8, 'stock_minimo': 3, 'precio_unitario': 120.00},
            {'codigo': '100194', 'nombre': 'Llanta 295/80 R22.5', 'descripcion': 'Llanta de tracción para camión de carga', 'stock': 12, 'stock_minimo': 4, 'precio_unitario': 290.00},
            {'codigo': '100195', 'nombre': 'Filtro de Aire Primario', 'descripcion': 'Filtro para admisión de motor diésel', 'stock': 2, 'stock_minimo': 5, 'precio_unitario': 35.00},
            {'codigo': '100196', 'nombre': 'Pastillas de Freno Delanteras', 'descripcion': 'Juego de pastillas cerámicas de alta durabilidad', 'stock': 15, 'stock_minimo': 6, 'precio_unitario': 65.00},
        ]

        repuestos_objs = {}
        for r_data in repuestos_data:
            rep, created = Repuesto.objects.get_or_create(
                codigo=r_data['codigo'],
                defaults=r_data
            )
            repuestos_objs[rep.codigo] = rep
            st = 'creado' if created else 'existente'
            self.stdout.write(self.style.SUCCESS(f'Repuesto "{rep.nombre}" -> {st}'))

        # 2. Vehículos de prueba
        vehiculos_data = [
            {'placa': 'C-89312', 'unidad': 'Freightliner Cascadia 2021', 'modelo': 'Freightliner Cascadia 2021', 'estado': 'En Taller', 'activo': True},
            {'placa': 'C-72109', 'unidad': 'International ProStar 2020', 'modelo': 'International ProStar 2020', 'estado': 'Disponible', 'activo': True},
            {'placa': 'C-44589', 'unidad': 'Kenworth T680 2022', 'modelo': 'Kenworth T680 2022', 'estado': 'En Viaje', 'activo': True},
        ]

        vehiculos_objs = {}
        for v_data in vehiculos_data:
            veh, created = Vehiculo.objects.get_or_create(
                placa=v_data['placa'],
                defaults=v_data
            )
            vehiculos_objs[veh.placa] = veh
            st = 'creado' if created else 'existente'
            self.stdout.write(self.style.SUCCESS(f'Vehículo "{veh.placa}" -> {st}'))

        # 3. Mecánicos de prueba por especialidad / área
        mecanicos_data = [
            {'nombre': 'Juan Pérez', 'area': 'General'},
            {'nombre': 'Roberto Estrada', 'area': 'Electromecánico'},
            {'nombre': 'Miguel Ángel López', 'area': 'Soldadura'},
            {'nombre': 'Mario Ramírez', 'area': 'Llantero'},
            {'nombre': 'Fernando Castro', 'area': 'Tapicería'},
        ]

        mecanicos_objs = {}
        for m_data in mecanicos_data:
            mec, created = Mecanico.objects.get_or_create(
                nombre=m_data['nombre'],
                defaults={'area': m_data['area']}
            )
            mecanicos_objs[mec.nombre] = mec
            st = 'creado' if created else 'existente'
            self.stdout.write(self.style.SUCCESS(f'Mecánico "{mec.nombre}" ({mec.area}) -> {st}'))


        # 3. Órdenes de trabajo de prueba
        ordenes_trabajo_data = [
            {
                'numero_orden': 'OT-2026-001',
                'placa': 'C-89312',
                'descripcion': 'Mantenimiento preventivo de 50k km y cambio de filtros de aceite y aire',
                'mecanico_asignado': 'Juan Pérez',
                'area_asignada': 'Mecánica General',
                'estado': 'Abierta'
            },
            {
                'numero_orden': 'OT-2026-002',
                'placa': 'C-72109',
                'descripcion': 'Cambio de sistema de frenos delanteros y reemplazo de pastillas',
                'mecanico_asignado': 'Carlos Gómez',
                'area_asignada': 'Frenos y Suspensión',
                'estado': 'Abierta'
            },
        ]

        ot_objs = {}
        for ot_data in ordenes_trabajo_data:
            veh = vehiculos_objs.get(ot_data['placa'])
            ot, created = OrdenTrabajo.objects.get_or_create(
                numero_orden=ot_data['numero_orden'],
                defaults={
                    'vehiculo': veh,
                    'descripcion': ot_data['descripcion'],
                    'mecanico_asignado': ot_data['mecanico_asignado'],
                    'area_asignada': ot_data['area_asignada'],
                    'estado': ot_data['estado']
                }
            )
            ot_objs[ot.numero_orden] = ot
            st = 'creado' if created else 'existente'
            self.stdout.write(self.style.SUCCESS(f'Orden de Trabajo "{ot.numero_orden}" -> {st}'))

        # Salida de repuesto de prueba vinculada a la OT-2026-001
        ot1 = ot_objs.get('OT-2026-001')
        rep100 = repuestos_objs.get('100')
        if ot1 and rep100:
            salida, created_salida = SalidaRepuesto.objects.get_or_create(
                orden_trabajo=ot1,
                repuesto=rep100,
                defaults={
                    'cantidad': 2,
                    'observacion': 'Despacho de filtros para mantenimiento preventivo',
                    'registrado_por': bodega_user or admin_user
                }
            )
            if created_salida:
                self.stdout.write(self.style.SUCCESS('Salida de repuesto vinculada a OT-2026-001 creada'))


        # 4. Orden de Ingreso de prueba (con número correlativo ej: 61635500)
        if not OrdenIngreso.objects.filter(numero_orden='61635500').exists():
            oi = OrdenIngreso.objects.create(
                numero_orden='61635500',
                proveedor='Distribuidora Central de Repuestos S.A.',
                observaciones='Ingreso de lote inicial de mantenimiento preventivo',
                creado_por=admin_user
            )
            DetalleOrdenIngreso.objects.create(
                orden_ingreso=oi,
                repuesto=repuestos_objs['100'],
                descripcion_repuesto='Filtro de Aceite Heavy Duty - Marca Fleetguard LF14000NN',
                cantidad=10,
                precio_unitario=18.50
            )
            DetalleOrdenIngreso.objects.create(
                orden_ingreso=oi,
                repuesto=repuestos_objs['101'],
                descripcion_repuesto='Batería 12V 100Ah Libre de Mantenimiento',
                cantidad=4,
                precio_unitario=120.00
            )
            self.stdout.write(self.style.SUCCESS('Orden de Ingreso correlativa #61635500 creada'))

        self.stdout.write(self.style.SUCCESS('¡Datos de bodega sembrados correctamente!'))
