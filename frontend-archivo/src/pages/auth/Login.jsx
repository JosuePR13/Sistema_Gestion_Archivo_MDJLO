import { useState } from 'react';
import api from '../../services/api';
import logoMuni from '../../assets/Logo_2.png';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', { email, password });
      const { token, user } = response.data;

      const tokenEsValido =
        typeof token === 'string' &&
        token.trim() !== '' &&
        token !== 'undefined' &&
        token !== 'null';

      if (!tokenEsValido) {
        throw new Error('El servidor no devolvió un token de autenticación válido.');
      }

      localStorage.setItem('token', token.trim());
      localStorage.setItem('user', JSON.stringify(user));

      onLoginSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Error al conectar con el servidor'
      );
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 selection:bg-blue-200 selection:text-blue-900">
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-[#0F4C81] via-[#125896] to-[#0A3156] flex-col p-12 justify-between relative overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.1)] z-10">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-300/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="w-12 h-1.5 bg-muni-yellow rounded-full mb-10 shadow-[0_0_15px_rgba(255,193,7,0.5)]"></div>
          <div className="flex flex-col text-white mt-8">
            <div className="w-40 h-40 bg-white/10 backdrop-blur-md rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/20 flex items-center justify-center overflow-hidden mb-8 transition-transform hover:scale-105 duration-500">
              <img
                src={logoMuni}
                alt="Logo Municipalidad JLO"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <p className="text-muni-yellow text-xs font-bold uppercase tracking-[0.2em] mb-1.5 drop-shadow-md">
              Municipalidad Distrital
            </p>
            <h1 className="text-4xl font-extrabold mb-1 tracking-tight text-white drop-shadow-sm">
              José Leonardo Ortiz
            </h1>
            <p className="text-blue-100/80 text-sm mb-12 font-medium">
              Lambayeque — Perú
            </p>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all hover:bg-white/10">
              <p className="text-white font-bold text-sm mb-2 tracking-wide">
                Sistema de Gestión de Archivos y Digitalización Documental
              </p>
              <p className="text-blue-100/70 text-xs leading-relaxed font-medium">
                Unidad Funcional de Archivo y Acceso Documentario. Gestión integral de expedientes, digitalización documental y seguimiento de antigüedad.
              </p>
            </div>
          </div>
        </div>

        <p className="text-blue-100/40 text-xs font-semibold tracking-wider relative z-10">MDJLO © 2026</p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] p-8 relative">
        <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 p-10 transform transition-all">
          <div className="w-10 h-1.5 bg-muni-yellow rounded-full mb-8"></div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5 tracking-tight">Iniciar Sesión</h2>
          <p className="text-slate-400 text-sm mb-8 font-medium">Ingrese sus credenciales corporativas</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl font-semibold flex items-center gap-3 animate-shake shadow-sm">
              <span className="flex-shrink-0 text-red-500">⚠️</span>
              <span className="leading-tight">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-[13px] font-bold text-slate-500 mb-2 tracking-wide">Correo</label>
              <div className="relative flex items-center group">
                <span className="absolute left-4 text-slate-400 text-sm transition-colors group-focus-within:text-[#0F4C81]">👤</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Ingrese su usuario o correo"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10 outline-none transition-all duration-300 font-medium text-slate-700 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-500 mb-2 tracking-wide">Contraseña</label>
              <div className="relative flex items-center group">
                <span className="absolute left-4 text-slate-400 text-sm transition-colors group-focus-within:text-[#0F4C81]">🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10 outline-none transition-all duration-300 font-medium text-slate-700 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-8 rounded-2xl font-bold text-white text-[13px] uppercase tracking-widest bg-gradient-to-r from-[#0F4C81] to-blue-700 shadow-[0_8px_20px_-6px_rgba(15,76,129,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(15,76,129,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:pointer-events-none disabled:transform-none"
            >
              {loading ? 'Validando...' : 'Iniciar sesión'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;