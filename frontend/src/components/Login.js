import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = ({ switchToRegister }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, error, clearError } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing 
        if(error) {
            clearError();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const result = await login(formData.email, formData.password);

        if (!result.success) {
            //Error is handled by AuthContext
            console.log('Login failed', result.error);
        }
        //If successful, AuthContext will update the app state
        setIsSubmitting(false);
    };

    return (
       <div className="auth-container">
        <div className="auth-card">
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your account</p>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder='Enter your email'
                        className='form input'
                        disabled={isSubmitting}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input 
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Enter your password"
                        className="form-inpit"
                        disabled={isSubmitting}
                    />
                </div>

                <button
                    type="submit"
                    className="auth-button"
                    disabled={isSubmitting || !formData.email || !formData.password}
                >
                    {idSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
            </form>

            <div className="auth-switch">
                <p>
                    Dont have an account?{' '}
                </p>
                <button
                    type="button"
                    onClick={switchToRegister}
                    className="switch-button"
                    disabled={isSubmitting}
                    >
                    Sign up
                </button>
            </div>
        </div>
       </div> 
    );
};

export default Login;