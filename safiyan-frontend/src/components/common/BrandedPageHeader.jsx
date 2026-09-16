import Logo from '../Logo';

export default function BrandedPageHeader({ section }) {
  return (
    <div style={headerStyle}>
      <Logo variant="short" size={30} />
      <div style={dividerStyle} />
      <div>
        <div style={nameStyle}>Safiyan International ECommerce System</div>
        {section && <div style={sectionStyle}>{section}</div>}
      </div>
    </div>
  );
}

const headerStyle = { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', marginBottom: 18 };
const dividerStyle = { width: 1, height: 30, background: '#dbe2ea' };
const nameStyle = { color: '#0f4c81', fontSize: 13, fontWeight: 800 };
const sectionStyle = { color: '#64748b', fontSize: 12, marginTop: 2 };
