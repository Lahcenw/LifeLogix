// lifelogix/src/app/activities/page.jsx

"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function ActivitiesTracker() {
    const [activities, setActivities] = useState([]);
    const [message, setMessage] = useState('');
    const [currentActivity, setCurrentActivity] = useState(null);
    const [timer, setTimer] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [pausedActivities, setPausedActivities] = useState([]);
    const [manualName, setManualName] = useState('');
    const [manualDuration, setManualDuration] = useState('');
    const [manualQuality, setManualQuality] = useState('');
    const [manualDetails, setManualDetails] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [popupQuality, setPopupQuality] = useState('');
    const [popupDetails, setPopupDetails] = useState('');
    const [popupData, setPopupData] = useState(null);
    const router = useRouter();
    const intervalRef = useRef(null);

    useEffect(() => {
        const fetchActivities = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login'); //redirection to login page
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

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

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
    
    const handleDeleteActivity = async (id) => {
        const token = localStorage.getItem('token');
        if (!window.confirm('Are you sure you want to delete this activity?')) {
            return;
        }
        try {
            const res = await fetch(`http://localhost:5000/api/activities/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token,
                },
            });

            if (res.ok) {
                setActivities(activities.filter(activity => activity._id !== id));
                setMessage('Activity successfully deleted!');
            } else {
                setMessage('Failed to delete activity.');
            }
        } catch (err) {
            setMessage('Server error. Please try again.');
        }
    };

    const handleSavePending = (activityToSave) => {
        setPopupData(activityToSave);
        setShowPopup(true);
        // This will now only show the pop-up and not interfere with a running timer
    };

    const handlePause = (name, duration) => {
        if (name && duration > 0) {
            setPausedActivities(prev => [...prev, { name, duration }]);
            setMessage(`${name} is now pending...`);
        }
        setCurrentActivity(null);
        setTimer(0);
        setIsActive(false);
    };

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

    const handleFinish = () => {
        setPopupData({ name: currentActivity, duration: timer });
        setIsActive(false); 
        setShowPopup(true);
    };

    const handlePopupSubmit = (e) => {
        e.preventDefault();
        
        const { name, duration } = popupData;
        saveActivity(name, duration, parseInt(popupQuality, 10), popupDetails);
        
        // After saving, clean up the pop-up's state and main timer if it was the active one
        if (name === currentActivity) {
            setCurrentActivity(null);
            setTimer(0);
        } else {
            // Remove the saved activity from the pending list
            setPausedActivities(prev => prev.filter(act => act.name !== name));
        }
        
        setShowPopup(false);
        setPopupQuality('');
        setPopupDetails('');
        setPopupData(null);
    };

    const handleCancelPopup = () => {
        // If the activity was active, put it back into the paused state
        if (popupData.name === currentActivity) {
            handlePause(currentActivity, timer);
        }
        
        setShowPopup(false);
        setPopupQuality('');
        setPopupDetails('');
        setPopupData(null);
    };

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

    const predefinedActivities = ['Work', 'Study', 'Gym', 'Reading'];

    return (
        <div style={{ padding: '20px' }}>
            <h1>Daily Activities Tracker</h1>
            {message && <p style={{ color: 'red' }}>{message}</p>}

            <div style={{ marginBottom: '30px' }}>
                <h2>Quick Tracker</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {predefinedActivities.map(name => (
                        <button
                            key={name}
                            onClick={() => handleStartPause(name)}
                            style={{
                                padding: '10px 20px',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                                backgroundColor: currentActivity === name ? '#d4edda' : '#f0f0f0'
                            }}
                        >
                            {name}
                        </button>
                    ))}
                </div>
                {isActive && (
                    <div style={{ marginTop: '20px', fontSize: '24px', fontWeight: 'bold' }}>
                        <p>Tracking: {currentActivity} - {formatTime(timer)}</p>
                        <button onClick={handleFinish} style={{ marginTop: '10px' }}>Finish & Save</button>
                    </div>
                )}
            </div>

            {showPopup && popupData && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '20px', border: '1px solid #ccc', zIndex: '100' }}>
                    <h3>Finalize {popupData.name}</h3>
                    <form onSubmit={handlePopupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label>
                            Quality (1-5):
                            <input
                                type="number"
                                value={popupQuality}
                                onChange={(e) => setPopupQuality(e.target.value)}
                                min="1"
                                max="5"
                                required
                            />
                        </label>
                        <label>
                            Details:
                            <textarea
                                value={popupDetails}
                                onChange={(e) => setPopupDetails(e.target.value)}
                                required
                            ></textarea>
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit">Save Log</button>
                            <button type="button" onClick={handleCancelPopup}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {pausedActivities.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h2>Pending Activities</h2>
                    <ul>
                        {pausedActivities.map((act, index) => (
                            <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>{act.name} - {formatTime(act.duration)}</span>
                                <button onClick={() => handleStartPause(act.name)}>Resume</button>
                                <button onClick={() => handleSavePending(act)}>Save</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div style={{ marginBottom: '30px' }}>
                <h2>Manual Entry</h2>
                <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="Activity Name"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Duration (minutes)"
                        value={manualDuration}
                        onChange={(e) => setManualDuration(e.target.value)}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Quality (1-5)"
                        value={manualQuality}
                        onChange={(e) => setManualQuality(e.target.value)}
                        min="1"
                        max="5"
                    />
                    <textarea
                        placeholder="Details..."
                        value={manualDetails}
                        onChange={(e) => setManualDetails(e.target.value)}
                    ></textarea>
                    <button type="submit">Log Activity</button>
                </form>
            </div>

            <div>
                <h2>Logged Activities</h2>
                {activities.length === 0 ? (
                    <p>No activities logged yet.</p>
                ) : (
                    <ul>
                        {activities.map((act) => (
                            <li key={act._id} style={{ marginBottom: '10px', border: '1px solid #eee', padding: '10px' }}>
                                <h3>{act.activityName}</h3>
                                <p>Duration: **{act.duration} minutes**</p>
                                {act.quality && <p>Quality: {act.quality}/5</p>}
                                {act.details && <p>Details: {act.details}</p>}
                                <small>Logged on: {new Date(act.date).toLocaleDateString()}</small>
                                <button onClick={() => handleDeleteActivity(act._id)} style={{ marginLeft: '10px', color: 'red', border: '1px solid red', background: 'none' }}>
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