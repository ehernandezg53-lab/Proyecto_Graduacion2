from django.db import migrations

def seed_tipos_alambre(apps, schema_editor):
    TipoAlambre = apps.get_model('logistica', 'TipoAlambre')
    alambres = [
        {
            'codigo': 'ALM-G12',
            'nombre': 'Alambre Galvanizado Calibre 12',
            'peso_estandar_kg': 50.00,
            'ubicacion_defecto': 'Bodega Central - Bahía A',
            'activo': True
        },
        {
            'codigo': 'ALM-G14',
            'nombre': 'Alambre Galvanizado Calibre 14',
            'peso_estandar_kg': 50.00,
            'ubicacion_defecto': 'Bodega Central - Bahía A',
            'activo': True
        },
        {
            'codigo': 'ALM-G16',
            'nombre': 'Alambre Galvanizado Calibre 16',
            'peso_estandar_kg': 50.00,
            'ubicacion_defecto': 'Bodega Central - Bahía B',
            'activo': True
        },
        {
            'codigo': 'ALM-PUA',
            'nombre': 'Alambre de Púa Alta Resistencia',
            'peso_estandar_kg': 35.00,
            'ubicacion_defecto': 'Bodega Central - Bahía C',
            'activo': True
        },
        {
            'codigo': 'ALM-REC',
            'nombre': 'Alambre Recocido para Amarre',
            'peso_estandar_kg': 50.00,
            'ubicacion_defecto': 'Bodega Central - Bahía B',
            'activo': True
        },
        {
            'codigo': 'ALM-EST',
            'nombre': 'Alambre de Acero Estructural',
            'peso_estandar_kg': 100.00,
            'ubicacion_defecto': 'Bodega Central - Bahía D',
            'activo': True
        },
    ]
    for item in alambres:
        TipoAlambre.objects.get_or_create(
            codigo=item['codigo'],
            defaults=item
        )

def unseed_tipos_alambre(apps, schema_editor):
    TipoAlambre = apps.get_model('logistica', 'TipoAlambre')
    TipoAlambre.objects.filter(codigo__in=['ALM-G12', 'ALM-G14', 'ALM-G16', 'ALM-PUA', 'ALM-REC', 'ALM-EST']).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('logistica', '0006_tipoalambre'),
    ]

    operations = [
        migrations.RunPython(seed_tipos_alambre, unseed_tipos_alambre),
    ]
