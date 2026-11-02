import React from 'react';
import { Truck, X, Layers, AlertCircle, CheckSquare, Square } from 'lucide-react';
import CustomSelect from '@/components/common/CustomSelect';

export const ModalProgramarViaje = ({
  isOpen,
  onClose,
  viajeForm,
  setViajeForm,
  vehiculos,
  clientes,
  conductores,
  rollosDisponibles,
  selectedRollosIds,
  onToggleRolloSelection,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={20} style={{ color: 'var(--blue)' }} />
            Programar Nuevo Viaje
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Número de Viaje</label>
              <input
                type="text"
                className="form-input"
                value={viajeForm.numero_viaje}
                readOnly
                title="Correlativo asignado automáticamente"
                style={{ fontWeight: 700, color: 'var(--yellow)', paddingLeft: '0.6rem', cursor: 'default' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Correlativo generado automáticamente</span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Unidad</label>
              <CustomSelect
                options={[
                  { value: '', label: '-- Seleccionar Unidad --' },
                  ...vehiculos.map(v => ({
                    value: v.id_vehiculo,
                    label: v.activo !== false
                      ? `${v.placa} (${v.unidad || v.modelo || 'Unidad'}) - Activo`
                      : `${v.placa} (${v.unidad || v.modelo || 'Unidad'}) - ⛔ Inactivo (No disponible)`
                  }))
                ]}
                value={viajeForm.vehiculo}
                onChange={(e) => setViajeForm({ ...viajeForm, vehiculo: e.target.value })}
                placeholder="-- Seleccionar Unidad --"
                required
                maxHeight={180}
              />
              {(() => {
                const selVeh = vehiculos.find(v => String(v.id_vehiculo) === String(viajeForm.vehiculo));
                if (selVeh && selVeh.activo === false) {
                  return (
                    <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', fontWeight: 600 }}>
                      ⚠️ Esta unidad está inactiva y no se puede generar el viaje con ella.
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cliente</label>
            <CustomSelect
              options={[
                { value: '', label: '-- Seleccionar Cliente --' },
                ...clientes.map(c => ({
                  value: c.id_cliente,
                  label: `${c.numero_cliente} - ${c.nombre}`
                }))
              ]}
              value={viajeForm.cliente}
              onChange={(e) => setViajeForm({ ...viajeForm, cliente: e.target.value })}
              placeholder="-- Seleccionar Cliente --"
              required
              maxHeight={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Conductor Asignado</label>
            <CustomSelect
              options={[
                { value: '', label: '-- Seleccionar Conductor --' },
                ...conductores.map(c => ({
                  value: c.id_conductor,
                  label: `${c.nombre}${c.codigo_carnet ? ` - Carnet: ${c.codigo_carnet}` : ''}`
                }))
              ]}
              value={viajeForm.conductor}
              onChange={(e) => setViajeForm({ ...viajeForm, conductor: e.target.value })}
              placeholder="-- Seleccionar Conductor --"
              required
              maxHeight={180}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Fecha del Envío</label>
              <input
                type="date"
                className="form-input"
                value={viajeForm.fecha_envio}
                onChange={(e) => setViajeForm({ ...viajeForm, fecha_envio: e.target.value })}
                required
                style={{ paddingLeft: '0.6rem' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Hora del Envío</label>
              <input
                type="time"
                className="form-input"
                value={viajeForm.hora_envio}
                onChange={(e) => setViajeForm({ ...viajeForm, hora_envio: e.target.value })}
                style={{ paddingLeft: '0.6rem' }}
              />
            </div>
          </div>

          {/* Asignación interactiva de Rollos de Alambre */}
          <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem', padding: '0.85rem', backgroundColor: 'var(--bg-element)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} style={{ color: 'var(--yellow)' }} />
                Asignación de Rollos de Alambre ({selectedRollosIds.length} seleccionados)
              </label>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, backgroundColor: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                {rollosDisponibles.length} disponibles en bodega
              </span>
            </div>

            {/* Lista seleccionable de rollos disponibles para selección libre */}
            {rollosDisponibles.length === 0 ? (
              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px dashed #ef4444', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', color: '#f87171' }}>
                <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                No hay rollos disponibles en bodega. Puede registrar nuevos lotes en la pestaña <strong>Control de Rollos</strong>.
              </div>
            ) : (
              <div style={{ maxHeight: '185px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--bg-base)' }}>
                {rollosDisponibles.map((r) => {
                  const isSelected = selectedRollosIds.includes(r.id_rollo);
                  return (
                    <div
                      key={r.id_rollo}
                      onClick={() => onToggleRolloSelection(r)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0.65rem',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        transition: 'background-color 0.1s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        {isSelected ? (
                          <CheckSquare size={16} style={{ color: 'var(--blue)' }} />
                        ) : (
                          <Square size={16} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <span style={{ fontWeight: 700, color: isSelected ? 'var(--blue)' : 'var(--yellow)', fontSize: '0.82rem' }}>
                          {r.codigo_rollo}
                        </span>
                        <span style={{ color: 'var(--white)', fontSize: '0.78rem' }}>
                          {r.tipo_alambre}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{r.ubicacion || 'Bodega'}</span>
                        <strong style={{ color: 'var(--white)' }}>{Number(r.peso_kg || 0).toFixed(1)} kg</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Resumen calculado automático */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', margin: '0 0 0.2rem 0' }}>Rollos Asignados</label>
                <input
                  type="number"
                  className="form-input"
                  value={viajeForm.cantidad_rollos}
                  readOnly
                  style={{ fontWeight: 700, color: 'var(--blue)', paddingLeft: '0.6rem', backgroundColor: 'var(--bg-base)', cursor: 'default' }}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', margin: '0 0 0.2rem 0' }}>Peso Total Carga (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={viajeForm.peso_carga_kg}
                  onChange={(e) => setViajeForm({ ...viajeForm, peso_carga_kg: parseFloat(e.target.value) || 0 })}
                  style={{ fontWeight: 700, color: 'var(--white)', paddingLeft: '0.6rem' }}
                />
              </div>
            </div>
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
              Guardar Viaje
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
