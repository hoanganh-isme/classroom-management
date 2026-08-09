import httpClient from "./httpClient";

export * from "./instructorApi";

export async function verifyStudentSetupToken(token) {
  const response = await httpClient.get("/verifyStudentSetupToken", {
    params: { token },
  });
  return response.data;
}

export async function setupStudentAccount(payload) {
  const response = await httpClient.post("/setupStudentAccount", payload);
  return response.data;
}

export async function studentLogin(payload) {
  const response = await httpClient.post("/studentLogin", payload);
  return response.data;
}

export async function getMyProfile() {
  const response = await httpClient.get("/myProfile");
  return response.data;
}

export async function editProfile(payload) {
  const response = await httpClient.put("/editProfile", payload);
  return response.data;
}

export async function changePassword(payload) {
  const response = await httpClient.put("/changePassword", payload);
  return response.data;
}

export async function getMyLessons() {
  const response = await httpClient.get("/myLessons");
  return response.data;
}

export async function markLessonDone(lessonId) {
  const response = await httpClient.put(`/markLessonDone/${encodeURIComponent(lessonId)}`);
  return response.data;
}
