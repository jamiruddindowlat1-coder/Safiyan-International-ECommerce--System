import { SIES_BRANDING } from '../../config/branding';
import Logo from '../Logo';

export default function Footer() {
  return (
    <footer style={footerStyle}>
      <div style={footerGridStyle}>
        <div><Logo variant="short" size={38} /><p style={mutedStyle}>{SIES_BRANDING.name}</p></div>
        <div><div style={labelStyle}>Contact</div><a href={`tel:${SIES_BRANDING.contact.phoneHref}`} style={contactStyle}>{SIES_BRANDING.contact.phoneDisplay}</a><a href={`mailto:${SIES_BRANDING.contact.email}`} style={contactStyle}>{SIES_BRANDING.contact.email}</a></div>
        <div><div style={labelStyle}>Address</div><address style={addressStyle}>{SIES_BRANDING.contact.address}</address></div>
      </div>
      <div style={copyrightStyle}>© {new Date().getFullYear()} {SIES_BRANDING.name} · Powered by {SIES_BRANDING.shortName}</div>
    </footer>
  );
}

const footerStyle = { background: '#06101d', color: '#e5eef8', borderTop: '1px solid #203852', padding: '28px 24px 16px', fontSize: 13 };
const footerGridStyle = { maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 28, alignItems: 'start' };
const mutedStyle = { color: '#9fb6cc', margin: '10px 0 0', lineHeight: 1.6 };
const labelStyle = { color: '#62b7f5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 };
const contactStyle = { display: 'block', color: '#e5eef8', marginBottom: 8 };
const addressStyle = { color: '#e5eef8', fontStyle: 'normal' };
const copyrightStyle = { maxWidth: 1400, margin: '24px auto 0', paddingTop: 14, borderTop: '1px solid #203852', color: '#7189a2' };
