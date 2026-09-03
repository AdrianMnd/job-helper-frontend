import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const EXIT_WINDOW_MS = 2000;

// Solo tiene sentido en contexto de app instalada (PWA standalone o TWA de
// Android) - en una pestana de navegador normal, "atras" debe navegar
// con normalidad, no advertir de salida.
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export function useDoubleBackToExit(active: boolean) {
  const lastBackPress = useRef(0);

  useEffect(() => {
    if (!active || !isStandalone()) return;

    // Evita apilar varias entradas centinela si el componente se vuelve a
    // montar (por ejemplo, al volver a la pantalla principal tras navegar
    // a otra pagina y regresar).
    if (!window.history.state?.__exitGuard) {
      window.history.pushState({ __exitGuard: true }, '');
    }

    function handlePopState() {
      const now = Date.now();
      if (now - lastBackPress.current < EXIT_WINDOW_MS) {
        return; // segunda pulsacion a tiempo: se deja que la app se cierre
      }
      lastBackPress.current = now;
      toast.info('Pulsa de nuevo para salir');
      window.history.pushState({ __exitGuard: true }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [active]);
}