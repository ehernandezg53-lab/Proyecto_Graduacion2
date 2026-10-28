from django.db import migrations

def update_codigos_alambre(apps, schema_editor):
    TipoAlambre = apps.get_model('logistica', 'TipoAlambre')
    
    mapping = {
        'ALM-G12': 'AL-72150',
        'ALM-G14': 'AL-72151',
        'ALM-G16': 'AL-72152',
        'ALM-PUA': 'AL-72153',
        'ALM-REC': 'AL-72154',
        'ALM-EST': 'AL-72155',
    }

    current_num = 72156
    for t in TipoAlambre.objects.all():
        if t.codigo in mapping:
            t.codigo = mapping[t.codigo]
            t.save()
        elif not str(t.codigo).startswith('AL-'):
            t.codigo = f"AL-{current_num}"
            current_num += 1
            t.save()

def reverse_update(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('logistica', '0007_seed_tipos_alambre'),
    ]

    operations = [
        migrations.RunPython(update_codigos_alambre, reverse_update),
    ]
