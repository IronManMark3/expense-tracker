import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import ExpenseForm from '../components/ExpenseForm';
import NavBar from '../components/NavBar';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ summary: {}, totalCredit: 0, totalDebit: 0, balance: 0 });
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const CATS = ['All','Food','Travel','Groceries','Friend','Bills','Entertainment','Health','Other'];

  useEffect(()=>{ fetchSummary(); fetchList(); }, []);

  async function fetchSummary() {
    try {
      const res = await api.get('/expenses/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchList(keepPage=false) {
    setLoading(true);
    try {
      const q = category === 'All' ? '' : `?category=${encodeURIComponent(category)}&limit=100&page=${page}`;
      const res = await api.get(`/expenses${q}`);
      setExpenses(res.data.items || res.data); // support both shapes
      if (!keepPage) setPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function onAdded(item) {
    // refresh both list and summary
    fetchSummary();
    fetchList(true);
  }

  return (
    <div>
      <NavBar />
      <div className="container" style={{ display:'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        <div>
          <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h2>Dashboard</h2>
              <div className="small-muted">Balance: <strong>{summary.balance?.toFixed(2)}</strong> | Credit: {summary.totalCredit?.toFixed(2)} | Debit: {summary.totalDebit?.toFixed(2)}</div>
            </div>

            <div>
              <select value={category} onChange={e=>{ setCategory(e.target.value); setPage(1); fetchList(); }}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </header>

          <div style={{ marginTop: 12 }}>
            {loading ? <div>Loading...</div> : (
              <ul className="expense-list">
                {expenses.length === 0 && <li className="expense-item">No transactions</li>}
                {expenses.map(x => (
                  <li className="expense-item" key={x._id}>
                    <div>
                      <div style={{ fontWeight:700 }}>{x.title}</div>
                      <div className="small-muted">{x.category} · {x.paymentMethod || '—'} · {new Date(x.date).toLocaleString()}</div>
                      {x.friendName && <div className="small-muted">Friend: {x.friendName}</div>}
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ color: x.type === 'debit' ? '#e11d48' : '#059669', fontWeight:700 }}>
                        {x.type === 'debit' ? '-' : '+'}{x.amount} {x.currency}
                      </div>
                      <div className="small-muted">{x.tags?.join?.(', ')}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside>
          <ExpenseForm onAdded={onAdded} />
          <div className="container" style={{ marginTop: 8 }}>
            <h4>Categories</h4>
            <ul style={{ listStyle:'none', padding:0 }}>
              {Object.entries(summary.summary || {}).map(([cat, vals]) => (
                <li key={cat} style={{ padding:8, borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontWeight:700 }}>{cat}</div>
                      <div className="small-muted">{vals.count || 0} transactions</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div className="small-muted">Credit: {vals.credit || 0}</div>
                      <div className="small-muted">Debit: {vals.debit || 0}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
