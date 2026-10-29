import React, { useState, useEffect, useRef } from 'react';
import { bodegaService } from '@/services/bodegaService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import CustomSelect from '@/components/common/CustomSelect';
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

  // State arrays
  const [repuestos, setRepuestos] = useState([]);
  const [ordenesIngreso, setOrdenesIngreso] = useState([]);
  const [salidasRepuestos, setSalidasRepuestos] = useState([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);

  // Loaders & search/filters
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepuestoFilter, setSelectedRepuestoFilter] = useState('');

  // Modals
  const [isNewRepuestoModalOpen, setIsNewRepuestoModalOpen] = useState(false);
  const [isNewIngresoModalOpen, setIsNewIngresoModalOpen] = useState(false);
  const [isNewSalidaModalOpen, setIsNewSalidaModalOpen] = useState(false);
  const [selectedOrdenSummary, setSelectedOrdenSummary] = useState(null); // For viewing order summary on click

  // Forms data
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

  // Fetch data functions
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

  // --- Handlers para Modal de Nuevo Repuesto ---
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

  // --- Handlers para Modal de Nueva Orden de Ingreso ---
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

  // --- Handlers: Salida de Repuestos ---
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

  // --- EXPORTACIÓN A EXCEL (CSV UTF-8) ---
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

  // Filtered data logic
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
      {/* Dynamic Print Header (visible only on print) */}
      <div className="print-only-header">
        <h2>REPORTE DE INVENTARIO DE BODEGA</h2>
        <p>Fecha de emisión: {new Date().toLocaleDateString('es-SV')} {new Date().toLocaleTimeString('es-SV')}</p>
        <p>Generado por: {user?.nombre} {user?.apellido} ({user?.rol})</p>
        <hr style={{ margin: '0.75rem 0' }} />
      </div>

      {/* Header & Sub-navigation tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Package size={22} style={{ color: 'var(--yellow)' }} />
            Módulo de Bodega de Repuestos
          </h1>
        </div>

        {/* Action button based on active tab */}
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

      {/* Filter & Search Bar */}
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
        <div style={{ minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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

      {/* TAB 1: INVENTARIO */}
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

      {/* TAB 2: INGRESOS DE REPUESTOS */}
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

      {/* TAB 3: SALIDAS DE REPUESTOS */}
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
      {selectedOrdenSummary && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ArrowDownRight size={18} style={{ color: 'var(--success)' }} />
                  Resumen de Orden de Ingreso #{selectedOrdenSummary.numero_orden}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Detalles del proveedor, repuesto y cantidades
                </p>
              </div>
              <button onClick={() => setSelectedOrdenSummary(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Datos Principales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', backgroundColor: 'var(--bg-element)', padding: '0.85rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  Proveedor
                </span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
                  {selectedOrdenSummary.proveedor}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  N° Orden Correlativo
                </span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--yellow)' }}>
                  #{selectedOrdenSummary.numero_orden}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  Generada Por
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedOrdenSummary.creado_por_nombre}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  Estado de Ingreso
                </span>
                <span style={{ fontSize: '0.85rem', color: selectedOrdenSummary.estado === 'Ingresado' ? 'var(--success)' : 'var(--yellow)', fontWeight: 600 }}>
                  {selectedOrdenSummary.estado === 'Ingresado' ? `Ingresado por ${selectedOrdenSummary.ingresado_por_nombre}` : 'Pendiente de Ingreso'}
                </span>
              </div>
            </div>

            {selectedOrdenSummary.observaciones && (
              <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Observaciones:</strong> {selectedOrdenSummary.observaciones}
              </div>
            )}

            {/* Tabla con el Detalle del Repuesto y la Cantidad */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--white)' }}>
              Repuestos de la Orden de Ingreso:
            </h4>
            <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th>Descripción del Repuesto</th>
                    <th style={{ textAlign: 'center' }}>Cantidad</th>
                    <th style={{ textAlign: 'right' }}>Precio Unit. (Q)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrdenSummary.detalles && selectedOrdenSummary.detalles.length > 0 ? (
                    selectedOrdenSummary.detalles.map((det, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--white)' }}>{det.repuesto_nombre}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{det.descripcion_repuesto}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success)' }}>+{det.cantidad}</td>
                        <td style={{ textAlign: 'right' }}>Q{Number(det.precio_unitario || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                        Sin detalle de repuestos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => setSelectedOrdenSummary(null)}>
                Cerrar Resumen
              </button>

              {selectedOrdenSummary.estado === 'Pendiente' && (
                <button
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.8rem', backgroundColor: 'var(--success)', borderColor: 'transparent' }}
                  onClick={() => handleProcesarIngresoBodega(selectedOrdenSummary.id_orden_ingreso)}
                >
                  <Check size={14} /> Ingresar Repuestos
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NUEVA ORDEN DE INGRESO (SOLO ADMINISTRADOR) */}
      {isNewIngresoModalOpen && isAdmin && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowDownRight size={18} style={{ color: 'var(--success)' }} />
                Generar Orden de Ingreso
              </h3>
              <button onClick={() => setIsNewIngresoModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveOrdenIngreso}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div className="form-group">
                  <label className="form-label">Número de Orden Correlativo *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. 61635500"
                    style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)' }}
                    value={ingresoForm.numero_orden}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, numero_orden: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Proveedor *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Distribuidora Central de Repuestos"
                    style={{ paddingLeft: '0.6rem' }}
                    value={ingresoForm.proveedor}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, proveedor: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Detalles sobre el pedido..."
                  style={{ paddingLeft: '0.6rem' }}
                  value={ingresoForm.observaciones}
                  onChange={(e) => setIngresoForm({ ...ingresoForm, observaciones: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-element)', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <input
                  type="checkbox"
                  id="proc_inm"
                  checked={ingresoForm.procesar_inmediatamente}
                  onChange={(e) => setIngresoForm({ ...ingresoForm, procesar_inmediatamente: e.target.checked })}
                />
                <label htmlFor="proc_inm" style={{ fontSize: '0.82rem', cursor: 'pointer', color: 'var(--white)', fontWeight: 600 }}>
                  Ingresar repuestos a bodega inmediatamente al generar la orden
                </label>
              </div>

              <hr style={{ margin: '1rem 0', borderColor: 'var(--border)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Repuestos e Ítems de la Orden *</label>
                <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }} onClick={handleAddIngresoDetailRow}>
                  <PlusCircle size={13} /> Añadir Repuesto
                </button>
              </div>

              {ingresoForm.detalles.map((det, idx) => (
                <div key={idx} style={{ backgroundColor: 'var(--bg-element)', padding: '0.65rem', borderRadius: 'var(--radius)', marginBottom: '0.5rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 0.8fr 0.8fr auto', gap: '0.4rem', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Repuesto</label>
                      <select
                        className="form-select"
                        style={{ fontSize: '0.8rem', padding: '0.35rem' }}
                        value={det.repuesto}
                        onChange={(e) => handleIngresoDetailChange(idx, 'repuesto', e.target.value)}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {repuestos.map(r => (
                          <option key={r.id_repuesto} value={r.id_repuesto}>[{r.codigo || r.id_repuesto}] {r.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Descripción del Repuesto</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                        placeholder="Descripción detallada..."
                        value={det.descripcion_repuesto}
                        onChange={(e) => handleIngresoDetailChange(idx, 'descripcion_repuesto', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', textAlign: 'center' }}
                        value={det.cantidad}
                        onChange={(e) => handleIngresoDetailChange(idx, 'cantidad', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Precio Unit. (Q)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', textAlign: 'right' }}
                        value={det.precio_unitario}
                        onChange={(e) => handleIngresoDetailChange(idx, 'precio_unitario', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {ingresoForm.detalles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngresoDetailRow(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginTop: '1rem' }}
                        title="Quitar ítem"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsNewIngresoModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Generar Orden de Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTRAR SALIDA DE REPUESTO (ENLAZADO A ORDEN DE TRABAJO) */}
      {isNewSalidaModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowUpRight size={18} style={{ color: 'var(--danger)' }} />
                Registrar Salida de Repuesto
              </h3>
              <button onClick={() => setIsNewSalidaModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSalida}>
              <div className="form-group">
                <label className="form-label">Orden de Trabajo *</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Seleccionar Orden de Trabajo...' },
                    ...ordenesTrabajo.map(ot => {
                      const desc = ot.descripcion ? (ot.descripcion.length > 45 ? ot.descripcion.substring(0, 42) + '...' : ot.descripcion) : 'Sin descripción';
                      const placaInfo = ot.vehiculo_detail?.placa ? ` (${ot.vehiculo_detail.placa})` : '';
                      const isClosed = ot.estado === 'Cerrada';
                      return {
                        value: ot.id_orden,
                        label: `#${ot.numero_orden}${placaInfo} — ${desc}${isClosed ? ' [CERRADA]' : ''}`,
                        disabled: isClosed
                      };
                    })
                  ]}
                  value={salidaForm.orden_trabajo}
                  onChange={(e) => setSalidaForm({ ...salidaForm, orden_trabajo: e.target.value })}
                  placeholder="Seleccionar Orden de Trabajo..."
                  required
                  maxHeight={200}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Repuesto *</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Seleccionar Repuesto...' },
                    ...repuestos.map(r => ({
                      value: r.id_repuesto,
                      label: `[${r.codigo || r.id_repuesto}] — ${r.nombre} (Disponible: ${r.stock})${r.stock <= 0 ? ' - AGOTADO' : ''}`,
                      disabled: r.stock <= 0
                    }))
                  ]}
                  value={salidaForm.repuesto}
                  onChange={(e) => setSalidaForm({ ...salidaForm, repuesto: e.target.value })}
                  placeholder="Seleccionar Repuesto..."
                  required
                  maxHeight={200}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cantidad a Despachar *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  style={{ paddingLeft: '0.6rem' }}
                  value={salidaForm.cantidad}
                  onChange={(e) => setSalidaForm({ ...salidaForm, cantidad: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Observación / Notas</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Instalado en camión Freightliner C-89312"
                  style={{ paddingLeft: '0.6rem' }}
                  value={salidaForm.observacion}
                  onChange={(e) => setSalidaForm({ ...salidaForm, observacion: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsNewSalidaModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'transparent' }}>
                  Confirmar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REGISTRO DE NUEVO REPUESTO AL CATÁLOGO (AMPLIADO Y ESPACIOSO) */}
      {isNewRepuestoModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', padding: '1.75rem 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} style={{ color: 'var(--yellow)' }} />
                Agregar Nuevo Repuesto al Catálogo
              </h3>
              <button onClick={() => setIsNewRepuestoModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRepuesto}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.45rem' }}>Código (Auto-generado correlativo)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 100192"
                  style={{ padding: '0.65rem 0.85rem', fontWeight: 700, fontSize: '0.95rem', color: '#b45309', backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
                  value={repuestoForm.codigo}
                  onChange={(e) => setRepuestoForm({ ...repuestoForm, codigo: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.45rem' }}>Nombre del Repuesto *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Amortiguador Trasero"
                  style={{ padding: '0.65rem 0.85rem' }}
                  value={repuestoForm.nombre}
                  onChange={(e) => setRepuestoForm({ ...repuestoForm, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.45rem' }}>Descripción</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Especificaciones técnicas o compatibilidad con vehículos"
                  style={{ padding: '0.65rem 0.85rem' }}
                  value={repuestoForm.descripcion}
                  onChange={(e) => setRepuestoForm({ ...repuestoForm, descripcion: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.45rem' }}>Precio Unitario (Q)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  style={{ padding: '0.65rem 0.85rem' }}
                  value={repuestoForm.precio_unitario}
                  onChange={(e) => setRepuestoForm({ ...repuestoForm, precio_unitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div style={{ fontSize: '0.82rem', color: '#1e40af', backgroundColor: '#eff6ff', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', margin: '1.25rem 0', border: '1px solid #bfdbfe', lineHeight: '1.4' }}>
                Nota: La creación del repuesto asigna un código correlativo. El stock disponible se incrementará únicamente al procesar una Orden de Ingreso.
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.7rem 1rem', fontSize: '0.9rem' }} onClick={() => setIsNewRepuestoModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.7rem 1rem', fontSize: '0.9rem' }}>
                  Guardar Repuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIÁLOGO CONFIRMACIÓN GENERAL DEL SISTEMA (Reemplaza confirm nativo del navegador) */}
      {confirmDialog && (
        <div className="modal-overlay" style={{ zIndex: 10001 }}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '92%', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                backgroundColor: confirmDialog.confirmColor === 'var(--danger)' ? '#fee2e2' : '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: confirmDialog.confirmColor === 'var(--danger)' ? 'var(--danger)' : 'var(--blue)',
                flexShrink: 0
              }}>
                <AlertCircle size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--white)' }}>
                {confirmDialog.title}
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.35rem', lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setConfirmDialog(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{
                  flex: 1,
                  backgroundColor: confirmDialog.confirmColor || 'var(--blue)',
                  borderColor: 'transparent'
                }}
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  if (action) await action();
                }}
              >
                {confirmDialog.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN TOAST DEL SISTEMA (Reemplaza alert nativo del navegador) */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            backgroundColor: toast.type === 'success' ? '#15803d' : toast.type === 'error' ? '#b91c1c' : '#d97706',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.15)',
            fontSize: '0.875rem',
            fontWeight: 500,
            maxWidth: '440px'
          }}
        >
          {toast.type === 'success' && <CheckCircle2 size={20} style={{ flexShrink: 0 }} />}
          {toast.type === 'error' && <AlertCircle size={20} style={{ flexShrink: 0 }} />}
          {toast.type === 'warning' && <AlertCircle size={20} style={{ flexShrink: 0 }} />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              opacity: 0.85
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

    </div>
  );
};

export default BodegaModule;
