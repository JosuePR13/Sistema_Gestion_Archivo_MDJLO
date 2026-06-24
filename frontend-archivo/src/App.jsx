import { useState, useEffect } from 'react';
import Login from './pages/auth/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Expedientes from './pages/expedientes/Expedientes';
import DetalleExpediente from './pages/expedientes/DetalleExpediente';
import RegistrarExpediente from './pages/expedientes/RegistrarExpediente';
import DigitalizacionScreen from './pages/expedientes/Digitalizacion';
import SeguimientoScreen from './pages/expedientes/Seguimiento';
import ReportesScreen from './pages/expedientes/Reportes';
import RegistrarSolicitud from './pages/solicitudes/RegistrarSolicitud';
import BandejaSolicitudes from './pages/solicitudes/BandejaSolicitudes';
import HistorialCaja from './pages/caja/HistorialCaja';
import ReporteCostos from './pages/caja/ReporteCostos';
import { ExpedienteProvider } from './context/ExpedienteProvider';
import { SolicitudProvider } from './context/SolicitudProvider';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');

    return Boolean(
      token &&
      token !== 'undefined' &&
      token !== 'null'
    );
  });

  const [currentScreen, setCurrentScreen] = useState({ name: 'dashboard', id: null });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');

  const [globalToast, setGlobalToast] = useState({ show: false, message: '' });

  useEffect(() => {
    const restringirSalidaInsegura = (e) => {
      if (isAuthenticated) {
        e.preventDefault();
        e.returnValue = '⚠️ Alerta de Seguridad Municipal: Debe cerrar su sesión formalmente utilizando el botón del sistema antes de abandonar la pestaña.';
      }
    };

    window.addEventListener('beforeunload', restringirSalidaInsegura);

    return () => {
      window.removeEventListener('beforeunload', restringirSalidaInsegura);
    };
  }, [isAuthenticated]);

  const triggerGlobalToast = (msg) => {
    setGlobalToast({ show: true, message: msg });

    setTimeout(() => {
      setGlobalToast({ show: false, message: '' });
    }, 2500);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);

    setSearchTerm('');
    setFilterTipo('');
    setFilterFechaDesde('');
    setCurrentScreen({ name: 'dashboard', id: null });
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <ExpedienteProvider>
      <SolicitudProvider>
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
          {globalToast.show && (
            <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] border border-emerald-500/30 animate-slide-in font-semibold text-sm backdrop-blur-md">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
              <span>{globalToast.message}</span>
            </div>
          )}
          <Sidebar currentScreen={currentScreen.name} setScreen={setCurrentScreen} />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-8 shrink-0">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 text-[12px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                CERRAR SESIÓN
              </button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-8">
              {currentScreen.name === 'dashboard' && (
                <Dashboard setScreen={setCurrentScreen} />
              )}
              {currentScreen.name === 'expedientes' && (
                <Expedientes
                  setScreen={setCurrentScreen}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filterTipo={filterTipo}
                  setFilterTipo={setFilterTipo}
                  filterFechaDesde={filterFechaDesde}
                  setFilterFechaDesde={setFilterFechaDesde}
                />
              )}
              {currentScreen.name === 'nuevo-expediente' && (
                <RegistrarExpediente
                  setScreen={setCurrentScreen}
                  triggerToast={triggerGlobalToast}
                />
              )}
              {currentScreen.name === 'detalle' && (
                <DetalleExpediente
                  id={currentScreen.id}
                  onBack={() => setCurrentScreen({ name: 'expedientes', id: null })}
                  triggerToast={triggerGlobalToast}
                  setSearchTerm={setSearchTerm}
                  setFilterTipo={setFilterTipo}
                  setFilterFechaDesde={setFilterFechaDesde}
                />
              )}
              {currentScreen.name === 'digitalizacion' && (
                <DigitalizacionScreen
                  setScreen={setCurrentScreen}
                  triggerToast={triggerGlobalToast}
                />
              )}
              {currentScreen.name === 'seguimiento' && (
                <SeguimientoScreen setScreen={setCurrentScreen} />
              )}
              {currentScreen.name === 'reportes' && (
                <ReportesScreen setScreen={setCurrentScreen} />
              )}
              {currentScreen.name === 'nueva-solicitud' && (
                <RegistrarSolicitud
                  setScreen={setCurrentScreen}
                  triggerToast={triggerGlobalToast}
                />
              )}
              {currentScreen.name === 'bandeja-solicitudes' && (
                <BandejaSolicitudes
                  triggerToast={triggerGlobalToast}
                />
              )}
              {currentScreen.name === 'historial-caja' && (
                <HistorialCaja setScreen={setCurrentScreen} />
              )}
              {currentScreen.name === 'reporte-costos' && (
                <ReporteCostos setScreen={setCurrentScreen} />
              )}
            </main>
          </div>
        </div>
      </SolicitudProvider>
    </ExpedienteProvider>
  );
}