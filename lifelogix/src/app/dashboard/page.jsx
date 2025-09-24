// lifelogix/src/app/dashboard/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    // State variables for managing journal entries and UI
    const [entries, setEntries] = useState([]);
    const [message, setMessage] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newText, setNewText] = useState('');
    const [editingEntryId, setEditingEntryId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingText, setEditingText] = useState('');
    const router = useRouter();

    // Fetch journal entries from the backend when the component loads
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
                    localStorage.removeItem('token');
                    router.push('/login');
                }
            } catch (err) {
                console.error(err);
                setMessage("Server error. Please try again later.");
            }
        };

        fetchEntries();
    }, [router]);

    // Handle form submission for creating a new entry
    const handleNewEntry = async (e) => {
        e.preventDefault();
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
                setEntries([data, ...entries]); // Add new entry to the top of the list
                setNewTitle('');
                setNewText('');
                setMessage("New entry added successfully!");
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

    // Handle form submission for updating an existing entry
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

    // Handle entry deletion
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
        <div className="flex flex-col md:flex-row md:space-x-8 p-4 md:p-8 w-full bg-gray-50 min-h-screen">
            <div className="w-full md:w-1/3 mb-8 md:mb-0">
                <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center md:text-left">My Journal</h1>
                {message && (
                    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-md mb-6" role="alert">
                        <span className="block sm:inline">{message}</span>
                    </div>
                )}
                
                {/* New Entry Form */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Create New Entry</h2>
                    <form onSubmit={handleNewEntry} className="flex flex-col space-y-4">
                        <input
                            type="text"
                            placeholder="Entry Title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            required
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                        />
                        <textarea
                            placeholder="Your journal entry..."
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            required
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 h-32"
                        ></textarea>
                        <button type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Add Entry
                        </button>
                    </form>
                </div>
            </div>

            {/* List of Journal Entries */}
            <div className="w-full md:w-2/3">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 md:text-left text-center">Your Entries</h2>
                {entries.length === 0 ? (
                    <p className="text-gray-500 italic text-center">No journal entries yet. Start writing!</p>
                ) : (
                    <div className="space-y-6">
                        {entries.map((entry) => (
                            <div key={entry._id} className="bg-white p-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                                {editingEntryId === entry._id ? (
                                    // Edit Form
                                    <form onSubmit={handleUpdate} className="flex flex-col space-y-4">
                                        <input
                                            type="text"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            required
                                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 font-bold text-xl"
                                        />
                                        <textarea
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            required
                                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 h-32"
                                        ></textarea>
                                        <div className="flex space-x-2">
                                            <button type="submit" className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                                Save
                                            </button>
                                            <button type="button" onClick={() => setEditingEntryId(null)} className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    // Display Mode
                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-bold text-gray-800">{entry.title}</h3>
                                            <p className="text-gray-700 mt-2">{entry.text}</p>
                                            <small className="text-xs text-gray-400 mt-2 block">Logged on: {new Date(entry.date).toLocaleDateString()}</small>
                                        </div>
                                        <div className="mt-4 lg:mt-0 flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setEditingEntryId(entry._id);
                                                    setEditingTitle(entry.title);
                                                    setEditingText(entry.text);
                                                }}
                                                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry._id)}
                                                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}