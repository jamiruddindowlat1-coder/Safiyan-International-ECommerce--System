import { jsPDF } from 'jspdf';
import { SIES_BRANDING } from '../config/branding';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadLogoSvg() {
  try {
    const response = await fetch(SIES_BRANDING.logo);
    return await response.text();
  } catch {
    return '';
  }
}

async function loadLogoPng() {
  const svg = await loadLogoSvg();
  if (!svg) return '';

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 220;
      canvas.height = 100;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => resolve('');
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function logoMarkup(svg) {
  return svg ? `<div class="logo">${svg}</div>` : `<div class="logo-fallback">${escapeHtml(SIES_BRANDING.shortName)}</div>`;
}

export function exportCSV(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportExcel(filename, data) {
  const headers = Object.keys(data[0] || {});
  const logo = await loadLogoSvg();
  const rows = data.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`).join('');
  const html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial;color:#142235}.logo svg{height:64px;width:145px}.logo-fallback{font-size:34px;font-weight:bold;color:#0f4c81}h1{color:#0f4c81;margin:4px 0}h2{font-size:14px;color:#52657a;margin:4px 0 18px}table{border-collapse:collapse}th{background:#0f4c81;color:#fff}th,td{padding:7px 10px;border:1px solid #b9c7d6}</style></head><body>${logoMarkup(logo)}<h1>${escapeHtml(SIES_BRANDING.shortName)}</h1><h2>${escapeHtml(SIES_BRANDING.name)}</h2><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportPDF(filename, title, rows) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const logo = await loadLogoPng();
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 14, 8, 34, 15);
    } catch {
      // Keep the text branding if the browser cannot rasterize the SVG.
    }
  }
  doc.setFontSize(16);
  doc.setTextColor(15, 76, 129);
  doc.text(SIES_BRANDING.shortName, 52, 14);
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(SIES_BRANDING.name, 52, 20);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 30);
  doc.setFontSize(10);

  const headers = Object.keys(rows[0] || {});
  let y = 44;

  doc.setFillColor(15, 76, 129);
  doc.setTextColor(255, 255, 255);
  doc.rect(14, y - 8, pageWidth - 28, 10, 'F');
  doc.text(headers.join(' | '), 18, y);

  doc.setTextColor(0, 0, 0);
  y += 12;

  rows.forEach((row) => {
    const values = headers.map((header) => row[header] ?? '');
    const text = values.join(' | ');
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(text, 18, y);
    y += 8;
  });

  doc.save(`${filename}.pdf`);
}

export async function printReport(title, rows) {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) return;
  const headers = Object.keys(rows[0] || {});
  const logo = await loadLogoSvg();
  const tableRows = rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`).join('');
  printWindow.document.write(`<html><head><title>${escapeHtml(title)}</title><style>body{font-family:Arial;padding:32px;color:#142235}.logo svg{height:68px;width:155px}.logo-fallback{font-size:36px;font-weight:bold;color:#0f4c81}h1{color:#0f4c81;margin:5px 0}h2{font-size:15px;color:#52657a}table{width:100%;border-collapse:collapse;margin-top:24px}th{background:#0f4c81;color:#fff}th,td{padding:9px;border:1px solid #b9c7d6;text-align:left}</style></head><body>${logoMarkup(logo)}<h1>${escapeHtml(SIES_BRANDING.shortName)}</h1><h2>${escapeHtml(SIES_BRANDING.name)}</h2><h2>${escapeHtml(title)}</h2><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
}
