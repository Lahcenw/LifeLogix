// lifelogix/src/app/activities/page.jsx

"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function ActivitiesTracker() {
    // --- State variables to manage all the UI and data.
    // 'activities' holds all the logged data from the server.
    const [activities, setActivities] = useState([]);
    // 'message' is for showing quick feedback like "Activity saved!".
    const [message, setMessage] = useState('');
    // 'currentActivity' tracks the activity being timed right now.
    const [currentActivity, setCurrentActivity] = useState(null);
    // 'timer' is just a simple second counter for the active activity.
    const [timer, setTimer] = useState(0);
    // 'isActive' is a boolean to control the timer.
    const [isActive, setIsActive] = useState(false);
    
    // 'pausedActivities' is where we store activities that were started but not saved yet.
    const [pausedActivities, setPausedActivities] = useState([]);

    // States for the manual entry form.
    const [manualName, setManualName] = useState('');
    const [manualDuration, setManualDuration] = useState('');
    const [manualQuality, setManualQuality] = useState('');
    const [manualDetails, setManualDetails] = useState('');

    // States for the pop-up to save a completed activity.
    const [showPopup, setShowPopup] = useState(false);
    const [popupQuality, setPopupQuality] = useState('');
    const [popupDetails, setPopupDetails] = useState('');
    const [popupData, setPopupData] = useState(null);

    // States for managing the pre-defined quick activities list.
    const [predefinedActivities, setPredefinedActivities] = useState(['Work', 'Study', 'Gym', 'Reading']);
    const [newActivityName, setNewActivityName] = useState('');

    // States for the delete confirmation pop-up.
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);

    // Get the Next.js router for navigation.
    const router = useRouter();
    // useRef to keep the timer's interval ID across renders.
    const intervalRef = useRef(null);

    // --- Utility Function: Format the timer into MM:SS.
    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // --- useEffect: Fetch logged activities on component load.
    // It also redirects to login if there's no token.
    useEffect(() => {
        const fetchActivities = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }
            try {
                const res = await fetch('http://localhost:5000/api/activities', {
                    headers: {
                        'x-auth-token': token,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setActivities(data);
                } else {
                    setMessage("Failed to fetch activities.");
                    localStorage.removeItem('token');
                    router.push('/login');
                }
            } catch (err) {
                setMessage("Server error. Please try again later.");
            }
        };

        fetchActivities();
    }, [router]);

    // --- useEffect: Handle the timer logic and prevent data loss on page reload.
    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setTimer(prevTimer => prevTimer + 1);
            }, 1000);
        } else if (!isActive && timer !== 0) {
            clearInterval(intervalRef.current);
        }
        
        const handleBeforeUnload = (event) => {
            if (isActive) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(intervalRef.current);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isActive, timer]);

    // --- Core Functions for handling data.

    // Function to send a new activity to the server.
    const saveActivity = async (name, duration, quality, details) => {
        const token = localStorage.getItem('token');
        if (!name || duration === 0) return;

        try {
            const res = await fetch('http://localhost:5000/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({
                    activityName: name,
                    duration: Math.floor(duration / 60),
                    quality,
                    details
                }),
            });
            if (res.ok) {
                const newActivity = await res.json();
                setActivities(prevActivities => [newActivity, ...prevActivities]);
                setMessage(`Logged ${name} for ${Math.floor(duration / 60)} minutes.`);
            } else {
                setMessage("Failed to log activity. Please try again.");
            }
        } catch (err) {
            setMessage("Server error. Please try again later.");
        }
    };
    
    // Function to trigger the delete confirmation pop-up.
    const handleDeleteActivity = (id) => {
        setActivityToDelete(id);
        setShowDeleteConfirm(true);
    };

    // Function to actually delete an activity from the database.
    const confirmDelete = async () => {
        const token = localStorage.getItem('token');
        try {
            // Check if the item to delete is a logged activity (by _id)
            if (activityToDelete.length === 24) { // MongoDB ObjectId has a length of 24
                const res = await fetch(`http://localhost:5000/api/activities/${activityToDelete}`, {
                    method: 'DELETE',
                    headers: {
                        'x-auth-token': token,
                    },
                });
                if (res.ok) {
                    setActivities(activities.filter(activity => activity._id !== activityToDelete));
                    setMessage('Activity successfully deleted!');
                } else {
                    setMessage('Failed to delete activity.');
                }
            } else { // Otherwise, it's a predefined activity name
                setPredefinedActivities(prev => prev.filter(name => name !== activityToDelete));
                setMessage(`'${activityToDelete}' successfully removed from quick activities!`);
            }
        } catch (err) {
            setMessage('Server error. Please try again.');
        } finally {
            setShowDeleteConfirm(false);
            setActivityToDelete(null);
        }
    };

    // Function to cancel the delete operation.
    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setActivityToDelete(null);
    };

    // Handle a user clicking 'Save' on a pending activity.
    const handleSavePending = (activityToSave) => {
        setPopupData(activityToSave);
        setShowPopup(true);
    };

    // Pause the currently active timer and add it to the pending list.
    const handlePause = (name, duration) => {
        if (name && duration > 0) {
            setPausedActivities(prev => [...prev, { name, duration }]);
            setMessage(`${name} is now pending...`);
        }
        setCurrentActivity(null);
        setTimer(0);
        setIsActive(false);
    };

    // Start or resume a quick activity timer.
    const handleStartPause = (activityName) => {
        if (isActive && currentActivity !== activityName) {
            handlePause(currentActivity, timer);
        }
        
        const pausedIndex = pausedActivities.findIndex(act => act.name === activityName);

        if (pausedIndex !== -1) {
            const resumedActivity = pausedActivities[pausedIndex];
            setPausedActivities(prev => prev.filter((_, index) => index !== pausedIndex));
            setCurrentActivity(resumedActivity.name);
            setTimer(resumedActivity.duration);
            setIsActive(true);
            setMessage(`Resuming ${resumedActivity.name}...`);
        } else if (currentActivity === activityName && isActive) {
            handlePause(currentActivity, timer);
        } else {
            setCurrentActivity(activityName);
            setTimer(0);
            setIsActive(true);
            setMessage(`Tracking ${activityName}...`);
        }
    };

    // Stop the active timer and show the pop-up to finalize the activity details.
    const handleFinish = () => {
        setPopupData({ name: currentActivity, duration: timer });
        setIsActive(false); 
        setShowPopup(true);
    };

    // Handle the form submission inside the save pop-up.
    const handlePopupSubmit = (e) => {
        e.preventDefault();
        
        const { name, duration } = popupData;
        saveActivity(name, duration, parseInt(popupQuality, 10), popupDetails);
        
        if (name === currentActivity) {
            setCurrentActivity(null);
            setTimer(0);
        } else {
            setPausedActivities(prev => prev.filter(act => act.name !== name));
        }
        
        setShowPopup(false);
        setPopupQuality('');
        setPopupDetails('');
        setPopupData(null);
    };

    // Close the save pop-up without logging the activity.
    const handleCancelPopup = () => {
        if (popupData.name === currentActivity) {
            handlePause(currentActivity, timer);
        }
        
        setShowPopup(false);
        setPopupQuality('');
        setPopupDetails('');
        setPopupData(null);
    };

    // Handle the submission for the manual entry form.
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!manualName || !manualDuration) return;

        try {
            const res = await fetch('http://localhost:5000/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({
                    activityName: manualName,
                    duration: parseInt(manualDuration, 10),
                    quality: parseInt(manualQuality, 10) || null,
                    details: manualDetails,
                }),
            });

            if (res.ok) {
                const newActivity = await res.json();
                setActivities([newActivity, ...activities]);
                setMessage("Manual activity logged successfully!");
                setManualName('');
                setManualDuration('');
                setManualQuality('');
                setManualDetails('');
            } else {
                setMessage("Failed to log manual activity.");
            }
        } catch (err) {
            setMessage("Server error. Please try again later.");
        }
    };
    
    // Allow users to add new quick activity buttons.
    const handleAddActivity = (e) => {
        e.preventDefault();
        if (newActivityName && !predefinedActivities.includes(newActivityName)) {
            setPredefinedActivities(prev => [...prev, newActivityName]);
            setNewActivityName('');
        }
    };

    // Allow users to remove quick activity buttons.
    const handleDeletePredefinedActivity = (activityToDeleteName) => {
        setActivityToDelete(activityToDeleteName); // Set the name as the item to delete
        setShowDeleteConfirm(true); // Show the confirmation popup
    };

    // --- The JSX for the component's UI.
    return (
        <div className="flex flex-col md:flex-row md:space-x-8 p-4 md:p-8 w-full bg-gray-50 min-h-screen">
            
            {/* Main Content Area */}
            <div className="w-full md:w-2/3">
                <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center md:text-left">Activities Tracker</h1>
                {message && (
                    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-md mb-6" role="alert">
                        <span className="block sm:inline">{message}</span>
                    </div>
                )}

                {/* Quick Tracker Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Quick Tracker</h2>
                    {isActive && (
                        <div className="mb-4 p-4 rounded-lg bg-indigo-100 border border-indigo-200">
                            <p className="text-lg font-bold text-indigo-800">
                                Tracking: <span className="font-extrabold">{currentActivity}</span>
                            </p>
                            <p className="text-3xl font-extrabold text-indigo-800">{formatTime(timer)}</p>
                            <div className="flex space-x-2 mt-4">
                                <button 
                                    onClick={handleFinish} 
                                    className="flex-1 py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Finish & Save
                                </button>
                                <button 
                                    onClick={() => handlePause(currentActivity, timer)} 
                                    className="flex-1 py-2 px-4 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Pause
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {predefinedActivities.map(name => (
                            <div key={name} className="flex items-center">
                                <button
                                    onClick={() => handleStartPause(name)}
                                    className={`py-2 px-4 border border-gray-300 rounded-md text-sm shadow-sm ${currentActivity === name ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                                >
                                    {name}
                                </button>
                                <button
                                    onClick={() => handleDeletePredefinedActivity(name)}
                                    className="p-1 text-red-500 hover:text-red-700 transition-colors duration-200"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <form onSubmit={handleAddActivity} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Add new activity"
                            value={newActivityName}
                            onChange={(e) => setNewActivityName(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                        />
                        <button type="submit" className="flex-shrink-0 bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Add
                        </button>
                    </form>
                </div>

                {/* Pending Activities Section */}
                {pausedActivities.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Pending Activities</h2>
                        <ul className="space-y-4">
                            {pausedActivities.map((act, index) => (
                                <li key={index} className="p-4 bg-gray-100 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="text-lg font-medium">{act.name}</h4>
                                        <p className="text-sm text-gray-600">{formatTime(act.duration)}</p>
                                    </div>
                                    <div className="flex space-x-2 mt-2 sm:mt-0">
                                        <button onClick={() => handleStartPause(act.name)} className="bg-green-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-green-600">Resume</button>
                                        <button onClick={() => handleSavePending(act)} className="bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700">Save</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {/* Manual Entry Form Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Manual Entry</h2>
                    <form onSubmit={handleManualSubmit} className="flex flex-col space-y-4">
                        <input
                            type="text"
                            placeholder="Activity Name"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            required
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                        />
                        <input
                            type="number"
                            placeholder="Duration (minutes)"
                            value={manualDuration}
                            onChange={(e) => setManualDuration(e.target.value)}
                            required
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                        />
                        <input
                            type="number"
                            placeholder="Quality (1-5)"
                            value={manualQuality}
                            onChange={(e) => setManualQuality(e.target.value)}
                            min="1"
                            max="5"
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                        />
                        <textarea
                            placeholder="Details (optional)"
                            value={manualDetails}
                            onChange={(e) => setManualDetails(e.target.value)}
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                            rows="3"
                        ></textarea>
                        <button type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Log Activity
                        </button>
                    </form>
                </div>

                {/* Logged Activities Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Logged Activities</h2>
                    {activities.length === 0 ? (
                        <p className="text-gray-500 italic">No activities logged yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
                            {activities.map((act) => (
                                <div key={act._id} className="bg-white p-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-bold text-gray-800">{act.activityName}</h3>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Duration: <span className="font-semibold">{act.duration} minutes</span>
                                            </p>
                                            {act.quality && (
                                                <p className="text-sm text-gray-500">Quality: <span className="font-semibold">{act.quality}</span>/5</p>
                                            )}
                                            {act.details && (
                                                <p className="text-sm text-gray-600 mt-2">{act.details}</p>
                                            )}
                                            <small className="text-xs text-gray-400 mt-1 block">Logged on: {new Date(act.date).toLocaleDateString()}</small>
                                        </div>
                                        <div className="mt-4 lg:mt-0">
                                            <button onClick={() => handleDeleteActivity(act._id)} className="bg-red-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pop-up for finalizing an activity */}
            {showPopup && popupData && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center w-full max-w-sm mx-auto">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Finalize {popupData.name}</h3>
                        <form onSubmit={handlePopupSubmit} className="flex flex-col space-y-4">
                            <label className="font-medium text-gray-700">
                                Quality (1-5):
                                <input
                                    type="number"
                                    value={popupQuality}
                                    onChange={(e) => setPopupQuality(e.target.value)}
                                    min="1"
                                    max="5"
                                    required
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                                />
                            </label>
                            <label className="font-medium text-gray-700">
                                Details:
                                <textarea
                                    value={popupDetails}
                                    onChange={(e) => setPopupDetails(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                                ></textarea>
                            </label>
                            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Save Log
                                </button>
                                <button type="button" onClick={handleCancelPopup} className="w-full sm:w-auto bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pop-up for confirming deletion */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center w-full max-w-sm mx-auto">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirm Deletion</h3>
                        <p className="mb-6 text-gray-600">Are you sure you want to delete this activity?</p>
                        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <button onClick={confirmDelete} className="w-full sm:w-auto bg-red-500 text-white font-semibold py-2 px-6 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                Delete
                            </button>
                            <button onClick={cancelDelete} className="w-full sm:w-auto bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}