const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const Joi = require('joi');
const mongoose = require('mongoose');

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

// Create
router.post('/', auth, async (req, res) => {
  const { error, value } = expenseSchema.validate(req.body);
  if (error) return res.status(400).json({ errors: error.details.map(d => d.message) });
  const expense = new Expense({ ...value, user: req.user.id });
  await expense.save();
  res.status(201).json(expense);
});

// Read list with Date Filters
router.get('/', auth, async (req, res) => {
  const { category, type, q, startDate, endDate, page = 1, limit = 100, sort = '-date' } = req.query;
  
  const filter = { user: new mongoose.Types.ObjectId(req.user.id) };
  
  if (category && category !== 'All') filter.category = category;
  if (type) filter.type = type;
  
  // Date Range Logic
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (q) {
    filter.$or = [
      { title: new RegExp(q, 'i') },
      { notes: new RegExp(q, 'i') },
      { friendName: new RegExp(q, 'i') }
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Expense.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Expense.countDocuments(filter)
  ]);

  res.json({ items, total, page: Number(page), limit: Number(limit) });
});

// Summary Route (Updated to respect date range if needed, keeping simple for now)
router.get('/summary', auth, async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  const match = { user: new mongoose.Types.ObjectId(userId) };
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const totals = await Expense.aggregate([
    { $match: match },
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

// Update & Delete (unchanged logic, just ensuring exports)
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const updated = await Expense.findOneAndUpdate({ _id: id, user: req.user.id }, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const removed = await Expense.findOneAndDelete({ _id: id, user: req.user.id });
  if (!removed) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;