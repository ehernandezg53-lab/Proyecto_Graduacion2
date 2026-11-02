import React, { useState, useEffect, useRef } from 'react';
import { bodegaService } from '@/services/bodegaService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { CustomSelect, ConfirmDialog, ToastNotification } from '@/components/common';
import {
  ModalResumenOrden,
  ModalNuevaOrden,
  ModalSalidaRepuesto,
  ModalNuevoRepuesto
} from './components';
import {
  Package,
  PlusCircle,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Eye,
  X,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  Building,
  ShieldAlert,
  Clock,
  Check,
  Filter,
  AlertCircle
} from 'lucide-react';

export const BodegaModule = ({ activeSubTab: externalSubTab, setActiveSubTab: externalSetSubTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Administrador';
  const isBodeguero = user?.rol === 'Bodeguero';
  const isAllowed = isAdmin || isBodeguero;

  // Notificaciones y confirmaciones del sistema
  const { toast, showToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState(null);

  const [internalSubTab, setInternalSubTab] = useState('inventario');
  const activeSubTab = externalSubTab ?? internalSubTab;
  const setActiveSubTab = externalSetSubTab ?? setInternalSubTab;

  // Arreglos de estado
  const [repuestos, setRepuestos] = useState([]);
  const [ordenesIngreso, setOrdenesIngreso] = useState([]);
  const [salidasRepuestos, setSalidasRepuestos] = useState([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);

  // Estados de carga, búsqueda y filtros
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepuestoFilter, setSelectedRepuestoFilter] = useState('');

  // Estados para modales
  const [isNewRepuestoModalOpen, setIsNewRepuestoModalOpen] = useState(false);
  const [isNewIngresoModalOpen, setIsNewIngresoModalOpen] = useState(false);
  const [isNewSalidaModalOpen, setIsNewSalidaModalOpen] = useState(false);
  const [selectedOrdenSummary, setSelectedOrdenSummary] = useState(null); // Para visualizar el resumen de la orden al hacer clic

  // Datos de formularios
  const [repuestoForm, setRepuestoForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    stock_minimo: 2,
    precio_unitario: 0.00
  });

  const [ingresoForm, setIngresoForm] = useState({
    numero_orden: '', // Número correlativo auto-incrementable ej: 61635500
    proveedor: '',
    observaciones: '',
    procesar_inmediatamente: true,
    detalles: [
      { repuesto: '', descripcion_repuesto: '', cantidad: 1, precio_unitario: 0.00 }
    ]
  });

  const [salidaForm, setSalidaForm] = useState({
    repuesto: '',
    orden_trabajo: '',
    cantidad: 1,
    observacion: ''
  });

  // Funciones para obtener datos del servidor
  const fetchRepuestos = async () => {
    try {
      const res = await bodegaService.getRepuestos({ search: searchTerm });
      setRepuestos(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar repuestos:", err);
      setRepuestos([]);
    }
  };

  const fetchOrdenesIngreso = async () => {
    try {
      const res = await bodegaService.getOrdenesIngreso({ search: searchTerm });
      setOrdenesIngreso(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar órdenes de ingreso:", err);
      setOrdenesIngreso([]);
    }
  };

  const fetchSalidasRepuestos = async () => {
    try {
      const res = await bodegaService.getSalidasRepuestos({ search: searchTerm });
      setSalidasRepuestos(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar salidas de repuestos:", err);
      setSalidasRepuestos([]);
    }
  };

  const fetchOrdenesTrabajo = async () => {
    try {
      const res = await bodegaService.getOrdenesTrabajo();
      setOrdenesTrabajo(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar órdenes de trabajo:", err);
      setOrdenesTrabajo([]);
    }
  };

  const loadCurrentTabData = async () => {
    setLoading(true);
    if (activeSubTab === 'inventario') {
      await fetchRepuestos();
    } else if (activeSubTab === 'ingresos') {
      await fetchOrdenesIngreso();
      await fetchRepuestos();
    } else if (activeSubTab === 'salidas') {
      await fetchSalidasRepuestos();
      await fetchRepuestos();
      await fetchOrdenesTrabajo();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAllowed) {
      loadCurrentTabData();
    }
  }, [activeSubTab, searchTerm, isAllowed]);

  if (!isAllowed) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <ShieldAlert size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.5rem' }}>
          Acceso Restringido
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          El Módulo de Bodega está reservado únicamente para el personal con rol de <strong>Bodeguero</strong> o <strong>Administrador</strong>.
        </p>
      </div>
    );
  }

  // --- Controladores para Modal de Nuevo Repuesto ---
  const handleOpenNewRepuestoModal = async () => {
    try {
      const res = await bodegaService.getSiguienteCodigo();
      setRepuestoForm({
        codigo: res.data.siguiente_codigo || res.data.siguiente_sku || '100192',
        nombre: '',
        descripcion: '',
        stock_minimo: 2,
        precio_unitario: 0.00
      });
    } catch (e) {
      setRepuestoForm({ codigo: '100192', nombre: '', descripcion: '', stock_minimo: 2, precio_unitario: 0.00 });
    }
    setIsNewRepuestoModalOpen(true);
  };

  const handleSaveRepuesto = async (e) => {
    e.preventDefault();
    try {
      await bodegaService.crearRepuesto(repuestoForm);
      showToast('success', "Repuesto registrado exitosamente en el inventario.");
      setIsNewRepuestoModalOpen(false);
      fetchRepuestos();
    } catch (err) {
      showToast('error', err.response?.data?.detail || "Error al registrar el repuesto.");
    }
  };

  // --- Controladores para Modal de Nueva Orden de Ingreso ---
  const handleOpenNewIngresoModal = async () => {
    await fetchRepuestos();
    try {
      const res = await bodegaService.getSiguienteCorrelativoIngreso();
      setIngresoForm({
        numero_orden: res.data.siguiente_correlativo || '61635500',
        proveedor: '',
        observaciones: '',
        procesar_inmediatamente: true,
        detalles: [{ repuesto: '', descripcion_repuesto: '', cantidad: 1, precio_unitario: 0.00 }]
      });
    } catch (e) {
      setIngresoForm({
        numero_orden: '61635500',
        proveedor: '',
        observaciones: '',
        procesar_inmediatamente: true,
        detalles: [{ repuesto: '', descripcion_repuesto: '', cantidad: 1, precio_unitario: 0.00 }]
      });
    }
    setIsNewIngresoModalOpen(true);
  };

  const handleAddIngresoDetailRow = () => {
    setIngresoForm({
      ...ingresoForm,
      detalles: [
        ...ingresoForm.detalles,
        { repuesto: '', descripcion_repuesto: '', cantidad: 1, precio_unitario: 0.00 }
      ]
    });
  };

  const handleRemoveIngresoDetailRow = (index) => {
    const updated = [...ingresoForm.detalles];
    updated.splice(index, 1);
    setIngresoForm({ ...ingresoForm, detalles: updated });
  };

  const handleIngresoDetailChange = (index, field, value) => {
    const updated = [...ingresoForm.detalles];
    updated[index][field] = value;

    if (field === 'repuesto' && value) {
      const selectedRep = repuestos.find(r => r.id_repuesto === parseInt(value));
      if (selectedRep) {
        updated[index].descripcion_repuesto = selectedRep.descripcion || selectedRep.nombre;
        updated[index].precio_unitario = selectedRep.precio_unitario || 0.00;
      }
    }
    setIngresoForm({ ...ingresoForm, detalles: updated });
  };

  const handleSaveOrdenIngreso = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('warning', "Solo el Administrador puede generar la orden de ingreso.");
      return;
    }
    try {
      await bodegaService.crearOrdenIngreso(ingresoForm);
      showToast('success', "Orden de ingreso generada exitosamente.");
      setIsNewIngresoModalOpen(false);
      fetchOrdenesIngreso();
      fetchRepuestos();
    } catch (err) {
      showToast('error', err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Error al crear la orden de ingreso.");
    }
  };

  const handleProcesarIngresoBodega = async (ordenId) => {
    try {
      const res = await bodegaService.procesarIngreso(ordenId);
      showToast('success', `¡Ingreso efectuado correctamente! Se ingresaron los repuestos de la orden #${res.data.numero_orden} al inventario.`);
      setSelectedOrdenSummary(null);
      fetchOrdenesIngreso();
      fetchRepuestos();
    } catch (err) {
      showToast('error', err.response?.data?.detail || "Error al procesar el ingreso a bodega.");
    }
  };

  // --- Controladores: Salida de Repuestos ---
  const handleSaveSalida = async (e) => {
    e.preventDefault();
    try {
      await bodegaService.crearSalidaRepuesto(salidaForm);
      showToast('success', "Salida de repuesto procesada exitosamente.");
      setIsNewSalidaModalOpen(false);
      setSalidaForm({ repuesto: '', orden_trabajo: '', cantidad: 1, observacion: '' });
      fetchSalidasRepuestos();
      fetchRepuestos();
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Error al registrar la salida de repuesto.";
      showToast('error', detail);
    }
  };

  // --- EXPORTACIÓN A EXCEL ---
  const exportToExcel = () => {
    if (repuestos.length === 0) {
      showToast('warning', "No hay repuestos en el inventario para exportar.");
      return;
    }

    const headers = ["Código", "Nombre Repuesto", "Descripción", "Stock Actual", "Estado Stock", "Precio Unitario (Q)"];
    const rows = filteredRepuestos.map(r => {
      let estado = 'Normal';
      if (r.stock <= 2) estado = 'Stock Bajo';

      return [
        `"${r.codigo || ''}"`,
        `"${r.nombre.replace(/"/g, '""')}"`,
        `"${(r.descripcion || '').replace(/"/g, '""')}"`,
        r.stock,
        `"${estado}"`,
        `Q${Number(r.precio_unitario).toFixed(2)}`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Inventario_Bodega_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Lógica de filtrado de datos
  const filteredRepuestos = repuestos.filter(r => {
    if (selectedRepuestoFilter && r.id_repuesto !== parseInt(selectedRepuestoFilter)) {
      return false;
    }
    return true;
  });

  const filteredOrdenesIngreso = ordenesIngreso.filter(oi => {
    if (selectedRepuestoFilter) {
      return oi.detalles?.some(d => d.repuesto === parseInt(selectedRepuestoFilter));
    }
    return true;
  });

  const filteredSalidasRepuestos = salidasRepuestos.filter(s => {
    if (selectedRepuestoFilter && s.repuesto !== parseInt(selectedRepuestoFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="bodega-container">
      {/* Encabezado dinámico de impresión (visible solo al imprimir) */}
      <div className="print-only-header">
        <h2>REPORTE DE INVENTARIO DE BODEGA</h2>
        <p>Fecha de emisión: {new Date().toLocaleDateString('es-SV')} {new Date().toLocaleTimeString('es-SV')}</p>
        <p>Generado por: {user?.nombre} {user?.apellido} ({user?.rol})</p>
        <hr style={{ margin: '0.75rem 0' }} />
      </div>

      {/* Encabezado y pestañas de navegación */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Package size={22} style={{ color: 'var(--yellow)' }} />
            Módulo de Bodega de Repuestos
          </h1>
        </div>

        {/* Botones de acción según la pestaña activa */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {activeSubTab === 'inventario' && (
            <>
              <button className="btn-secondary" onClick={exportToExcel} title="Exportar inventario a Excel (CSV)">
                <FileSpreadsheet size={15} style={{ color: 'var(--success)' }} />
                <span>Exportar Excel</span>
              </button>

              <button className="btn-secondary" onClick={handlePrintPDF} title="Imprimir / Exportar PDF">
                <Printer size={15} />
                <span>Imprimir / PDF</span>
              </button>

              <button className="btn-primary" onClick={handleOpenNewRepuestoModal}>
                <PlusCircle size={15} />
                <span>Nuevo Repuesto</span>
              </button>
            </>
          )}

          {activeSubTab === 'ingresos' && isAdmin && (
            <button className="btn-primary" onClick={handleOpenNewIngresoModal}>
              <ArrowDownRight size={15} />
              <span>Generar Orden de Ingreso</span>
            </button>
          )}

          {activeSubTab === 'salidas' && (
            <button className="btn-primary" onClick={() => { fetchRepuestos(); fetchOrdenesTrabajo(); setIsNewSalidaModalOpen(true); }}>
              <ArrowUpRight size={15} />
              <span>Registrar Salida de Repuesto</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de filtros y búsqueda */}
      <div className="card no-print" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="input-container" style={{ flex: 1, minWidth: '220px' }}>
          <Search className="input-icon" size={15} />
          <input
            type="text"
            className="form-input"
            placeholder={
              activeSubTab === 'inventario' ? "Buscar repuesto por nombre, código o descripción..." :
              activeSubTab === 'ingresos' ? "Buscar ingreso por número correlativo, proveedor..." :
              "Buscar salida por repuesto, N° de orden de trabajo..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtro específico para Productos/Repuestos */}
        <div style={{ flex: '1 1 200px', minWidth: '180px', maxWidth: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={15} style={{ color: 'var(--yellow)' }} />
          <select
            className="form-select"
            value={selectedRepuestoFilter}
            onChange={(e) => setSelectedRepuestoFilter(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">Todos los productos</option>
            {repuestos.map(r => (
              <option key={r.id_repuesto} value={r.id_repuesto}>
                Código #{r.codigo || r.id_repuesto} - {r.nombre}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-secondary" onClick={loadCurrentTabData} style={{ padding: '0.5rem' }} title="Recargar">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* PESTAÑA 1: INVENTARIO */}
      {activeSubTab === 'inventario' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre del Repuesto</th>
                  <th>Descripción</th>
                  <th style={{ textAlign: 'center' }}>Stock Actual</th>
                  <th>Estado Stock</th>
                  <th style={{ textAlign: 'right' }}>Precio Unit. (Q)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Cargando inventario...
                    </td>
                  </tr>
                ) : filteredRepuestos.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No se encontraron repuestos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredRepuestos.map((r) => {
                    const isLowStock = r.stock <= 2;
                    const stockBadge = isLowStock ? (
                      <span style={{ color: 'var(--yellow)', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <AlertTriangle size={13} /> Stock Bajo
                      </span>
                    ) : (
                      <span style={{ color: 'var(--success)', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={13} /> Normal
                      </span>
                    );

                    return (
                      <tr key={r.id_repuesto}>
                        <td style={{ fontWeight: 700, color: 'var(--yellow)' }}>{r.codigo || r.id_repuesto}</td>
                        <td style={{ fontWeight: 600, color: 'var(--white)' }}>{r.nombre}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.descripcion || '—'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1rem', color: isLowStock ? 'var(--yellow)' : 'var(--white)' }}>
                          {r.stock}
                        </td>
                        <td>{stockBadge}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>Q{Number(r.precio_unitario).toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: INGRESOS DE REPUESTOS */}
      {activeSubTab === 'ingresos' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>N° Orden Correlativo</th>
                  <th>Proveedor</th>
                  <th>Estado Ingreso</th>
                  <th>Generada Por</th>
                  <th>Ingresada Por</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Cargando órdenes de ingreso...
                    </td>
                  </tr>
                ) : filteredOrdenesIngreso.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No se encontraron órdenes de ingreso registradas.
                    </td>
                  </tr>
                ) : (
                  filteredOrdenesIngreso.map((oi) => (
                    <tr
                      key={oi.id_orden_ingreso}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedOrdenSummary(oi)}
                    >
                      <td style={{ fontWeight: 700, color: 'var(--yellow)' }}>
                        #{oi.numero_orden}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--white)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Building size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>{oi.proveedor}</span>
                        </div>
                      </td>
                      <td>
                        {oi.estado === 'Ingresado' ? (
                          <span style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={12} /> Ingresado a Bodega
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} /> Pendiente de Ingreso
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{oi.creado_por_nombre}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{oi.ingresado_por_nombre}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrdenSummary(oi);
                            }}
                          >
                            <Eye size={13} />
                            <span>Ver Resumen</span>
                          </button>

                          {oi.estado === 'Pendiente' && (
                            <button
                              className="btn-primary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', backgroundColor: 'var(--success)', borderColor: 'transparent' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProcesarIngresoBodega(oi.id_orden_ingreso);
                              }}
                              title="Efectuar el ingreso físico de repuestos al inventario de bodega"
                            >
                              <Check size={13} />
                              <span>Ingresar Repuestos</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: SALIDAS DE REPUESTOS */}
      {activeSubTab === 'salidas' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Repuesto Entregado</th>
                  <th>Orden de Trabajo</th>
                  <th style={{ textAlign: 'center' }}>Cantidad Despachada</th>
                  <th>Observación</th>
                  <th>Registrado Por</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Cargando salidas de repuestos...
                    </td>
                  </tr>
                ) : filteredSalidasRepuestos.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No se han registrado salidas de repuestos.
                    </td>
                  </tr>
                ) : (
                  filteredSalidasRepuestos.map((s) => (
                    <tr key={s.id_salida}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(s.fecha).toLocaleDateString('es-SV', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--white)' }}>{s.repuesto_nombre}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--yellow)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Wrench size={13} /> #{s.orden_trabajo_numero}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--danger)' }}>
                        -{s.cantidad}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.observacion || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{s.registrado_por_nombre}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: RESUMEN DE ORDEN DE INGRESO */}
      <ModalResumenOrden
        orden={selectedOrdenSummary}
        onClose={() => setSelectedOrdenSummary(null)}
        onProcesarIngreso={handleProcesarIngresoBodega}
      />

      {/* MODAL 2: NUEVA ORDEN DE INGRESO (SOLO ADMINISTRADOR) */}
      <ModalNuevaOrden
        isOpen={isNewIngresoModalOpen && isAdmin}
        onClose={() => setIsNewIngresoModalOpen(false)}
        ingresoForm={ingresoForm}
        setIngresoForm={setIngresoForm}
        repuestos={repuestos}
        onSubmit={handleSaveOrdenIngreso}
        onAddDetailRow={handleAddIngresoDetailRow}
        onRemoveDetailRow={handleRemoveIngresoDetailRow}
        onDetailChange={handleIngresoDetailChange}
      />

      {/* MODAL 3: REGISTRAR SALIDA DE REPUESTO (ENLAZADO A ORDEN DE TRABAJO) */}
      <ModalSalidaRepuesto
        isOpen={isNewSalidaModalOpen}
        onClose={() => setIsNewSalidaModalOpen(false)}
        salidaForm={salidaForm}
        setSalidaForm={setSalidaForm}
        ordenesTrabajo={ordenesTrabajo}
        repuestos={repuestos}
        onSubmit={handleSaveSalida}
      />

      {/* MODAL 4: REGISTRO DE NUEVO REPUESTO AL CATÁLOGO */}
      <ModalNuevoRepuesto
        isOpen={isNewRepuestoModalOpen}
        onClose={() => setIsNewRepuestoModalOpen(false)}
        repuestoForm={repuestoForm}
        setRepuestoForm={setRepuestoForm}
        onSubmit={handleSaveRepuesto}
      />

      {/* DIÁLOGO CONFIRMACIÓN GENERAL DEL SISTEMA */}
      <ConfirmDialog dialog={confirmDialog} onCancel={() => setConfirmDialog(null)} />

      {/* NOTIFICACIÓN TOAST DEL SISTEMA */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

    </div>
  );
};

export default BodegaModule;
