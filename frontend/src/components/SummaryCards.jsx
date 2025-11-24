import React from 'react';

export default function SummaryCards({ summary }) {
  const currency = (v) => '₹' + Number(v || 0).toLocaleString('en-IN');

  return (
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
  );
}