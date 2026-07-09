import { useState } from 'react';
import api from '../../services/api';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0F4C81] via-[#104a82] to-[#0A3156] relative overflow-hidden selection:bg-blue-200 selection:text-blue-900 text-left">

      {/* --- ARTE ABSTRACTO DE FONDO --- */}
      <div className="absolute top-[-15%] left-[-10%] w-[45vw] h-[45vw] bg-gradient-to-br from-blue-500 to-[#0F4C81] rounded-full opacity-90 shadow-[inset_0_0_80px_rgba(0,0,0,0.3)] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] right-[-5%] w-[35vw] h-[35vw] bg-gradient-to-tl from-blue-400 to-[#125896] rounded-full opacity-80 shadow-2xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[40vw] h-[40vw] bg-gradient-to-tr from-[#082846] to-blue-500 rounded-full opacity-70 shadow-[0_20px_60px_rgba(0,0,0,0.4)] pointer-events-none z-0"></div>

      <p className="absolute bottom-8 left-8 lg:left-16 text-blue-100/50 text-xs font-bold tracking-wider z-10">MDJLO © 2026</p>

      {/* --- CONTENEDOR CENTRAL --- */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">

        {/* --- LADO IZQUIERDO: TEXTOS --- */}
        <div className="w-full lg:w-1/2 flex flex-col text-white pt-10 lg:pt-0">

          {/* ========================================================================= */}
          {/*                                   LOGO                                    */}
          {/* ========================================================================= */}
          <div
            className="self-start h-[90px] bg-white rounded-2xl shadow-xl flex items-center justify-center px-7 py-3 mb-8 transition-transform hover:scale-105 duration-300 transform-gpu"
            style={{ backfaceVisibility: 'hidden', WebkitFontSmoothing: 'antialiased' }}
          >
            <img
              src="/img/logo_muni.png"
              alt="Logo Municipalidad JLO"
              className="h-full w-auto object-contain transform-gpu"
            />
          </div>
          {/* ========================================================================= */}

          <p className="text-muni-yellow text-xs font-black uppercase tracking-[0.25em] mb-2 drop-shadow-md">
            Municipalidad Distrital
          </p>
          <h1 className="text-5xl xl:text-6xl font-black mb-4 tracking-tight text-white drop-shadow-lg leading-none">
            José Leonardo Ortiz
          </h1>
          <p className="text-blue-100/80 text-sm mb-10 font-bold uppercase tracking-widest">
            Lambayeque — Perú
          </p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.1)] max-w-lg">
            <div className="w-10 h-1 bg-muni-yellow rounded-full mb-4"></div>
            <h3 className="text-white font-black text-lg mb-2 tracking-wide">
              Sistema de Gestión Documental
            </h3>
            <p className="text-blue-100/80 text-sm leading-relaxed font-medium">
              Plataforma centralizada para la administración de archivos, digitalización en alta resolución y control riguroso de documentos municipales.
            </p>
          </div>
        </div>

        {/* --- LADO DERECHO: TARJETA FLOTANTE --- */}
        <div className="w-full max-w-[460px] bg-white rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-10 lg:p-12 relative z-20 transform transition-all animate-fade-in">

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-[32px] font-black text-[#0F4C81] tracking-tight mb-2 leading-none">Iniciar Sesión</h2>
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-3">Ingresa tus credenciales corporativas</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-xl font-bold flex items-start gap-3 shadow-sm">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="leading-tight">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-2 tracking-wider uppercase">Correo</label>
              <div className="relative flex items-center group">
                <div className="absolute left-4 text-slate-400 transition-colors group-focus-within:text-[#0F4C81]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Ingrese su correo"
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-xl text-sm focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10 outline-none transition-all duration-300 font-bold text-slate-700 placeholder-slate-300 hover:border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-2 tracking-wider uppercase">Contraseña</label>
              <div className="relative flex items-center group">
                <div className="absolute left-4 text-slate-400 transition-colors group-focus-within:text-[#0F4C81]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-xl text-sm focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10 outline-none transition-all duration-300 font-bold text-slate-700 placeholder-slate-300 hover:border-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-xl font-black text-white text-[13px] uppercase tracking-widest bg-gradient-to-r from-[#0F4C81] to-[#125896] shadow-[0_10px_20px_-6px_rgba(15,76,129,0.5)] hover:shadow-[0_15px_25px_-6px_rgba(15,76,129,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? 'Validando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;