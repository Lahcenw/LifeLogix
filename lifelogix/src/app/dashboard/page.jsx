// lifelogix/src/app/dashboard/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [entries, setEntries] = useState([]);
    const [message, setMessage] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newText, setNewText] = useState('');
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
                            <h3>{entry.title}</h3>
                            <p>{entry.text}</p>
                            <small>{new Date(entry.date).toLocaleDateString()}</small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}