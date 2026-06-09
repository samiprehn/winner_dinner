// Builds www/ for the Capacitor Android app from the website source files.
// AdSense is stripped: it's not allowed inside mobile apps (AdMob territory).
const fs = require('fs');
const path = require('path');

const ADSENSE_RE = /\s*<script[^>]*pagead2\.googlesyndication\.com[^>]*><\/script>/g;

fs.mkdirSync('www', { recursive: true });

for (const f of ['index.html', 'app.html']) {
  const html = fs.readFileSync(f, 'utf8').replace(ADSENSE_RE, '');
  fs.writeFileSync(path.join('www', f), html);
}
fs.copyFileSync('windin_logo.png', path.join('www', 'windin_logo.png'));

console.log('Built www/ (AdSense stripped)');
