import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Spinner from './Spinner';
import { authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

const empty = { password: '', newPassword: '', confirm: '' };

export default function ChangePasswordModal({ open, onClose }) {
  const { updateToken } = useAuth();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setForm(empty);
    setError('');
    onClose();
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 6) return setError('New password must be at least 6 characters.');
    if (form.newPassword !== form.confirm) return setError('New password and confirmation do not match.');
    if (form.newPassword === form.password) return setError('New password must differ from the current one.');

    setLoading(true);
    try {
      const res = await authApi.changePassword({ password: form.password, newPassword: form.newPassword });
      const newToken = res?.data?.data?.token;
      if (newToken) updateToken(newToken);
      toast.success(res?.data?.message && res.data.message !== 'success' ? res.data.message : 'Password changed successfully');
      handleClose();
    } catch {
      // Error toast is displayed by the Axios interceptor.
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Change password">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Current password</label>
          <input type="password" name="password" required value={form.password} onChange={onChange} className="input" autoComplete="current-password" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">New password</label>
          <input type="password" name="newPassword" required value={form.newPassword} onChange={onChange} className="input" autoComplete="new-password" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Confirm new password</label>
          <input type="password" name="confirm" required value={form.confirm} onChange={onChange} className="input" autoComplete="new-password" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={handleClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Spinner className="h-4 w-4" />} Update password
          </button>
        </div>
      </form>
    </Modal>
  );
}
