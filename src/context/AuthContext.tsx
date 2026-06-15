import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define User Type (Basic for now)
interface User {
    id: string; // Matched ID to 'id' as per backend DTO
    fullname: string;
    email: string;
    phone?: string;
    status: string;
    roles?: { id: string; name: string }[];
    department?: { id: string; name: string };
    organization?: { id: string; name: string };
    subcity?: string;
    kebele?: string;
    permissions?: string[];
    profileImage?: string;
    accessLevel?: string;
    onboarding?: {
        welcomeShown: boolean;
    }
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user from storage on init
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    // Ideally verify token with backend here, or just trust storage until 401
                    // Let's assume trust heavily, but maybe try to fetch latest user details
                    // setUser(JSON.parse(storedUser));

                    // Better: fetch fresh user details to ensure status is active etc.
                    // But for fast load, set stored first, then update?
                    // Let's just set stored one first.
                    setUser(JSON.parse(storedUser));

                } catch (error) {
                    console.error("Auth init error", error);
                    logout();
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Assuming we have an endpoint that returns the current user's info based on token
            // For now, if we don't have /me, we can use the ID from the current user state if available.
            // But better to decode token or just use the ID we have.
            if (user?.id) {
                // Import api dynamically or use fetch to avoid circular dependency if api depends on auth
                // But usually api imports auth. Let's try to request.
                // We'll use a direct fetch here to be safe or assuming api is available.
                // Actually, let's just rely on the fact that if we are refreshing, we have the ID.
                // We need the 'api' instance. Let's assume it's globally available or we insert logic later.
                // NOTE: To fix circular deps, we can't import 'api' here if 'api' imports 'useAuth'.
                // Let's use standard fetch for this specific internal refresh.

                const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    // Maintain the local formatting if API returns slightly different structure?
                    // Our API returns DTO structure which matches User interface mostly.
                    // Just need to ensure `id` vs `_id` is handled if backend returns `_id`.
                    // The backend DTO currently maps _id to id.
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            }
        } catch (e) {
            console.error("Failed to refresh user", e);
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
