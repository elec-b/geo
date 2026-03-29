// Pantalla de carga mientras el globo se inicializa
import { useTranslation } from 'react-i18next';
import './LoadingScreen.css';

interface LoadingScreenProps {
  visible?: boolean;
}

export function LoadingScreen({ visible = true }: LoadingScreenProps) {
  const { t } = useTranslation('common');

  return (
    <div className={`loading-screen ${visible ? '' : 'loading-screen--hidden'}`}>
      <img className="loading-logo" src="/assets/logo.svg" alt="" />
      <h1 className="loading-title">GeoExpert</h1>
      <div className="loading-spinner" />
      <p className="loading-text">{t('loading')}</p>
    </div>
  );
}

export default LoadingScreen;
