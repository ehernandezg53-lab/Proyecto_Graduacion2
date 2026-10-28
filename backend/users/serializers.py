import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario, Rol, Permiso, SolicitudRestablecimiento

class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ['id', 'nombre_permiso', 'modulo']


class RolSerializer(serializers.ModelSerializer):
    permisos = PermisoSerializer(many=True, read_only=True)

    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion', 'permisos']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # We need to authenticate using 'username' instead of 'email'.
        # SimpleJWT automatically handles USERNAME_FIELD = 'username' from the model.
        data = super().validate(attrs)
        
        # Verify user is active (soft delete protection)
        if not self.user.activo:
            raise serializers.ValidationError({"detail": "Usuario deshabilitado. Contacte al administrador."})
            
        permisos_list = []
        if self.user.rol:
            permisos_list = list(self.user.rol.permisos.values('nombre_permiso', 'modulo'))

        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'nombre': self.user.nombre,
            'apellido': self.user.apellido,
            'telefono': self.user.telefono,
            'rol': self.user.rol.nombre if self.user.rol else None,
            'rol_id': self.user.rol.id if self.user.rol else None,
            'permisos': permisos_list,
            'cambio_temporal': bool(self.user.cambio_temporal)
        }
        return data


class UsuarioSerializer(serializers.ModelSerializer):
    rol_detail = RolSerializer(source='rol', read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    creado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'nombre', 'apellido', 'telefono',
            'rol', 'rol_detail', 'activo', 'cambio_temporal',
            'fecha_creacion', 'fecha_modificacion', 'creado_por',
            'creado_por_nombre', 'password'
        ]
        read_only_fields = ['fecha_creacion', 'fecha_modificacion', 'creado_por']

    def validate_nombre(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("El nombre es obligatorio.")
        if any(char.isdigit() for char in value):
            raise serializers.ValidationError("El nombre solo debe contener texto (letras), no se permiten números.")
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$", value.strip()):
            raise serializers.ValidationError("El nombre solo debe contener letras y espacios válidos.")
        return value.strip()

    def validate_username(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("El nombre de usuario es obligatorio.")
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ._]+$", value.strip()):
            raise serializers.ValidationError("El nombre de usuario solo debe contener texto (letras, punto o guion bajo), no se permiten números.")
        return value.strip()

    def validate_apellido(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("El apellido es obligatorio.")
        if any(char.isdigit() for char in value):
            raise serializers.ValidationError("El apellido solo debe contener texto (letras), no se permiten números.")
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$", value.strip()):
            raise serializers.ValidationError("El apellido solo debe contener letras y espacios válidos.")
        return value.strip()

    def validate_password(self, value):
        if value and len(value) < 8:
            raise serializers.ValidationError("La contraseña debe tener como mínimo 8 caracteres.")
        return value

    def get_creado_por_nombre(self, obj):
        if obj.creado_por:
            return f"{obj.creado_por.nombre} {obj.creado_por.apellido}"
        return None

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        usuario = Usuario(**validated_data)
        if password:
            usuario.set_password(password)
        else:
            usuario.set_unusable_password()
        usuario.save()
        return usuario

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class SolicitudRestablecimientoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.nombre')
    usuario_apellido = serializers.ReadOnlyField(source='usuario.apellido')
    usuario_username = serializers.ReadOnlyField(source='usuario.username')
    usuario_rol = serializers.ReadOnlyField(source='usuario.rol.nombre')
    autorizado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = SolicitudRestablecimiento
        fields = [
            'id_solicitud',
            'numero_ticket',
            'usuario',
            'usuario_nombre',
            'usuario_apellido',
            'usuario_username',
            'usuario_rol',
            'motivo',
            'pin_temporal',
            'estado',
            'autorizado_por',
            'autorizado_por_nombre',
            'fecha_solicitud',
            'fecha_autorizacion',
            'fecha_completado'
        ]
        read_only_fields = ['numero_ticket', 'fecha_solicitud', 'fecha_autorizacion', 'fecha_completado']

    def get_autorizado_por_nombre(self, obj):
        if obj.autorizado_por:
            return f"{obj.autorizado_por.nombre} {obj.autorizado_por.apellido}"
        return None
