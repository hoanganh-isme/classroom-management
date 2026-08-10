import { disconnectSocket } from '../socket/socketClient';
import { signOutFirebase } from '../services/firebasePhoneAuth.service';

// Decodes a JWT token payload safely
export function decodeJwtToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Checks if a JWT token is expired
export function isJwtExpired(token) {
  const decoded = decodeJwtToken(token);
  if (!decoded || !decoded.exp) return true;
  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  return decoded.exp <= currentTimeInSeconds;
}

// Returns the currently stored token if valid and not expired
export function getStoredToken() {
  const token = localStorage.getItem('token');
  if (!token || isJwtExpired(token)) {
    return null;
  }
  return token;
}

// Gets the user role verified against JWT token
export function getUserRole(tokenOrAuthData = null) {
  let rawToken = typeof tokenOrAuthData === 'string' ? tokenOrAuthData : tokenOrAuthData?.token;

  if (!rawToken) {
    rawToken = localStorage.getItem('token');
  }

  if (rawToken && !isJwtExpired(rawToken)) {
    const decoded = decodeJwtToken(rawToken);
    if (decoded && (decoded.role === 'student' || decoded.role === 'instructor')) {
      return decoded.role;
    }
  }

  return null;
}

// Saves authenticated session data
export function saveAuthSession(authData) {
  if (!authData) return;
  if (authData.token) {
    localStorage.setItem('token', authData.token);
  }
  if (authData.user) {
    localStorage.setItem('user', JSON.stringify(authData.user));
    if (authData.user.phone) {
      localStorage.setItem('phone', authData.user.phone);
    }
  }
}

// Clears authenticated session data
export function clearAuthSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('phone');
  try {
    signOutFirebase();
  } catch (err) {
    console.warn('Firebase signout warning:', err);
  }
  disconnectSocket();
}
