const express = require('express');
const router = express.Router();
const QuickAction = require('../models/QuickAction');
const auth = require('../middleware/auth');
const Joi = require('joi');

const schema = Joi.object({
  title: Joi.string().required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('credit', 'debit').required(),
  category: Joi.string().optional()
});

// Get all actions for user
router.get('/', auth, async (req, res) => {
  const actions = await QuickAction.find({ user: req.user.id });
  res.json(actions);
});

// Create new action
router.post('/', auth, async (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const action = new QuickAction({ ...value, user: req.user.id });
  await action.save();
  res.status(201).json(action);
});

// Delete action
router.delete('/:id', auth, async (req, res) => {
  await QuickAction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.json({ message: 'Deleted' });
});

module.exports = router;