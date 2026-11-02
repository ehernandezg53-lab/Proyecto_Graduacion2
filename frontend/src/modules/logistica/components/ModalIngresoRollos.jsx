import React from 'react';
import { Download, X } from 'lucide-react';

export const ModalIngresoRollos = ({
  isOpen,
  onClose,
  ingresoRolloForm,
  setIngresoRolloForm,
  tiposAlambre,
  onSubmit
}) => {
  if (!isOpen) return null;

  const selectedWire = tiposAlambre.find(t => t.codigo === ingresoRolloForm.codigo_alambre) || tiposAlambre[0];
  const pesoUnit = parseFloat(selectedWire?.peso_estandar_kg || 50);
  const totalPeso = (ingresoRolloForm.cantidad || 0) * pesoUnit;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} style={{ color: 'var(--blue)' }} />
            Ingreso a Bodega de Rollos (Código Existente)
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {/* Selector de Código Existente */}
          <div className="form-group">
            <label className="form-label">Código de Alambre</label>
            <select
              className="form-input"
              value={ingresoRolloForm.codigo_alambre}
              onChange={(e) => {
                const selected = tiposAlambre.find(t => t.codigo === e.target.value);
                setIngresoRolloForm({
                  ...ingresoRolloForm,
                  codigo_alambre: e.target.value,
                  ubicacion: selected?.ubicacion_defecto || ingresoRolloForm.ubicacion
                });
              }}
              style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)' }}
              required
            >
              {tiposAlambre.map((t) => (
                <option key={t.id_tipo || t.codigo} value={t.codigo}>
                  [{t.codigo}] {t.nombre}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Catálogo oficial de códigos</span>
          </div>

          {/* Datos técnicos autocompletados (Solo Lectura) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem', marginBottom: '1rem', backgroundColor: 'var(--bg-element)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Tipo de Alambre
              </span>
              <strong style={{ fontSize: '0.88rem', color: 'var(--white)' }}>
                {selectedWire?.nombre || '—'}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Peso Estándar Unitario
              </span>
              <strong style={{ fontSize: '0.88rem', color: 'var(--yellow)' }}>
                {Number(selectedWire?.peso_estandar_kg || 50).toFixed(2)} kg
              </strong>
            </div>
          </div>

          {/* Cantidad y Ubicación */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Cantidad de Rollos a Ingresar</label>
              <input
                type="number"
                min="1"
                max="500"
                className="form-input"
                value={ingresoRolloForm.cantidad}
                onChange={(e) => setIngresoRolloForm({ ...ingresoRolloForm, cantidad: parseInt(e.target.value) || 1 })}
                required
                style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--blue)' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rollos que ingresan a bodega</span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Ubicación / Bahía en Bodega</label>
              <input
                type="text"
                className="form-input"
                value={ingresoRolloForm.ubicacion}
                onChange={(e) => setIngresoRolloForm({ ...ingresoRolloForm, ubicacion: e.target.value })}
                required
                style={{ paddingLeft: '0.6rem' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lugar de almacenamiento</span>
            </div>
          </div>

          {/* Resumen Calculado */}
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-element)', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Peso Total del Ingreso:</span>
            <strong style={{ fontSize: '1rem', color: 'var(--yellow)' }}>
              {totalPeso.toLocaleString()} kg
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--blue)' }}
            >
              <Download size={16} />
              Registrar Ingreso a Bodega
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
