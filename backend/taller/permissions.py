from rest_framework import permissions

class IsTallerOrAdmin(permissions.BasePermission):
    """
    Permite acceso únicamente a usuarios autenticados con rol Administrador o Taller,
    o con permiso 'ver_taller'.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser or request.user.is_staff:
            return True

        rol = getattr(request.user, 'rol', None)
        if not rol:
            return False

        rol_nombre = getattr(rol, 'nombre', None)
        if rol_nombre in ['Administrador', 'Taller']:
            return True

        return rol.permisos.filter(nombre_permiso='ver_taller').exists()


class IsTallerOrBodegueroOrAdmin(permissions.BasePermission):
    """
    Permite acceso a usuarios autenticados con rol Administrador, Bodeguero, Taller o Logística.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser or request.user.is_staff:
            return True

        rol = getattr(request.user, 'rol', None)
        if not rol:
            return False

        rol_nombre = getattr(rol, 'nombre', None)
        return rol_nombre in ['Administrador', 'Bodeguero', 'Taller', 'Logística']


class IsAdminUserOnly(permissions.BasePermission):
    """
    Permite acceso únicamente a usuarios autenticados con rol Administrador.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser or request.user.is_staff:
            return True

        rol = getattr(request.user, 'rol', None)
        if not rol:
            return False

        rol_nombre = getattr(rol, 'nombre', None)
        return rol_nombre == 'Administrador'
