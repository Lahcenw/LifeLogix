// lifelogix/src/app/dashboard/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [entries, setEntries] = useState([]);
    const [message, setMessage] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newText, setNewText] = useState('');
    const [editingEntryId, setEditingEntryId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingText, setEditingText] = useState('');
    const router = useRouter();


    useEffect(() => {
        const fetchEntries = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const res = await fetch('http://localhost:5000/api/entries', {
                    headers: {
                        'x-auth-token': token,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setEntries(data);
                } else {
                    setMessage("Failed to fetch entries.");
                    // If token is invalid or expired, redirect to login
                    localStorage.removeItem('token');
                    router.push('/login');
                }
            } catch (err) {
                console.error(err);
                setMessage("Server error. Please try again later.");
            }
        };

        fetchEntries();
    }, [router]); //[router]: Dependency array, I can remove it to avoid redundancy but since it's considered as a robust approach I'll keep it

    const handleNewEntry = async (e) => {
        e.preventDefault();

        // Handling of form submission
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:5000/api/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ title: newTitle, text: newText }),
            });

            if (res.ok) {
                const data = await res.json();
                setEntries([data, ...entries]);
                setNewTitle('');
                setNewText('');
            } else {
                setMessage("Failed to add entry. Please log in again.");
                localStorage.removeItem('token');
                router.push('/login');
            }
        } catch (err) {
            console.error(err);
            setMessage("Server error. Please try again later.");
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/entries/${editingEntryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ title: editingTitle, text: editingText }),
            });

            if (res.ok) {
                const updatedEntry = await res.json();
                setEntries(entries.map(entry =>
                    entry._id === updatedEntry._id ? updatedEntry : entry
                ));
                setEditingEntryId(null);
                setEditingTitle('');
                setEditingText('');
                setMessage("Entry updated successfully!");
            } else {
                setMessage("Failed to update entry.");
            }
        } catch (err) {
            setMessage("Server error. Please try again later.");
        }
    };

    const handleDelete = async (id) => {

        const confirmed = window.confirm("Are you sure you want to delete this journal entry?");

        if (!confirmed) {
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/entries/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token,
                },
            });

            if (res.ok) {
            setEntries(entries.filter(entry => entry._id !== id));
            setMessage("Entry deleted successfully!");
            } else {
            setMessage("Failed to delete entry.");
            }
        } catch (err) {
            setMessage("Server error. Please try again later.");
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>My Journal</h1>

            <form onSubmit={handleNewEntry} style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Entry Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                /><textarea
                    placeholder="Your journal entry..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    required
                ></textarea>
                <button type="submit">Add Entry</button>
            </form>

            {/* The list of entries will be displayed here */}
            {message && <p>{message}</p>}
            {entries.length === 0 ? (
                <p>No journal entries yet. Start writing!</p>
            ) : (
                <ul>
                    {entries.map((entry) => (
                    <li key={entry._id}>
                        {editingEntryId === entry._id ? (
                            // Edit Form
                            <form onSubmit={handleUpdate}>
                                <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    required
                                />
                                <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    required
                                ></textarea>
                                <button type="submit">Save</button>
                                <button onClick={() => setEditingEntryId(null)}>Cancel</button>
                            </form>
                        ) : (
                            // Display Mode
                            <div>
                                <h3>{entry.title}</h3>
                                <p>{entry.text}</p>
                                <small>{new Date(entry.date).toLocaleDateString()}</small>
                                <div style={{ marginTop: '10px' }}>
                                    <button onClick={() => {
                                        setEditingEntryId(entry._id);
                                        setEditingTitle(entry.title);
                                        setEditingText(entry.text);
                                    }}> Edit </button>
                                    <button onClick={() => handleDelete(entry._id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                    ))}
                </ul>
            )}
        </div>
    );
};