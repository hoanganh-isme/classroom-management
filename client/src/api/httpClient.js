import axios from "axios";
import { getStoredToken, clearAuthSession } from "../utils/authUtils";

const httpClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:3000",
    headers: {
        "Content-Type": "application/json",
    },
});

httpClient.interceptors.request.use(
    (config) => {
        const token = getStoredToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status } = error.response;
            if (status === 401) {
                clearAuthSession();
                window.dispatchEvent(new CustomEvent("auth:unauthorized"));
            } else if (status === 403) {
                window.dispatchEvent(new CustomEvent("auth:forbidden", {
                    detail: error.response.data
                }));
            }
        }
        return Promise.reject(error);
    }
);

export default httpClient;