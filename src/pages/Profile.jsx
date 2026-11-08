import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Mail, User as UserIcon } from 'lucide-react';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import Spinner from '../components/Spinner';
import { postsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { extractList, getId, hasMorePages, mergeUnique, sortNewestFirst } from '../utils/helpers';

const LIMIT = 10;

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const userId = getId(user);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Always show fresh profile data.
  useEffect(() => {
    refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPage = useCallback(
    async (p, replace = false) => {
      if (!userId) return;
      try {
        const res = await postsApi.listByUser(userId, { page: p, limit: LIMIT });
        const list = extractList(res).filter((post) => {
          const a = post?.user ?? post?.author;
          return !a || getId(a) === userId;
        });
        setPosts((prev) => sortNewestFirst(replace ? list : mergeUnique(prev, list)));
        setHasMore(hasMorePages(res, extractList(res).length, LIMIT));
        setPage(p);
      } catch {
        /* handled globally */
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) return undefined;
    let alive = true;
    setLoading(true);
    fetchPage(1, true).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId, fetchPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchPage(page + 1);
    setLoadingMore(false);
  };

  const joined = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <section className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-500 to-indigo-500" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <Avatar user={user} size={96} className="ring-4 ring-white" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">{user?.name || 'Your profile'}</h1>
          {user?.username && <p className="text-sm text-slate-500">@{user.username}</p>}
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            {user?.email && (
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {user.email}</span>
            )}
            {user?.gender && (
              <span className="flex items-center gap-1.5 capitalize"><UserIcon className="h-4 w-4" /> {user.gender}</span>
            )}
            {user?.dateOfBirth && (
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Born {new Date(user.dateOfBirth).toLocaleDateString()}</span>
            )}
            {joined && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Joined {joined}</span>}
          </div>
        </div>
      </section>

      <h2 className="px-1 text-lg font-semibold">My posts</h2>

      {loading && (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      )}
      {!loading && posts.length === 0 && (
        <div className="card p-8 text-center text-slate-500">You haven&apos;t posted anything yet.</div>
      )}
      {posts.map((post) => (
        <PostCard
          key={getId(post)}
          post={post}
          onUpdated={(p) => setPosts((prev) => prev.map((x) => (getId(x) === getId(p) ? p : x)))}
          onDeleted={(id) => setPosts((prev) => prev.filter((x) => getId(x) !== id))}
        />
      ))}
      {hasMore && !loading && (
        <button onClick={loadMore} disabled={loadingMore} className="btn-ghost w-full border border-slate-200 bg-white">
          {loadingMore && <Spinner className="h-4 w-4" />} Load more posts
        </button>
      )}
    </div>
  );
}
