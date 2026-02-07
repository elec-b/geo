// Punto de entrada de la aplicación
// StrictMode desactivado: el doble mount/unmount de React 19 StrictMode
// causa que MapLibre GL pierda el contexto WebGL en desarrollo.
// En producción (Capacitor) StrictMode no se ejecuta, así que no afecta.
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
