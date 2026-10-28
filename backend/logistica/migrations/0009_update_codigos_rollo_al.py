from django.db import migrations

def update_codigos_rollo_al(apps, schema_editor):
    Rollo = apps.get_model('logistica', 'Rollo')
    for r in Rollo.objects.all():
        codigo = str(r.codigo_rollo).strip()
        if codigo.startswith('RL-'):
            r.codigo_rollo = 'AL-' + codigo[3:]
            r.save(update_fields=['codigo_rollo'])
        elif codigo.startswith('ROL-'):
            r.codigo_rollo = 'AL-' + codigo[4:]
            r.save(update_fields=['codigo_rollo'])
        elif not codigo.startswith('AL-'):
            clean = codigo.replace('RL-', '').replace('ROL-', '').strip()
            r.codigo_rollo = f"AL-{clean}"
            r.save(update_fields=['codigo_rollo'])

def reverse_update(apps, schema_editor):
    Rollo = apps.get_model('logistica', 'Rollo')
    for r in Rollo.objects.all():
        codigo = str(r.codigo_rollo).strip()
        if codigo.startswith('AL-'):
            r.codigo_rollo = 'RL-' + codigo[3:]
            r.save(update_fields=['codigo_rollo'])

class Migration(migrations.Migration):

    dependencies = [
        ('logistica', '0008_update_codigos_alambre'),
    ]

    operations = [
        migrations.RunPython(update_codigos_rollo_al, reverse_update),
    ]
