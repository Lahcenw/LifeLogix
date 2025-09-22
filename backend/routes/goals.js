const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');

// @route   POST /api/goals
// @desc    Create a new goal log
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { goalName, description, targetDate, subGoals } = req.body;

        const newGoal = new Goal({
            user: req.user.id,
            goalName,
            description,
            targetDate,
            subGoals,
        });

        const goal = await newGoal.save();
        res.json(goal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/goals
// @desc    Get all goals logs for the authenticated user
// @access  Private
router.get('/',auth, async (req, res) => {
    try{
        const goals = await Goal.find({
            user: req.user.id }).sort({ date: -1});
            res.json(goals);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
    }
});

// @route   PUT /api/goals
// @desc    Update a goal log
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const goal= await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({msg: 'Goal not found'});
        }
        //Ensure user owns the goal
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({msg: 'User not authorized'})
        }
        const { goalName, description, targetDate, subGoals } = req.body;
        goal.goalName = goalName || goal.goalName;
        goal.description = description || goal.description;
        goal.targetDate = targetDate || goal.targetDate;
        goal.subGoals = subGoals || goal.subGoals;

        await goal.save();
        res.json(goal);

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    } 
});

// @route   DELETE api/goal
// @desc    Delete a goal log
// @access  Private
router.delete('/:id', auth, async (req,res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) {
            return res.status(404).json({msg: 'Goal not found'});
        }
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({msg: 'User not authorized'});
        }

        await goal.deleteOne();
        res.json({msg: 'Goal removed successfully'})
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/goals/:goalId/subgoals
// @desc    Add a new sub-goal to a specific main goal
// @access  Private
router.post('/:goalId/subgoals', auth, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.goalId);

        if (!goal) {
            return res.status(404).json({ msg: 'Main Goal not found' });
        }

        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const { name } = req.body; // Frontend sends 'name'
        
        // Match the frontend's 'name' with the backend's 'subGoalName'
        const newSubGoal = {
            subGoalName: name,
            progress: 0,
        };
        
        goal.subGoals.push(newSubGoal);
        await goal.save();

        const addedSubGoal = goal.subGoals[goal.subGoals.length - 1];

        res.json(addedSubGoal);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Main Goal not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/goals/:goalId/subgoals/:subGoalId/toggle
// @desc    Toggle a sub-goal's completion status
// @access  Private
router.put('/:goalId/subgoals/:subGoalId/toggle', auth, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.goalId);
        if (!goal) {
            return res.status(404).json({ msg: 'Main Goal not found' });
        }
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const subGoal = goal.subGoals.id(req.params.subGoalId);
        if (!subGoal) {
            return res.status(404).json({ msg: 'Sub-goal not found' });
        }

        subGoal.progress = subGoal.progress === 100 ? 0 : 100; // Toggle progress between 0 and 100
        await goal.save();
        res.json(subGoal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/goals/:goalId/subgoals/:subGoalId
// @desc    Delete a sub-goal
// @access  Private
// @route   DELETE /api/goals/:goalId/subgoals/:subGoalId
// @desc    Delete a sub-goal
// @access  Private
router.delete('/:goalId/subgoals/:subGoalId', auth, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.goalId);
        if (!goal) {
            return res.status(404).json({ msg: 'Main Goal not found' });
        }
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const subGoal = goal.subGoals.id(req.params.subGoalId);
        if (!subGoal) {
            return res.status(404).json({ msg: 'Sub-goal not found' });
        }
        
        // Correct way to remove a subdocument from an array in Mongoose 5.x and later
        await goal.subGoals.pull({ _id: req.params.subGoalId });
        await goal.save();
        
        res.json({ msg: 'Sub-goal removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/goals/:goalId/subgoals/:subGoalId
// @desc    Update a sub-goal
// @access  Private
router.put('/:goalId/subgoals/:subGoalId', auth, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.goalId);
        if (!goal) {
            return res.status(404).json({ msg: 'Main Goal not found' });
        }
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const subGoal = goal.subGoals.id(req.params.subGoalId);
        if (!subGoal) {
            return res.status(404).json({ msg: 'Sub-goal not found' });
        }
        
        const { name } = req.body;
        subGoal.subGoalName = name;

        await goal.save();
        res.json(subGoal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;