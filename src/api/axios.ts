import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL || 'http://localhost:5000/api',
    headers: {},
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
    (config) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            // ignore in non-browser environments
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

            const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
            const isPublicPage = (
                pathname === '/' ||
                pathname === '/portal' ||
                pathname.startsWith('/portal/') ||
                pathname.startsWith('/incident-reporting') ||
                pathname.startsWith('/alert-subscription') ||
                pathname.startsWith('/inspection-request') ||
                pathname.startsWith('/emergency-contacts') ||
                pathname.startsWith('/community-registration') ||
                pathname.startsWith('/feedback') ||
                pathname.startsWith('/news') ||
                pathname.startsWith('/flood-dashboard') ||
                pathname === '/login' ||
                pathname === '/signin' ||
                pathname === '/signup' ||
                pathname === '/register' ||
                pathname === '/verify' ||
                pathname === '/forgot-password' ||
                pathname === '/reset-password' ||
                pathname === '/setup-account'
            );

            if (!isLoginRequest && !isPublicPage) {
                try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch(e) {}
                if (typeof window !== 'undefined') window.location.href = '/login';
            } else if (!isLoginRequest) {
                // On public pages, quietly clear expired or invalid tokens from storage
                try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch(e) {}
            }
        }
        return Promise.reject(error);
    }
);

export default api;

