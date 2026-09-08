import { exportExcel, exportPDF, printReport } from '../../utils/exportUtils';
import { SIES_BRANDING } from '../../config/branding';

export default function AdminExportActions({ filename, title, rows, onPrint }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <img src={SIES_BRANDING.logo} alt={SIES_BRANDING.shortName} style={{ height: 28, width: 'auto', marginRight: 4 }} />
      <button onClick={() => exportExcel(filename, rows)} style={buttonStyle}>Excel</button>
      <button onClick={() => exportPDF(filename, title, rows)} style={buttonStyle}>PDF</button>
      <button onClick={onPrint || (() => printReport(title, rows))} style={secondaryStyle}>Print</button>
    </div>
  );
}

const buttonStyle = { border: 0, background: '#0f4c81', color: '#fff', borderRadius: 8, padding: '9px 13px', fontWeight: 700, cursor: 'pointer' };
const secondaryStyle = { ...buttonStyle, background: '#e2e8f0', color: '#0f172a' };
