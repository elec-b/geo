// Punto de entrada de la aplicación
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initI18n, detectLocale } from './i18n';
import './styles/global.css';
import App from './App';

// Inicializar i18next antes del primer render (carga dinámica)
const initialLocale = detectLocale();
initI18n(initialLocale).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
