import axios from "axios";
import { Toast } from "tdesign-mobile-vue";

const request = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

request.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data.code && data.code !== 200) {
      Toast({ message: data.message || "请求失败", theme: "error" });
      return Promise.reject(new Error(data.message));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    } else {
      Toast({
        message: error.response?.data?.message || "网络错误",
        theme: "error",
      });
    }
    return Promise.reject(error);
  },
);

export default request;
