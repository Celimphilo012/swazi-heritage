import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME } from '../../utils/constants';

const Login = () => {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h1>
      <p className="text-sm text-gray-500 mb-6">Swazi Cultural Heritage Platform</p>
      {error && <p className="text-sm text-red-700 mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" required value={form.email} onChange={set('email')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            placeholder="your@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" required value={form.password} onChange={set('password')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="text-xs text-gray-400 text-center mt-4">
        No account? <Link to="/register" className="text-red-700 hover:underline">Register</Link>
      </p>
    </div>
  );
};
export default Login;
