import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/authService';
import './Auth.css';

const Login: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const res = await authService.googleLogin(credentialResponse.credential);
            if (res.success) {
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));
                window.location.href = '/dashboard';
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Google Login failed');
        }
    };

    return (
        <div className="split-layout">
            <div className="split-visual">
                <div className="visual-glow"></div>
                <div className="visual-accent"></div>
                <div className="visual-content">
                    <h1>Vi-SlideS.</h1>
                    <p>Elevate your classroom engagement. Real-time Q&A, interactive whiteboards, and AI-driven grading all in one premium interface.</p>
                </div>
            </div>

            <div className="split-form-container">
                <div className="form-wrapper">
                    <div className="form-header">
                        <h2>Welcome back.</h2>
                        <p>Sign in below to access your workspace.</p>
                    </div>

                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="minimal-group">
                            <label className="minimal-label" htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="minimal-input"
                                placeholder="name@domain.com"
                                value={formData.email}
                                onChange={onChange}
                                required
                            />
                        </div>

                        <div className="minimal-group">
                            <label className="minimal-label" htmlFor="password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    className="minimal-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={onChange}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '0',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#0de2d4',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    {showPassword ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-cyber" disabled={loading}>
                            {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>OR CONTINUE WITH</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Login Failed')}
                            theme="filled_black"
                            shape="rectangular"
                            size="large"
                            width="420"
                            text="signin_with"
                        />
                    </div>

                    <div className="bottom-link">
                        Don't have an account? 
                        <Link to="/register">Create one</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

