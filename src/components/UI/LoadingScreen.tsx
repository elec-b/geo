// Pantalla de carga mientras el globo se inicializa
import './LoadingScreen.css';

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-text">Cargando globo...</p>
    </div>
  );
}

export default LoadingScreen;
