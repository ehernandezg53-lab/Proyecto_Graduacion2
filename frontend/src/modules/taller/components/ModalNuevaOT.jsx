import React from 'react';
import { Wrench, X } from 'lucide-react';
import CustomSelect from '@/components/common/CustomSelect';

export const ModalNuevaOT = ({
  isOpen,
  onClose,
  otForm,
  setOtForm,
  vehiculos,
  mecanicos,
  handleMecanicoSelectChange,
  handleAreaSelectChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  const mecsDisponibles = (otForm.area_asignada && otForm.area_asignada !== 'General')
    ? mecanicos.filter(m => m.area === otForm.area_asignada)
    : mecanicos;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={20} style={{ color: 'var(--blue)' }} />
            Crear Nueva Orden de Trabajo (OT)
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Correlativo OT</label>
              <input
                type="text"
                className="form-input"
                value={otForm.numero_orden}
                onChange={(e) => setOtForm({ ...otForm, numero_orden: e.target.value })}
                required
                style={{ fontWeight: 700, color: 'var(--yellow)', paddingLeft: '0.6rem' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Vehículo de Flotilla</label>
              <CustomSelect
                options={[
                  { value: '', label: '-- Seleccionar Vehículo --' },
                  ...vehiculos.map((v) => ({
                    value: v.id_vehiculo,
                    label: `${v.placa} - ${v.modelo || 'Sin modelo'} (${v.estado})`
                  }))
                ]}
                value={otForm.vehiculo}
                onChange={(e) => setOtForm({ ...otForm, vehiculo: e.target.value })}
                placeholder="-- Seleccionar Vehículo --"
                required
                maxHeight={200}
              />
            </div>
          </div>

          {/* Selección de Mecánico del Taller (Filtrado dinámicamente por área seleccionada) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Mecánico Asignado</label>
              <CustomSelect
                options={[
                  { value: '', label: mecsDisponibles.length > 0 ? '-- Seleccionar Mecánico --' : '-- Sin mecánicos en esta área --' },
                  ...mecsDisponibles.map((m) => ({
                    value: m.id_mecanico,
                    label: `${m.nombre} (${m.area})`
                  }))
                ]}
                value={otForm.mecanico}
                onChange={handleMecanicoSelectChange}
                placeholder="-- Seleccionar Mecánico --"
                maxHeight={200}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Área de Trabajo / Especialidad</label>
              <select
                className="form-select"
                value={otForm.area_asignada}
                onChange={handleAreaSelectChange}
              >
                <option value="Soldadura">Soldadura</option>
                <option value="Electromecánico">Electromecánico</option>
                <option value="Tapicería">Tapicería</option>
                <option value="Llantero">Llantero</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Estado Inicial de la Orden</label>
            <select
              className="form-select"
              value={otForm.estado}
              onChange={(e) => setOtForm({ ...otForm, estado: e.target.value })}
            >
              <option value="Abierta">Abierta</option>
              <option value="Cerrada">Cerrada</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción del Mantenimiento / Trabajo Requerido</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Describa el trabajo a realizar en el vehículo..."
              value={otForm.descripcion}
              onChange={(e) => setOtForm({ ...otForm, descripcion: e.target.value })}
              style={{ resize: 'vertical', padding: '0.6rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
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
              style={{ flex: 1 }}
            >
              Crear Orden de Trabajo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
