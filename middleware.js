// Vercel Routing Middleware. learn.vishalpanwar.in serves the study checklist
// (public/sdc/index.html) at its root. A vercel.json rewrite can't do this:
// the portfolio's own index.html already answers "/", and files win over
// rewrites. Middleware runs before that, and only for "/".
export const config = { matcher: '/' }

export default function middleware(request) {
  const url = new URL(request.url)
  if (url.hostname === 'learn.vishalpanwar.in') {
    return new Response(null, { headers: { 'x-middleware-rewrite': new URL('/sdc/index.html', url).toString() } })
  }
  return new Response(null, { headers: { 'x-middleware-next': '1' } })
}
