import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Expedientes from './pages/Expedientes';
import DetalleExpediente from './pages/DetalleExpediente';
import RegistrarExpediente from './pages/RegistrarExpediente';
import DigitalizacionScreen from './pages/Digitalizacion';
import SeguimientoScreen from './pages/Seguimiento';
import ReportesScreen from './pages/Reportes';

// 🚀 IMPORTACIÓN DEL CONTEXTO GLOBAL DE EXPEDIENTES
import { ExpedienteProvider } from './context/ExpedienteProvider';

export default function App() {
  // 🏛️ SEGURO 1: Forzamos a que el estado de autenticación SIEMPRE inicie en false al ingresar en frío.
  // Así obligamos a pasar obligatoriamente por la validación de credenciales del Login.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState({ name: 'dashboard', id: null });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');

  const [globalToast, setGlobalToast] = useState({ show: false, message: '' });

  // 🏛️ SEGURO 2: Interceptor nativo para evitar fugas o cierres accidentales sin cerrar sesión formalmente
  useEffect(() => {
    const restringirSalidaInsegura = (e) => {
      if (isAuthenticated) {
        e.preventDefault();
        e.returnValue = '⚠️ Alerta de Seguridad Municipal: Debe cerrar su sesión formalmente utilizando el botón del sistema antes de abandonar la pestaña.';
      }
    };

    // 🏛️ SEGURO 3: Si cierran la pestaña a la fuerza, destruimos el token de forma inminente
    const limpiarRastroToken = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    };

    window.addEventListener('beforeunload', restringirSalidaInsegura);
    window.addEventListener('unload', limpiarRastroToken);

    return () => {
      window.removeEventListener('beforeunload', restringirSalidaInsegura);
      window.removeEventListener('unload', limpiarRastroToken);
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

  if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} />

  return (
    <ExpedienteProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 relative">

        {globalToast.show && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] border border-emerald-500/30 animate-slide-in font-semibold text-sm backdrop-blur-md">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
            <span>{globalToast.message}</span>
          </div>
        )}

        <Header onLogout={handleLogout} setScreen={setCurrentScreen} currentScreen={currentScreen.name} />

        <main className="flex-1 overflow-y-auto">
          {currentScreen.name === 'dashboard' && <Dashboard setScreen={setCurrentScreen} />}

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
            <SeguimientoScreen
              setScreen={setCurrentScreen}
            />
          )}

          {currentScreen.name === 'reportes' && (
            <ReportesScreen
              setScreen={setCurrentScreen}
            />
          )}
        </main>
      </div>
    </ExpedienteProvider>
  );
}