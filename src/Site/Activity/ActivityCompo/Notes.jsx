import '../Activity.css';
import { useState } from 'react';
import { FiLink } from "react-icons/fi";
import { LuCopy } from "react-icons/lu";
import { RiDeleteBin7Line } from "react-icons/ri";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [links, setLinks] = useState([]);
    const [currentNote, setCurrentNote] = useState(null);
    const [view, setView] = useState(false);
    const [showAddLink, setShowAddLink] = useState(false);
    const [newLinkTitle, setNewLinkTitle] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');

    const handleAddNote = () => {
        const newNote = { id: Date.now(), title: '', description: '' };
        setNotes([...notes, newNote]);
        setCurrentNote(newNote);
        setView(true);
    };

    const handleAddLink = () => {
        if (!newLinkTitle || !newLinkUrl) {
            alert('Please enter both title and URL.');
            return;
        }
        const newLink = { id: Date.now(), title: newLinkTitle, url: newLinkUrl };
        setLinks([...links, newLink]);
        setShowAddLink(false);
        setNewLinkTitle('');
        setNewLinkUrl('');
    };

    const handleDeleteNote = (id) => {
        const noteToDelete = notes.find(note => note.id === id);
        if (noteToDelete && window.confirm(`Delete "${noteToDelete.title || 'Untitled Note'}"?`)) {
            setNotes(notes.filter(note => note.id !== id));
        }
    };

    const handleDeleteLink = (id) => {
        setLinks(links.filter(link => link.id !== id));
    };

    const handleCopyLink = (url) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url)
                // .then(() => alert("Link copied to clipboard!"))
                .catch(() => fallbackCopy(url));
        } else {
            fallbackCopy(url);
        }
    };

    const fallbackCopy = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            // alert("Link copied to clipboard!");
        } catch (err) {
            alert("Failed to copy link");
        }
        document.body.removeChild(textArea);
    };


    return (
        <main className="notes-main">
            {showAddLink && (
                <div className="notes-link-add-con">
                    <div className="notes-link-add">
                        <input
                            placeholder='Title'
                            className="notes-link-head-in"
                            value={newLinkTitle}
                            onChange={(e) => setNewLinkTitle(e.target.value)}
                        />
                        <input
                            placeholder='Paste Link'
                            className="notes-link-link-in"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                        />
                        <div className="link-btns">
                            <p className="link-save" onClick={() => { setShowAddLink(false) }} >Cancle</p>
                            <p className="link-save" onClick={handleAddLink} >Save</p>
                        </div>

                    </div>
                </div>
            )}
            {view && (
                <div className="notes-view-page">
                    <div className='notes-view-head'>
                        <input
                            className='notes-view-name-in'
                            type="text"
                            placeholder='Title'
                            value={currentNote?.title || ''}
                            onChange={(e) =>
                                setCurrentNote({ ...currentNote, title: e.target.value })
                            }
                        />
                        <p className="notes-save" onClick={() => {
                            if (!currentNote?.title.trim() && !currentNote?.description.trim()) {
                                alert("Cannot save an empty note!");
                                return;
                            }
                            setNotes(notes.map(note => (note.id === currentNote.id ? currentNote : note)));
                            setView(false);
                        }}>Save</p>
                        <p
                            className="notes-close"
                            onClick={() => {
                                setView(false);
                            }}
                        >
                            X
                        </p>

                    </div>
                    <textarea
                        className='notes-view-desc-in'
                        placeholder='Description'
                        value={currentNote?.description || ''}
                        onChange={(e) =>
                            setCurrentNote({ ...currentNote, description: e.target.value })
                        }
                    />
                </div>
            )}
            <p className="todo-title">
                Notes / Sheets
                <p onClick={handleAddNote} className="notes-add-column">+ New Notes</p>
                <p className="notes-add-excel" onClick={() => setShowAddLink(!showAddLink)}>
                    <PiMicrosoftExcelLogoFill />
                </p>
            </p>
            <div className="notes-container">
                {notes.map(note => (
                    <div key={note.id} className="notes-card" onDoubleClick={() => handleDeleteNote(note.id)}>
                        <p className="notes-head">{note.title || 'Untitled Note'}</p>
                        <p className="notes-desc">{note.description || 'No description available'}</p>
                        <p className="notes-btn" onClick={() => { setCurrentNote(note); setView(true); }}>
                            View &gt;
                        </p>
                    </div>
                ))}
                {links.map(link => (
                    <div key={link.id} className="notes-link-card">
                        <a className='notes-link' href={link.url} target="_blank" rel="noopener noreferrer">
                            <p className="notes-link-icon"><FiLink /></p>
                            <p className="notes-link-head">{link.title || 'No Title'}</p>
                        </a>
                        <p className="notes-link-icon">
                            <span style={{ color: 'red' }} className="notes-link-icon" onClick={() => handleDeleteLink(link.id)}>
                                <RiDeleteBin7Line />
                            </span>
                            <span className="notes-link-icon" onClick={() => handleCopyLink(link.url)}>
                                <LuCopy />
                            </span>
                        </p>
                    </div>
                ))}
            </div>
        </main>
    );
}
