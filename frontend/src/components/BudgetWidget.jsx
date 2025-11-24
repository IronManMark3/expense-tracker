import React, { useState } from 'react';
import api from '../lib/api';

export default function BudgetWidget({ budget, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(budget);

  async function handleUpdate() {
    try {
      const res = await api.post('/budgets', { amount: Number(amount) });
      onUpdate(res.data.amount);
      setIsEditing(false);
    } catch (err) { alert('Failed to update budget'); }
  }

  return (
    <div className="glass-effect interactive-card" style={{padding:'30px', flexGrow:1}}>
      <h4 style={{margin:0}}>Budget Module</h4>
      <div style={{marginTop:'10px'}}>
        <div className="small-muted">Monthly Hard Limit</div>
        {isEditing ? (
          <div style={{marginTop:'10px', display:'flex', gap:'8px'}}>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} autoFocus />
            <button className="btn primary" onClick={handleUpdate}>Save</button>
          </div>
        ) : (
          <>
            <div className="value" style={{fontSize:'32px', fontWeight:900, color:'var(--q-danger)'}}>
              ₹{Number(budget).toLocaleString('en-IN')}
            </div>
            <div style={{marginTop:'20px'}}>
              <button className="btn primary" onClick={() => { setIsEditing(true); setAmount(budget); }} style={{width:'100%'}}>
                Set Limit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}