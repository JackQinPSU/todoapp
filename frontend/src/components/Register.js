import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Register = ({ switchToLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        email:'',
        password: '',
        confirmPassword: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');
    const {register, error, clearError} = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear errors when user starts typing
        if (error) {
            clearError();
        }
        if (localError) {
            setLocalError('');
        }
    };

    const validateForm = () => {
        if(!formData.name.trim()) {
            setLocalError('Name is required');
            return false
        }
        if (!formData.email.trim()) {
            setLocalError('Email is required');
        }
        if(formData.password.length < 6) {
            setLocalError('Password must be at least 6 characters long');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        const result = await register(formData.name, formData.email, formData.password);

        if (!result.success) {
            //Error is handled by AuthContext
            console.log('Registration failed:', result.error);
        }
        //If successful, AuthContext will update the app state

        setIsSubmitting(false);
    };

    const displayError = localError || error;

    return (
        <div className="auth-container">
            <div className='auth-card'>
                <h2>Create Account</h2>
                <p className="auth-subtitle">Join us today</p>

                {displayError && (
                    <div className="error-message">
                        {displayError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlfor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder='Enter your full name'
                            className='form-input'
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            required
                            placeholder='Enter your email'
                            className='form-input'
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
                            placeholder="Enter your password (min 6 characters)"
                            className='form-input'
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="submit"
                    >
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-switch">
                    <p>
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={switchToLogin}
                            className="switch-button"
                            disabled={isSubmitting}
                        >
                            Sign in 
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;