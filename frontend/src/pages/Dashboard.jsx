import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import ExpenseForm from '../components/ExpenseForm';
import NavBar from '../components/NavBar';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  // Simplified summary state to hold only the totals for the current view
  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, balance: 0 });
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const CATS = ['All','Food','Travel','Groceries','Friend','Bills','Entertainment','Health','Other'];

  async function fetchList() {
    setLoading(true);
    try {
      // 1. Fetch transactions for the selected category (or all if 'All' is selected)
      // The 'category' state is used here for filtering the request.
      const q = category === 'All' ? '' : `?category=${encodeURIComponent(category)}&limit=100&page=${page}`;
      const res = await api.get(`/expenses${q}`);
      const fetchedExpenses = res.data.items || res.data; 
      setExpenses(fetchedExpenses);
      
      // 2. Calculate summary (balance, credit, debit) from the filtered list 
      // This ensures the summary always reflects the transactions currently displayed.
      let totalCredit = 0;
      let totalDebit = 0;
      
      fetchedExpenses.forEach(exp => {
        const amount = Number(exp.amount);
        if (exp.type === 'credit') {
          totalCredit += amount;
        } else if (exp.type === 'debit') {
          totalDebit += amount;
        }
      });

      // Update the summary state for the displayed filter
      setSummary({ totalCredit, totalDebit, balance: totalCredit - totalDebit }); 
      
    } catch (err) {
      console.error(err);
      setExpenses([]); 
      setSummary({ totalCredit: 0, totalDebit: 0, balance: 0 }); 
    } finally {
      setLoading(false);
    }
  }

  // Use useEffect to run fetchList on mount and whenever category or page changes
  useEffect(() => {
    fetchList();
  }, [category, page]); //

  // Function to run after adding a new item
  function onAdded(item) {
    // Re-fetch the list and recalculate the summary for the current view
    fetchList(); 
  }

  // Handle category change (just update state, useEffect handles the fetch)
  const handleCategoryChange = (e) => {
    setCategory(e.target.value); 
    setPage(1); // Reset page on category change
  };

  return (
    <div>
      <NavBar />
      <div className="container" style={{ display:'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        <div>
          <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h2>Dashboard</h2>
              {/* Display summary for the currently filtered view */}
              <div className="small-muted">Balance: <strong>{summary.balance?.toFixed(2)}</strong> | Credit: {summary.totalCredit?.toFixed(2)} | Debit: {summary.totalDebit?.toFixed(2)}</div>
            </div>

            <div>
              <select value={category} onChange={handleCategoryChange}>
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
            {/* Pagination controls for larger lists would go here, using the 'page' state */}
          </div>
        </div>

        <aside>
          <ExpenseForm onAdded={onAdded} />
          {/* The Categories summary section has been removed as requested by the user. */}
        </aside>
      </div>
    </div>
  );
}