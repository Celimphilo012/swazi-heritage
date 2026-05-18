import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import shieldPng from '../../lib/shield.png';

const DIAMONDS = [
  { s: 10, x: "7%",  y: "12%", d: "0.2s", t: "4.5s", c: "#FFD600" },
  { s:  6, x: "15%", y: "75%", d: "1.3s", t: "5.2s", c: "#ffffff" },
  { s: 14, x: "82%", y: "18%", d: "0.6s", t: "3.9s", c: "#CE1126" },
  { s:  8, x: "90%", y: "62%", d: "1.8s", t: "5.1s", c: "#FFD600" },
  { s: 11, x: "94%", y: "38%", d: "0.4s", t: "4.7s", c: "#ffffff" },
  { s:  7, x: "22%", y: "88%", d: "1.6s", t: "3.6s", c: "#FFD600" },
  { s:  9, x: "75%", y: "82%", d: "0.9s", t: "4.8s", c: "#CE1126" },
];

const Register = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = f => e => setForm(d => ({ ...d, [f]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Create your account to get started</p>
          </div>

          {/* Form body */}
          <div className="px-8 py-7">
            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm"
                style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Full name
                </label>
                <input type="text" required value={form.name} onChange={set('name')}
                  placeholder="Your full name"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800
                             placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200
                             focus:border-slate-300 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Email address
                </label>
                <input type="email" required value={form.email} onChange={set('email')}
                  placeholder="you@example.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800
                             placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200
                             focus:border-slate-300 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input type="password" required value={form.password} onChange={set('password')}
                  placeholder="At least 8 characters"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800
                             placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200
                             focus:border-slate-300 transition-all" />
                {form.password.length > 0 && form.password.length < 8 && (
                  <p className="text-xs mt-1" style={{ color: "#d97706" }}>
                    {8 - form.password.length} more character{8 - form.password.length !== 1 ? "s" : ""} needed
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                           text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 mt-1"
                style={{ background: "linear-gradient(135deg,#001540,#002d80)" }}>
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold hover:underline"
                  style={{ color: "#CE1126" }}>
                  Sign in
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

export default Register;
