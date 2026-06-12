// winner-dinner-push — sends FCM push notifications to dinner party members.
//
// The app (the device whose action caused the event) POSTs /notify with a
// Firebase ID token; the worker verifies it, confirms the sender is in the
// session, then notifies every OTHER participant's registered devices.
//
// Secret required: FIREBASE_SERVICE_ACCOUNT — the full JSON of a Firebase
// service account key (Project settings -> Service accounts -> Generate key).
//   npx wrangler secret put FIREBASE_SERVICE_ACCOUNT < key.json

const PROJECT_ID = 'winner-dinner-3e154';
const DB_URL = 'https://winner-dinner-3e154-default-rtdb.firebaseio.com';
const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

const b64url = (buf) =>
    btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const b64urlDecode = (s) => {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
};

// --- Verify a Firebase Auth ID token (RS256 against Google's public JWKs) ---
let jwkCache = { keys: null, expires: 0 };

async function verifyIdToken(idToken) {
    const parts = (idToken || '').split('.');
    if (parts.length !== 3) throw new Error('bad token');
    const header = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])));
    const now = Math.floor(Date.now() / 1000);
    if (payload.aud !== PROJECT_ID || payload.iss !== `https://securetoken.google.com/${PROJECT_ID}` || payload.exp <= now || !payload.sub) {
        throw new Error('invalid token claims');
    }
    if (Date.now() > jwkCache.expires) {
        const res = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
        jwkCache = { keys: (await res.json()).keys, expires: Date.now() + 3600_000 };
    }
    const jwk = jwkCache.keys.find((k) => k.kid === header.kid);
    if (!jwk) throw new Error('unknown signing key');
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        b64urlDecode(parts[2]),
        new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!ok) throw new Error('bad signature');
    return payload.sub;
}

// --- OAuth access token from the service account (for FCM + RTDB REST) ---
let tokenCache = { token: null, expires: 0 };

async function getAccessToken(sa) {
    if (Date.now() < tokenCache.expires) return tokenCache.token;
    const now = Math.floor(Date.now() / 1000);
    const claims = {
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
    };
    const enc = new TextEncoder();
    const unsigned = `${b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))}.${b64url(enc.encode(JSON.stringify(claims)))}`;
    const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const key = await crypto.subtle.importKey(
        'pkcs8',
        Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(unsigned));
    const jwt = `${unsigned}.${b64url(sig)}`;
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`,
    });
    const data = await res.json();
    if (!data.access_token) throw new Error('oauth failed');
    tokenCache = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
    return data.access_token;
}

// First name, plus last initial / full last name only as needed to
// disambiguate within the party (mirrors the app's display logic)
function shortName(fullName, allNames) {
    const parse = (n) => {
        const parts = (n || '').trim().split(/\s+/);
        return { first: parts[0] || 'Someone', last: parts.slice(1).join(' ') };
    };
    const me = parse(fullName);
    const others = allNames.map(parse).filter((p) => p.first === me.first);
    if (others.length <= 1 || !me.last) return me.first;
    const initial = me.last[0].toUpperCase();
    const sameInitial = others.filter((p) => p.last && p.last[0].toUpperCase() === initial);
    return sameInitial.length > 1 ? `${me.first} ${me.last}` : `${me.first} ${initial}`;
}

const dbGet = async (path, token) => (await fetch(`${DB_URL}/${path}.json?access_token=${token}`)).json();
const dbDelete = (path, token) => fetch(`${DB_URL}/${path}.json?access_token=${token}`, { method: 'DELETE' });

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
        if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

        let uid;
        try {
            uid = await verifyIdToken((request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''));
        } catch (e) {
            return json({ error: `auth: ${e.message}` }, 401);
        }

        try {
            const { sessionCode, event, restaurant, count } = await request.json();
            if (!/^[A-Z0-9]{4,10}$/.test(sessionCode || '')) return json({ error: 'bad session code' }, 400);

            const token = await getAccessToken(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT));
            const session = await dbGet(`sessions/${sessionCode}`, token);
            if (!session?.participants?.[uid]) return json({ error: 'not a participant' }, 403);

            const senderName = shortName(session.participants[uid], Object.values(session.participants));
            const partyName = session.name || sessionCode;
            let title, body;
            if (event === 'match' && restaurant) {
                title = "It's a match! 🎉";
                body = `Everyone in ${partyName} wants ${restaurant}`;
            } else if (event === 'join') {
                title = partyName;
                body = `${senderName} joined the party`;
            } else if (event === 'added' && count > 0) {
                title = partyName;
                body = `${senderName} added ${count === 1 ? 'a restaurant' : `${count} restaurants`} — time to vote!`;
            } else {
                return json({ error: 'bad event' }, 400);
            }

            const others = Object.keys(session.participants).filter((u) => u !== uid);
            const targets = [];
            await Promise.all(
                others.map(async (u) => {
                    const tokens = await dbGet(`users/${u}/fcmTokens`, token);
                    if (tokens) Object.keys(tokens).forEach((t) => targets.push({ uid: u, deviceToken: t }));
                })
            );

            let sent = 0;
            await Promise.all(
                targets.map(async ({ uid: u, deviceToken }) => {
                    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: { token: deviceToken, notification: { title, body }, data: { sessionCode } },
                        }),
                    });
                    if (res.ok) sent++;
                    else if (res.status === 404 || res.status === 400) {
                        // stale/invalid device token — forget it
                        await dbDelete(`users/${u}/fcmTokens/${deviceToken}`, token);
                    }
                })
            );
            return json({ sent, devices: targets.length });
        } catch (e) {
            return json({ error: e.message }, 500);
        }
    },
};
