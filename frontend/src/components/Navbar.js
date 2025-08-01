import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const { user, logout, loading } = useAuth();

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
        }
    };


    if (loading) {
        return (
            <nav className="navbar">
                <div className="navbar-container">
                    <div className="navbar-brand">
                        <h1>My Todo App</h1>
                    </div>
                    <div className="navbar-loading">Loading...</div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="navbar">
            <div className="navber-container">
                <div className="navbar-brand">
                    <h1>My Todo App</h1>
                </div>
            </div>

            {user && (
                <div className="navbar-user">
                    <div className="user-info">
                        <span className="user-greeting">Hello, </span>
                        <span className="user-name">{user.name}</span>
                        <span className="user-email">({user.email})</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="logout-button"
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;