import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, MessagesSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import { authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) er.email = 'Enter a valid email address';
    if (!form.password) er.password = 'Password is required';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.signin({ email: form.email.trim(), password: form.password });
      const data = res?.data?.data;
      const token = data?.token;
      if (!token) throw new Error('No token returned from the server');
      login(token, data?.user);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      if (!err?.response) toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-indigo-100 p-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <MessagesSquare className="mx-auto h-10 w-10 text-brand-600" />
          <h1 className="mt-2 text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-slate-500">Log in to continue to Connect</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} className="input" placeholder="you@example.com" autoComplete="email" />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <div className="relative">
              <input name="password" type={show ? 'text' : 'password'} value={form.password} onChange={onChange} className="input pr-10" placeholder="••••••••" autoComplete="current-password" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Toggle password visibility">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading && <Spinner className="h-4 w-4" />} Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
