import httpClient from "./httpClient";

export const createAccessCode = async (phoneNumber) => {
  const response = await httpClient.post("/createAccessCode", { phoneNumber });
  return response.data;
};

export const validateAccessCode = async (phoneNumber, accessCode) => {
  const response = await httpClient.post("/validateAccessCode", {
    phoneNumber,
    accessCode,
  });
  return response.data;
};
