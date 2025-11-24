import React from 'react';

export default function TransactionList({ expenses, onDelete, onExport }) {
  const currency = (v) => '₹' + Number(v).toLocaleString('en-IN');

  return (
    <div className="glass-effect" style={{padding:'40px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--glass-border)', paddingBottom:'20px'}}>
        <div className="small-muted">CLASSIFIED LEDGER</div>
        <button className="btn ghost" style={{fontSize:'12px', padding:'6px 12px'}} onClick={onExport}>Export CSV</button>
      </div>
      
      <div style={{maxHeight:'60vh', overflowY:'auto', marginTop:'20px'}}>
        {expenses.length === 0 && <div className="small-muted" style={{textAlign:'center', padding:'20px'}}>No records found.</div>}
        
        {expenses.map(t => (
          <div key={t._id} className="txn interactive-card">
            <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
              <div className={`tag ${t.type === 'credit' ? 'inflow' : 'outflow'}`}>{t.type === 'credit' ? 'IN' : 'OUT'}</div>
              <div>
                <div style={{fontWeight:600}}>{t.title}</div>
                <div className="small-muted">{new Date(t.date).toLocaleDateString()} • {t.category} • {t.paymentMethod || 'Cash'}</div>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div className={`txn-amount ${t.type === 'credit' ? 'inflow' : 'outflow'}`} style={{fontWeight:800, fontSize:'20px'}}>
                {t.type === 'credit' ? '+' : '-'}{currency(t.amount)}
              </div>
              <button className="btn ghost" style={{fontSize:'10px', padding:'2px 6px', marginTop:'4px'}} onClick={() => onDelete(t._id)}>DELETE</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}