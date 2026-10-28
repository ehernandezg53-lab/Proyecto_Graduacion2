from django.core.management.base import BaseCommand
from logistica.models import Cliente, Conductor, Viaje
from bodega.models import Vehiculo
from datetime import date

class Command(BaseCommand):
    help = 'Puebla la base de datos con información inicial para el Módulo de Logística'

    def handle(self, *args, **options):
        self.stdout.write("Poblando catálogo de clientes...")
        clientes_data = [
            {
                'numero_cliente': '607020',
                'nombre': 'GRUPO VITAL VITALSA TICSA -ST-FUE',
                'direccion': 'Km 14.5 Carretera a Mixco, Zona 4 de Mixco, Guatemala'
            },
            {
                'numero_cliente': '612150',
                'nombre': 'UNO FUELS GUATEMALA S.A.',
                'direccion': 'Calzada Aguilar Batres 34-78, Zona 11, Ciudad de Guatemala'
            },
            {
                'numero_cliente': '605110',
                'nombre': 'DISTRIBUIDORA CENTRAL DE TRANSPORTES',
                'direccion': 'Puerto Quetzal, Lote 12 Manzana B, Escuintla'
            }
        ]

        cliente_objs = {}
        for cdata in clientes_data:
            c, _ = Cliente.objects.get_or_create(
                numero_cliente=cdata['numero_cliente'],
                defaults={
                    'nombre': cdata['nombre'],
                    'direccion': cdata['direccion']
                }
            )
            cliente_objs[cdata['numero_cliente']] = c

        self.stdout.write("Poblando catálogo de conductores...")
        conductores_data = [
            {'codigo_carnet': '0000701010', 'nombre': 'Roberto Estrada', 'fecha_vencimiento_licencia': date(2027, 5, 20)},
            {'codigo_carnet': '0000701020', 'nombre': 'Juan Pérez', 'fecha_vencimiento_licencia': date(2026, 12, 15)},
            {'codigo_carnet': '0000701030', 'nombre': 'Carlos Gómez', 'fecha_vencimiento_licencia': date(2025, 8, 10)},
            {'codigo_carnet': '0000701040', 'nombre': 'Mario Ramírez', 'fecha_vencimiento_licencia': date(2028, 1, 30)}
        ]

        conductor_objs = {}
        for cdata in conductores_data:
            cond, _ = Conductor.objects.get_or_create(
                nombre=cdata['nombre'],
                defaults={
                    'codigo_carnet': cdata['codigo_carnet'],
                    'fecha_vencimiento_licencia': cdata['fecha_vencimiento_licencia']
                }
            )
            conductor_objs[cdata['nombre']] = cond

        self.stdout.write("Poblando viajes iniciales...")
        vehiculo_td = Vehiculo.objects.filter(placa='C-44589').first() or Vehiculo.objects.first()

        viajes_data = [
            {
                'numero_viaje': '612150',
                'vehiculo': vehiculo_td,
                'cliente': cliente_objs.get('0000607020'),
                'conductor': conductor_objs.get('Roberto Estrada'),
                'fecha_envio': date(2026, 10, 9),
                'hora_envio': '08:30:00',
                'peso_carga_kg': 4500.50,
                'cantidad_rollos': 24,
                'estado': 'Abierta'
            },
            {
                'numero_viaje': '71907',
                'vehiculo': vehiculo_td,
                'cliente': cliente_objs.get('0000612150'),
                'conductor': conductor_objs.get('Juan Pérez'),
                'fecha_envio': date(2026, 10, 9),
                'hora_envio': '10:00:00',
                'peso_carga_kg': 3200.00,
                'cantidad_rollos': 16,
                'estado': 'Abierta'
            }
        ]

        for vdata in viajes_data:
            if vdata['cliente'] and vdata['vehiculo']:
                Viaje.objects.get_or_create(
                    numero_viaje=vdata['numero_viaje'],
                    defaults=vdata
                )

        self.stdout.write(self.style.SUCCESS("¡Módulo de Logística poblado correctamente!"))
