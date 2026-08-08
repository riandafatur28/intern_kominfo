import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => {
    // Workaround backend: Unauthenticated dikirim dgn status 200 (harusnya 401).
    // Kalau body bertanda Unauthenticated → token tidak valid lagi → logout otomatis.
    if (
      res.status === 200 &&
      res.data?.message === "Unauthenticated." &&
      !res.config.url?.includes("/auth/login")
    ) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default client;
