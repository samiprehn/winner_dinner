// Patches @capacitor-firebase/authentication's iOS Apple sign-in handler.
// Upstream only builds a displayName when Apple shares BOTH a given and a
// family name; some Apple IDs only have a first name, which upstream drops.
// Runs on postinstall so CI builds (npm ci) pick it up too.
const fs = require('fs');

const FILE = 'node_modules/@capacitor-firebase/authentication/ios/Plugin/Handlers/AppleAuthProviderHandler.swift';

const UPSTREAM = `        var displayName: String?
        if let fullName = appleIDCredential.fullName {
            if let givenName = fullName.givenName, let familyName = fullName.familyName {
                displayName = "\\(givenName) \\(familyName)"
            }
        }`;

const PATCHED = `        var displayName: String?
        if let fullName = appleIDCredential.fullName {
            let parts = [fullName.givenName, fullName.familyName].compactMap { $0 }
            if !parts.isEmpty {
                displayName = parts.joined(separator: " ")
            }
        }`;

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes(PATCHED)) {
  console.log('patch-plugins: Apple displayName patch already applied');
} else if (src.includes(UPSTREAM)) {
  fs.writeFileSync(FILE, src.replace(UPSTREAM, PATCHED));
  console.log('patch-plugins: applied Apple displayName patch');
} else {
  console.error('patch-plugins: expected code not found in ' + FILE +
    ' — the plugin was probably updated. Re-check whether the patch is still needed.');
  process.exit(1);
}
