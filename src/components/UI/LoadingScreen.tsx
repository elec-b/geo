// Pantalla de carga mientras el globo se inicializa
import './LoadingScreen.css';

interface LoadingScreenProps {
  visible?: boolean;
}

export function LoadingScreen({ visible = true }: LoadingScreenProps) {
  return (
    <div className={`loading-screen ${visible ? '' : 'loading-screen--hidden'}`}>
      <div className="loading-spinner" />
      <p className="loading-text">Cargando globo…</p>
    </div>
  );
}

export default LoadingScreen;
