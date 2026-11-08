import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from './Avatar';
import Spinner from './Spinner';
import CreatePostModal from './CreatePostModal';
import CommentSection from './CommentSection';
import { postsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { fullDate, getAuthor, getId, getPostImage, timeAgo } from '../utils/helpers';

export default function PostCard({ post, detail = false, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const myId = getId(user);
  const postId = getId(post);
  const author = getAuthor(post);
  const authorId = getId(author);
  const isOwner = !!myId && !!authorId && myId === authorId;
  const image = getPostImage(post);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showComments, setShowComments] = useState(detail);
  const [commentsCount, setCommentsCount] = useState(
    post.commentsCount ?? (Array.isArray(post.comments) ? post.comments.length : 0)
  );
  const [liked, setLiked] = useState(
    post.isLiked ?? post.liked ?? post.likedByMe ?? (Array.isArray(post.likes) ? post.likes.some((l) => getId(l) === myId) : false)
  );
  const [likes, setLikes] = useState(post.likesCount ?? (Array.isArray(post.likes) ? post.likes.length : 0));
  const [liking, setLiking] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await postsApi.remove(postId);
      toast.success('Post deleted');
      onDeleted?.(postId);
      if (detail) navigate('/', { replace: true });
    } catch {
      setDeleting(false);
    }
  };

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await postsApi.like(postId);
      const d = res?.data?.data || {};
      const nextLiked = typeof d.liked === 'boolean' ? d.liked : typeof d.isLiked === 'boolean' ? d.isLiked : !liked;
      const nextCount = d.likesCount ?? (nextLiked ? likes + 1 : Math.max(0, likes - 1));
      setLiked(nextLiked);
      setLikes(nextCount);
    } catch {
      /* handled globally */
    } finally {
      setLiking(false);
    }
  };

  const body = post.body || '';

  return (
    <article className={`card overflow-hidden transition ${deleting ? 'pointer-events-none opacity-50' : ''}`}>
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar user={author} size={42} />
          <div>
            <p className="font-semibold leading-tight">{author?.name || 'Unknown user'}</p>
            <p className="text-xs text-slate-500" title={fullDate(post.createdAt)}>
              {timeAgo(post.createdAt)}
              {post.updatedAt && post.createdAt && post.updatedAt !== post.createdAt && ' · edited'}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((o) => !o)} className="btn-ghost !p-1.5" aria-label="Post options">
              {deleting ? <Spinner className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button onClick={() => { setMenuOpen(false); setEditOpen(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50">
                  <Pencil className="h-4 w-4" /> Edit post
                </button>
                <button onClick={handleDelete} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {body && (
        <div className="px-4 pb-3">
          {detail ? (
            <p className="whitespace-pre-wrap break-words">{body}</p>
          ) : (
            <Link to={`/post/${postId}`} className="block whitespace-pre-wrap break-words">
              {body.length > 400 ? `${body.slice(0, 400)}…` : body}
            </Link>
          )}
        </div>
      )}

      {image && (
        <Link to={`/post/${postId}`} className="block bg-slate-100">
          <img src={image} alt="Post" loading="lazy" className="max-h-[520px] w-full object-cover" />
        </Link>
      )}

      <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> {likes}</span>
        <button onClick={() => setShowComments((s) => !s)} className="hover:underline">{commentsCount} comments</button>
      </div>

      <div className="flex border-t border-slate-200 px-2 py-1">
        <button onClick={handleLike} disabled={liking} className={`btn-ghost flex-1 ${liked ? '!text-red-500' : ''}`}>
          <Heart className={`h-5 w-5 ${liked ? 'fill-red-500' : ''}`} /> Like
        </button>
        <button onClick={() => (detail ? setShowComments((s) => !s) : setShowComments(true))} className="btn-ghost flex-1">
          <MessageCircle className="h-5 w-5" /> Comment
        </button>
      </div>

      {showComments && (
        <CommentSection
          postId={postId}
          postOwnerId={authorId}
          onCountChange={(delta) => setCommentsCount((c) => Math.max(0, c + delta))}
        />
      )}

      <CreatePostModal open={editOpen} onClose={() => setEditOpen(false)} post={post} onSaved={(p) => p && onUpdated?.(p)} />
    </article>
  );
}
