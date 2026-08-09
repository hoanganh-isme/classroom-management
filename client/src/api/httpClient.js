import axios from "axios";

const httpClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:3000",
    headers: {
        "Content-Type": "application/json",
    },
});

httpClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
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
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.dispatchEvent(new CustomEvent("auth:unauthorized"));
            } else if (status === 403) {
                const msg = error.response.data?.message || "Bạn không có quyền truy cập vào chức năng này.";
                alert(msg);
            }
        }
        return Promise.reject(error);
    }
);

export default httpClient;