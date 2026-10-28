import React, { useState } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Truck, User, Lock, Eye, EyeOff, AlertCircle, LogIn, KeyRound, CheckCircle2, X } from 'lucide-react';

export const Login = () => {
  const { login, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados para modal de solicitud de restablecimiento
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetResult, setResetResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  };

  const handleSolicitarReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    try {
      const res = await api.post('/auth/solicitar_restablecimiento/', {
        username: resetUsername
      });
      setResetResult(res.data);
    } catch (err) {
      setResetError(err.response?.data?.detail || 'Error al enviar la solicitud de restablecimiento.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-icon-box">
            <Truck size={24} />
          </div>
          <h1 className="login-title">
            Sistema de Gestión <span>TM</span>
          </h1>
          <p className="login-subtitle">Ingresa tus credenciales para acceder</p>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de Usuario</label>
            <div className="input-container">
              <User className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-container">
              <Lock className="input-icon" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <span>Iniciando sesión...</span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => {
              setIsResetModalOpen(true);
              setResetUsername(username || '');
              setResetResult(null);
              setResetError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--yellow)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline'
            }}
          >
            ¿Olvidaste tu contraseña? Solicitar restablecimiento
          </button>
        </div>
      </div>

      {/* Modal para solicitar restablecimiento */}
      {isResetModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', width: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} style={{ color: 'var(--yellow)' }} />
                Restablecer Contraseña
              </h2>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {resetResult ? (
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.5rem' }}>
                  ¡Solicitud Registrada!
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                  Tu solicitud ha sido enviada al Administrador. Preséntale el siguiente número de ticket para que autorice y genere tu clave temporal de acceso:
                </p>

                <div style={{ padding: '0.9rem', backgroundColor: 'var(--bg-element)', borderRadius: '8px', border: '2px dashed var(--yellow)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Código de Ticket de Verificación
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--yellow)', letterSpacing: '0.08em', marginTop: '0.25rem' }}>
                    {resetResult.ticket}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--white)', marginTop: '0.25rem' }}>
                    Usuario: {resetResult.usuario}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setIsResetModalOpen(false)}
                >
                  Entendido / Volver al Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSolicitarReset}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                  Ingresa tu nombre de usuario registrado. El sistema generará un <strong>código o ticket de verificación</strong> que llegará a la bandeja del Administrador para generar tu clave temporal.
                </p>

                {resetError && (
                  <div className="alert-error" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                    <AlertCircle size={16} />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nombre de Usuario (Login) *</label>
                  <div className="input-container">
                    <User className="input-icon" size={16} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ingresa tu nombre de usuario"
                      value={resetUsername}
                      onChange={(e) => setResetUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>


                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setIsResetModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1 }}
                    disabled={resetLoading}
                  >
                    {resetLoading ? 'Generando...' : 'Generar Ticket'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

