import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

    //Set up axios interceptor to include token in requests
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
        
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    //Token expired or invalid
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [token]);

    //Check if user is logged in on app start
    useEffect(() => {
        const initializeAuth = async() => {
            try {
                //check if theres a token in memory and validate it
                setLoading(false);
            } catch(error) {
                console.error('Auth initialization error:', error);
                setLoading(false);
            }
        };
        initializeAuth();
        
    }, []);

    const login = async (email, password) => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email, 
                password
            });

            if (response.data.success) {
                const { user: userData, token: userToken } = response.data.data;
                setUser(userData);
                setToken(userToken);
                return {success: true};
            } else {
                setError(response.data.error || 'Login failed');
                return { success: false, error: response.data.error };
            }
        } catch(error) {
            const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const register = async (name, email, password) => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                name,
                email,
                password
            });

            if (response.data.success) {
                const { user: userData, token: userToken } = response.data.data;
                setUser(userData);
                setToken(userToken);
                return { success: true };
            } else {
                setError(response.data.error || 'Registration failed');
                return { success: false, error: response.data.error };
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };


    const logout = async () => {
        try {
            if (token) {
                //Notify server about logout 
                await axios.post(`${API_BASE_URL}/auth/logout`);
            }
        } catch(error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setToken(null);
            setError('');
        }
    };

    const clearError = () => {
        setError('');
    };

    const value = {
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isAuthenticated: !!user && !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );

};