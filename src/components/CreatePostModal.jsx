import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Spinner from './Spinner';
import Avatar from './Avatar';
import { postsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { getAuthor, getPostImage } from '../utils/helpers';

/**
 * Create a post (no `post` prop) or edit an existing one (`post` prop).
 * onSaved(post | null): receives the saved post (null => caller should refetch).
 */
export default function CreatePostModal({ open, onClose, post = null, onSaved }) {
  const { user } = useAuth();
  const isEdit = !!post;
  const fileRef = useRef(null);

  const [body, setBody] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [loading, setLoading] = useState(false);

  const existingImage = isEdit && !removeExisting ? getPostImage(post) : null;

  // Reset state each time the modal opens.
  useEffect(() => {
    if (open) {
      setBody(post?.body || '');
      setFile(null);
      setPreview(null);
      setRemoveExisting(false);
    }
  }, [open, post]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Please choose an image file');
    if (f.size > 5 * 1024 * 1024) return toast.error('Image must be smaller than 5MB');
    setFile(f);
    setRemoveExisting(false);
  };

  const clearImage = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    if (isEdit && getPostImage(post)) setRemoveExisting(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = body.trim();
    if (!text && !file && !existingImage) return toast.error('Write something or attach an image');

    const fd = new FormData();
    if (text) fd.append('body', text);
    if (file) fd.append('image', file);
    if (isEdit && removeExisting && !file) fd.append('removeImage', 'true');

    setLoading(true);
    try {
      if (isEdit) {
        const res = await postsApi.update(post._id || post.id, fd);
        const updated = postsApi.pick(res);
        toast.success('Post updated');
        onSaved?.({
          ...post,
          ...(updated && typeof updated === 'object' ? updated : {}),
          body: updated?.body ?? text,
          user: getAuthor(updated)?.name ? updated.user : post.user,
        });
      } else {
        const res = await postsApi.create(fd);
        const created = postsApi.pick(res);
        toast.success('Post published');
        if (created && (created._id || created.id)) {
          onSaved?.({ ...created, user: getAuthor(created)?.name ? created.user : user });
        } else {
          onSaved?.(null);
        }
      }
      onClose();
    } catch {
      // Error toast is handled globally.
    } finally {
      setLoading(false);
    }
  };

  const shownImage = preview || existingImage;

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={isEdit ? 'Edit post' : 'Create post'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar user={user} />
          <span className="font-semibold">{user?.name}</span>
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder={`What's on your mind${user?.name ? `, ${user.name.split(' ')[0]}` : ''}?`}
          className="input resize-none"
        />

        {shownImage && (
          <div className="relative overflow-hidden rounded-lg border border-slate-200">
            <img src={shownImage} alt="Selected" className="max-h-72 w-full object-cover" />
            <button type="button" onClick={clearImage} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80" aria-label="Remove image">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
          <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-5 w-5 text-green-600" /> {shownImage ? 'Change image' : 'Add image'}
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Spinner className="h-4 w-4" />} {isEdit ? 'Save changes' : 'Post'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
