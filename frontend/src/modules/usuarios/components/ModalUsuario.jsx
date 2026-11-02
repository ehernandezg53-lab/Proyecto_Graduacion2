import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export const ModalUsuario = ({
  isOpen,
  onClose,
  editingUser,
  formData,
  setFormData,
  handleNombreChange,
  handleApellidoChange,
  handleUsernameChange,
  roles,
  userFormError,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px', width: '92%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', margin: 0 }}>
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {userFormError && (
            <div className="alert-error" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', padding: '0.6rem 0.75rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{userFormError}</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '0.6rem' }}
                value={formData.nombre}
                onChange={handleNombreChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Apellido</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '0.6rem' }}
                value={formData.apellido}
                onChange={handleApellidoChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre de Usuario (Login)</label>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '0.6rem' }}
              value={formData.username}
              onChange={handleUsernameChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '0.6rem' }}
                placeholder="7000-0000"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rol del Sistema</label>
              <select
                className="form-select"
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                required
              >
                <option value="">Seleccionar rol...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {!editingUser && (
            <div className="form-group">
              <label className="form-label">Contraseña Inicial</label>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '0.6rem' }}
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              {editingUser ? 'Guardar' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
