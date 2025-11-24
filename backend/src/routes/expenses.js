const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const Joi = require('joi');
const mongoose = require('mongoose'); // Required for ObjectId

const expenseSchema = Joi.object({
  title: Joi.string().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().optional(),
  type: Joi.string().valid('debit','credit').required(),
  category: Joi.string().optional(),
  notes: Joi.string().allow('').optional(),
  paymentMethod: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  friendName: Joi.string().allow('', null).optional(),
  date: Joi.date().optional()
});

// Create - Saves expense with the logged-in User's ID
router.post('/', auth, async (req, res) => {
  const { error, value } = expenseSchema.validate(req.body);
  if (error) return res.status(400).json({ errors: error.details.map(d => d.message) });
  
  // req.user.id comes from the Auth Middleware
  const expense = new Expense({ ...value, user: req.user.id });
  await expense.save();
  res.status(201).json(expense);
});

// Read list - Loads ONLY the logged-in User's expenses
router.get('/', auth, async (req, res) => {
  const { category, type, q, page = 1, limit = 50, sort = '-date' } = req.query;
  
  // Filter by User ID
  const filter = { user: new mongoose.Types.ObjectId(req.user.id) };
  
  if (category && category !== 'All') filter.category = category;
  if (type) filter.type = type;
  if (q) filter.$or = [
    { title: new RegExp(q, 'i') },
    { notes: new RegExp(q, 'i') },
    { friendName: new RegExp(q, 'i') }
  ];

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Expense.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Expense.countDocuments(filter)
  ]);

  res.json({ items, total, page: Number(page), limit: Number(limit) });
});

// Summary - Aggregates data for the specific user
router.get('/summary', auth, async (req, res) => {
  const userId = req.user.id;

  const totals = await Expense.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = {};
  let totalCredit = 0, totalDebit = 0;
  totals.forEach(t => {
    const cat = t._id.category || 'Other';
    const type = t._id.type;
    summary[cat] = summary[cat] || { credit: 0, debit: 0, count: 0 };
    summary[cat][type] = t.total;
    summary[cat].count += t.count;
    if (type === 'credit') totalCredit += t.total;
    if (type === 'debit') totalDebit += t.total;
  });

  res.json({ summary, totalCredit, totalDebit, balance: totalCredit - totalDebit });
});

// Update
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { error, value } = expenseSchema.validate(req.body);
  if (error) return res.status(400).json({ errors: error.details.map(d => d.message) });
  
  const updated = await Expense.findOneAndUpdate(
    { _id: id, user: req.user.id }, // Ensure user owns this expense
    value, 
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

// Delete
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const removed = await Expense.findOneAndDelete({ _id: id, user: req.user.id });
  if (!removed) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;