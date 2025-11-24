const mongoose = require('mongoose');

const QuickActionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  category: { type: String, default: 'Other' }
});

module.exports = mongoose.model('QuickAction', QuickActionSchema);