// Cloudflare Worker - Google Places API Proxy
// Deploy at: https://workers.cloudflare.com
//
// SECURITY: every request must carry a valid Firebase ID token in the
// Authorization header. The worker verifies it (RS256 against Google's public
// JWKs) before spending any Places quota, so only signed-in app users can call
// it. A stranger with curl — even one spoofing the Origin header — is rejected
// with 401. This mirrors the winner-dinner-push worker's auth model.
//
// Secret required (the existing Places key):
//   npx wrangler secret put GOOGLE_PLACES_API_KEY

const PROJECT_ID = 'winner-dinner-3e154';

const ALLOWED_ORIGINS = [
  'https://samiprehn.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

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

// Only request basic fields to stay on cheapest pricing tier
const FIELD_MASK =
'places.displayName,places.formattedAddress,places.primaryTypeDisplayName,places.location';

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }

    // --- auth gate: no valid token, no Places quota spent ---
    try {
      await verifyIdToken((request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''));
    } catch (e) {
      return new Response(JSON.stringify({ error: `auth: ${e.message}` }), {
        status: 401,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'browse'; // 'browse' or 'search'
    const query = url.searchParams.get('query') || '';
    const lat = url.searchParams.get('lat') || '';
    const lng = url.searchParams.get('lng') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const radius = parseFloat(url.searchParams.get('radius') || '40000');

    // Get API key from environment variable
    const GOOGLE_API_KEY = env.GOOGLE_PLACES_API_KEY;

    try {
      let apiUrl, body;

      if (mode === 'search' && query) {
        // Text Search - for keyword searches
        apiUrl = 'https://places.googleapis.com/v1/places:searchText';
        body = {
          textQuery: query,
          maxResultCount: Math.min(limit, 20),
        };
        if (lat && lng) {
          body.locationBias = {
            circle: {
              center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
              radius: radius
            }
          };
        }
      } else if (lat && lng) {
        // Nearby Search - for browsing
        apiUrl = 'https://places.googleapis.com/v1/places:searchNearby';
        body = {
          includedTypes: ['restaurant'],
          excludedTypes: ['fast_food_restaurant', 'convenience_store'],
          maxResultCount: Math.min(limit, 20),
          locationRestriction: {
            circle: {
              center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
              radius: radius
            }
          },
          rankPreference: 'DISTANCE'
        };
      } else {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), {
          status: 400,
          headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' },
      });
    }
  },
};
