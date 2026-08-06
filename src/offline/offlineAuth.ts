// Cached Authentication helper for offline site survey access

const CACHED_USER_KEY = 'idrmis_cached_user';
const CACHED_TOKEN_KEY = 'idrmis_cached_token';
const CACHED_AUTH_TIME_KEY = 'idrmis_cached_auth_time';

export interface CachedUser {
    id: string;
    fullname: string;
    email: string;
    role?: string;
    organization?: string;
}

export const saveAuthSession = (user: CachedUser, token: string) => {
    try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
        localStorage.setItem(CACHED_TOKEN_KEY, token);
        localStorage.setItem(CACHED_AUTH_TIME_KEY, new Date().toISOString());
    } catch (e) {
        console.error('Failed to cache auth session:', e);
    }
};

export const getCachedAuthSession = (): { user: CachedUser | null; token: string | null; isAuthenticated: boolean } => {
    try {
        const userStr = localStorage.getItem(CACHED_USER_KEY) || localStorage.getItem('user');
        const token = localStorage.getItem(CACHED_TOKEN_KEY) || localStorage.getItem('token');

        if (userStr && token) {
            const user = JSON.parse(userStr);
            return { user, token, isAuthenticated: true };
        }
    } catch (e) {
        console.error('Failed to read cached auth session:', e);
    }
    return { user: null, token: null, isAuthenticated: false };
};

export const isOnline = (): boolean => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
};
