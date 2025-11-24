const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');
const Joi = require('joi');

// Get current budget
router.get('/', auth, async (req, res) => {
  let budget = await Budget.findOne({ user: req.user.id });
  if (!budget) budget = { amount: 0 }; // Default if not set
  res.json(budget);
});

// Set/Update budget
router.post('/', auth, async (req, res) => {
  const schema = Joi.object({ amount: Joi.number().min(0).required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const budget = await Budget.findOneAndUpdate(
    { user: req.user.id },
    { amount: value.amount },
    { new: true, upsert: true } // Create if doesn't exist
  );
  res.json(budget);
});

module.exports = router;