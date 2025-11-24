import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function QuickActionWidget({ onExecute }) {
  const [actions, setActions] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state for new action
  const [form, setForm] = useState({ title: '', amount: '', type: 'debit', category: 'Food' });
  
  const CATS = ['Food','Travel','Groceries','Friend','Bills','Entertainment','Health','Other'];

  useEffect(() => { fetchActions(); }, []);

  async function fetchActions() {
    try {
      const res = await api.get('/quick-actions');
      setActions(res.data);
    } catch (e) { console.error(e); }
  }

  async function createAction(e) {
    e.preventDefault();
    try {
      await api.post('/quick-actions', { ...form, amount: Number(form.amount) });
      setIsAdding(false);
      setForm({ title: '', amount: '', type: 'debit', category: 'Food' });
      fetchActions();
    } catch (e) { alert('Failed to create shortcut'); }
  }

  async function deleteAction(id, e) {
    e.stopPropagation();
    if(!confirm('Remove this shortcut?')) return;
    try {
      await api.delete(`/quick-actions/${id}`);
      fetchActions();
    } catch (e) { alert('Delete failed'); }
  }

  return (
    <div className="glass-effect interactive-card" style={{padding:'30px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--glass-border)', paddingBottom:'15px'}}>
        <h4 style={{margin:0}}>Quick Actions</h4>
        <button className="btn ghost" style={{fontSize:'12px', padding:'4px 8px'}} onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : '+ New'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={createAction} style={{marginTop:'15px', paddingBottom:'15px', borderBottom:'1px solid var(--glass-border)'}}>
          <input placeholder="Label (e.g. Coffee)" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
          <div style={{display:'flex', gap:'5px'}}>
            <input type="number" placeholder="Amt" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} required style={{width:'80px'}} />
            <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} style={{flex:1}}>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn primary" style={{width:'100%'}}>Save Shortcut</button>
        </form>
      )}

      <div style={{display:'flex', flexWrap:'wrap', gap:'10px', marginTop:'14px'}}>
        {actions.length === 0 && !isAdding && <p className="small-muted">No shortcuts set.</p>}
        
        {actions.map(action => (
          <div 
            key={action._id} 
            className="glass-effect" 
            onClick={() => onExecute(action)}
            style={{
              padding:'10px 14px', 
              cursor:'pointer', 
              display:'flex', 
              alignItems:'center', 
              gap:'8px',
              border: '1px solid var(--glass-border)',
              transition: '0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--q-blue)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
          >
            <div>
              <div style={{fontWeight:600, fontSize:'13px'}}>{action.title}</div>
              <div className="small-muted" style={{fontSize:'11px'}}>
                {action.type === 'debit' ? '-' : '+'}₹{action.amount}
              </div>
            </div>
            <div 
              onClick={(e) => deleteAction(action._id, e)}
              style={{marginLeft:'5px', color:'var(--q-text-muted)', fontSize:'14px', padding:'2px'}}
            >
              ×
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}