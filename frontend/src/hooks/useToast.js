import { useState, useRef, useCallback } from 'react';

/**
 * Hook reutilizable para manejo de notificaciones toast temporales.
 * Elimina la duplicación de estado y temporizadores en los módulos del sistema.
 */
export const useToast = (duration = 4500) => {
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((type, message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  }, [duration]);

  const hideToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
};

export default useToast;
