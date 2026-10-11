// ══════════ SECURITY — password hashing + login throttle ══════════
// Passwords are never stored in plain text: each user gets a random salt and
// a PBKDF2-SHA256 hash (ph = hash, ps = salt, pi = iterations). Verification
// happens in the browser, so this protects the *stored* passwords (database,
// backups, anyone browsing the data) — it is NOT a substitute for Firestore
// security rules / Firebase Auth. See SECURITY.md.

const PW_ITER = 150000;
const WEAK_PASSWORDS = ['admin1234','editor1234','editor2222','tadir123','pass1234','12345678','123456','password','tadiran','tadiran123'];

const pwSecure = () => !!(window.crypto && window.crypto.subtle);
const _b64   = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const _unb64 = s   => Uint8Array.from(atob(s), c => c.charCodeAt(0));

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function pwHash(pwd, saltB64, iter) {
  const key  = await crypto.subtle.importKey('raw', new TextEncoder().encode(pwd), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt:_unb64(saltB64), iterations:iter, hash:'SHA-256'}, key, 256);
  return _b64(bits);
}

// → {ph, ps, pi} to store on the user record
async function pwMake(pwd) {
  const ps = _b64(crypto.getRandomValues(new Uint8Array(16)));
  return { ps, pi: PW_ITER, ph: await pwHash(pwd, ps, PW_ITER) };
}

// Does `pwd` match this user? Supports hashed users and (until migrated) legacy plaintext.
async function pwVerify(user, pwd) {
  if (user.ph && user.ps) {
    if (!pwSecure()) return false;
    return timingSafeEqual(await pwHash(pwd, user.ps, user.pi || PW_ITER), user.ph);
  }
  return typeof user.pass === 'string' && user.pass !== '' && user.pass === pwd;
}

const isHashed = u => !!(u.ph && u.ps);

// ── Client-side login throttle (UI deterrent only — can be bypassed) ──
const LOGIN_FAIL_KEY = 'ac_login_fail';
function loginLockLeft() {
  try {
    const s = JSON.parse(localStorage.getItem(LOGIN_FAIL_KEY) || '{}');
    return Math.max(0, Math.ceil(((s.until || 0) - Date.now()) / 1000));
  } catch (e) { return 0; }
}
function loginFailed() {
  try {
    const s = JSON.parse(localStorage.getItem(LOGIN_FAIL_KEY) || '{}');
    const n = (s.n || 0) + 1;
    // free tries first, then 30s, 60s, 120s ... capped at 15 minutes
    const wait = n >= 5 ? Math.min(15 * 60, 30 * Math.pow(2, n - 5)) : 0;
    localStorage.setItem(LOGIN_FAIL_KEY, JSON.stringify({ n, until: wait ? Date.now() + wait * 1000 : 0 }));
  } catch (e) {}
}
function loginSucceeded() { try { localStorage.removeItem(LOGIN_FAIL_KEY); } catch (e) {} }

// ══════════ SECURE MODE — staff login through hidden Firebase accounts ══════════
// Login stays password-only. Behind the scenes the typed password is tried
// against two technical Firebase Auth accounts (admin / editor); Firestore Rules
// then let only those sessions write. Viewers never touch Firebase Auth.
// Decision order: viewer list → Firebase staff → legacy local staff (only while
// secure mode is OFF).
async function resolveLogin(users, pwd, secure, staffLogin) {
  const oks   = await Promise.all(users.map(u => pwVerify(u, pwd)));
  const local = users[oks.indexOf(true)] || null;
  if (local && local.role === 'viewer') return {ok:true, role:'viewer', id:local.id, label:local.label};

  let staffRole = null, authErr = null;
  try { staffRole = await staffLogin(pwd); } catch (e) { authErr = e; }
  if (staffRole) return {ok:true, role:staffRole, id:'fb-'+staffRole, label: staffRole === 'admin' ? 'מנהל' : 'עורך'};

  if (local && !secure) return {ok:true, role:local.role, id:local.id, label:local.label};   // legacy (pre-secure-mode)
  if (authErr) {
    const c = authErr.code || '';
    return {ok:false, reason: c === 'auth/too-many-requests' ? 'toomany' : c === 'auth/network-request-failed' ? 'network' : 'noauth'};
  }
  return {ok:false, reason:'wrong'};
}

const FIRESTORE_RULES = "rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n\n    // ── Staff = two technical Firebase Auth accounts (nobody types an email: the\n    //    site's password-only login uses them behind the scenes). See SECURITY.md.\n    function isAdmin()  { return request.auth != null && request.auth.token.email == 'admin@catalog.invalid'; }\n    function isEditor() { return request.auth != null && request.auth.token.email == 'editor@catalog.invalid'; }\n    function isStaff()  { return isAdmin() || isEditor(); }\n    function str(v, max) { return v is string && v.size() <= max; }\n\n    // Catalog structure + per-model parts + news + broadcast:\n    // readable by everyone (the site loads them before login); written only by staff.\n    match /catalog/{doc} {\n      allow read: if true;\n      allow create, update: if isStaff();\n      allow delete: if false;\n    }\n    match /parts/{doc}  { allow read: if true; allow write: if isStaff(); }\n    match /news/{doc}   { allow read: if true; allow write: if isStaff(); }\n    match /system/{doc} { allow read: if true; allow write: if isStaff(); }\n\n    // Staff only: activity log, alerts, restore points.\n    match /history/{doc}   { allow read, write: if isStaff(); }\n    match /alerts/{doc}    { allow read, write: if isStaff(); }\n    match /snapshots/{doc} { allow read, write: if isStaff(); }\n\n    // Anyone (viewers too) may SUBMIT an error report / missing-model request.\n    // Only staff can read, resolve or delete them.\n    match /reports/{doc} {\n      allow create: if request.resource.data.keys().hasOnly(['bid','cid','mid','modelName','brandName','text','role','ts','resolved'])\n                    && request.resource.data.keys().hasAll(['text','ts','resolved'])\n                    && str(request.resource.data.text, 2000)\n                    && request.resource.data.resolved == false\n                    && request.resource.data.ts == request.time;\n      allow read, update, delete: if isStaff();\n    }\n    match /techRequests/{doc} {\n      allow create: if request.resource.data.keys().hasOnly(['text','submittedBy','role','ts','resolved'])\n                    && request.resource.data.keys().hasAll(['text','ts','resolved'])\n                    && str(request.resource.data.text, 2000)\n                    && request.resource.data.resolved == false\n                    && request.resource.data.ts == request.time;\n      allow read, update, delete: if isStaff();\n    }\n\n    // Per-model view counter: anyone may add exactly +1.\n    match /views/{id} {\n      allow get: if true;\n      allow list, delete: if isStaff();\n      allow create: if request.resource.data.keys().hasOnly(['count','modelName','brandName','lastSeen'])\n                    && request.resource.data.count == 1;\n      allow update: if request.resource.data.keys().hasOnly(['count','modelName','brandName','lastSeen'])\n                    && request.resource.data.count == resource.data.count + 1;\n    }\n\n    // Everything else: closed.\n    match /{document=**} { allow read, write: if false; }\n  }\n}\n";
