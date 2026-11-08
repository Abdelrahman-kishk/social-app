import { useCallback, useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import CreatePostModal from '../components/CreatePostModal';
import Spinner from '../components/Spinner';
import { postsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { extractList, getId, hasMorePages, mergeUnique, sortNewestFirst } from '../utils/helpers';

const LIMIT = 10;

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchPage = useCallback(async (p, replace = false) => {
    try {
      const res = await postsApi.list({ page: p, limit: LIMIT });
      const list = extractList(res);
      setPosts((prev) => sortNewestFirst(replace ? list : mergeUnique(prev, list)));
      setHasMore(hasMorePages(res, list.length, LIMIT));
      setPage(p);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchPage(1, true).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [fetchPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchPage(page + 1);
    setLoadingMore(false);
  };

  const handleCreated = async (post) => {
    if (post) setPosts((prev) => sortNewestFirst(mergeUnique([post], prev)));
    else await fetchPage(1, true);
  };

  const handleUpdated = (post) =>
    setPosts((prev) => prev.map((p) => (getId(p) === getId(post) ? post : p)));

  const handleDeleted = (id) => setPosts((prev) => prev.filter((p) => getId(p) !== id));

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div className="card flex items-center gap-3 p-4">
        <Avatar user={user} size={42} />
        <button
          onClick={() => setCreateOpen(true)}
          className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-left text-sm text-slate-500 transition hover:bg-slate-200"
        >
          What&apos;s on your mind{user?.name ? `, ${user.name.split(' ')[0]}` : ''}?
        </button>
        <button onClick={() => setCreateOpen(true)} className="btn-ghost !p-2" aria-label="Add photo">
          <ImagePlus className="h-6 w-6 text-green-600" />
        </button>
      </div>

      {loading && (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      )}

      {!loading && failed && posts.length === 0 && (
        <div className="card p-8 text-center">
          <p className="mb-3 text-slate-600">We couldn&apos;t load the feed.</p>
          <button className="btn-primary" onClick={() => { setLoading(true); fetchPage(1, true).finally(() => setLoading(false)); }}>
            Try again
          </button>
        </div>
      )}

      {!loading && !failed && posts.length === 0 && (
        <div className="card p-8 text-center text-slate-500">No posts yet. Be the first to share something!</div>
      )}

      {posts.map((post) => (
        <PostCard key={getId(post)} post={post} onUpdated={handleUpdated} onDeleted={handleDeleted} />
      ))}

      {hasMore && !loading && (
        <button onClick={loadMore} disabled={loadingMore} className="btn-ghost w-full border border-slate-200 bg-white">
          {loadingMore && <Spinner className="h-4 w-4" />} Load more posts
        </button>
      )}

      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={handleCreated} />
    </div>
  );
}
