"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Goals() {
    // State to hold all the goals from the server
    const [goals, setGoals] = useState([]);
    
    // State for a message or error feedback
    const [message, setMessage] = useState('');

    const router = useRouter();
    // States for goal creation form
    const [goalName, setGoalName] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [goalDescription, setGoalDescription] = useState('');
    
    // States for Editing and Deleting Goals
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [goalToDelete, setGoalToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentGoal, setCurrentGoal] = useState(null);

    // States for sub-goal management
    const [subGoalName, setSubGoalName] = useState('');
    const [subGoalParentId, setSubGoalParentId] = useState(null);
    const [showSubGoalForm, setShowSubGoalForm] = useState(false);
    const [showSubGoalDeleteConfirm, setShowSubGoalDeleteConfirm] = useState(false);
    const [subGoalToDelete, setSubGoalToDelete] = useState(null);
    const [isEditingSubGoal, setIsEditingSubGoal] = useState(false);
    const [currentSubGoal, setCurrentSubGoal] = useState(null);


    const handleAddGoal = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            if (goalName === '' || targetDate === '') {
                setMessage('Missing Data. Please set the goal name and target date');
                return;
            }

            const res = await fetch('http://localhost:5000/api/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({
                    goalName: goalName,
                    targetDate: targetDate,
                    description: goalDescription,
                })
            });

            if (res.ok) {
                const newGoal = await res.json();
                setGoals([newGoal, ...goals]);
                setGoalName('');
                setTargetDate('');
                setGoalDescription('');
                setMessage('New goal created successfully!');
            } else {
                setMessage('Failed to create goal. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setMessage("Server error. Please try again later.");
        }
    };

    useEffect(() => {
        const fetchGoals = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const res = await fetch('http://localhost:5000/api/goals', {
                    headers: {
                        'x-auth-token': token,
                    },
                });
                if (res.ok) {
                    const fetchedGoals = await res.json();
                    setGoals(fetchedGoals);
                } else {
                    setMessage('Failed to fetch goals.');
                }
            } catch (err) {
                console.error(err);
                setMessage('Server Error. Please try again later.');
            }
        };
        fetchGoals();
    }, [router]);

    // DELETE GOALS
    const handleDeleteGoal = (id) => {
        setGoalToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        const token = localStorage.getItem('token');
        if (!token || !goalToDelete) return;

        try {
            const res = await fetch(`http://localhost:5000/api/goals/${goalToDelete}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token,
                },
            });

            if (res.ok) {
                setGoals(goals.filter(goal => goal._id !== goalToDelete));
                setMessage('Goal successfully deleted!');
            } else {
                setMessage('Failed to delete goal.');
            }
        } catch (err) {
            setMessage('Server error. Please try again.');
        } finally {
            setShowDeleteConfirm(false);
            setGoalToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setGoalToDelete(null);
    };

    // UPDATE GOALS
    const handleEditGoal = (goal) => {
        setCurrentGoal(goal);
        setIsEditing(true);
        setGoalName(goal.goalName);
        setTargetDate(new Date(goal.targetDate).toISOString().split('T')[0]);
        setGoalDescription(goal.description);
    };

    const handleUpdateGoal = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || !currentGoal) return;

        try {
            const res = await fetch(`http://localhost:5000/api/goals/${currentGoal._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({
                    goalName,
                    targetDate,
                    description: goalDescription,
                }),
            });

            if (res.ok) {
                const updatedGoal = await res.json();
                setGoals(goals.map(goal => goal._id === updatedGoal._id ? updatedGoal : goal));
                setMessage('Goal updated successfully!');
                setIsEditing(false);
                setCurrentGoal(null);
                setGoalName('');
                setTargetDate('');
                setGoalDescription('');
            } else {
                setMessage('Failed to update goal. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setMessage('Server error. Please try again later.');
        }
    };

    // NEW SUB-GOAL FUNCTIONS
    const handleAddSubGoal = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || !subGoalParentId || !subGoalName) {
            setMessage('Missing data for sub-goal.');
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/goals/${subGoalParentId}/subgoals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ name: subGoalName }), // Send 'name' to match backend
            });

            if (res.ok) {
                const newSubGoal = await res.json();
                setGoals(goals.map(goal => 
                    goal._id === subGoalParentId ? { ...goal, subGoals: [...(goal.subGoals || []), newSubGoal] } : goal
                ));
                setMessage('Sub-goal created successfully!');
                setSubGoalName('');
                setShowSubGoalForm(false);
                setSubGoalParentId(null);
            } else {
                setMessage('Failed to create sub-goal.');
            }
        } catch (err) {
            console.error(err);
            setMessage('Server error. Please try again.');
        }
    };

    const handleToggleSubGoal = async (subGoalId, parentGoalId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/goals/${parentGoalId}/subgoals/${subGoalId}/toggle`, {
                method: 'PUT',
                headers: {
                    'x-auth-token': token,
                },
            });

            if (res.ok) {
                const updatedSubGoal = await res.json();
                setGoals(goals.map(goal => {
                    if (goal._id === parentGoalId) {
                        return {
                            ...goal,
                            subGoals: goal.subGoals.map(subGoal =>
                                subGoal._id === updatedSubGoal._id ? updatedSubGoal : subGoal
                            )
                        };
                    }
                    return goal;
                }));
            } else {
                setMessage('Failed to update sub-goal status.');
            }
        } catch (err) {
            setMessage('Server error. Please try again.');
        }
    };

    const handleDeleteSubGoal = (subGoalId, parentGoalId) => {
        setSubGoalToDelete({ subGoalId, parentGoalId });
        setShowSubGoalDeleteConfirm(true);
    };

    const confirmDeleteSubGoal = async () => {
        const token = localStorage.getItem('token');
        if (!token || !subGoalToDelete) return;

        try {
            const res = await fetch(`http://localhost:5000/api/goals/${subGoalToDelete.parentGoalId}/subgoals/${subGoalToDelete.subGoalId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token,
                },
            });

            if (res.ok) {
                setGoals(goals.map(goal => {
                    if (goal._id === subGoalToDelete.parentGoalId) {
                        return {
                            ...goal,
                            subGoals: goal.subGoals.filter(subGoal => subGoal._id !== subGoalToDelete.subGoalId),
                        };
                    }
                    return goal;
                }));
                setMessage('Sub-goal successfully deleted!');
            } else {
                setMessage('Failed to delete sub-goal.');
            }
        } catch (err) {
            setMessage('Server error. Please try again.');
        } finally {
            setShowSubGoalDeleteConfirm(false);
            setSubGoalToDelete(null);
        }
    };

    const cancelDeleteSubGoal = () => {
        setShowSubGoalDeleteConfirm(false);
        setSubGoalToDelete(null);
    };

    const handleEditSubGoal = (subGoal, parentGoalId) => {
        setCurrentSubGoal({ ...subGoal, parentGoalId });
        setIsEditingSubGoal(true);
        setSubGoalName(subGoal.subGoalName); // Use subGoalName from the backend
        setShowSubGoalForm(true);
        setSubGoalParentId(parentGoalId);
    };

    const handleUpdateSubGoal = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || !currentSubGoal) return;

        try {
            const res = await fetch(`http://localhost:5000/api/goals/${currentSubGoal.parentGoalId}/subgoals/${currentSubGoal._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ name: subGoalName }), // Send 'name' to match backend
            });

            if (res.ok) {
                const updatedSubGoal = await res.json();
                setGoals(goals.map(goal => {
                    if (goal._id === currentSubGoal.parentGoalId) {
                        return {
                            ...goal,
                            subGoals: goal.subGoals.map(subGoal => subGoal._id === updatedSubGoal._id ? updatedSubGoal : subGoal)
                        };
                    }
                    return goal;
                }));
                setMessage('Sub-goal updated successfully!');
                setIsEditingSubGoal(false);
                setCurrentSubGoal(null);
                setSubGoalName('');
                setShowSubGoalForm(false);
                setSubGoalParentId(null);
            } else {
                setMessage('Failed to update sub-goal.');
            }
        } catch (err) {
            console.error(err);
            setMessage('Server error. Please try again.');
        }
    };
    
    const handleCancelSubGoalForm = () => {
        setShowSubGoalForm(false);
        setSubGoalParentId(null);
        setSubGoalName('');
        setIsEditingSubGoal(false);
        setCurrentSubGoal(null);
        setMessage('');
    };

    return (
        <div className="p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">Your Goals</h1>

            {message && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-md mb-6" role="alert">
                    <span className="block sm:inline">{message}</span>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">{isEditing ? 'Edit Goal' : 'Create a New Goal'}</h2>
                <form onSubmit={isEditing ? handleUpdateGoal : handleAddGoal} className="flex flex-col space-y-4">
                    <label htmlFor="goalName" className="font-medium text-gray-700">
                        Goal Name
                        <input
                            id="goalName"
                            type="text"
                            placeholder="Enter goal name"
                            value={goalName}
                            onChange={(e) => setGoalName(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </label>
                    <label htmlFor="targetDate" className="font-medium text-gray-700">
                        Target Date
                        <input
                            id="targetDate"
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </label>
                    <label htmlFor="goalDescription" className="font-medium text-gray-700">
                        Description
                        <textarea
                            id="goalDescription"
                            placeholder="Describe your goal (optional)"
                            value={goalDescription}
                            onChange={(e) => setGoalDescription(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            rows="3"
                        ></textarea>
                    </label>
                    <button type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        {isEditing ? 'Update Goal' : 'Create Goal'}
                    </button>
                    {isEditing && (
                        <button type="button" onClick={() => {
                            setIsEditing(false);
                            setCurrentGoal(null);
                            setGoalName('');
                            setTargetDate('');
                            setGoalDescription('');
                        }} className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Cancel Edit
                        </button>
                    )}
                </form>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Existing Goals</h2>
                {goals.length === 0 ? (
                    <p className="text-gray-500 italic text-center">There's no existing goals yet. Create one to get started!</p>
                ) : (
                    goals.map((goal) => (
                        <div key={goal._id} className="bg-white p-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{goal.goalName}</h3>
                                    {goal.description && <p className="text-gray-600 mt-2">{goal.description}</p>}
                                    <p className="text-sm text-gray-500 mt-2">
                                        Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEditGoal(goal)} className="bg-yellow-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDeleteGoal(goal._id)} className="bg-red-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                        Delete
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-4 border-t pt-4">
                                <h4 className="text-lg font-semibold text-gray-700 mb-2">Sub-Goals</h4>
                                {goal.subGoals && goal.subGoals.length > 0 ? (
                                    <ul className="space-y-2">
                                        {goal.subGoals.map(subGoal => (
                                            <li key={subGoal._id} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
                                                <div className="flex items-center">
                                                    <input 
                                                        type="checkbox"
                                                        checked={subGoal.progress === 100}
                                                        onChange={() => handleToggleSubGoal(subGoal._id, goal._id)}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                                                    />
                                                    <span className={`text-gray-800 ${subGoal.progress === 100 ? 'line-through text-gray-500' : ''}`}>{subGoal.subGoalName}</span>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleEditSubGoal(subGoal, goal._id)} className="text-sm text-blue-500 hover:text-blue-700">Edit</button>
                                                    <button onClick={() => handleDeleteSubGoal(subGoal._id, goal._id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No sub-goals yet. Add one below!</p>
                                )}

                                <button 
                                    onClick={() => {
                                        setSubGoalParentId(goal._id);
                                        setShowSubGoalForm(true);
                                        setSubGoalName('');
                                        setIsEditingSubGoal(false);
                                    }} 
                                    className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                    + Add Sub-Goal
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Main Goal Delete Confirmation Pop-up */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm mx-auto">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirm Deletion</h3>
                        <p className="mb-6 text-gray-600">Are you sure you want to delete this goal? This action cannot be undone.</p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={confirmDelete} className="bg-red-500 text-white font-semibold py-2 px-6 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                Delete
                            </button>
                            <button onClick={cancelDelete} className="bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Sub-Goal Form Pop-up */}
            {showSubGoalForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm mx-auto">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">{isEditingSubGoal ? 'Edit Sub-Goal' : 'Add New Sub-Goal'}</h3>
                        <form onSubmit={isEditingSubGoal ? handleUpdateSubGoal : handleAddSubGoal} className="flex flex-col space-y-4">
                            <input
                                type="text"
                                placeholder="Sub-goal name"
                                value={subGoalName}
                                onChange={(e) => setSubGoalName(e.target.value)}
                                required
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 placeholder-black text-black"
                            />
                            <div className="flex justify-center space-x-4">
                                <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    {isEditingSubGoal ? 'Update' : 'Add'}
                                </button>
                                <button type="button" onClick={handleCancelSubGoalForm} className="bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sub-Goal Delete Confirmation Pop-up */}
            {showSubGoalDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm mx-auto">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirm Deletion</h3>
                        <p className="mb-6 text-gray-600">Are you sure you want to delete this sub-goal? This action cannot be undone.</p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={confirmDeleteSubGoal} className="bg-red-500 text-white font-semibold py-2 px-6 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                Delete
                            </button>
                            <button onClick={cancelDeleteSubGoal} className="bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}