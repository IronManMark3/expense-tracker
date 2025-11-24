import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import NavBar from '../components/NavBar';
import SummaryCards from '../components/SummaryCards';
import ExpenseChart from '../components/ExpenseChart';
import TransactionList from '../components/TransactionList';
import BudgetWidget from '../components/BudgetWidget';
import GoalWidget from '../components/GoalWidget';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, balance: 0 });
  const [budget, setBudget] = useState(0);
  const [goals, setGoals] = useState([]);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Form
  const [form, setForm] = useState({ 
    title: '', amount: '', type: 'debit', category: 'Food', 
    date: new Date().toISOString().slice(0,10), paymentMethod: '', tags: '', notes: '' 
  });

  const CATS = ['All', 'Food','Travel','Groceries','Friend','Bills','Entertainment','Health','Other'];

  useEffect(() => { 
    fetchData(); 
  }, [filterCategory, dateRange]);

  async function fetchData() {
    try {
      // Build Query
      let q = `/expenses?limit=200`;
      if(filterCategory !== 'All') q += `&category=${encodeURIComponent(filterCategory)}`;
      if(dateRange.start) q += `&startDate=${dateRange.start}`;
      if(dateRange.end) q += `&endDate=${dateRange.end}`;

      const [expRes, budgetRes, goalsRes] = await Promise.all([
        api.get(q),
        api.get('/budgets'),
        api.get('/goals')
      ]);

      const list = expRes.data.items || expRes.data;
      setExpenses(list);
      setBudget(budgetRes.data.amount);
      setGoals(goalsRes.data);
      
      // Calc Summary locally based on filtered list
      let c = 0, d = 0;
      list.forEach(i => i.type === 'credit' ? c += i.amount : d += i.amount);
      setSummary({ totalCredit: c, totalDebit: d, balance: c - d });

    } catch (err) { console.error('Data load failed', err); }
  }

  async function addTransaction(e) {
    e.preventDefault();
    try {
      const payload = { ...form, amount: Number(form.amount), tags: form.tags ? form.tags.split(',') : [] };
      await api.post('/expenses', payload);
      setForm({ ...form, title: '', amount: '' }); // Reset partial
      fetchData();
      document.getElementById('section-transactions').scrollIntoView({behavior:'smooth'});
    } catch (err) { alert('Add failed'); }
  }

  async function deleteTxn(id) {
    if(!confirm('Delete?')) return;
    await api.delete(`/expenses/${id}`);
    fetchData();
  }

  function exportCSV() {
    if (expenses.length === 0) return alert("No data");
    const headers = ["Title", "Amount", "Type", "Category", "Date", "Payment Method"];
    const rows = expenses.map(e => [
      `"${e.title}"`, e.amount, e.type, e.category, new Date(e.date).toISOString().split('T')[0], e.paymentMethod || "-"
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "expensio_report.csv";
    link.click();
  }

  return (
    <div className="site">
      <NavBar />
      <main>
        {/* HERO */}
        <section className="panel" id="section-hero">
          <div className="content-container dashboard-grid-2-col">
            <div className="glass-effect interactive-card hero-left" style={{padding:'40px', display:'flex', flexDirection:'column', gap:'20px'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <h2>Operational Overview</h2>
                {/* Date Filter */}
                <div style={{display:'flex', gap:'8px'}}>
                  <input type="date" onChange={e=>setDateRange({...dateRange, start:e.target.value})} style={{padding:'5px'}} />
                  <input type="date" onChange={e=>setDateRange({...dateRange, end:e.target.value})} style={{padding:'5px'}} />
                </div>
              </div>
              
              <SummaryCards summary={summary} />
              <ExpenseChart expenses={expenses} />
            </div>

            <div className="widgets-area" style={{display:'flex', flexDirection:'column', gap:'30px'}}>
              <BudgetWidget budget={budget} onUpdate={val => setBudget(val)} />
              {/* Quick Add Shortcut Block */}
              <div className="glass-effect interactive-card" style={{padding:'20px'}}>
                <h4>Quick Actions</h4>
                <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                  <button className="btn ghost" onClick={()=>api.post('/expenses', { title:'Food', amount:200, type:'debit', category:'Food'}).then(fetchData)}>+ Lunch (200)</button>
                  <button className="btn ghost" onClick={()=>api.post('/expenses', { title:'Cab', amount:500, type:'debit', category:'Travel'}).then(fetchData)}>+ Cab (500)</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSACTIONS */}
        <section className="panel" id="section-transactions">
          <div className="content-container dashboard-grid-2-col">
            <div className="panel-left">
              <div style={{marginBottom:'20px'}}>
                <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} style={{width:'200px', padding:'10px'}}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <TransactionList expenses={expenses} onDelete={deleteTxn} onExport={exportCSV} />
            </div>

            <aside className="widgets">
              <GoalWidget goals={goals} onRefresh={fetchData} />
              <div className="glass-effect interactive-card" style={{padding:'30px'}}>
                <h4>Security Analysis</h4>
                <div style={{marginTop:'15px', borderLeft:`3px solid ${summary.totalDebit > budget && budget > 0 ? 'var(--q-danger)' : 'var(--q-success)'}`, paddingLeft:'15px'}}>
                  <div style={{fontWeight:700, fontSize:'18px'}}>
                    {summary.totalDebit > budget && budget > 0 ? 'BUDGET OVERRUN' : 'ON TRACK'}
                  </div>
                  <p className="small-muted">
                    {summary.totalDebit > budget && budget > 0 ? 'Spending exceeds set limit.' : 'Spending is within operational parameters.'}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ADD FORM */}
        <section className="panel" id="section-add">
          <div className="content-container" style={{maxWidth:'800px'}}>
            <div className="glass-effect interactive-card" style={{padding:'40px'}}>
              <h3>EXECUTE NEW TRANSFER LOG</h3>
              <form onSubmit={addTransaction} style={{marginTop:'30px', display:'grid', gap:'20px'}}>
                <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
                  <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Description" required />
                  <input type="number" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} placeholder="Amount" required />
                </div>
                <div style={{display:'flex', gap:'20px'}}>
                  <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} style={{flex:1}}>
                    <option value="debit">OUTFLOW (-)</option>
                    <option value="credit">INFLOW (+)</option>
                  </select>
                  <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} style={{flex:1}}>
                    {CATS.filter(c=>c!=='All').map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{display:'flex', gap:'20px'}}>
                  <input value={form.paymentMethod} onChange={e=>setForm({...form, paymentMethod:e.target.value})} placeholder="Payment Method (UPI, Card)" />
                  <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
                </div>
                <input value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})} placeholder="Tags (comma separated)" />
                <button className="btn primary" type="submit" style={{padding:'18px'}}>EXECUTE</button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}