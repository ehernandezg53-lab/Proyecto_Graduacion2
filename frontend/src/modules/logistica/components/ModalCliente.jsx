import React from 'react';
import { Building, X } from 'lucide-react';

export const ModalCliente = ({
  isOpen,
  onClose,
  clienteForm,
  setClienteForm,
  editingClienteId,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={20} style={{ color: 'var(--blue)' }} />
            {editingClienteId ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Número / Código de Cliente</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="form-input"
              style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)' }}
              placeholder="Solo números"
              value={clienteForm.numero_cliente}
              onChange={(e) => setClienteForm({ ...clienteForm, numero_cliente: e.target.value.replace(/\D/g, '') })}
              onKeyDown={(e) => {
                if (
                  !/^\d$/.test(e.key) &&
                  !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'].includes(e.key) &&
                  !(e.ctrlKey || e.metaKey)
                ) {
                  e.preventDefault();
                }
              }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nombre del Cliente / Empresa</label>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '0.6rem' }}
              value={clienteForm.nombre}
              onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dirección</label>
            <textarea
              className="form-input"
              rows="3"
              style={{ padding: '0.6rem', resize: 'vertical' }}
              value={clienteForm.direccion}
              onChange={(e) => setClienteForm({ ...clienteForm, direccion: e.target.value })}
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
              {editingClienteId ? 'Guardar Cambios' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
