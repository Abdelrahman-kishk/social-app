export const getId = (o) => {
  if (!o) return null;
  if (typeof o === 'object') return o._id || o.id || null;
  return o;
};

const toUrl = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v;
  return v.url || v.secure_url || null;
};

export const getPostImage = (item) =>
  toUrl(item?.image) || (Array.isArray(item?.images) ? toUrl(item.images[0]) : null) || null;

export const getAuthor = (item) => {
  const a = item?.user ?? item?.author ?? item?.commentCreator ?? item?.creator ?? null;
  if (!a) return null;
  return typeof a === 'object' ? a : { _id: a };
};

export const getPhoto = (user) => toUrl(user?.photo) || toUrl(user?.avatar) || toUrl(user?.profilePicture) || null;

export const extractList = (res, keys = ['posts', 'comments', 'items', 'results']) => {
  const d = res?.data?.data;
  if (Array.isArray(d)) return d;
  for (const k of keys) if (Array.isArray(d?.[k])) return d[k];
  if (Array.isArray(res?.data?.[keys[0]])) return res.data[keys[0]];
  return [];
};

export const hasMorePages = (res, count, limit) => {
  const meta = res?.data?.meta || {};
  const pg = meta.pagination || meta;
  if (pg.numberOfPages != null && pg.currentPage != null) return Number(pg.currentPage) < Number(pg.numberOfPages);
  if ('nextPage' in pg) return !!pg.nextPage;
  return count >= limit;
};

export const sortNewestFirst = (list) =>
  [...list].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

export const mergeUnique = (existing, incoming) => {
  const map = new Map();
  [...existing, ...incoming].forEach((item) => map.set(getId(item), item));
  return Array.from(map.values());
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(seconds) >= secs) return rtf.format(Math.round(seconds / secs), unit);
  }
  return 'just now';
};

export const fullDate = (dateStr) => {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
};
