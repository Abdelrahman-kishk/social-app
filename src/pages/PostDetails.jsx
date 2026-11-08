import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import { postsApi } from '../api/services';

export default function PostDetails() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setPost(null);
    postsApi
      .getById(id)
      .then((p) => alive && setPost(p))
      .catch((err) => alive && setError(err?.notFound ? 'This post could not be found. It may have been deleted.' : 'Failed to load this post.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>
      {loading && <PostSkeleton />}
      {!loading && error && <div className="card p-8 text-center text-slate-600">{error}</div>}
      {!loading && post && <PostCard key={id} post={post} detail onUpdated={setPost} />}
    </div>
  );
}
