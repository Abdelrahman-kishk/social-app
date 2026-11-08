import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import { authApi } from '../api/services';

const initial = {
  name: '',
  username: '',
  email: '',
  password: '',
  rePassword: '',
  dateOfBirth: '',
  gender: '',
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const er = {};
    if (form.name.trim().length < 3) er.name = 'Name must be at least 3 characters';
    if (!/^[a-zA-Z0-9_.]{3,}$/.test(form.username.trim())) er.username = 'Username: 3+ letters, numbers, "_" or "."';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) er.email = 'Enter a valid email address';
    if (form.password.length < 6) er.password = 'Password must be at least 6 characters';
    if (form.rePassword !== form.password) er.rePassword = 'Passwords do not match';
    if (!form.dateOfBirth) er.dateOfBirth = 'Date of birth is required';
    else if (new Date(form.dateOfBirth) > new Date()) er.dateOfBirth = 'Date of birth cannot be in the future';
    if (!form.gender) er.gender = 'Please select your gender';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.signup({
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        rePassword: form.rePassword,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
      });
      toast.success(res?.data?.message && res.data.message !== 'success' ? res.data.message : 'Account created! Please log in.');
      navigate('/login', { replace: true });
    } catch {
      /* error toast shown by interceptor */
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', props = {}) => (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input name={name} type={type} value={form[name]} onChange={onChange} className="input" {...props} />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-indigo-100 p-4">
      <div className="card w-full max-w-lg p-8">
        <div className="mb-6 text-center">
          <MessagesSquare className="mx-auto h-10 w-10 text-brand-600" />
          <h1 className="mt-2 text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-slate-500">Join Connect and start sharing</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('name', 'Full name', 'text', { placeholder: 'John Doe', autoComplete: 'name' })}
            {field('username', 'Username', 'text', { placeholder: 'johndoe', autoComplete: 'username' })}
          </div>
          {field('email', 'Email', 'email', { placeholder: 'you@example.com', autoComplete: 'email' })}
          <div className="grid gap-4 sm:grid-cols-2">
            {field('password', 'Password', 'password', { autoComplete: 'new-password' })}
            {field('rePassword', 'Confirm password', 'password', { autoComplete: 'new-password' })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('dateOfBirth', 'Date of birth', 'date', { max: new Date().toISOString().split('T')[0] })}
            <div>
              <label className="mb-1 block text-sm font-medium">Gender</label>
              <select name="gender" value={form.gender} onChange={onChange} className="input">
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading && <Spinner className="h-4 w-4" />} Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
