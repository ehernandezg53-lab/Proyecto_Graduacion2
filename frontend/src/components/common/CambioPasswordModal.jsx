import React, { useState } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Check,
  Circle,
  LogOut
} from 'lucide-react';

export const CambioPasswordModal = () => {
  const { user, updateUser, logout } = useAuth();
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!user || !user.cambio_temporal) {
    return null;
  }

  // --- Validaciones en tiempo real para la lista de requisitos ---
  const reqMinLength = nuevaPassword.length >= 8;
  const reqUpperLower = /[a-z]/.test(nuevaPassword) && /[A-Z]/.test(nuevaPassword);
  const reqHasNumber = /\d/.test(nuevaPassword);
  const reqNotOnlyNumbers = nuevaPassword.length > 0 && !/^\d+$/.test(nuevaPassword);

  const nombreClean = (user?.nombre || '').toLowerCase().trim();
  const apellidoClean = (user?.apellido || '').toLowerCase().trim();
  const usernameClean = (user?.username || '').toLowerCase().trim();
  const pwdLower = nuevaPassword.toLowerCase();

  const hasNameMatch =
    (nombreClean.length >= 3 && pwdLower.includes(nombreClean)) ||
    (apellidoClean.length >= 3 && pwdLower.includes(apellidoClean)) ||
    (usernameClean.length >= 3 && pwdLower.includes(usernameClean));

  const reqNoNameMatch = nuevaPassword.length > 0 && !hasNameMatch;
  const reqMatch = nuevaPassword.length > 0 && nuevaPassword === confirmarPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!passwordActual.trim()) {
      setErrorMsg('Debes ingresar tu contraseña temporal actual.');
      return;
    }

    if (!reqMinLength) {
      setErrorMsg('La contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    if (!reqUpperLower) {
      setErrorMsg('La contraseña debe contener tanto mayúsculas como minúsculas.');
      return;
    }

    if (!reqHasNumber) {
      setErrorMsg('La contraseña debe contener al menos un número.');
      return;
    }

    if (!reqNotOnlyNumbers) {
      setErrorMsg('La contraseña no puede componerse únicamente de números.');
      return;
    }

    if (!reqNoNameMatch) {
      setErrorMsg('Por motivos de seguridad, la contraseña no debe coincidir con tu nombre, apellido o usuario.');
      return;
    }

    if (!reqMatch) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifica que ambas sean idénticas.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/cambiar_password_obligatorio/', {
        password_actual: passwordActual,
        password_nueva: nuevaPassword,
        password_confirmar: confirmarPassword
      });

      setSuccessMsg(res.data.message || 'Contraseña actualizada exitosamente.');
      setTimeout(() => {
        updateUser({ cambio_temporal: false });
      }, 1200);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleCancelAndExit = () => {
    setShowExitConfirm(true);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '560px',
          width: '94%',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          padding: '1.75rem',
          maxHeight: '94vh',
          overflowY: 'auto'
        }}
      >
        {/* Cabecera del Modal */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '8px',
                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--blue)'
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--white)', margin: 0 }}>
                Cambio de Contraseña Obligatorio
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.15rem' }}>
                Primer inicio de sesión detectado en Sistema de Gestión TM
              </p>
            </div>
          </div>
        </div>

        {/* Banner de Aviso de Seguridad */}
        <div
          style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#fff1f2',
            borderRadius: '6px',
            border: '1px solid #fecdd3',
            marginBottom: '1.25rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start'
          }}
        >
          <ShieldAlert size={20} style={{ color: '#e11d48', flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9f1239', marginBottom: '0.2rem' }}>
              Seguridad de la Cuenta:
            </div>
            <div style={{ fontSize: '0.8rem', color: '#be123c', lineHeight: 1.45 }}>
              Debes cambiar tu contraseña temporal asignada antes de acceder al sistema.
            </div>
          </div>
        </div>

        {/* Alerta de Error */}
        {errorMsg && (
          <div
            className="alert-error"
            style={{
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.82rem',
              padding: '0.65rem 0.85rem'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Alerta de Éxito */}
        {successMsg && (
          <div
            style={{
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.82rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              borderRadius: '6px',
              border: '1px solid #bbf7d0'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario de Cambio de Contraseña */}
        <form onSubmit={handleSubmit}>
          {/* Contraseña Temporal Actual */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Contraseña Temporal Actual *</label>
            <div className="input-container">
              <Lock className="input-icon" size={16} />
              <input
                type={showActual ? 'text' : 'password'}
                className="form-input"
                placeholder="Ingresa tu clave o PIN temporal asignado"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                required
                disabled={loading || Boolean(successMsg)}
              />
              <button
                type="button"
                className="input-toggle-btn"
                onClick={() => setShowActual(!showActual)}
                title={showActual ? 'Ocultar' : 'Mostrar'}
              >
                {showActual ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Grid de Nueva Contraseña y Confirmar Contraseña */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.25rem'
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nueva Contraseña *</label>
              <div className="input-container">
                <Lock className="input-icon" size={16} />
                <input
                  type={showNueva ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Crea tu nueva contraseña"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  required
                  disabled={loading || Boolean(successMsg)}
                />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowNueva(!showNueva)}
                  title={showNueva ? 'Ocultar' : 'Mostrar'}
                >
                  {showNueva ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirmar Contraseña *</label>
              <div className="input-container">
                <Lock className="input-icon" size={16} />
                <input
                  type={showConfirmar ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repite la contraseña"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  required
                  disabled={loading || Boolean(successMsg)}
                />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowConfirmar(!showConfirmar)}
                  title={showConfirmar ? 'Ocultar' : 'Mostrar'}
                >
                  {showConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Panel de Requisitos de Seguridad */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem'
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.65rem'
              }}
            >
              REQUISITOS DE SEGURIDAD:
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.5rem 1.25rem'
              }}
            >
              {/* 1. Mínimo 8 caracteres */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                {reqMinLength ? (
                  <Check size={14} style={{ color: 'var(--success)', strokeWidth: 2.5, flexShrink: 0 }} />
                ) : (
                  <Circle size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                )}
                <span style={{ color: reqMinLength ? 'var(--success)' : 'var(--text-muted)', fontWeight: reqMinLength ? 600 : 400 }}>
                  Mínimo 8 caracteres
                </span>
              </div>

              {/* 2. Mayúsculas y minúsculas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                {reqUpperLower ? (
                  <Check size={14} style={{ color: 'var(--success)', strokeWidth: 2.5, flexShrink: 0 }} />
                ) : (
                  <Circle size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                )}
                <span style={{ color: reqUpperLower ? 'var(--success)' : 'var(--text-muted)', fontWeight: reqUpperLower ? 600 : 400 }}>
                  Mayúsculas y minúsculas
                </span>
              </div>

              {/* 3. Al menos un número */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                {reqHasNumber ? (
                  <Check size={14} style={{ color: 'var(--success)', strokeWidth: 2.5, flexShrink: 0 }} />
                ) : (
                  <Circle size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                )}
                <span style={{ color: reqHasNumber ? 'var(--success)' : 'var(--text-muted)', fontWeight: reqHasNumber ? 600 : 400 }}>
                  Al menos un número
                </span>
              </div>

              {/* 4. No ser solo números */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                {reqNotOnlyNumbers ? (
                  <Check size={14} style={{ color: 'var(--success)', strokeWidth: 2.5, flexShrink: 0 }} />
                ) : (
                  <Circle size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                )}
                <span style={{ color: reqNotOnlyNumbers ? 'var(--success)' : 'var(--text-muted)', fontWeight: reqNotOnlyNumbers ? 600 : 400 }}>
                  No ser solo números
                </span>
              </div>

              {/* 5. Sin coincidencia con tu nombre */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                {reqNoNameMatch ? (
                  <Check size={14} style={{ color: 'var(--success)', strokeWidth: 2.5, flexShrink: 0 }} />
                ) : (
                  <Circle size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                )}
                <span style={{ color: reqNoNameMatch ? 'var(--success)' : 'var(--text-muted)', fontWeight: reqNoNameMatch ? 600 : 400 }}>
                  Sin coincidencia con tu nombre
                </span>
              </div>

              {/* 6. Las contraseñas coinciden */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                {reqMatch ? (
                  <Check size={14} style={{ color: 'var(--success)', strokeWidth: 2.5, flexShrink: 0 }} />
                ) : (
                  <Circle size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                )}
                <span style={{ color: reqMatch ? 'var(--success)' : 'var(--text-muted)', fontWeight: reqMatch ? 600 : 400 }}>
                  Las contraseñas coinciden
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancelAndExit}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.15rem',
                fontSize: '0.875rem'
              }}
            >
              <LogOut size={16} />
              <span>Cancelar y Salir</span>
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || Boolean(successMsg)}
              style={{
                width: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.35rem',
                fontSize: '0.875rem'
              }}
            >
              {loading ? (
                <span>Estableciendo contraseña...</span>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Establecer Contraseña</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Diálogo de Confirmación para Cancelar y Salir */}
      {showExitConfirm && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 10002,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(2px)'
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '420px',
              width: '92%',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '1.5rem',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.5rem' }}>
              ¿Deseas salir del sistema?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
              Tu sesión se cerrará y no podrás acceder al sistema hasta que establezcas tu nueva contraseña personal.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowExitConfirm(false)}
              >
                Continuar aquí
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={logout}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CambioPasswordModal;
