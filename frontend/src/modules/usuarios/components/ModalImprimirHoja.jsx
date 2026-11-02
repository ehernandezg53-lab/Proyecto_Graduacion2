import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';

export const ModalImprimirHoja = ({
  isOpen,
  onClose,
  solicitud,
  onPrint
}) => {
  if (!isOpen || !solicitud) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content print-modal-content" style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Printer size={18} style={{ color: 'var(--yellow)' }} />
            Vista Previa de Hoja de Restablecimiento
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensaje de confirmación del sistema */}
        <div
          className="no-print"
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            borderRadius: '6px',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>
            Clave temporal generada exitosamente para {solicitud.usuario_nombre} {solicitud.usuario_apellido}.
          </span>
        </div>

        {/* DOCUMENTO FORMAL IMPRIMIBLE */}
        <div id="printable-auth-sheet" style={{
          backgroundColor: '#ffffff',
          color: '#000000',
          padding: '2rem',
          borderRadius: '6px',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: '12pt',
          lineHeight: 1.5,
          border: '1px solid #d1d5db'
        }}>
          {/* Encabezado Institucional */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000000', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '16pt', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              TRANSPORTES MININO, S.A.
            </div>
            <div style={{ fontSize: '10pt', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.15rem' }}>
              Departamento de Tecnologías de la Información y Seguridad
            </div>
            <div style={{ fontSize: '13pt', fontWeight: 800, marginTop: '0.5rem', textTransform: 'uppercase', color: '#111827' }}>
              CONSTANCIA Y AUTORIZACIÓN DE RESTABLECIMIENTO DE CONTRASEÑA
            </div>
          </div>

          {/* Ficha de Información de la Solicitud */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', backgroundColor: '#f9fafb', padding: '0.85rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
            <div>
              <span style={{ fontSize: '9pt', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Folio / Ticket:</span>
              <strong style={{ fontSize: '12pt', color: '#1e40af' }}>{solicitud.numero_ticket}</strong>
            </div>
            <div>
              <span style={{ fontSize: '9pt', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Fecha de Emisión:</span>
              <strong style={{ fontSize: '10pt' }}>{new Date().toLocaleString()}</strong>
            </div>
          </div>

          {/* Detalles del Usuario y Administrador */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '10pt' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.45rem', fontWeight: 700, width: '38%', color: '#374151' }}>Usuario Solicitante:</td>
                <td style={{ padding: '0.45rem', fontWeight: 600 }}>{solicitud.usuario_nombre} {solicitud.usuario_apellido}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.45rem', fontWeight: 700, color: '#374151' }}>Nombre de Usuario (Login):</td>
                <td style={{ padding: '0.45rem', fontFamily: 'monospace', fontWeight: 700 }}>{solicitud.usuario_username}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.45rem', fontWeight: 700, color: '#374151' }}>Rol / Área en el Sistema:</td>
                <td style={{ padding: '0.45rem' }}>{solicitud.usuario_rol || 'Usuario Operativo'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.45rem', fontWeight: 700, color: '#374151' }}>Fecha de Solicitud Inicial:</td>
                <td style={{ padding: '0.45rem' }}>{solicitud.fecha_solicitud ? new Date(solicitud.fecha_solicitud).toLocaleString() : '—'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.45rem', fontWeight: 700, color: '#374151' }}>Administrador que Autoriza:</td>
                <td style={{ padding: '0.45rem', fontWeight: 600 }}>{solicitud.autorizado_por_nombre || 'Administrador del Sistema'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.45rem', fontWeight: 700, color: '#374151' }}>Fecha de Autorización:</td>
                <td style={{ padding: '0.45rem' }}>{solicitud.fecha_autorizacion ? new Date(solicitud.fecha_autorizacion).toLocaleString() : new Date().toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Recuadro de Clave Temporal */}
          <div style={{ textAlign: 'center', border: '2px dashed #000000', padding: '1rem', marginBottom: '1.25rem', backgroundColor: '#fffbeb' }}>
            <span style={{ fontSize: '9pt', color: '#92400e', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'block' }}>
              CLAVE / PIN TEMPORAL DE ACCESO ASIGNADO:
            </span>
            <span style={{ fontSize: '18pt', fontFamily: 'monospace', fontWeight: 900, color: '#b45309', letterSpacing: '0.1em', display: 'block', marginTop: '0.25rem' }}>
              {solicitud.pin_temporal || '000000'}
            </span>
            <span style={{ fontSize: '8.5pt', color: '#78350f', display: 'block', marginTop: '0.35rem' }}>
              * IMPORTANTE: Esta clave es de un solo uso. El sistema le exigirá obligatoriamente su cambio en el primer inicio de sesión.
            </span>
          </div>

          {/* Cláusula y Declaración de Conformidad */}
          <p style={{ fontSize: '8.5pt', color: '#4b5563', textAlign: 'justify', marginBottom: '2.5rem', lineHeight: 1.4 }}>
            Por medio del presente documento se hace constar que el usuario solicitante ha requerido la restitución de sus credenciales de acceso al Sistema de Gestión TM y el Administrador ha autorizado la emisión de la clave temporal indicada. Ambas partes firman de conformidad según las políticas de seguridad y confidencialidad de la empresa.
          </p>

          {/* Recuadros de Firma */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem', textAlign: 'center' }}>
            <div>
              <div style={{ borderBottom: '1px solid #000000', marginBottom: '0.4rem', height: '40px' }}></div>
              <strong style={{ fontSize: '9pt', display: 'block', textTransform: 'uppercase' }}>
                {solicitud.usuario_nombre} {solicitud.usuario_apellido}
              </strong>
              <span style={{ fontSize: '8pt', color: '#6b7280' }}>Firma del Usuario Solicitante</span>
            </div>

            <div>
              <div style={{ borderBottom: '1px solid #000000', marginBottom: '0.4rem', height: '40px' }}></div>
              <strong style={{ fontSize: '9pt', display: 'block', textTransform: 'uppercase' }}>
                {solicitud.autorizado_por_nombre || 'Administrador del Sistema'}
              </strong>
              <span style={{ fontSize: '8pt', color: '#6b7280' }}>Firma y Sello del Administrador que Autoriza</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción (Ocultos al imprimir) */}
        <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.25rem' }}
            onClick={onPrint}
          >
            <Printer size={16} />
            <span>Imprimir Hoja de Autorización</span>
          </button>
        </div>
      </div>
    </div>
  );
};
