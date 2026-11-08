import { useCallback, useEffect, useState } from 'react';
import { Check, Pencil, Send, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from './Avatar';
import Spinner from './Spinner';
import { CommentSkeleton } from './PostSkeleton';
import { commentsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { extractList, fullDate, getAuthor, getId, hasMorePages, mergeUnique, timeAgo } from '../utils/helpers';

const LIMIT = 10;

function CommentItem({ comment, postId, canDelete, isOwner, onChanged, onDeleted }) {
  const author = getAuthor(comment);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.content || '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const content = text.trim();
    if (!content) return toast.error('Comment cannot be empty');
    setBusy(true);
    try {
      const res = await commentsApi.update(postId, getId(comment), content);
      const d = res?.data?.data;
      const updated = d?.comment || (d && typeof d === 'object' && !Array.isArray(d) ? d : {});
      onChanged({ ...comment, ...updated, content: updated.content ?? content, commentCreator: comment.commentCreator, user: comment.user });
      setEditing(false);
      toast.success('Comment updated');
    } catch {
      /* handled globally */
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this comment?')) return;
    setBusy(true);
    try {
      await commentsApi.remove(postId, getId(comment));
      onDeleted(getId(comment));
      toast.success('Comment deleted');
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Avatar user={author} size={34} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-slate-100 px-3.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold">{author?.name || 'Unknown user'}</span>
            {(isOwner || canDelete) && !editing && (
              <div className="flex shrink-0 gap-1">
                {isOwner && (
                  <button onClick={() => setEditing(true)} disabled={busy} className="rounded p-1 text-slate-500 hover:bg-slate-200" aria-label="Edit comment">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={remove} disabled={busy} className="rounded p-1 text-red-500 hover:bg-red-100" aria-label="Delete comment">
                  {busy ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>
          {editing ? (
            <div className="mt-1 space-y-2">
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="input resize-none" autoFocus />
              <div className="flex justify-end gap-1">
                <button onClick={() => { setEditing(false); setText(comment.content || ''); }} className="btn-ghost !px-2 !py-1" disabled={busy}>
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button onClick={save} className="btn-primary !px-3 !py-1" disabled={busy}>
                  {busy ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />} Save
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm">{comment.content}</p>
          )}
        </div>
        <p className="mt-0.5 pl-3 text-xs text-slate-400" title={fullDate(comment.createdAt)}>
          {timeAgo(comment.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function CommentSection({ postId, postOwnerId, onCountChange }) {
  const { user } = useAuth();
  const myId = getId(user);
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(
    async (p) => {
      try {
        const res = await commentsApi.list(postId, { page: p, limit: LIMIT });
        const list = extractList(res, ['comments', 'items', 'results']);
        setComments((prev) => (p === 1 ? list : mergeUnique(prev, list)));
        setHasMore(hasMorePages(res, list.length, LIMIT));
        setPage(p);
      } catch {
        /* handled globally */
      }
    },
    [postId]
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load(1).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    await load(page + 1);
    setLoadingMore(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      const res = await commentsApi.create(postId, content);
      const d = res?.data?.data;
      const created = d?.comment || (d && typeof d === 'object' && !Array.isArray(d) ? d : null);
      setText('');
      toast.success('Comment added');
      if (created && getId(created)) {
        const withAuthor = getAuthor(created)?.name ? created : { ...created, commentCreator: user };
        setComments((prev) => mergeUnique(prev, [{ ...withAuthor, content: withAuthor.content ?? content }]));
        onCountChange?.(1);
      } else {
        await load(1);
        onCountChange?.(1);
      }
    } catch {
      /* handled globally */
    } finally {
      setSending(false);
    }
  };

  const handleChanged = (updated) =>
    setComments((prev) => prev.map((c) => (getId(c) === getId(updated) ? updated : c)));

  const handleDeleted = (id) => {
    setComments((prev) => prev.filter((c) => getId(c) !== id));
    onCountChange?.(-1);
  };

  return (
    <div className="border-t border-slate-200 px-4 py-4">
      <form onSubmit={submit} className="flex items-start gap-3">
        <Avatar user={user} size={34} />
        <div className="flex flex-1 items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" className="input !rounded-full" disabled={sending} />
          <button type="submit" disabled={sending || !text.trim()} className="btn-primary !rounded-full !px-3" aria-label="Send comment">
            {sending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>

      <div className="mt-4 space-y-4">
        {loading && (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        )}
        {!loading && comments.length === 0 && (
          <p className="py-2 text-center text-sm text-slate-400">No comments yet. Be the first to comment.</p>
        )}
        {comments.map((c) => {
          const authorId = getId(getAuthor(c));
          return (
            <CommentItem
              key={getId(c)}
              comment={c}
              postId={postId}
              isOwner={!!myId && authorId === myId}
              canDelete={!!myId && (authorId === myId || postOwnerId === myId)}
              onChanged={handleChanged}
              onDeleted={handleDeleted}
            />
          );
        })}
        {hasMore && !loading && (
          <button onClick={loadMore} disabled={loadingMore} className="btn-ghost w-full">
            {loadingMore && <Spinner className="h-4 w-4" />} Load more comments
          </button>
        )}
      </div>
    </div>
  );
}
