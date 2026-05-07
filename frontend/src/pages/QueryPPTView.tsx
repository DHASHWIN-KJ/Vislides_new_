import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sessionService } from '../services/sessionService';
import { questionService, Question } from '../services/questionService';
import { socketService } from '../services/socketService';

const QueryPPTView: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [showEndModal, setShowEndModal] = useState(false);


    useEffect(() => {
        const initQueryMode = async () => {
            try {
                // 1. Get/Create the persistent query session
                const sResponse = await sessionService.getQuerySession();
                if (sResponse.success) {
                    setSession(sResponse.data);

                    // 2. Fetch existing questions
                    const qResponse = await questionService.getSessionQuestions(sResponse.data._id);
                    if (qResponse.success) {
                        setQuestions(qResponse.data);
                    }

                    // 3. Connect to Socket and listen for new questions
                    socketService.connect();
                    socketService.joinSession({ sessionCode: sResponse.data.code, user });

                    socketService.onNewQuestion((newQ: Question) => {
                        setQuestions(prev => {
                            // Avoid duplicates
                            if (prev.find(q => q._id === newQ._id)) return prev;
                            return [...prev, newQ];
                        });
                    });
                }
            } catch (err) {
                console.error('Error initializing Query Mode:', err);
            } finally {
                setLoading(false);
            }
        };

        initQueryMode();

        return () => {
            if (session) {
                socketService.leaveSession(session.code);
            }
            socketService.offNewQuestion();
        };
    }, []);

    // Manual refresh handler using GET (find many) API
    const handleRefreshQuestions = async () => {
        if (!session?._id) return;
        setIsRefreshing(true);
        try {
            const qResponse = await questionService.getSessionQuestions(session._id);
            if (qResponse.success) {
                setQuestions(qResponse.data);
                setLastRefreshedAt(new Date());
            }
        } catch (err) {
            console.error('Error refreshing questions:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Auto refresh every 5 seconds (polling fallback if sockets fail)
    useEffect(() => {
        if (!session?._id || !autoRefresh) return;

        const interval = setInterval(async () => {
            try {
                const qResponse = await questionService.getSessionQuestions(session._id);
                if (qResponse.success) {
                    setQuestions(qResponse.data);
                    setLastRefreshedAt(new Date());
                }
            } catch (err) {
                console.error('Auto refresh questions error:', err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [session?._id, autoRefresh]);

    const deleteQuestion = async (id: string) => {
        try {
            const response = await questionService.deleteQuestion(id);
            if (response.success) {
                setQuestions(questions.filter(q => q._id !== id));
            }
        } catch (err) {
            console.error('Error deleting question:', err);
        }
    };

    const totalSlides = questions.length + 1; // +1 for QR slide

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{
                width: '250px',
                background: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1rem'
            }}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Slides</h2>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
                    >✕</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* QR Code Slide Thumbnail */}
                    <div
                        onClick={() => setCurrentSlide(0)}
                        style={{
                            padding: '0.5rem',
                            border: currentSlide === 0 ? '2px solid #f59e0b' : '1px solid var(--color-surface)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: currentSlide === 0 ? 'var(--color-surface-hover)' : 'var(--color-surface)'
                        }}
                    >
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Slide 1</div>
                        <div style={{ background: 'white', height: '80px', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {session?.code ? (
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(session.customQueryUrl || session.joinUrl)}`}
                                    alt="QR Thumbnail"
                                    style={{ height: '80%', width: 'auto' }}
                                />
                            ) : (
                                <div style={{ color: '#ccc', fontSize: '10px' }}>Loading...</div>
                            )}
                        </div>
                        <p style={{ fontSize: '0.75rem', marginTop: '4px', textAlign: 'center' }}>QR Code</p>
                    </div>

                    {/* Question Slides Thumbnails */}
                    {questions.map((q, i) => (
                        <div
                            key={q._id}
                            onClick={() => setCurrentSlide(i + 1)}
                            style={{
                                padding: '0.5rem',
                                border: currentSlide === i + 1 ? '2px solid #f59e0b' : '1px solid var(--color-surface)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: currentSlide === i + 1 ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                                position: 'relative'
                            }}
                        >
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Slide {i + 2}</div>
                            <div style={{
                                height: '80px',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.5rem',
                                fontSize: '0.65rem',
                                color: 'var(--color-text-secondary)',
                                overflow: 'hidden'
                            }}>
                                {q.content}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteQuestion(q._id); }}
                                style={{
                                    position: 'absolute', top: '2px', right: '2px',
                                    background: 'rgba(239, 68, 68, 0.8)', border: 'none',
                                    color: 'white', borderRadius: '50%', width: '16px', height: '16px',
                                    fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >×</button>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-surface)', paddingTop: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Manual question addition is disabled in Query Mode. Use the QR code to post questions.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
                    {loading ? (
                        <div className="spinner"></div>
                    ) : currentSlide === 0 ? (
                        <div style={{
                            background: 'var(--color-bg-secondary)', padding: '3rem', borderRadius: '24px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)', textAlign: 'center',
                            maxWidth: '600px', width: '100%'
                        }}>
                            <h1 style={{ color: 'var(--color-text)', marginBottom: '2rem', fontSize: '2.5rem' }}>Scan to Ask Questions</h1>
                            {session?.code && (
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(session.customQueryUrl || session.joinUrl)}`}
                                    alt="QR Code"
                                    style={{ width: '80%', height: 'auto', marginBottom: '2rem' }}
                                />
                            )}
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>Go to your camera and scan the code above!</p>
                        </div>
                    ) : (
                        <div style={{
                            background: 'var(--color-bg-secondary)',
                            padding: '5rem', borderRadius: '32px',
                            border: '1px solid var(--color-surface)',
                            boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                            textAlign: 'center',
                            maxWidth: '1000px', width: '100%', minHeight: '400px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <h1 style={{ fontSize: '3.5rem', lineHeight: '1.2', textShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '2rem', color: 'var(--color-text)' }}>
                                {questions[currentSlide - 1].content}
                            </h1>
                            <div style={{
                                padding: '10px 20px', background: 'var(--color-surface)',
                                borderRadius: '100px', fontSize: '1.2rem', color: 'var(--color-text-muted)'
                            }}>
                                Asked by <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{questions[currentSlide - 1].guestName || 'Anonymous'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Bar */}
                <div style={{
                    height: '80px', background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem'
                }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            Slide {currentSlide + 1} of {totalSlides}
                        </span>
                        <button
                            onClick={handleRefreshQuestions}
                            disabled={isRefreshing || !session}
                            style={{
                                padding: '0.4rem 1rem',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-surface-hover)',
                                borderRadius: '999px',
                                color: 'var(--color-text)',
                                cursor: isRefreshing || !session ? 'not-allowed' : 'pointer',
                                fontSize: '0.8rem',
                                opacity: isRefreshing || !session ? 0.6 : 1
                            }}
                        >
                            {isRefreshing ? 'Refreshing...' : 'Refresh Questions'}
                        </button>
                        <button
                            onClick={() => setAutoRefresh(prev => !prev)}
                            style={{
                                padding: '0.3rem 0.8rem',
                                background: 'transparent',
                                border: '1px solid var(--color-surface)',
                                borderRadius: '999px',
                                color: autoRefresh ? '#4ade80' : '#f97316',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                            }}
                        >
                            {autoRefresh ? 'Auto (5s) On' : 'Auto Off'}
                        </button>
                        {lastRefreshedAt && (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                                Last: {lastRefreshedAt.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            disabled={currentSlide === 0}
                            onClick={() => setCurrentSlide(prev => prev - 1)}
                            style={{
                                padding: '0.6rem 1.5rem', background: 'var(--color-surface)',
                                border: '1px solid var(--color-surface)', borderRadius: '8px', color: 'var(--color-text)',
                                cursor: currentSlide === 0 ? 'not-allowed' : 'pointer', opacity: currentSlide === 0 ? 0.5 : 1
                            }}
                        >
                            Previous
                        </button>
                        <button
                            disabled={currentSlide === totalSlides - 1}
                            onClick={() => setCurrentSlide(prev => prev + 1)}
                            style={{
                                padding: '0.6rem 1.5rem', background: '#f59e0b',
                                border: 'none', borderRadius: '8px', color: '#ffffff',
                                cursor: currentSlide === totalSlides - 1 ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold', opacity: currentSlide === totalSlides - 1 ? 0.5 : 1
                            }}
                        >
                            Next
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={() => setShowEndModal(true)}
                            style={{
                                padding: '0.6rem 1.5rem', background: 'transparent',
                                border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444',
                                cursor: 'pointer'
                            }}
                        >
                            End Presentation
                        </button>
                    </div>
                </div>
            </div>

            {showEndModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1.5rem'
                }}>
                    <div style={{
                        maxWidth: '400px',
                        width: '100%',
                        padding: '2rem',
                        textAlign: 'center',
                        background: 'rgba(30, 41, 59, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#ffffff' }}>End Presentation?</h3>
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '2rem', lineHeight: '1.5' }}>
                            Are you sure you want to exit the presentation mode? This will take you back to the dashboard.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowEndModal(false)}
                                style={{ 
                                    flex: 1, 
                                    padding: '0.8rem',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                Continue
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                style={{
                                    flex: 1,
                                    padding: '0.8rem',
                                    background: '#ef4444',
                                    border: 'none',
                                    color: '#ffffff',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Terminate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QueryPPTView;

