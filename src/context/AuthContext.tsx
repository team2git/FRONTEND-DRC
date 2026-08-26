import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/axios';

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
    organizationType?: string;
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
            if (!user?.id) return;

            const userId = user?.id || (user as any)?._id;
            if (userId) {
                const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            }
        } catch (e) {
            console.error("Failed to refresh user", e);
        }
    };

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
