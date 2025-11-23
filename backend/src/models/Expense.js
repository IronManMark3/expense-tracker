const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  // transaction type: 'debit' = money out, 'credit' = money in
  type: { type: String, enum: ['debit', 'credit'], default: 'debit' },
  category: { type: String, default: 'Other', index: true },
  notes: { type: String },
  paymentMethod: { type: String },
  tags: [{ type: String }],
  // friend-related (when category === 'Friend')
  friendName: { type: String, default: null },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
