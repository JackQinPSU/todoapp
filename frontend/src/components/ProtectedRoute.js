import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }
    if (!isAuthenticated) {
        // This will cause the parent component (App.js) to show login/register
        return null;
    }
    return children;
};

export default ProtectedRoute;