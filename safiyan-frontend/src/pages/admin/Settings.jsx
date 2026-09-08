export default function Settings() {
  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0f4c81', marginBottom: 8 }}>System Settings</div>
      <div style={{ color: '#64748b', marginBottom: 24 }}>Configure platform branding, policies, and defaults.</div>

      <div style={{ background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <Field label="Store Name" value="Safiyan International ECommerce System" />
          <Field label="Short Name" value="SIES" />
          <Field label="Currency" value="BDT / USD" />
          <Field label="Tax Rate" value="5%" />
          <Field label="Support Email" value="support@sies.com" />
          <Field label="Theme" value="Blue / Teal" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', background: '#f8fafc' }}>
      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#0f172a' }}>{value}</div>
    </div>
  );
}
