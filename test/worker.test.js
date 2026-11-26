import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

const env = { TARGET_ORIGIN: 'https://tada2you.com' };
const site = 'https://tada2you.com';

// [method, address, settings, status, location or null, body check]
const cases = [
    ['GET', 'https://2s.au/abcde', env, 302, site + '/abcde'],
    ['GET', 'http://2s.au/abcde', env, 302, site + '/abcde'],
    ['HEAD', 'https://2s.au/abcde', env, 302, site + '/abcde'],
    ['GET', 'https://2s.au/AbC-9', env, 302, site + '/abc-9'],
    ['GET', 'https://2s.au/abcde/', env, 302, site + '/abcde'],
    ['GET', 'https://2s.au/abcde?utm=1&next=https://evil.example', env, 302, site + '/abcde'],
    ['GET', 'https://2s.au/' + 'a'.repeat(32), env, 302, site + '/' + 'a'.repeat(32)],
    ['GET', 'https://2s.au/', env, 302, site + '/'],
    ['GET', 'https://staging.2s.au/abcde', { TARGET_ORIGIN: 'https://staging.tada2you.com' }, 302, 'https://staging.tada2you.com/abcde'],
    ['GET', 'https://2s.au/abcde', { TARGET_ORIGIN: 'http://localhost:8787' }, 302, 'http://localhost:8787/abcde'],
    ['GET', 'https://2s.au/' + 'a'.repeat(33), env, 404, null],
    ['GET', 'https://2s.au/a/b', env, 404, null],
    ['GET', 'https://2s.au/a.b', env, 404, null],
    ['GET', 'https://2s.au/%2F%2Fevil.example', env, 404, null],
    ['GET', 'https://2s.au//evil.example', env, 404, null],
    ['GET', 'https://2s.au/a_b', env, 404, null],
    ['POST', 'https://2s.au/abcde', env, 405, null],
    ['DELETE', 'https://2s.au/', env, 405, null],
    ['GET', 'https://2s.au/health', env, 200, null, /"target":"https:\/\/tada2you\.com"/],
    ['HEAD', 'https://2s.au/health', env, 200, null, /^$/],
    ['GET', 'https://2s.au/health', {}, 500, null, /"ok":false/],
    ['GET', 'https://2s.au/health', { TARGET_ORIGIN: 'tada2you.com' }, 500, null],
    ['GET', 'https://2s.au/health', { TARGET_ORIGIN: 'https://tada2you.com/path' }, 500, null],
    ['GET', 'https://2s.au/health', { TARGET_ORIGIN: 'javascript:alert(1)' }, 500, null],
    ['GET', 'https://2s.au/abcde', {}, 500, null],
    ['GET', 'https://2s.au/robots.txt', {}, 200, null, /^User-agent: \*\nAllow: \/\n$/]
];

for (const [method, address, settings, status, location, body] of cases) {
    test(`${method} ${address} with ${settings.TARGET_ORIGIN || 'no target'} answers ${status}`, async () => {
        const response = await worker.fetch(new Request(address, { method }), settings);
        assert.equal(response.status, status);
        assert.equal(response.headers.get('location'), location);
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
        assert.equal(response.headers.get('x-robots-tag'), 'noindex');
        assert.equal(response.headers.get('set-cookie'), null);
        if (status === 405) assert.equal(response.headers.get('allow'), 'GET, HEAD');
        if (body) assert.match(await response.text(), body);
    });
}
