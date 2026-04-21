export const CACHE_TTL = 60 * 60 * 24 * 7;
export const LOCK_TTL = 10; // Đơn vị giây
export const WAIT_POLL_INTERVAL = 100; // ms
export const WAIT_MAX_ITERATIONS = 30;

export const TRANSLATION_EVENTS = {
  POST_CREATED: 'post.created',
  COMMENT_CREATED: 'comment.created',
} as const;
