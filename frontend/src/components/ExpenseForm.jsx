import React, { useState } from 'react';
import api from '../lib/api';

const CATEGORIES = ['Food','Travel','Groceries','Friend','Bills','Entertainment','Health','Other'];

export default function ExpenseForm({ onAdded }) {
  const [form, setForm] = useState({
    title: '', amount: '', currency: 'INR', type: 'debit', category: 'Food', friendName: '', notes: '', paymentMethod: '', tags: ''
  });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      const res = await api.post('/expenses', payload);
      setForm({ title: '', amount: '', currency: 'INR', type: 'debit', category: 'Food', friendName: '', notes: '', paymentMethod: '', tags: '' });
      onAdded && onAdded(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="container" style={{ marginBottom: 16 }}>
      <h3>Add transaction</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
        <input placeholder="Title (e.g., Lunch at Café)" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
        <input placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} required />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
          <option value="debit">Debit (spent)</option>
          <option value="credit">Credit (received)</option>
        </select>

        <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <input placeholder="Currency" value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})} style={{ width: 100 }} />
      </div>

      {form.category === 'Friend' && (
        <input placeholder="Friend name" value={form.friendName} onChange={e=>setForm({...form, friendName:e.target.value})} style={{ marginTop: 8 }} />
      )}

      <input placeholder="Payment method (UPI/Cash/Card)" value={form.paymentMethod} onChange={e=>setForm({...form, paymentMethod:e.target.value})} style={{ marginTop: 8 }} />
      <input placeholder="Tags (comma separated)" value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})} style={{ marginTop: 8 }} />
      <textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} style={{ marginTop: 8 }} />

      <div style={{ display:'flex', gap:8, marginTop: 10 }}>
        <button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add transaction'}</button>
        <button type="button" className="secondary" onClick={()=>{
          setForm({ title: '', amount: '', currency: 'INR', type: 'debit', category: 'Food', friendName: '', notes: '', paymentMethod: '', tags: '' });
        }}>Reset</button>
      </div>
    </form>
  );
}
