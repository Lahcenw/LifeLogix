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
        <div className="p-5">
            <h1 className="text-3xl font-bold mb-4">Daily Activities Tracker</h1>
            {message && <p className="text-red-500 mb-4">{message}</p>}

            {/* Quick Tracker section with buttons and delete functionality */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Quick Tracker</h2>
                <div className="flex flex-wrap gap-2">
                    {predefinedActivities.map(name => (
                        <div key={name} className="flex items-center gap-1">
                            <button
                                onClick={() => handleStartPause(name)}
                                className={`py-2 px-4 border border-gray-300 rounded-md text-black ${currentActivity === name ? 'bg-green-200' : 'bg-gray-200'}`}
                            >
                                {name}
                            </button>
                            <button
                                onClick={() => handleDeletePredefinedActivity(name)}
                                className="bg-transparent border-none cursor-pointer text-red-500"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form to add or remove quick activities */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Manage Quick Activities</h2>
                <form onSubmit={handleAddActivity} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Add new activity"
                        value={newActivityName}
                        onChange={(e) => setNewActivityName(e.target.value)}
                        required
                        className="p-2 border border-gray-300 rounded-md flex-grow"
                    />
                    <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md">Add</button>
                </form>
            </div>

            {/* Display for the current active timer */}
            {isActive && (
                <div className="mt-5 text-2xl font-bold">
                    <p>Tracking: {currentActivity} - {formatTime(timer)}</p>
                    <button onClick={handleFinish} className="mt-2 bg-blue-500 text-white py-2 px-4 rounded-md">Finish & Save</button>
                </div>
            )}

            // Pop-up for finalizing an activity
            {showPopup && popupData && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-5 border border-gray-300 rounded-lg z-50 text-black">
                    <h3 className="text-lg font-semibold mb-4 text-black">Finalize {popupData.name}</h3>
                    <form onSubmit={handlePopupSubmit} className="flex flex-col gap-4">
                        <label className="text-black">
                            Quality (1-5):
                            <input
                                type="number"
                                value={popupQuality}
                                onChange={(e) => setPopupQuality(e.target.value)}
                                min="1"
                                max="5"
                                required
                                className="mt-1 p-2 border border-gray-300 rounded-md w-full text-black"
                            />
                        </label>
                        <label className="text-black">
                            Details:
                            <textarea
                                value={popupDetails}
                                onChange={(e) => setPopupDetails(e.target.value)}
                                required
                                className="mt-1 p-2 border border-gray-300 rounded-md w-full text-black"
                            ></textarea>
                        </label>
                        <div className="flex gap-2">
                            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md">Save Log</button>
                            <button type="button" onClick={handleCancelPopup} className="bg-gray-300 text-black py-2 px-4 rounded-md">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Pop-up for confirming deletion */}
            {showDeleteConfirm && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-5 border border-gray-300 rounded-lg z-50 text-black">
                    <h3 className="text-lg font-semibold mb-4 text-black">Confirm Deletion</h3>
                    <p className="mb-4 text-black">Are you sure you want to delete this activity?</p>
                    <div className="flex gap-2">
                        <button onClick={confirmDelete} className="bg-red-500 text-white border-none py-2 px-4 rounded-md cursor-pointer">
                            Delete
                        </button>
                        <button onClick={cancelDelete} className="bg-gray-300 text-black border-none py-2 px-4 rounded-md cursor-pointer">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* List of pending activities to resume or save */}
            {pausedActivities.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">Pending Activities</h2>
                    <ul>
                        {pausedActivities.map((act, index) => (
                            <li key={index} className="mb-2 flex items-center gap-2">
                                <span>{act.name} - {formatTime(act.duration)}</span>
                                <button onClick={() => handleStartPause(act.name)} className="bg-green-500 text-white py-1 px-3 rounded-md">Resume</button>
                                <button onClick={() => handleSavePending(act)} className="bg-blue-500 text-white py-1 px-3 rounded-md">Save</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Form for manual activity entry */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Manual Entry</h2>
                <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Activity Name"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        required
                        className="p-2 border border-gray-300 rounded-md"
                    />
                    <input
                        type="number"
                        placeholder="Duration (minutes)"
                        value={manualDuration}
                        onChange={(e) => setManualDuration(e.target.value)}
                        required
                        className="p-2 border border-gray-300 rounded-md"
                    />
                    <input
                        type="number"
                        placeholder="Quality (1-5)"
                        value={manualQuality}
                        onChange={(e) => setManualQuality(e.target.value)}
                        min="1"
                        max="5"
                        className="p-2 border border-gray-300 rounded-md"
                    />
                    <textarea
                        placeholder="Details..."
                        value={manualDetails}
                        onChange={(e) => setManualDetails(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md"
                    ></textarea>
                    <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md">Log Activity</button>
                </form>
            </div>

            {/* Display list of all logged activities */}
            <div>
                <h2 className="text-xl font-semibold mb-2">Logged Activities</h2>
                {activities.length === 0 ? (
                    <p className="text-gray-500">No activities logged yet.</p>
                ) : (
                    <ul>
                        {activities.map((act) => (
                            <li key={act._id} className="mb-4 p-4 border border-gray-200 rounded-md">
                                <h3 className="text-lg font-semibold">{act.activityName}</h3>
                                <p className="text-sm">Duration: <strong className="font-bold">{act.duration} minutes</strong></p>
                                {act.quality && <p className="text-sm">Quality: {act.quality}/5</p>}
                                {act.details && <p className="text-sm">Details: {act.details}</p>}
                                <small className="text-xs text-gray-500">Logged on: {new Date(act.date).toLocaleDateString()}</small>
                                <button onClick={() => handleDeleteActivity(act._id)} className="ml-2 text-red-500 border border-red-500 bg-transparent rounded-md py-1 px-2">
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}