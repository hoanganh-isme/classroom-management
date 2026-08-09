import httpClient from "./httpClient";

export const createAccessCode = async (identifier) => {
  const payload = typeof identifier === 'string' && identifier.includes('@')
    ? { email: identifier.trim() }
    : { phoneNumber: identifier };
  const response = await httpClient.post("/createAccessCode", payload);
  return response.data;
};

export const validateAccessCode = async (identifier, accessCode) => {
  const payload = typeof identifier === 'string' && identifier.includes('@')
    ? { email: identifier.trim(), accessCode }
    : { phoneNumber: identifier, accessCode };
  const response = await httpClient.post("/validateAccessCode", payload);
  return response.data;
};

export const firebasePhoneLogin = async (idToken) => {
  const response = await httpClient.post("/firebasePhoneLogin", { idToken });
  return response.data;
};
