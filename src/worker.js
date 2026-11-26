// 2s.au: the short address printed inside the QR codes. It forwards
// /<ending> to the same path on the site and stores nothing.
const HEADERS = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-robots-tag': 'noindex' };
// Deliberately loose: the site alone decides which endings exist.
const ENDING = /^\/([A-Za-z0-9-]{1,32})\/?$/;

// The site's address from the settings, or null when missing or malformed.
export function targetOrigin(env) {
    try {
        const url = new URL(env.TARGET_ORIGIN);
        return /^https?:$/.test(url.protocol) && url.origin === String(env.TARGET_ORIGIN).replace(/\/$/, '') ? url.origin : null;
    } catch { return null; }
}

export default {
    fetch(request, env) {
        const head = request.method === 'HEAD';
        const reply = (body, status, headers = {}) => new Response(head ? null : body, { status, headers: { ...HEADERS, ...headers } });
        if (request.method !== 'GET' && !head) return reply('Method not allowed\n', 405, { allow: 'GET, HEAD' });

        const { pathname } = new URL(request.url);
        // Every bot may follow a link (Kieran, 25 November): a chat app that
        // obeys robots.txt then shows the card's preview for a 2s.au link
        // shared by hand. x-robots-tag still keeps the links out of searches.
        if (pathname === '/robots.txt') return reply('User-agent: *\nAllow: /\n', 200, { 'content-type': 'text/plain; charset=utf-8' });
        const target = targetOrigin(env);
        if (pathname === '/health') {
            return reply(JSON.stringify({ ok: !!target, target }) + '\n', target ? 200 : 500, { 'content-type': 'application/json; charset=utf-8' });
        }
        const ending = pathname === '/' ? [null, ''] : pathname.match(ENDING);
        if (!ending) return reply('Not found\n', 404);
        if (!target) return reply('TARGET_ORIGIN is not set\n', 500);
        // 302, never 301: the destination must stay changeable. Query strings are dropped.
        return reply(null, 302, { location: target + '/' + ending[1].toLowerCase() });
    }
};
