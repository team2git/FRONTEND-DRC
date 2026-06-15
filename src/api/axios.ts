import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL || 'http://localhost:5000/api',
    headers: {},
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 errors (optional but good practice)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Check if 401 Unauthorized AND not a login attempt
        // We don't want to redirect/refresh if the user just failed to login
        if (error.response && error.response.status === 401) {
            const isLoginRequest = error.config && error.config.url && (
                error.config.url.includes('/auth/login') ||
                error.config.url.includes('/login')
            );

            const isLoginPage = window.location.pathname === '/login' || window.location.pathname.includes('/auth/login');

            if (!isLoginRequest && !isLoginPage) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
