from django.urls import path
from . import views

urlpatterns = [
    # Dashboard ejecutivo
    path('dashboard/', views.DashboardKpiView.as_view(), name='reportes-dashboard'),

    # Reportes de Bodega
    path('bodega/kardex/', views.KardexReportView.as_view(), name='reportes-bodega-kardex'),
    path('bodega/stock-critico/', views.StockCriticoReportView.as_view(), name='reportes-bodega-stock-critico'),
    path('bodega/valorizacion/', views.ValorizacionReportView.as_view(), name='reportes-bodega-valorizacion'),

    # Reportes de Taller
    path('taller/ordenes/', views.TallerOrdenesReportView.as_view(), name='reportes-taller-ordenes'),
    path('taller/historial-vehiculo/', views.HistorialVehiculoReportView.as_view(), name='reportes-taller-historial-vehiculo'),
    path('taller/productividad-mecanicos/', views.ProductividadMecanicosReportView.as_view(), name='reportes-taller-productividad-mecanicos'),

    # Reportes de Logística
    path('logistica/viajes/', views.LogisticaViajesReportView.as_view(), name='reportes-logistica-viajes'),
    path('logistica/rollos/', views.RollosReportView.as_view(), name='reportes-logistica-rollos'),
    path('logistica/licencias/', views.LicenciasConductoresReportView.as_view(), name='reportes-logistica-licencias'),

    # Reportes de Auditoría / Seguridad
    path('bitacora/auditoria/', views.BitacoraReportView.as_view(), name='reportes-bitacora-auditoria'),
]
