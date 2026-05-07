import React, { useState, useEffect } from 'react';

interface StudentNotepadProps {
    sessionCode: string;
}

const StudentNotepad: React.FC<StudentNotepadProps> = ({ sessionCode }) => {
    const [notes, setNotes] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem(`vislides_notes_${sessionCode}`);
        if (saved) {
            setNotes(saved);
        }
    }, [sessionCode]);

    // Save to local storage
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newNotes = e.target.value;
        setNotes(newNotes);
        localStorage.setItem(`vislides_notes_${sessionCode}`, newNotes);
    };

    const downloadNotes = () => {
        const element = document.createElement("a");
        const file = new Blob([notes], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `Class_Notes_${sessionCode}.txt`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-secondary anim-scale-up"
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    left: '2rem',
                    zIndex: 1500,
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    background: 'var(--color-surface)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid rgba(0,0,0,0.05)'
                }}
                title="Open Class Notepad"
            >
                📝
            </button>
        );
    }

    return (
        <div className="bento-box anim-fade-in" style={{
            position: 'fixed',
            bottom: '2rem',
            left: '2rem',
            zIndex: 1500,
            width: '350px',
            height: '450px',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{color: 'var(--color-primary)'}}>📝</span> My Notes
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={downloadNotes} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Download as .txt">⬇️</button>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>✖️</button>
                </div>
            </div>
            
            <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Take your class notes here... (Auto-saves locally)"
                style={{
                    flex: 1,
                    resize: 'none',
                    border: 'none',
                    background: 'rgba(0,0,0,0.02)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    fontSize: '0.95rem',
                    fontFamily: 'var(--font-family)',
                    color: 'var(--color-text)',
                    lineHeight: '1.5'
                }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
                Stored securely on this browser
            </div>
        </div>
    );
};

export default StudentNotepad;
