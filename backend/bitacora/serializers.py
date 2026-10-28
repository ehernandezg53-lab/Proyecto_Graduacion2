from rest_framework import serializers
from .models import RegistroBitacora

class RegistroBitacoraSerializer(serializers.ModelSerializer):
    usuario_nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = RegistroBitacora
        fields = [
            'id_bitacora',
            'usuario',
            'username_historico',
            'usuario_nombre_completo',
            'accion',
            'metodo',
            'ruta',
            'modulo',
            'ip_origen',
            'user_agent',
            'codigo_respuesta',
            'datos_enviados',
            'fecha_hora',
        ]

    def get_usuario_nombre_completo(self, obj):
        if obj.usuario:
            return f"{obj.usuario.nombre} {obj.usuario.apellido}".strip()
        return obj.username_historico or "Anónimo / Sistema"
