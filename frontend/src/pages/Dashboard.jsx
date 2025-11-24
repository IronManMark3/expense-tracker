import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import NavBar from '../components/NavBar';

export default function Dashboard() {
  // --- STATE ---
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, balance: 0 });
  
  // Filter State
  const [filterCategory, setFilterCategory] = useState('All');

  // Form State
  const [form, setForm] = useState({ 
    title: '', 
    amount: '', 
    type: 'debit', 
    category: 'Food',
    date: new Date().toISOString().slice(0,10),
    paymentMethod: '',
    tags: '',
    notes: ''
  });
  
  // Local Storage Features (Budget & Goals - Client Side for now)
  const [budget, setBudget] = useState(() => Number(localStorage.getItem('exp_budget')) || 50000);
  const [goals, setGoals] = useState(() => JSON.parse(localStorage.getItem('exp_goals')) || []);
  const [modalOpen, setModalOpen] = useState(null); 
  const [modalInput, setModalInput] = useState('');
  const [goalName, setGoalName] = useState('');

  const CATS = ['All', 'Food','Travel','Groceries','Friend','Bills','Entertainment','Health','Other'];

  // --- EFFECTS ---
  // Fetch list whenever the category filter changes
  useEffect(() => { fetchList(); }, [filterCategory]);
  
  useEffect(() => { localStorage.setItem('exp_budget', budget); }, [budget]);
  useEffect(() => { localStorage.setItem('exp_goals', JSON.stringify(goals)); }, [goals]);

  // --- API ACTIONS ---
  async function fetchList() {
    try {
      // Build query string based on filter
      let query = '/expenses?limit=100';
      if (filterCategory !== 'All') {
        query += `&category=${encodeURIComponent(filterCategory)}`;
      }

      const res = await api.get(query);
      const list = res.data.items || res.data;
      setExpenses(list);
      
      // Note: Summary should ideally come from backend, but for now we calc it from the list
      // or fetch a separate summary endpoint if you want global totals regardless of filter
      calcSummary(list); 
    } catch (err) { console.error(err); }
  }

  async function addTransaction(e) {
    e.preventDefault();
    try {
      if(!form.title || !form.amount) return;
      
      const payload = {
        ...form,
        amount: Number(form.amount),
        tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : []
      };

      await api.post('/expenses', payload);
      
      setForm({ 
        title: '', amount: '', type: 'debit', category: 'Food', 
        date: new Date().toISOString().slice(0,10), 
        paymentMethod: '', tags: '', notes: '' 
      });
      
      // If the new item matches current filter (or filter is All), refresh list
      if (filterCategory === 'All' || filterCategory === form.category) {
        fetchList();
      }
      
      document.getElementById('section-transactions').scrollIntoView({behavior:'smooth'});
    } catch (err) { alert('Failed to log transfer'); }
  }

  async function deleteTxn(id) {
    if(!window.confirm('Permanently delete this entry?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchList();
    } catch (err) { alert('Delete failed'); }
  }

  // --- HELPERS ---
  function calcSummary(list) {
    let c = 0, d = 0;
    list.forEach(i => i.type === 'credit' ? c += i.amount : d += i.amount);
    setSummary({ totalCredit: c, totalDebit: d, balance: c - d });
  }

  function currency(v) { return '₹' + Number(v).toLocaleString('en-IN'); }

  function exportJSON() {
    const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(expenses, null, 2));
    const a = document.createElement('a');
    a.href = str; a.download = "expensio-log.json";
    a.click();
  }

  // --- GOAL / BUDGET HANDLERS ---
  function handleBudgetSubmit(e) {
    e.preventDefault();
    setBudget(Number(modalInput));
    setModalOpen(null);
  }

  function handleGoalSubmit(e) {
    e.preventDefault();
    setGoals([...goals, { id: Date.now(), name: goalName, target: Number(modalInput), saved: 0 }]);
    setModalOpen(null); setGoalName(''); setModalInput('');
  }

  function allocateToGoal(id, amt) {
    setGoals(goals.map(g => g.id === id ? { ...g, saved: g.saved + amt } : g));
  }

  async function quickAdd(title, amt, type) {
    try {
      await api.post('/expenses', { title, amount: amt, type, category: 'Other' });
      fetchList();
    } catch(e){}
  }

  return (
    <div className="site">
      <NavBar />
      <main>
        {/* HERO */}
        <section className="panel" id="section-hero">
          <div className="content-container dashboard-grid-2-col">
            <div className="glass-effect interactive-card hero-left" style={{padding:'40px', height:'100%'}}>
              <h2>Operational Overview: Real-Time Flow.</h2>
              <p className="small-muted">System metrics are validated against the current fiscal cycle.</p>
              
              <div className="overview-grid">
                <div className="stat glass-effect interactive-card" style={{borderLeft:'3px solid var(--q-blue)'}}>
                  <div className="small-muted"><span className="stat-icon">💳</span> Net Balance</div>
                  <div className="value">{currency(summary.balance)}</div>
                </div>
                <div className="stat glass-effect interactive-card" style={{borderLeft:'3px solid var(--q-success)'}}>
                  <div className="small-muted"><span className="stat-icon">▲</span> Inflow</div>
                  <div className="value" style={{color:'var(--q-success)'}}>{currency(summary.totalCredit)}</div>
                </div>
                <div className="stat glass-effect interactive-card" style={{borderLeft:'3px solid var(--q-danger)'}}>
                  <div className="small-muted"><span className="stat-icon">▼</span> Outflow</div>
                  <div className="value" style={{color:'var(--q-danger)'}}>{currency(summary.totalDebit)}</div>
                </div>
              </div>

              <div style={{marginTop:'40px', display:'flex', gap:'16px'}}>
                <button className="btn primary" onClick={()=>document.getElementById('section-add').scrollIntoView({behavior:'smooth'})}>Log Transfer</button>
                <button className="btn ghost" onClick={()=>document.getElementById('section-transactions').scrollIntoView({behavior:'smooth'})}>View Ledger</button>
              </div>
            </div>

            <div className="widgets-area" style={{display:'flex', flexDirection:'column', gap:'30px'}}>
              <div className="glass-effect interactive-card" style={{padding:'30px'}}>
                <div style={{borderBottom:'1px solid var(--glass-border)', paddingBottom:'15px'}}>
                  <h4 style={{margin:0}}>Quick Deployment</h4>
                  <p className="small-muted" style={{marginTop:'5px'}}>Pre-configured actions.</p>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'14px'}}>
                  <button className="btn ghost" onClick={()=>quickAdd('Standard Resource Deposit', 50000, 'credit')} style={{fontSize:'14px', padding:'10px'}}>+ Resource INFLOW</button>
                  <button className="btn ghost" onClick={()=>quickAdd('Secure Asset Relocation', 15000, 'debit')} style={{fontSize:'14px', padding:'10px'}}>- Asset OUTFLOW</button>
                </div>
              </div>

              <div className="glass-effect interactive-card" style={{padding:'30px', flexGrow:1}}>
                <h4 style={{margin:0}}>Budget Module</h4>
                <div style={{marginTop:'10px'}}>
                  <div className="small-muted">Monthly Hard Limit</div>
                  <div className="value" style={{fontSize:'32px', fontWeight:900, color:'var(--q-danger)'}}>{currency(budget)}</div>
                  <div style={{marginTop:'20px'}}>
                    <button className="btn primary" onClick={()=>{setModalOpen('budget'); setModalInput(budget);}} style={{width:'100%'}}>Set Limit</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSACTIONS */}
        <section className="panel" id="section-transactions">
          <div className="content-container dashboard-grid-2-col">
            <div className="panel-left">
              <div className="glass-effect" style={{padding:'40px'}}>
                
                {/* HEADER WITH FILTER */}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--glass-border)', paddingBottom:'20px'}}>
                  <div>
                    <div className="small-muted">CLASSIFIED LEDGER</div>
                    <div style={{fontWeight:700, fontSize:'28px', marginTop:'5px'}}>{expenses.length} entries</div>
                  </div>
                  <div style={{width:'150px'}}>
                    <select 
                      value={filterCategory} 
                      onChange={(e) => setFilterCategory(e.target.value)}
                      style={{padding:'8px', fontSize:'14px', background:'rgba(0,0,0,0.3)'}}
                    >
                      {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* LIST */}
                <div style={{maxHeight:'60vh', overflowY:'auto', marginTop:'20px'}}>
                  {expenses.length === 0 && <div className="small-muted" style={{textAlign:'center', padding:'20px'}}>No records found for this category.</div>}
                  
                  {expenses.map(t => (
                    <div key={t._id} className="txn interactive-card">
                      <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
                        <div className={`tag ${t.type === 'credit' ? 'inflow' : 'outflow'}`}>{t.type === 'credit' ? 'IN' : 'OUT'}</div>
                        <div>
                          <div style={{fontWeight:600}}>{t.title}</div>
                          <div className="small-muted">{new Date(t.date).toLocaleDateString()} • {t.category} • {t.paymentMethod || 'Cash'}</div>
                        </div>
                      </div>
                      <div className={`txn-amount ${t.type === 'credit' ? 'inflow' : 'outflow'}`} style={{fontWeight:800, fontSize:'20px'}}>
                        {t.type === 'credit' ? '+' : '-'}{currency(t.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="widgets">
              <div className="glass-effect interactive-card" style={{padding:'30px', marginBottom:'30px'}}>
                <h4 style={{margin:0}}>Target Fund Allocation</h4>
                <div style={{marginTop:'16px'}}>
                  {goals.map(g => {
                    const pct = Math.min(100, Math.round((g.saved/g.target)*100));
                    return (
                      <div key={g.id} className="glass-effect" style={{padding:'15px', marginBottom:'10px'}}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                          <div style={{fontWeight:700}}>{g.name}</div>
                          <div className="small-muted">{pct}%</div>
                        </div>
                        <div className="small-muted">{currency(g.saved)} / {currency(g.target)}</div>
                        <div style={{marginTop:'10px', display:'flex', gap:'5px'}}>
                          <button className="btn ghost" style={{padding:'5px', fontSize:'12px'}} onClick={()=>allocateToGoal(g.id, 1000)}>+1k</button>
                          <button className="btn ghost" style={{padding:'5px', fontSize:'12px'}} onClick={()=>allocateToGoal(g.id, 5000)}>+5k</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{marginTop:'14px'}}>
                  <button className="btn primary" onClick={()=>{setModalOpen('goal'); setModalInput('');}} style={{width:'100%'}}>Create Target</button>
                </div>
              </div>

              <div className="glass-effect interactive-card" style={{padding:'30px'}}>
                <h4 style={{margin:0}}>Log Management</h4>
                <div style={{marginTop:'14px', maxHeight:'25vh', overflowY:'auto'}}>
                  {expenses.slice(0, 10).map(t => (
                    <div key={t._id} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                      <div className="small-muted" style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'150px'}}>{t.title}</div>
                      <button className="btn ghost" style={{padding:'4px 8px', fontSize:'10px'}} onClick={()=>deleteTxn(t._id)}>DEL</button>
                    </div>
                  ))}
                </div>
                <button className="btn ghost" onClick={exportJSON} style={{width:'100%', marginTop:'20px'}}>Export JSON</button>
              </div>
            </aside>
          </div>
        </section>

        {/* ADD SECTION */}
        <section className="panel" id="section-add">
          <div className="content-container dashboard-grid-2-col">
            <div className="panel-left">
              <div className="glass-effect interactive-card" style={{padding:'40px'}}>
                <h3 style={{margin:0}}>EXECUTE NEW TRANSFER LOG</h3>
                <p className="small-muted" style={{marginTop:'6px'}}>Ensure accurate classification.</p>
                
                <form onSubmit={addTransaction} style={{marginTop:'30px'}}>
                  <label className="small-muted">DESCRIPTION</label>
                  <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="e.g. Server Maintenance" required />
                  
                  <div style={{marginTop:'20px', display:'flex', gap:'20px'}}>
                    <div style={{flex:1}}>
                      <label className="small-muted">AMOUNT</label>
                      <input type="number" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} placeholder="0" required />
                    </div>
                    <div style={{width:'180px'}}>
                      <label className="small-muted">TYPE</label>
                      <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
                        <option value="debit">OUTFLOW (-)</option>
                        <option value="credit">INFLOW (+)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{marginTop:'20px', display:'flex', gap:'20px'}}>
                    <div style={{flex:1}}>
                      <label className="small-muted">CATEGORY</label>
                      <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
                        {CATS.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{flex:1}}>
                      <label className="small-muted">PAYMENT METHOD</label>
                      <input value={form.paymentMethod} onChange={e=>setForm({...form, paymentMethod:e.target.value})} placeholder="UPI, Cash..." />
                    </div>
                  </div>

                  <div style={{marginTop:'20px'}}>
                    <label className="small-muted">TAGS</label>
                    <input value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})} placeholder="Comma separated (e.g. personal, urgent)" />
                  </div>

                  <div style={{marginTop:'20px'}}>
                    <label className="small-muted">NOTES</label>
                    <input value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} placeholder="Additional details..." />
                  </div>

                  <label className="small-muted" style={{marginTop:'20px', display:'block'}}>DATE</label>
                  <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
                  
                  <button className="btn primary" type="submit" style={{width:'100%', marginTop:'30px', padding:'18px', fontSize:'18px'}}>EXECUTE & VALIDATE</button>
                </form>
              </div>
            </div>
            
            <aside className="widgets">
              <div className="glass-effect interactive-card" style={{padding:'30px'}}>
                <h4 style={{margin:0}}>Security Module Analysis</h4>
                <div id="aiBox2" style={{marginTop:'15px', borderLeft:`3px solid ${summary.totalDebit > budget ? 'var(--q-danger)' : 'var(--q-blue)'}`, paddingLeft:'15px'}}>
                  <div className="small-muted">System Recommendation</div>
                  <div style={{fontWeight:700, fontSize:'18px', marginTop:'5px', color: summary.totalDebit > budget ? 'var(--q-danger)' : 'var(--q-success)'}}>
                    {summary.totalDebit > budget ? 'BUDGET OVERRUN' : 'HIGH COMPLIANCE'}
                  </div>
                  <p className="small-muted" style={{marginTop:'5px'}}>
                    {summary.totalDebit > budget ? 'Outflow exceeds defined hard limit.' : 'Current logs exhibit typical operational flow.'}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
        
        <section className="panel" style={{minHeight:'20vh', alignItems:'flex-start', padding:'40px 0', textAlign:'center'}}>
           <div style={{width:'100%', margin:'0 auto'}}>
             <h3>Expensio: Operational Integrity Maintained.</h3>
             <div style={{marginTop:'24px'}}>
               <button className="btn primary" onClick={()=>document.getElementById('section-hero').scrollIntoView({behavior:'smooth'})}>Return to Access Point</button>
             </div>
           </div>
        </section>
      </main>

      {/* MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{modalOpen === 'budget' ? 'SET OPERATIONAL LIMIT' : 'CREATE TARGET'}</h3>
            <form onSubmit={modalOpen === 'budget' ? handleBudgetSubmit : handleGoalSubmit} style={{marginTop:'20px'}}>
              {modalOpen === 'goal' && (
                <input placeholder="Target Name" value={goalName} onChange={e=>setGoalName(e.target.value)} required style={{marginBottom:'10px'}} />
              )}
              <input type="number" placeholder="Amount" value={modalInput} onChange={e=>setModalInput(e.target.value)} required />
              <div style={{marginTop:'25px', display:'flex', gap:'15px', justifyContent:'flex-end'}}>
                <button type="button" className="btn ghost" onClick={()=>setModalOpen(null)}>CANCEL</button>
                <button type="submit" className="btn primary">CONFIRM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}