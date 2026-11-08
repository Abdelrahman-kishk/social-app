import { useState } from 'react';
import { getPhoto } from '../utils/helpers';

export default function Avatar({ user, size = 40, className = '' }) {
  const [failed, setFailed] = useState(false);
  const photo = getPhoto(user);
  const initial = (user?.name || user?.username || '?').trim().charAt(0).toUpperCase();
  const style = { width: size, height: size, fontSize: Math.max(12, size / 2.4) };

  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={user?.name || 'avatar'}
        style={style}
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 font-semibold text-white ${className}`}
    >
      {initial}
    </div>
  );
}
