export function decodeJwtToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT token:', e);
    return null;
  }
}

export function getUserRole(tokenOrAuthData = null) {
  // 1. Try decoding from explicit token or token in authData
  let rawToken = typeof tokenOrAuthData === 'string' ? tokenOrAuthData : tokenOrAuthData?.token;
  
  if (!rawToken) {
    rawToken = localStorage.getItem('token');
  }

  if (rawToken) {
    const decoded = decodeJwtToken(rawToken);
    if (decoded && decoded.role) {
      return decoded.role;
    }
  }

  // 2. Fallback to authData user object or localStorage user object
  if (tokenOrAuthData?.user?.role) {
    return tokenOrAuthData.user.role;
  }

  const savedUserStr = localStorage.getItem('user');
  if (savedUserStr) {
    try {
      const savedUser = JSON.parse(savedUserStr);
      if (savedUser?.role) return savedUser.role;
    } catch (e) {
      // Ignore JSON parse error
    }
  }

  return null;
}
