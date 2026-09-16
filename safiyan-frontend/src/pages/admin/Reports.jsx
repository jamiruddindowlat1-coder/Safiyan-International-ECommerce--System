import { useEffect, useState } from 'react';
import { accountingService } from '../../services/accountingService';
import { commissionService } from '../../services/commissionService';

const formatMoney = (value = 0) => `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const emptyReport = { daily: [], entries: [], profitAndLoss: {}, balanceSheet: {}, trialBalance: {} };
const emptyCommission = { totalMarketplaceSales: 0, totalCommissionEarned: 0, totalVendorEarnings: 0, byVendor: [], outstandingPayables: [] };

export default function Reports() {
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState(emptyReport);
  const [commission, setCommission] = useState(emptyCommission);
  const [form, setForm] = useState({ entryDate: today, type: 'Purchase', description: '', amount: '', reference: '' });
  const [payoutForm, setPayoutForm] = useState({ vendorId: '', amount: '', paymentMethod: 'Bank Transfer', notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payingOut, setPayingOut] = useState(false);
  const [error, setError] = useState('');

  async function loadReport() {
    setLoading(true);
    setError('');
    try {
      const [accounts, commissionSummary] = await Promise.all([
        accountingService.getAccounts(from, to),
        commissionService.getAdminSummary(from, to),
      ]);
      setReport(accounts);
      setCommission(commissionSummary);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  async function handlePayout(event) {
    event.preventDefault();
    if (!payoutForm.vendorId || !payoutForm.amount) {
      setError('Select a vendor and enter a payout amount.');
      return;
    }
    setPayingOut(true);
    setError('');
    try {
      await commissionService.createPayout({ ...payoutForm, vendorId: Number(payoutForm.vendorId), amount: Number(payoutForm.amount) });
      setPayoutForm({ vendorId: '', amount: '', paymentMethod: 'Bank Transfer', notes: '' });
      await loadReport();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPayingOut(false);
    }
  }

  async function handleEntry(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await accountingService.addEntry({ ...form, amount: Number(form.amount) });
      setForm({ entryDate: today, type: 'Purchase', description: '', amount: '', reference: '' });
      await loadReport();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const pnl = report.profitAndLoss;
  const balance = report.balanceSheet;
  const trialBalance = report.trialBalance;

  return (
    <div className="accounts-report">
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>Accounts</div>
          <div style={mutedStyle}>Daily purchase, sales, profit and balance sheet.</div>
        </div>
        <button onClick={() => window.print()} style={buttonStyle} className="no-print">Print Report</button>
      </div>

      <div style={filterStyle} className="no-print">
        <label>From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} style={inputStyle} /></label>
        <label>To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} style={inputStyle} /></label>
        <button onClick={loadReport} disabled={loading} style={buttonStyle}>{loading ? 'Loading...' : 'View Report'}</button>
      </div>

      {error && <div role="alert" style={errorStyle}>{error}</div>}

      <div style={cardGridStyle}>
        <SummaryCard label="Sales" value={formatMoney(pnl.sales)} color="#0f4c81" />
        <SummaryCard label="Purchases" value={formatMoney(pnl.purchases)} color="#b54708" />
        <SummaryCard label="Expenses" value={formatMoney(pnl.expenses)} color="#b42318" />
        <SummaryCard label="Net Profit" value={formatMoney(pnl.netProfit)} color={pnl.netProfit >= 0 ? '#087443' : '#b42318'} />
      </div>

      <div style={cardGridStyle}>
        <SummaryCard label="Marketplace Sales (Delivered)" value={formatMoney(commission.totalMarketplaceSales)} color="#0f4c81" />
        <SummaryCard label="Commission Earned" value={formatMoney(commission.totalCommissionEarned)} color="#087443" />
        <SummaryCard label="Vendor Earnings" value={formatMoney(commission.totalVendorEarnings)} color="#14919b" />
      </div>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Commission by Vendor</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr><th style={cellStyle}>Vendor</th><th style={cellStyle}>Sales</th><th style={cellStyle}>Commission</th><th style={cellStyle}>Vendor Earning</th></tr></thead>
            <tbody>{commission.byVendor.map((v) => <tr key={v.vendorId}><td style={cellStyle}>{v.storeName}</td><td style={cellStyle}>{formatMoney(v.totalSales)}</td><td style={cellStyle}>{formatMoney(v.totalCommission)}</td><td style={cellStyle}>{formatMoney(v.totalEarning)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section style={panelStyle} className="no-print">
        <h2 style={sectionTitleStyle}>Vendor Payouts / Settlement</h2>
        <p style={mutedStyle}>Outstanding payable balances awaiting settlement, mirroring Daraz's seller settlement cycle.</p>
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={tableStyle}>
            <thead><tr><th style={cellStyle}>Vendor</th><th style={cellStyle}>Payable Balance</th></tr></thead>
            <tbody>{commission.outstandingPayables.map((v) => <tr key={v.id}><td style={cellStyle}>{v.storeName}</td><td style={cellStyle}>{formatMoney(v.payableBalance)}</td></tr>)}</tbody>
          </table>
        </div>
        <form onSubmit={handlePayout} style={formGridStyle}>
          <select value={payoutForm.vendorId} onChange={(event) => setPayoutForm({ ...payoutForm, vendorId: event.target.value })} style={inputStyle}>
            <option value="">Select vendor to pay</option>
            {commission.outstandingPayables.map((v) => <option key={v.id} value={v.id}>{v.storeName} — {formatMoney(v.payableBalance)} due</option>)}
          </select>
          <input placeholder="Amount" type="number" min="0.01" step="0.01" required value={payoutForm.amount} onChange={(event) => setPayoutForm({ ...payoutForm, amount: event.target.value })} style={inputStyle} />
          <select value={payoutForm.paymentMethod} onChange={(event) => setPayoutForm({ ...payoutForm, paymentMethod: event.target.value })} style={inputStyle}>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Mobile Banking">Mobile Banking (bKash/Nagad)</option>
            <option value="Cash">Cash</option>
          </select>
          <input placeholder="Notes (optional)" value={payoutForm.notes} onChange={(event) => setPayoutForm({ ...payoutForm, notes: event.target.value })} style={inputStyle} />
          <button type="submit" disabled={payingOut} style={buttonStyle}>{payingOut ? 'Processing...' : 'Mark as Paid'}</button>
        </form>
      </section>

      <div style={twoColumnStyle}>
        <section style={panelStyle}>
          <h2 style={sectionTitleStyle}>Profit &amp; Loss</h2>
          <Line label="Sales" value={pnl.sales} />
          <Line label="Other income" value={pnl.otherIncome} />
          <Line label="Purchases" value={-pnl.purchases} />
          <Line label="Expenses" value={-pnl.expenses} />
          <Line label="Net profit" value={pnl.netProfit} strong />
        </section>
        <section style={panelStyle}>
          <h2 style={sectionTitleStyle}>Balance Sheet</h2>
          <Line label="Cash movement" value={balance.cash} />
          <Line label="Inventory value" value={balance.inventory} />
          <Line label="Total assets" value={balance.totalAssets} strong />
          <Line label="Liabilities" value={balance.liabilities} />
          <Line label="Equity" value={balance.equity} strong />
        </section>
      </div>

      <section style={panelStyle} className="no-print">
        <h2 style={sectionTitleStyle}>Add Purchase or Expense</h2>
        <form onSubmit={handleEntry} style={formGridStyle}>
          <input type="date" required value={form.entryDate} onChange={(event) => setForm({ ...form, entryDate: event.target.value })} style={inputStyle} />
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} style={inputStyle}>
            <option value="Purchase">Purchase</option>
            <option value="Expense">Expense</option>
            <option value="Income">Other income</option>
          </select>
          <input placeholder="Description" required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} style={inputStyle} />
          <input placeholder="Amount" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} style={inputStyle} />
          <input placeholder="Reference" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} style={inputStyle} />
          <button type="submit" disabled={saving} style={buttonStyle}>{saving ? 'Saving...' : 'Add Entry'}</button>
        </form>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Daily Ledger</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr><th style={cellStyle}>Date</th><th style={cellStyle}>Sales</th><th style={cellStyle}>Purchase</th><th style={cellStyle}>Expense</th><th style={cellStyle}>Profit</th></tr></thead>
            <tbody>{report.daily.map((row) => <tr key={row.date}><td style={cellStyle}>{new Date(row.date).toLocaleDateString()}</td><td style={cellStyle}>{formatMoney(row.sales)}</td><td style={cellStyle}>{formatMoney(row.purchases)}</td><td style={cellStyle}>{formatMoney(row.expenses)}</td><td style={cellStyle}>{formatMoney(row.profit)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Trial Balance</h2>
        <div style={tableRowStyle}><strong>Debit total</strong><strong>Credit total</strong></div>
        <div style={tableRowStyle}><span>{formatMoney(trialBalance.debit)}</span><span>{formatMoney(trialBalance.credit)}</span></div>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Journal Entries</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr><th style={cellStyle}>Date</th><th style={cellStyle}>Type</th><th style={cellStyle}>Description</th><th style={cellStyle}>Reference</th><th style={cellStyle}>Amount</th></tr></thead>
            <tbody>{report.entries.map((entry) => <tr key={entry.id}><td style={cellStyle}>{new Date(entry.entryDate).toLocaleDateString()}</td><td style={cellStyle}>{entry.type}</td><td style={cellStyle}>{entry.description}</td><td style={cellStyle}>{entry.reference || '-'}</td><td style={cellStyle}>{formatMoney(entry.amount)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return <div style={summaryCardStyle}><div style={mutedStyle}>{label}</div><div style={{ fontSize: 25, fontWeight: 800, color, marginTop: 8 }}>{value}</div></div>;
}

function Line({ label, value = 0, strong }) {
  return <div style={{ ...lineStyle, fontWeight: strong ? 800 : 500, borderTop: strong ? '1px solid #dbe2ea' : undefined }}><span>{label}</span><span>{formatMoney(value)}</span></div>;
}

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 };
const titleStyle = { fontSize: 28, fontWeight: 800, color: '#62b7f5' };
const mutedStyle = { color: '#9fb6cc', fontSize: 14 };
const buttonStyle = { border: 'none', background: 'linear-gradient(90deg, #0f4c81 0%, #14919b 100%)', color: '#fff', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' };
const filterStyle = { display: 'flex', alignItems: 'end', flexWrap: 'wrap', gap: 12, background: '#fff', padding: 16, borderRadius: 12, marginBottom: 18 };
const inputStyle = { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '10px 12px', borderRadius: 8, border: '1px solid #dbe2ea', background: '#fff' };
const cardGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 };
const summaryCardStyle = { background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' };
const twoColumnStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 18 };
const panelStyle = { background: '#fff', borderRadius: 12, padding: 18, marginBottom: 18, boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' };
const sectionTitleStyle = { margin: '0 0 14px', fontSize: 18, color: '#0f172a' };
const lineStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', color: '#c7d6e5' };
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, alignItems: 'end' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const cellStyle = { textAlign: 'left', padding: '11px 10px', borderBottom: '1px solid #eef2f7', whiteSpace: 'nowrap' };
const tableRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '11px 10px', borderBottom: '1px solid #eef2f7' };
const errorStyle = { background: '#fef3f2', color: '#b42318', padding: 12, borderRadius: 8, marginBottom: 18 };

