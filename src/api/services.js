import api from './axiosInstance';
import { extractList, getId } from '../utils/helpers';

const quiet = { skipErrorToast: true };

export const authApi = {
  signup: (payload) => api.post('/users/signup', payload),
  signin: (payload) => api.post('/users/signin', payload),
  profile: (config = {}) => api.get('/users/profile-data', config),
  changePassword: (payload) => api.patch('/users/change-password', payload),
};

const pickPost = (res) => {
  const d = res?.data?.data;
  return d?.post || d || null;
};

// Scan paginated public posts (used only as a fallback).
const scanPosts = async (predicate, maxPages = 10, limit = 50) => {
  const found = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const res = await api.get('/posts', { params: { page, limit, sort: '-createdAt' }, ...quiet });
    const list = extractList(res);
    found.push(...list.filter(predicate));
    if (list.length < limit) break;
  }
  return found;
};

export const postsApi = {
  list: ({ page = 1, limit = 10 } = {}) =>
    api.get('/posts', { params: { page, limit, sort: '-createdAt' } }),

  async listByUser(userId, { page = 1, limit = 10 } = {}) {
    try {
      return await api.get(`/users/${userId}/posts`, { params: { page, limit }, ...quiet });
    } catch (err) {
      // Fallback: filter the public timeline by author id.
      const mine = await scanPosts((p) => getId(p?.user ?? p?.author) === userId);
      return { data: { data: { posts: mine }, meta: { nextPage: null } } };
    }
  },

  async getById(id) {
    try {
      const res = await api.get(`/posts/${id}`, quiet);
      const post = pickPost(res);
      if (post && getId(post)) return post;
    } catch (err) {
      if (err?.response && ![404, 405].includes(err.response.status)) throw err;
    }
    const [match] = await scanPosts((p) => getId(p) === id);
    if (!match) {
      const e = new Error('Post not found');
      e.notFound = true;
      throw e;
    }
    return match;
  },

  create: (formData) => api.post('/posts', formData),
  update: (id, formData) => api.put(`/posts/${id}`, formData),
  remove: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.put(`/posts/${id}/like`),
  pick: pickPost,
};

export const commentsApi = {
  list: (postId, { page = 1, limit = 10 } = {}) =>
    api.get(`/posts/${postId}/comments`, { params: { page, limit } }),
  create: (postId, content) => {
    const fd = new FormData();
    fd.append('content', content);
    return api.post(`/posts/${postId}/comments`, fd);
  },
  update: (postId, commentId, content) =>
    api.put(`/posts/${postId}/comments/${commentId}`, { content }),
  remove: (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`),
};
