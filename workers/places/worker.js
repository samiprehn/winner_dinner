// winner-dinner (Places proxy) — fronts the *paid* Google Places API (New, v1).
//
// SECURITY: every request must carry a valid Firebase ID token in the
// Authorization header. The worker verifies it (RS256 against Google's public
// JWKs) before spending any Places quota, so only signed-in app users can call
// it. A stranger with curl — even one spoofing the Origin header — is rejected
// with 401. This mirrors the winner-dinner-push worker's auth model.
//
// Secret required (set to match your existing Places key):
//   npx wrangler secret put GOOGLE_PLACES_API_KEY
// If your current worker reads the key under a different name, either rename it
// here or set this secret to the same value.
//
// Client sends GET ?mode=search|browse&query=&lat=&lng=&limit=&radius=
// and returns Google's { places: [...] } shape unchanged (the app's
// parseGoogleResults reads displayName.text, formattedAddress, location,
// primaryTypeDisplayName.text).

const PROJECT_ID = 'winner-dinner-3e154';
const FIELD_MASK = 'places.displayName,places.formattedAddress,places.location,places.primaryTypeDisplayName';

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

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

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
        if (request.method !== 'GET') return json({ error: 'GET only' }, 405);

        // --- auth gate: no valid token, no Places quota spent ---
        try {
            await verifyIdToken((request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''));
        } catch (e) {
            return json({ error: `auth: ${e.message}` }, 401);
        }

        try {
            const url = new URL(request.url);
            const mode = url.searchParams.get('mode');
            const lat = parseFloat(url.searchParams.get('lat'));
            const lng = parseFloat(url.searchParams.get('lng'));
            const radius = Math.min(parseFloat(url.searchParams.get('radius')) || 32187, 50000);
            const limit = Math.min(parseInt(url.searchParams.get('limit'), 10) || 20, 20);
            const hasLoc = Number.isFinite(lat) && Number.isFinite(lng);
            const circle = { center: { latitude: lat, longitude: lng }, radius };

            let endpoint, body;
            if (mode === 'search') {
                const query = (url.searchParams.get('query') || '').trim();
                if (!query) return json({ error: 'missing query' }, 400);
                endpoint = 'https://places.googleapis.com/v1/places:searchText';
                body = {
                    textQuery: query,
                    maxResultCount: limit,
                    ...(hasLoc ? { locationBias: { circle } } : {}),
                };
            } else if (mode === 'browse') {
                if (!hasLoc) return json({ error: 'missing lat/lng' }, 400);
                endpoint = 'https://places.googleapis.com/v1/places:searchNearby';
                body = {
                    maxResultCount: limit,
                    includedTypes: ['restaurant'],
                    locationRestriction: { circle },
                };
            } else {
                return json({ error: 'bad mode' }, 400);
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
                    'X-Goog-FieldMask': FIELD_MASK,
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            return json(data, res.ok ? 200 : res.status);
        } catch (e) {
            return json({ error: e.message }, 500);
        }
    },
};
