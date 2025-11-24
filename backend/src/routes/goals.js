const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const Joi = require('joi');

const goalSchema = Joi.object({
  name: Joi.string().required(),
  target: Joi.number().positive().required(),
  saved: Joi.number().min(0).optional()
});

// Get all goals
router.get('/', auth, async (req, res) => {
  const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(goals);
});

// Create goal
router.post('/', auth, async (req, res) => {
  const { error, value } = goalSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const goal = new Goal({ ...value, user: req.user.id });
  await goal.save();
  res.status(201).json(goal);
});

// Update goal (allocate funds)
router.put('/:id', auth, async (req, res) => {
  const { saved } = req.body;
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { saved },
    { new: true }
  );
  res.json(goal);
});

// Delete goal
router.delete('/:id', auth, async (req, res) => {
  await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.json({ message: 'Deleted' });
});

module.exports = router;