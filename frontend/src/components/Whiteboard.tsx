import React, { useRef, useEffect, useState } from 'react';
import { socketService } from '../services/socketService';

interface WhiteboardProps {
    sessionCode: string;
    isTeacher: boolean;
    onClose: () => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ sessionCode, isTeacher, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#111827');
    const [brushSize, setBrushSize] = useState(3);
    const [eraserSize, setEraserSize] = useState(20);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Floating window state for PDF
    const [pdfPos, setPdfPos] = useState({ x: 50, y: 100 });
    const [pdfSize, setPdfSize] = useState({ w: 400, h: 500 });
    const [isDraggingPDF, setIsDraggingPDF] = useState(false);
    const [isResizingPDF, setIsResizingPDF] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight - 60;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        socketService.onWhiteboardDraw((data) => {
            drawOnCanvas(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
        });

        socketService.onWhiteboardClear(() => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });

        socketService.onWhiteboardPDF((data) => {
            const fullUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${data.pdfUrl}`;
            setPdfUrl(fullUrl);
        });

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            socketService.offWhiteboardContentEvents();
        };
    }, []);

    const drawOnCanvas = (x0: number, y0: number, x1: number, y1: number, strokeColor: string, strokeSize: number, emit: boolean) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeSize;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.closePath();

        if (emit && isTeacher) {
            socketService.emitWhiteboardDraw(sessionCode, { x0, y0, x1, y1, color: strokeColor, size: strokeSize });
        }
    };

    const handleMouseDown = () => {
        if (!isTeacher) return;
        setIsDrawing(true);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isTeacher || !isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x1 = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y1 = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        const x0 = (canvas as any).lastX || x1;
        const y0 = (canvas as any).lastY || y1;

        const currentSize = tool === 'eraser' ? eraserSize : brushSize;
        const currentColor = tool === 'eraser' ? '#ffffff' : color;

        drawOnCanvas(x0, y0, x1, y1, currentColor, currentSize, true);

        (canvas as any).lastX = x1;
        (canvas as any).lastY = y1;
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            (canvas as any).lastX = undefined;
            (canvas as any).lastY = undefined;
        }
    };

    const clearBoard = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            socketService.emitWhiteboardClear(sessionCode);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== 'application/pdf') return;

        setUploading(true);
        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('🔒 Authentication Required: Please ensure you are logged in as a Teacher to share PDFs in this session.');
                setUploading(false);
                return;
            }

            const baseUrl = import.meta.env.VITE_API_URL || '';
            console.log('📤 Sending PDF to:', `${baseUrl}/upload/pdf`);
            
            const response = await fetch(`${baseUrl}/upload/pdf`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Server responded with ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                const fullUrl = `${baseUrl.replace('/api', '')}${result.data.url}`;
                console.log('✅ Upload successful. PDF URL:', fullUrl);
                setPdfUrl(fullUrl);
                socketService.emitWhiteboardPDF(sessionCode, result.data.url);
            }
        } catch (error: any) {
            console.error('❌ Upload failed:', error);
            alert(`PDF Upload Failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // PDF Window interaction
    const startDraggingPDF = (e: React.MouseEvent) => {
        setIsDraggingPDF(true);
        setDragStart({ x: e.clientX - pdfPos.x, y: e.clientY - pdfPos.y });
    };

    const startResizingPDF = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizingPDF(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    // Use window listeners for smooth dragging/resizing even if mouse leaves the window
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (isDraggingPDF) {
                setPdfPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
            } else if (isResizingPDF) {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                setPdfSize(prev => ({ 
                    w: Math.max(250, prev.w + dx), 
                    h: Math.max(250, prev.h + dy) 
                }));
                setDragStart({ x: e.clientX, y: e.clientY });
            }
        };

        const handleUp = () => {
            setIsDraggingPDF(false);
            setIsResizingPDF(false);
        };

        if (isDraggingPDF || isResizingPDF) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isDraggingPDF, isResizingPDF, dragStart]);

    return (
        <div 
            className="bento-box anim-scale-up" 
            style={{
                position: 'fixed',
                top: isTeacher ? '74px' : '5%',
                left: isTeacher ? '0' : '5%',
                width: isTeacher ? '100%' : '90%',
                height: isTeacher ? 'calc(100vh - 74px - 225px)' : '90%',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: 0,
                border: 'none',
                boxShadow: isTeacher ? '0 20px 40px rgba(0,0,0,0.2)' : 'var(--shadow-xl)',
                background: 'var(--color-surface)',
                borderRadius: isTeacher ? '0' : 'var(--radius-xl)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            {/* Toolbar */}
            <div style={{
                height: '60px',
                background: 'var(--color-bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.5rem',
                borderBottom: '1px solid var(--color-surface-hover)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-primary)' }}>
                        🎨 {isTeacher ? 'Whiteboard Tool' : 'Teacher\'s Whiteboard'}
                    </h3>

                    {isTeacher && (
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginLeft: '1rem' }}>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                style={{ width: '30px', height: '30px', border: 'none', background: 'none', cursor: 'pointer' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>Pen Size</span>
                                <select
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                    className="form-input"
                                    style={{ padding: '0.2rem', width: '70px', fontSize: '0.75rem' }}
                                >
                                    <option value="2">Thin</option>
                                    <option value="5">Med</option>
                                    <option value="12">Thick</option>
                                    <option value="25">Ultra</option>
                                </select>
                            </div>

                            <button
                                onClick={() => setTool('pen')}
                                className={`btn ${tool === 'pen' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                            >
                                Pen
                            </button>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.03)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-md)' }}>
                                <button
                                    onClick={() => setTool('eraser')}
                                    className={`btn ${tool === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                >
                                    Eraser
                                </button>
                                <select
                                    value={eraserSize}
                                    onChange={(e) => setEraserSize(parseInt(e.target.value))}
                                    className="form-input"
                                    style={{ padding: '0.2rem', width: '85px', fontSize: '0.75rem' }}
                                >
                                    <option value="15">Small</option>
                                    <option value="40">Medium</option>
                                    <option value="80">Large</option>
                                    <option value="150">Mega Wipe</option>
                                </select>
                            </div>

                            <button
                                onClick={clearBoard}
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: '#ef4444' }}
                            >
                                Clear All
                            </button>

                            <div style={{ borderLeft: '1px solid rgba(0,0,0,0.1)', height: '24px', margin: '0 0.5rem' }} />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
                                disabled={uploading}
                            >
                                {uploading ? '⌛ Uploading...' : '📄 Share PDF'}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".pdf"
                                style={{ display: 'none' }}
                            />
                        </div>
                    )}

                    {pdfUrl && !isTeacher && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary)', fontWeight: '600', animation: 'pulse 2s infinite' }}>
                            📺 PDF Shared by Teacher
                        </span>
                    )}
                </div>

                {isTeacher && (
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text)', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        &times;
                    </button>
                )}
            </div>

            {/* Canvas Area */}
            <div style={{ flex: 1, position: 'relative', cursor: isTeacher ? (tool === 'eraser' ? 'cell' : 'crosshair') : 'default' }}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseOut={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                    style={{ display: 'block', outline: 'none' }}
                />

                {/* Floating PDF Window */}
                {pdfUrl && (
                    <div 
                        style={{
                            position: 'absolute',
                            left: `${pdfPos.x}px`,
                            top: `${pdfPos.y}px`,
                            width: `${pdfSize.w}px`,
                            height: `${pdfSize.h}px`,
                            zIndex: 10,
                            background: 'white',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            border: '1px solid rgba(0,0,0,0.08)',
                            transition: isDraggingPDF || isResizingPDF ? 'none' : 'all 0.2s ease-out'
                        }}
                    >
                        <div 
                            onMouseDown={startDraggingPDF}
                            style={{
                                padding: '10px 16px',
                                background: 'var(--color-bg-secondary)',
                                borderBottom: '1px solid rgba(0,0,0,0.05)',
                                cursor: 'move',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                userSelect: 'none'
                            }}
                        >
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text)' }}>📄 MATERIAL</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', border: '1px solid rgba(0,0,0,0.1)' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', border: '1px solid rgba(0,0,0,0.1)' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', border: '1px solid rgba(0,0,0,0.1)' }} />
                            </div>
                        </div>
                        <iframe 
                            src={`${pdfUrl}#toolbar=1`}
                            style={{ flex: 1, border: 'none', pointerEvents: isDraggingPDF || isResizingPDF ? 'none' : 'auto' }}
                            title="Interactive PDF Material"
                        />
                        
                        {/* Resize Handle / Draggable Corner */}
                        <div 
                            onMouseDown={startResizingPDF}
                            style={{
                                position: 'absolute',
                                right: '4px',
                                bottom: '4px',
                                width: '20px',
                                height: '20px',
                                cursor: 'nwse-resize',
                                zIndex: 20,
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'flex-end',
                                padding: '2px'
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M11 1L1 11M11 5L5 11M11 9L9 11" stroke="var(--color-text)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
                            </svg>
                        </div>

                        {isTeacher && (
                            <button 
                                onClick={() => setPdfUrl(null)}
                                style={{
                                    position: 'absolute',
                                    bottom: '12px',
                                    left: '12px',
                                    padding: '5px 10px',
                                    fontSize: '0.7rem',
                                    background: 'rgba(239, 68, 68, 0.9)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    backdropFilter: 'blur(4px)'
                                }}
                            >
                                Stop Sharing
                            </button>
                        )}
                    </div>
                )}

                {!isTeacher && !pdfUrl && (
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        padding: '6px 12px',
                        background: 'rgba(0,0,0,0.05)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--color-text-muted)'
                    }}>
                        View Only
                    </div>
                )}
            </div>
        </div>
    );
};

export default Whiteboard;
