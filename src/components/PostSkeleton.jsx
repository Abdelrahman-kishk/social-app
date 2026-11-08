export default function PostSkeleton() {
  return (
    <div className="card animate-pulse p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="h-2.5 w-20 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-5/6 rounded bg-slate-200" />
      </div>
      <div className="mt-4 h-48 rounded-lg bg-slate-200" />
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="flex animate-pulse gap-3">
      <div className="h-8 w-8 rounded-full bg-slate-200" />
      <div className="h-12 flex-1 rounded-2xl bg-slate-200" />
    </div>
  );
}
