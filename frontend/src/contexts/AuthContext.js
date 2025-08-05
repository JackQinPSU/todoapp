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
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

    // Helper function to update token
    const updateToken = (newToken) => {
        setToken(newToken);
        if (newToken) {
            localStorage.setItem('token', newToken);
        } else {
            localStorage.removeItem('token');
        }
    };

    // Logout function
    const logout = async () => {
        try {
            if (token) {
                await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch(error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            updateToken(null);
            setError('');
        }
    };

    // Check if user is logged in on app start
    useEffect(() => {
        const initializeAuth = async() => {
            try {
                const storedToken = localStorage.getItem('token');
                if (storedToken) {
                    // Validate token by fetching user info
                    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    
                    if (response.data.success) {
                        setUser(response.data.data.user);
                        setToken(storedToken);
                    } else {
                        localStorage.removeItem('token');
                    }
                }
            } catch(error) {
                console.error('Auth initialization error:', error);
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };
        
        initializeAuth();
    }, [API_BASE_URL]);

    const login = async (email, password) => {
        try {
            setLoading(true);
            setError('');

            console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
            
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email, 
                password
            });

            console.log('Login response:', response.data);

            if (response.data.success) {
                const { user: userData, token: userToken } = response.data.data;
                setUser(userData);
                updateToken(userToken);
                return {success: true};
            } else {
                const errorMsg = response.data.error || 'Login failed';
                setError(errorMsg);
                return { success: false, error: errorMsg };
            }
        } catch(error) {
            console.error('Login error:', error);
            console.log('Error response:', error.response?.data);
            
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.message || 
                               'Login failed. Please check your connection and try again.';
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

            console.log('Attempting register to:', `${API_BASE_URL}/auth/register`);

            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                name,
                email,
                password
            });

            console.log('Register response:', response.data);

            if (response.data.success) {
                const { user: userData, token: userToken } = response.data.data;
                setUser(userData);
                updateToken(userToken);
                return { success: true };
            } else {
                const errorMsg = response.data.error || 'Registration failed';
                setError(errorMsg);
                return { success: false, error: errorMsg };
            }
        } catch (error) {
            console.error('Registration error:', error);
            console.log('Error response:', error.response?.data);
            
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.message ||
                               'Registration failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Add missing methods that Profile.js expects
    const updateProfile = async (name, email) => {
        try {
            setLoading(true);
            setError('');
            
            const response = await axios.put(`${API_BASE_URL}/auth/profile`, {
                name,
                email
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setUser(response.data.data.user);
                return { success: true };
            } else {
                setError(response.data.error || 'Update failed');
                return { success: false, error: response.data.error };
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Update failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            setLoading(true);
            setError('');
            
            const response = await axios.put(`${API_BASE_URL}/auth/password`, {
                currentPassword,
                newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { success: true };
            } else {
                setError(response.data.error || 'Password change failed');
                return { success: false, error: response.data.error };
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Password change failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
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
        updateProfile,
        changePassword,
        clearError,
        isAuthenticated: !!user && !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};