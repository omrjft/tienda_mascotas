const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'tm_sid';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas
const sessions = new Map();

/**
 * Genera un hash seguro con sal aleatoria usando scrypt.
 * Formato: saltHex:hashHex
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Verifica una contraseña contra un hash almacenado (saltHex:hashHex).
 * Soporta comparación en tiempo constante.
 */
function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedBuffer = crypto.scryptSync(String(password), salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

/**
 * Crea una sesión administrada en servidor y devuelve su ID opaco.
 */
function createSession(userPayload) {
  const sid = crypto.randomBytes(32).toString('hex');
  sessions.set(sid, {
    user: userPayload,
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  return sid;
}

/**
 * Obtiene la sesión activa por SID o null si expiró o no existe.
 */
function getSession(sid) {
  if (!sid) return null;
  const entry = sessions.get(sid);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    sessions.delete(sid);
    return null;
  }
  return entry;
}

/**
 * Elimina una sesión del servidor.
 */
function destroySession(sid) {
  if (sid) {
    sessions.delete(sid);
  }
}

function destroyUserSessions(userId) {
  for (const [sid, session] of sessions.entries()) {
    if (session.user.id === userId) {
      sessions.delete(sid);
    }
  }
}

/**
 * Parsea la cabecera Cookie en un objeto clave-valor.
 */
function parseCookies(cookieHeader) {
  const result = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return result;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = decodeURIComponent(pair.slice(idx + 1).trim());
    if (key) result[key] = val;
  }
  return result;
}

/**
 * Establece la cookie HttpOnly de sesión.
 */
function setSessionCookie(res, sid) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE_NAME, sid, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS
  });
}

/**
 * Limpia la cookie de sesión.
 */
function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/'
  });
}

module.exports = {
  SESSION_COOKIE_NAME,
  hashPassword,
  verifyPassword,
  createSession,
  getSession,
  destroySession,
  destroyUserSessions,
  parseCookies,
  setSessionCookie,
  clearSessionCookie
};
