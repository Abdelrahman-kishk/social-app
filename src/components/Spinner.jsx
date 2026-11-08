import { Loader2 } from 'lucide-react';

export default function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin ${className || 'h-5 w-5'}`} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center text-brand-600">
      <Loader2 className="h-10 w-10 animate-spin" />
    </div>
  );
}
