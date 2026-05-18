import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME } from '../../utils/constants';
import shieldPng from '../../lib/shield.png';

const DIAMONDS = [
  { s: 12, x: "5%",  y: "15%", d: "0s",   t: "4.2s", c: "#FFD600" },
  { s:  7, x: "12%", y: "70%", d: "1.1s", t: "5.4s", c: "#ffffff" },
  { s: 16, x: "80%", y: "20%", d: "0.5s", t: "3.8s", c: "#CE1126" },
  { s:  9, x: "88%", y: "68%", d: "2.0s", t: "5.0s", c: "#FFD600" },
  { s: 13, x: "92%", y: "40%", d: "0.3s", t: "4.6s", c: "#ffffff" },
  { s:  6, x: "20%", y: "85%", d: "1.5s", t: "3.5s", c: "#FFD600" },
  { s: 10, x: "70%", y: "80%", d: "0.8s", t: "4.9s", c: "#CE1126" },
];

const Login = () => {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,#001540,#002d80,#001540)" }}>

      {/* Diamond particles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {DIAMONDS.map((d, i) => (
          <div key={i} className="absolute" style={{
            width: d.s, height: d.s,
            left: d.x, top: d.y,
            background: d.c,
            opacity: 0.18,
            animationName: "floatDiamond",
            animationDuration: d.t,
            animationDelay: d.d,
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
          }} />
        ))}
      </div>

      <div className="w-full max-w-sm relative z-10">

        {/* Card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: "#fff", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>

          {/* Card header */}
          <div className="px-8 pt-8 pb-7 text-center"
            style={{ background: "linear-gradient(160deg,#001540,#002d80)" }}>

            {/* Flag stripe */}
            <div className="flex mb-6" style={{ height: 3 }}>
              <div className="flex-1" style={{ background: "#002395" }} />
              <div style={{ width: "6%", background: "#FFD600" }} />
              <div className="flex-1" style={{ background: "#CE1126" }} />
              <div style={{ width: "6%", background: "#FFD600" }} />
              <div className="flex-1" style={{ background: "#002395" }} />
            </div>

            {/* Shield */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,214,0,0.1)", border: "1px solid rgba(255,214,0,0.2)" }}>
                <img src={shieldPng} alt="Nguni Shield" width="32" height="40"
                  style={{ objectFit: "contain" }} />
              </div>
            </div>

            <h1 className="text-xl font-black text-white">Swazi Cultural Heritage</h1>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Welcome back — sign in to continue</p>
          </div>

          {/* Form body */}
          <div className="px-8 py-7">
            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm"
                style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Email address
                </label>
                <input type="email" required value={form.email} onChange={set('email')}
                  placeholder="your@email.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800
                             placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200
                             focus:border-slate-300 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input type="password" required value={form.password} onChange={set('password')}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800
                             placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200
                             focus:border-slate-300 transition-all" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                           text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 mt-1"
                style={{ background: "linear-gradient(135deg,#001540,#002d80)" }}>
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                No account?{' '}
                <Link to="/register" className="font-bold hover:underline"
                  style={{ color: "#CE1126" }}>
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "rgba(148,163,184,0.6)" }}>
          Kingdom of Eswatini Cultural Preservation Platform
        </p>
      </div>
    </div>
  );
};

export default Login;
