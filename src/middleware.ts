import { defineMiddleware } from 'astro:middleware';
import { getUser } from './server/auth';

/* Every server-rendered route gets the current user on locals, so pages
   never have to repeat session plumbing. */
export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  if (path.startsWith('/_') || path.startsWith('/fonts/')) return next();

  let user = null;
  try {
    user = await getUser(context);
  } catch (err) {
    console.error('[auth] session lookup failed', err);
  }
  context.locals.user = user;

  const needsAuth = path === '/account' || path.startsWith('/account/');
  const needsStaff = path === '/staff' || path.startsWith('/staff/');

  if (needsAuth && !user) return context.redirect(`/login?next=${encodeURIComponent(path)}`, 302);
  if (needsStaff && !(user && (user.role === 'staff' || user.role === 'admin')))
    return context.redirect('/login', 302);

  return next();
});
