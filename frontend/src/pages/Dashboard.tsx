import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sessionService } from '../services/sessionService';

import CertificateCard from '../components/CertificateCard';
import Toast from '../components/Toast';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [sessionTitle, setSessionTitle] = useState('');
    const [error, setError] = useState('');
    const [pastSessions, setPastSessions] = useState<any[]>([]);
    const [hiddenCerts, setHiddenCerts] = useState<string[]>(() => {
        const saved = localStorage.getItem('hidden_certs');
        return saved ? JSON.parse(saved) : [];
    });

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCertModal, setShowCertModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Dynamic Statistics Calculation
    const stats = useMemo(() => {
        if (!pastSessions || pastSessions.length === 0) {
            return { avgTime: '0m', avgAttendance: '0%' };
        }

        // Calculate Average Duration for Teacher Sessions
        const completedSessions = pastSessions.filter(s => s.endedAt);
        if (completedSessions.length > 0) {
            const totalDuration = completedSessions.reduce((acc, curr) => {
                const start = new Date(curr.createdAt).getTime();
                const end = new Date(curr.endedAt).getTime();
                return acc + (end - start);
            }, 0);
            const avgMinutes = Math.round(totalDuration / completedSessions.length / 60000);
            
            return {
                avgTime: `${avgMinutes}m`,
                avgAttendance: '98%' // Placeholder for students
            };
        }

        return { avgTime: '0m', avgAttendance: '0%' };
    }, [pastSessions]);

    useEffect(() => {
        if (!user) return; // Wait for user to be available

        const fetchData = async () => {
            try {
                // 1. Fetch Active Session
                const activeRes = await sessionService.getActiveSession();
                if (activeRes.success && activeRes.data) {
                    if (user.role.toLowerCase() === 'student') {
                        navigate(`/session/${activeRes.data.code}`);
                    } else {
                        setActiveSession(activeRes.data);
                    }
                }

                // 2. Fetch Past Sessions (History)
                let historyRes;
                if (user.role.toLowerCase() === 'teacher') {
                    historyRes = await sessionService.getTeacherSessions();
                } else {
                    historyRes = await sessionService.getStudentSessions();
                }
                
                if (historyRes.success) {
                    setPastSessions(historyRes.data);
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, user]);

    const handleDeleteCert = (sessionId: string) => {
        const newHidden = [...hiddenCerts, sessionId];
        setHiddenCerts(newHidden);
        localStorage.setItem('hidden_certs', JSON.stringify(newHidden));
        setToast({ message: 'Certificate removed from view', type: 'info' });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionTitle.trim()) return;

        setError('');
        try {
            const response = await sessionService.createSession({ title: sessionTitle });
            if (response.success) {
                navigate(`/session/${response.data.code}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create session');
        }
    };

    const handleJoinSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setError('');
        try {
            const response = await sessionService.joinSession(joinCode);
            if (response.success) {
                navigate(`/session/${response.data.code}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to join session. Please check the code.');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            {/* Navigation Bar */}
            <nav style={{
                background: 'var(--color-bg-secondary)',
                opacity: 0.95,
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--color-surface)',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1000
            }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Vi-SlideS
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                    <div
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            padding: '0.5rem 1.2rem',
                            borderRadius: 'var(--radius-full)',
                            transition: 'all 0.2s ease',
                            border: showUserMenu ? '1px solid var(--color-primary)' : '1px solid transparent',
                            background: showUserMenu ? 'var(--color-surface-hover)' : 'transparent'
                        }}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text)' }}>{user?.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.role}</span>
                        </div>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: user?.avatar ? `url(${user.avatar}) center/cover no-repeat` : 'var(--gradient-primary)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            color: 'white',
                            boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)',
                            border: '2px solid rgba(255,255,255,0.2)'
                        }}>
                            {!user?.avatar && user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    {showUserMenu && (
                        <div className="bento-box slide-in" style={{
                            position: 'absolute',
                            top: '125%',
                            right: 0,
                            width: '300px',
                            padding: '1rem',
                            zIndex: 1000,
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-surface)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 0 15px rgba(245, 158, 11, 0.15)'
                        }}>
                            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-surface)', marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Signed in as</p>
                                <p style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn"
                                style={{
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    background: 'transparent',
                                    color: '#ef4444',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem 1rem'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ marginRight: '12px', fontSize: '1.2rem' }}>🚪</span>
                                <span style={{ fontSize: '1rem' }}>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <main className="container fade-in" style={{ paddingTop: '3rem', maxWidth: '1600px' }}>
                <div style={{ marginBottom: '2.5rem', padding: '1rem' }}>
                    <h1 className="mb-2" style={{ fontSize: '3rem', fontWeight: 800 }}>Welcome, <span style={{color: '#fbbf24'}}>{user?.name}</span></h1>
                    <p className="text-muted">
                        {user?.role?.toLowerCase() === 'teacher' ? 'Ready to interact with your students?' : 'Join a session to start asking questions!'}
                    </p>

                    {error && (
                        <div className="alert alert-error slide-in" style={{ marginTop: '1rem' }}>
                            {error}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    
                    <div style={{ flex: '1 1 350px' }}>
                        <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            {user?.role?.toLowerCase() === 'teacher' ? (
                                <>
                                    <div className="bento-box bento-hero">
                                        <h3><span style={{color: '#f59e0b'}}>⚡</span> Start Session Center</h3>
                                        <p className="text-muted mt-1">Create a new live Q&A session for your class.</p>
                                        <form onSubmit={handleCreateSession} style={{ marginTop: '1.5rem' }}>
                                            <div className="form-group">
                                                <input
                                                    type="text"
                                                    placeholder="Session Title (e.g. Intro to Biology)"
                                                    className="form-input"
                                                    value={sessionTitle}
                                                    onChange={(e) => setSessionTitle(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <button type="submit" className="btn btn-primary btn-block">Create Now</button>
                                        </form>
                                    </div>
                                    <div className="bento-box">
                                        <h3><span style={{color: '#10b981'}}>📚</span> Assignments Portal</h3>
                                        <p className="text-muted mt-1">Create and grade student assignments.</p>
                                        <button onClick={() => navigate('/assignments')} className="btn btn-primary mt-2">Manage Assignments</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bento-box">
                                        <h3><span style={{color: '#f43f5e'}}>🔗</span> Quick Join Session</h3>
                                        <p className="text-muted mt-1">Enter the 6-digit code provided by your teacher.</p>
                                        <form onSubmit={handleJoinSession} style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                                            <input
                                                type="text"
                                                placeholder="E.G. AB1234"
                                                className="form-input"
                                                style={{ textTransform: 'uppercase' }}
                                                value={joinCode}
                                                onChange={(e) => setJoinCode(e.target.value)}
                                                required
                                            />
                                            <button type="submit" className="btn btn-primary">Join</button>
                                        </form>
                                    </div>
                                    <div className="bento-box">
                                        <h3><span style={{color: '#10b981'}}>📝</span> My Submissions</h3>
                                        <p className="text-muted mt-1">View and submit your assignments.</p>
                                        <button onClick={() => navigate('/assignments')} className="btn btn-primary mt-2">View Assignments</button>
                                    </div>
                                    <div className="bento-box bento-hero">
                                        <h3><span style={{color: '#8b5cf6'}}>🎓</span> Achievement Vault</h3>
                                        <p className="text-muted mt-1">View and download your participation certificates.</p>
                                        <button onClick={() => setShowCertModal(true)} className="btn btn-primary mt-2">View Certificates</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bento-box" style={{ 
                        flex: '1 1 750px',
                        padding: '2.5rem', 
                        background: 'var(--color-primary)', 
                        color: 'white', 
                        border: 'none',
                        position: 'sticky',
                        top: '2rem',
                        boxShadow: 'var(--shadow-lg)',
                        borderRadius: 'var(--radius-xl)'
                    }}>
                        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
                            {user?.role?.toLowerCase() === 'teacher' ? (
                                <>
                                    {/* Column 1: Stats */}
                                    <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <span>📈</span> Teaching Insights
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                                            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.8rem', borderRadius: '1.25rem', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.2rem' }}>{pastSessions.length}</div>
                                                <div style={{ opacity: 0.9, fontSize: '0.95rem', fontWeight: '500' }}>Total Classes Taken</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.8rem', borderRadius: '1.25rem', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.2rem' }}>{stats.avgTime}</div>
                                                <div style={{ opacity: 0.9, fontSize: '0.95rem', fontWeight: '500' }}>Avg. Time per Class</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ width: '1px', alignSelf: 'stretch', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)' }}></div>

                                    {/* Column 2: History */}
                                    <div style={{ flex: '1 1 280px', maxWidth: '320px' }}>
                                        <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem', opacity: 0.9, fontWeight: '600' }}>Last 5 Classes Taken</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {pastSessions.slice(0, 5).length === 0 ? (
                                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem 1rem', borderRadius: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', border: '1px dashed rgba(255,255,255,0.2)' }}>
                                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>📊</div>
                                                    No classes hosted yet
                                                </div>
                                            ) : (
                                                pastSessions.slice(0, 5).map(s => (
                                                    <div key={s._id} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.65rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                        <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{s.title}</div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', opacity: 0.75 }}>
                                                            <span>📅 {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                            <span>👥 {s.students?.length || 0} joined</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Column 1: Stats */}
                                    <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <span>🚀</span> Learning Journey
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                                            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.8rem', borderRadius: '1.25rem', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.2rem' }}>{pastSessions.length}</div>
                                                <div style={{ opacity: 0.9, fontSize: '0.95rem', fontWeight: '500' }}>Total Classes Attended</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.8rem', borderRadius: '1.25rem', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.2rem' }}>{stats.avgAttendance}</div>
                                                <div style={{ opacity: 0.9, fontSize: '0.95rem', fontWeight: '500' }}>Avg. Attendance</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ width: '1px', alignSelf: 'stretch', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)' }}></div>

                                    {/* Column 2: History */}
                                    <div style={{ flex: '1 1 280px', maxWidth: '320px' }}>
                                        <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem', opacity: 0.9, fontWeight: '600' }}>Last 5 Classes Attended</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {pastSessions.slice(0, 5).length === 0 ? (
                                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem 1rem', borderRadius: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', border: '1px dashed rgba(255,255,255,0.2)' }}>
                                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🎓</div>
                                                    No sessions joined yet
                                                </div>
                                            ) : (
                                                pastSessions.slice(0, 5).map(s => (
                                                    <div key={s._id} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.65rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                        <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{s.title}</div>
                                                        <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>
                                                            👨‍🏫 {s.teacher?.name || 'Instructor'} · 📅 {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {showCertModal && (
                <div className="modal-overlay fade-in" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 2000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    padding: '2rem'
                }}>
                    <div className="bento-box slide-in" style={{
                        width: '100%',
                        maxWidth: '900px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowCertModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text)', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}
                        >
                            ✕
                        </button>
                        <h2 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🎓</span> Your Certificates
                        </h2>
                        {pastSessions.filter(session => !hiddenCerts.includes(session._id)).length === 0 ? (
                            <p className="text-muted">No certificates found. Join sessions to earn them!</p>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                                gap: '2rem',
                                marginTop: '1.5rem'
                            }}>
                                {pastSessions
                                    .filter(session => !hiddenCerts.includes(session._id))
                                    .map((session) => (
                                        <CertificateCard
                                            key={session._id}
                                            sessionTitle={session.title}
                                            sessionCode={session.code}
                                            studentName={user?.name || 'Student'}
                                            date={session.createdAt}
                                            teacherName={session.teacher?.name || 'Instructor'}
                                            onDelete={() => handleDeleteCert(session._id)}
                                        />
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showQRModal && activeSession && (
                <div className="modal-overlay fade-in" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 2000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    padding: '2rem'
                }}>
                    <div className="bento-box slide-in" style={{
                        width: '100%',
                        maxWidth: '500px',
                        position: 'relative',
                        textAlign: 'center'
                    }}>
                        <button
                            onClick={() => setShowQRModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}
                        >
                            ✕
                        </button>
                        <h2 className="mb-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <span>📱</span> Join with QR Code
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                            {activeSession.title}
                        </p>
                        {activeSession.qrCodeDataUrl ? (
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
                                <img src={activeSession.qrCodeDataUrl} alt="QR Code" style={{ width: '100%', maxWidth: '300px', height: 'auto' }} />
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>
                                QR Code not available
                            </div>
                        )}
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Join URL:</p>
                            <p style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: 'var(--color-primary-light)', wordBreak: 'break-all' }}>
                                {window.location.origin}/join/{activeSession.code}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/join/${activeSession.code}`);
                                setToast({ message: 'Join link copied to clipboard!', type: 'success' });
                            }}
                            className="btn btn-primary btn-block"
                        >
                            📋 Copy Join Link
                        </button>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
