import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import NavBar from '../components/NavBar';
import SummaryCards from '../components/SummaryCards';
import ExpenseChart from '../components/ExpenseChart';
import TransactionList from '../components/TransactionList';
import BudgetWidget from '../components/BudgetWidget';
import GoalWidget from '../components/GoalWidget';
import QuickActionWidget from '../components/QuickActionWidget';

// --- DATE PICKER IMPORTS ---
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, balance: 0 });
  const [budget, setBudget] = useState(0);
  const [goals, setGoals] = useState([]);
  
  const [filterCategory, setFilterCategory] = useState('All');
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const [form, setForm] = useState({ 
    title: '', amount: '', type: 'debit', category: 'Food', 
    date: new Date(), 
    paymentMethod: '', tags: '', notes: '' 
  });

  const CATS = ['All', 'Food','Travel','Groceries','Friend','Bills','Entertainment','Health','Other'];

  useEffect(() => { fetchData(); }, [filterCategory, dateRange]);

  async function fetchData() {
    try {
      let q = `/expenses?limit=200`;
      if(filterCategory !== 'All') q += `&category=${encodeURIComponent(filterCategory)}`;
      if(dateRange.start) q += `&startDate=${dateRange.start.toISOString().split('T')[0]}`;
      if(dateRange.end) q += `&endDate=${dateRange.end.toISOString().split('T')[0]}`;

      const [expRes, budgetRes, goalsRes] = await Promise.all([
        api.get(q),
        api.get('/budgets'),
        api.get('/goals')
      ]);

      const list = expRes.data.items || expRes.data;
      setExpenses(list);
      setBudget(budgetRes.data.amount);
      setGoals(goalsRes.data);
      
      let c = 0, d = 0;
      list.forEach(i => i.type === 'credit' ? c += i.amount : d += i.amount);
      setSummary({ totalCredit: c, totalDebit: d, balance: c - d });

    } catch (err) { console.error('Data load failed', err); }
  }

  async function addTransaction(e) {
    e.preventDefault();
    try {
      const payload = { 
        ...form, 
        amount: Number(form.amount), 
        tags: form.tags ? form.tags.split(',') : [],
        date: form.date.toISOString()
      };
      await api.post('/expenses', payload);
      setForm({ ...form, title: '', amount: '' }); 
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

  async function handleQuickAction(action) {
    try {
      await api.post('/expenses', {
        title: action.title,
        amount: action.amount,
        type: action.type,
        category: action.category || 'Other',
        date: new Date().toISOString()
      });
      fetchData();
    } catch (e) { alert('Failed to execute quick action'); }
  }

  return (
    <div className="site">
      <NavBar />
      <main>
        <section className="panel" id="section-hero">
          <div className="content-container dashboard-grid-2-col">
            <div className="glass-effect interactive-card hero-left" style={{padding:'40px', display:'flex', flexDirection:'column', gap:'20px'}}>
              {/* Z-INDEX FIX: Added position relative and zIndex: 20 to ensure dropdown covers the cards below */}
              <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'10px', position: 'relative', zIndex: 20}}>
                <h2>Operational Overview</h2>
                
                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                  <DatePicker 
                    selected={dateRange.start} 
                    onChange={(date) => setDateRange({...dateRange, start: date})} 
                    placeholderText="Start Date"
                    className="custom-datepicker"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <span className="small-muted">-</span>
                  <DatePicker 
                    selected={dateRange.end} 
                    onChange={(date) => setDateRange({...dateRange, end: date})} 
                    placeholderText="End Date"
                    className="custom-datepicker"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
              </div>
              
              <SummaryCards summary={summary} />
              <ExpenseChart expenses={expenses} />
            </div>

            <div className="widgets-area" style={{display:'flex', flexDirection:'column', gap:'30px'}}>
              <BudgetWidget budget={budget} onUpdate={val => setBudget(val)} />
              <QuickActionWidget onExecute={handleQuickAction} />
            </div>
          </div>
        </section>

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
                <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
                  <input style={{flex:1}} value={form.paymentMethod} onChange={e=>setForm({...form, paymentMethod:e.target.value})} placeholder="Payment Method (UPI, Card)" />
                  <div style={{flex:1}}>
                    <DatePicker 
                      selected={form.date} 
                      onChange={(date) => setForm({...form, date: date})} 
                      dateFormat="yyyy/MM/dd"
                      className="custom-datepicker"
                      wrapperClassName="date-picker-full-width"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </div>
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