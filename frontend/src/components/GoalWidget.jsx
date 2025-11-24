import React, { useState } from 'react';
import api from '../lib/api';

export default function GoalWidget({ goals, onRefresh }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target: '' });

  async function addGoal(e) {
    e.preventDefault();
    try {
      await api.post('/goals', { name: newGoal.name, target: Number(newGoal.target) });
      setIsAdding(false); setNewGoal({ name: '', target: '' });
      onRefresh();
    } catch (err) { alert('Failed to add goal'); }
  }

  async function allocate(id, currentSaved, amount) {
    try {
      await api.put(`/goals/${id}`, { saved: currentSaved + amount });
      onRefresh();
    } catch (err) { alert('Allocation failed'); }
  }

  async function deleteGoal(id) {
    if(!confirm('Delete goal?')) return;
    await api.delete(`/goals/${id}`);
    onRefresh();
  }

  return (
    <div className="glass-effect interactive-card" style={{padding:'30px', marginBottom:'30px'}}>
      <h4 style={{margin:0}}>Target Fund Allocation</h4>
      
      <div style={{marginTop:'16px'}}>
        {goals.map(g => {
          const pct = Math.min(100, Math.round((g.saved/g.target)*100));
          return (
            <div key={g._id} className="glass-effect" style={{padding:'15px', marginBottom:'10px'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div style={{fontWeight:700}}>{g.name}</div>
                <div className="small-muted">{pct}%</div>
              </div>
              <div className="small-muted">₹{g.saved} / ₹{g.target}</div>
              <div style={{marginTop:'10px', display:'flex', gap:'5px'}}>
                <button className="btn ghost" style={{padding:'5px', fontSize:'12px'}} onClick={()=>allocate(g._id, g.saved, 1000)}>+1k</button>
                <button className="btn ghost" style={{padding:'5px', fontSize:'12px'}} onClick={()=>allocate(g._id, g.saved, 5000)}>+5k</button>
                <button className="btn ghost" style={{padding:'5px', fontSize:'10px', color:'var(--q-danger)', borderColor:'var(--q-danger)'}} onClick={()=>deleteGoal(g._id)}>X</button>
              </div>
            </div>
          )
        })}
      </div>

      {isAdding ? (
        <form onSubmit={addGoal} style={{marginTop:'15px'}}>
          <input placeholder="Goal Name" value={newGoal.name} onChange={e=>setNewGoal({...newGoal, name:e.target.value})} required style={{marginBottom:'8px'}} />
          <input type="number" placeholder="Target Amount" value={newGoal.target} onChange={e=>setNewGoal({...newGoal, target:e.target.value})} required style={{marginBottom:'8px'}} />
          <div style={{display:'flex', gap:'5px'}}>
            <button type="submit" className="btn primary" style={{flex:1}}>Save</button>
            <button type="button" className="btn ghost" onClick={()=>setIsAdding(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div style={{marginTop:'14px'}}>
          <button className="btn primary" onClick={()=>setIsAdding(true)} style={{width:'100%'}}>Create Target</button>
        </div>
      )}
    </div>
  );
}