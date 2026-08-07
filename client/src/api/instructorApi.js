import httpClient from "./httpClient";

export const getStudents = async () => {
  const response = await httpClient.get("/students");
  return response.data;
};

export const addStudent = async (payload) => {
  const response = await httpClient.post("/addStudent", payload);
  return response.data;
};

export const editStudent = async (originalPhone, payload) => {
  const response = await httpClient.put(
    `/editStudent/${encodeURIComponent(originalPhone)}`,
    payload
  );
  return response.data;
};

export const deleteStudent = async (phone) => {
  const response = await httpClient.delete(
    `/student/${encodeURIComponent(phone)}`
  );
  return response.data;
};

export const getStudent = async (phone) => {
  const response = await httpClient.get(
    `/student/${encodeURIComponent(phone)}`
  );
  return response.data;
};

export const assignLesson = async (payload) => {
  const response = await httpClient.post("/assignLesson", payload);
  return response.data;
};

export const getLessons = async () => {
  const response = await httpClient.get("/lessons");
  return response.data;
};
