import { Link } from 'react-router-dom';
import { SIES_BRANDING } from '../../config/branding';

export default function Home() {
  return (
    <div style={{ padding: '36px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', background: '#fff', borderRadius: 18, padding: 30, boxShadow: '08px 22px rgba(15, 23, 42, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <img src={SIES_BRANDING.logo} alt={SIES_BRANDING.shortName} style={{ height: 52, width: 'auto' }} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f4c81' }}>{SIES_BRANDING.name}</div>
            <div style={{ color: '#64748b' }}>Modern commerce platform for shoppers and vendors</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          <FeatureCard title="Product Catalog" text="Browse curated, filterable products across categories." />
          <FeatureCard title="Smart Cart" text="Add, review, and manage orders with a clean checkout flow." />
          <FeatureCard title="Vendor Controls" text="Support admin and vendor-specific management screens." />
        </div>

        <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/login" style={primaryButton}>Login</Link>
          <Link to="/register" style={secondaryButton}>Register</Link>
          <Link to="/admin" style={secondaryButton}>Admin Panel</Link>
        </div>

        <div style={{
          marginTop: 32,
          padding: 24,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%)',
          border: '1px solid #dbe7f3'
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f4c81' }}>
            SIES Project Documentation
          </div>

          <div style={{ marginTop: 8, color: '#475569', lineHeight: 1.7 }}>
            Explore the complete Safiyan International ECommerce System project
            documentation, screenshots, features, testing information, and system overview.
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href={`${import.meta.env.BASE_URL}Safiyan_International_ECommerce_Final_with_logo.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              style={primaryButton}
            >
              📄 View Project PDF
            </a>

            <a
              href={`${import.meta.env.BASE_URL}Safiyan_International_ECommerce_Final_with_logo.pdf`}
              download
              style={secondaryButton}
            >
              ⬇ Download PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, text }) {
  return (
    <div style={{ borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', padding: 20 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f4c81' }}>{title}</div>
      <div style={{ marginTop: 8, color: '#475569', lineHeight: 1.7 }}>{text}</div>
    </div>
  );
}

const primaryButton = {
  background: 'linear-gradient(90deg, #0f4c81 0%, #14919b 100%)',
  color: '#fff',
  borderRadius: 10,
  padding: '12px 18px',
  fontWeight: 700,
  display: 'inline-block',
};

const secondaryButton = {
  ...primaryButton,
  background: 'transparent',
  color: '#e5eef8',
  border: '1px solid #31506f',
};
