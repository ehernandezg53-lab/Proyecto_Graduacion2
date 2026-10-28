import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export const CustomSelect = ({
  options = [],
  value,
  onChange,
  name,
  placeholder = 'Seleccionar...',
  required = false,
  disabled = false,
  maxHeight = 220,
  style = {},
  className = '',
  searchable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Cerrar desplegable si el usuario hace clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Encontrar opción seleccionada actualmente
  const selectedOption = options.find(opt => String(opt.value) === String(value));

  // Filtrar opciones cuando hay término de búsqueda
  const filteredOptions = options.filter(opt => {
    if (!searchTerm) return true;
    const label = opt.label || '';
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (option) => {
    if (option.disabled) return;
    setIsOpen(false);
    setSearchTerm('');
    if (onChange) {
      onChange({
        target: {
          name: name || '',
          value: option.value
        }
      });
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', ...style }}
      className={`custom-select-wrapper ${className}`}
    >
      {/* Botón / Selector visible */}
      <div
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className="form-select"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: '#ffffff',
          userSelect: 'none',
          paddingRight: '0.75rem',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selectedOption && selectedOption.value !== '' ? 'var(--white)' : 'var(--text-muted)',
            fontWeight: selectedOption && selectedOption.value !== '' ? 500 : 400
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
            marginLeft: '0.4rem'
          }}
        />
      </div>

      {/* Menú desplegable flotante con scroll */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}
        >
          {/* Buscador opcional integrado */}
          {(searchable && options.length > 5) && (
            <div style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-element)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar opciones..."
                autoFocus
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.8rem',
                  color: 'var(--white)'
                }}
              />
              {searchTerm && (
                <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSearchTerm('')} />
              )}
            </div>
          )}

          {/* Contenedor con barra de desplazamiento scrollable */}
          <div
            className="custom-scrollbar"
            style={{
              maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
              overflowY: 'auto',
              padding: '0.25rem'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value ?? idx}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.825rem',
                      borderRadius: '4px',
                      cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      opacity: opt.disabled ? 0.5 : 1,
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      color: isSelected ? 'var(--blue)' : 'var(--white)',
                      fontWeight: isSelected ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!opt.disabled && !isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-element)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                    </span>
                    {isSelected && <Check size={14} style={{ color: 'var(--blue)', flexShrink: 0, marginLeft: '0.4rem' }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Input oculto para validación nativa de formularios HTML */}
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          required
          style={{ opacity: 0, height: 0, width: 0, position: 'absolute', pointerEvents: 'none' }}
        />
      )}
    </div>
  );
};

export default CustomSelect;
