import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/authService';
import './Auth.css';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Student' as 'Teacher' | 'Student'
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validatePassword = (password: string) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*]/.test(password);

        if (password.length < minLength) return "Password must be at least 8 characters long";
        if (!hasUpperCase) return "Password must contain an uppercase letter";
        if (!hasLowerCase) return "Password must contain a lowercase letter";
        if (!hasNumber) return "Password must contain a number";
        if (!hasSpecialChar) return "Password must contain a special character";

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;
            await register(registerData);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const res = await authService.googleLogin(credentialResponse.credential, formData.role);
            if (res.success) {
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));
                window.location.href = '/dashboard';
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Google Signup failed');
        }
    };

    return (
        <div className="split-layout">
            <div className="split-visual">
                <div className="visual-glow" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%)'}}></div>
                <div className="visual-accent" style={{ background: 'radial-gradient(circle, rgba(13, 226, 212, 0.2) 0%, rgba(0,0,0,0) 70%)'}}></div>
                <div className="visual-content">
                    <h1>Join Vi-SlideS.</h1>
                    <p>Unlock the power of real-time gamified learning. Transform passive lectures into massive interactive events instantly.</p>
                </div>
            </div>

            <div className="split-form-container">
                <div className="form-wrapper" style={{ maxWidth: '460px' }}>
                    <div className="form-header" style={{ marginBottom: '1.5rem' }}>
                        <h2>Create Account.</h2>
                        <p>Let's get you set up to revolutionize your classes.</p>
                    </div>

                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="minimal-group">
                                <label className="minimal-label" htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="minimal-input"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="minimal-group">
                                <label className="minimal-label" htmlFor="role">Role</label>
                                <select
                                    id="role"
                                    name="role"
                                    className="minimal-input"
                                    style={{ background: '#0c0c0f' }}
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Student">Student</option>
                                    <option value="Teacher">Teacher</option>
                                </select>
                            </div>
                        </div>

                        <div className="minimal-group">
                            <label className="minimal-label" htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="minimal-input"
                                placeholder="name@domain.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="minimal-group" style={{ marginBottom: '0.5rem' }}>
                                <label className="minimal-label" htmlFor="password">Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    className="minimal-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            
                            <div className="minimal-group" style={{ marginBottom: '0.5rem' }}>
                                <label className="minimal-label" htmlFor="confirmPassword">Confirm</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className="minimal-input"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'none', border: 'none', color: '#0de2d4', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                            >
                                {showPassword ? 'HIDE PASSWORDS' : 'SHOW PASSWORDS'}
                            </button>
                        </div>

                        {/* Password Requirements Checklist Minimalist */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.75rem' }}>
                            {[
                                { label: '8+ Characters', met: formData.password.length >= 8 },
                                { label: 'Uppercase', met: /[A-Z]/.test(formData.password) },
                                { label: 'Lowercase', met: /[a-z]/.test(formData.password) },
                                { label: 'Number', met: /[0-9]/.test(formData.password) },
                                { label: 'Special', met: /[!@#$%^&*]/.test(formData.password) }
                            ].map((req, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: req.met ? '#0de2d4' : '#52525b', transition: 'color 0.3s' }}>
                                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: req.met ? '#0de2d4' : '#27272a' }}></span>
                                    {req.label}
                                </div>
                            ))}
                        </div>

                        <button type="submit" className="btn-cyber" disabled={loading}>
                            {loading ? 'REGISTERING...' : 'CREATE ACCOUNT'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>OR SIGN UP VIA GOOGLE</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Signup Failed')}
                            theme="filled_black"
                            shape="rectangular"
                            size="large"
                            width="460"
                            text="signup_with"
                        />
                    </div>
                    
                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#52525b', marginTop: '0.8rem' }}>
                        Google Signup will use role: <strong>{formData.role}</strong>
                    </p>

                    <div className="bottom-link">
                        Already have an account? 
                        <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

