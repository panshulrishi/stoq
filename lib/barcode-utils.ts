import { Product, BarcodeFormat } from './types';

// Helper to calculate or generate realistic barcodes
export function generateRandomBarcode(format: BarcodeFormat): string {
  const prefix = '890';
  if (format === 'EAN13') {
    let code = prefix + Math.floor(100000000 + Math.random() * 900000000).toString();
    code = code.substring(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    return code + check;
  } else if (format === 'UPC') {
    let code = '0' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    code = code.substring(0, 11);
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      const digit = parseInt(code[i], 10);
      sum += (i % 2 === 0) ? digit * 3 : digit;
    }
    const check = (10 - (sum % 10)) % 10;
    return code + check;
  } else if (format === 'QR') {
    return `QR-${Math.floor(100000 + Math.random() * 900000)}`;
  } else {
    // CODE128
    return `C128-${Math.floor(1000000 + Math.random() * 9000000)}`;
  }
}

// Convert string into pseudo-bars pattern for crisp SVG drawing
export function getBarPattern(code: string): boolean[] {
  const bars: boolean[] = [true, false, true]; // Quiet start
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
    hash |= 0;
  }

  for (let i = 0; i < 60; i++) {
    const bit = ((hash >> (i % 31)) & 1) === 1;
    // ensure no huge solid block
    if (i > 2 && bars[i-1] && bars[i-2] && bars[i-3]) {
      bars.push(false);
    } else if (i > 2 && !bars[i-1] && !bars[i-2] && !bars[i-3]) {
      bars.push(true);
    } else {
      bars.push(bit);
    }
  }
  bars.push(true, false, true); // Quiet stop
  return bars;
}

// Generate SVG string for Barcode
export function renderSVGBarcode(barcode: string, format: BarcodeFormat, productName?: string, price?: number): string {
  const bars = getBarPattern(barcode);
  const barWidth = 2.5;
  const height = 70;
  const totalWidth = bars.length * barWidth + 30;

  const rects = bars.map((isDark, idx) => {
    if (!isDark) return '';
    const x = 15 + idx * barWidth;
    return `<rect x="${x}" y="15" width="${barWidth}" height="${height}" fill="#0f172a" />`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 115" width="100%" height="100%" style="background:#ffffff; border-radius:8px;">
    ${productName ? `<text x="${totalWidth / 2}" y="10" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="600" fill="#334155">${escapeXml(productName)}</text>` : ''}
    ${rects}
    <text x="${totalWidth / 2}" y="${height + 28}" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#0f172a">${escapeXml(barcode)} (${format})</text>
    ${price !== undefined ? `<text x="${totalWidth / 2}" y="${height + 40}" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="#2563eb">$${price.toFixed(2)}</text>` : ''}
  </svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Export CSV trigger
export function exportToCSV(filename: string, rows: object[]) {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(','),
    ...rows.map(row => keys.map(k => {
      const val = (row as Record<string, unknown>)[k];
      const str = val === undefined || val === null ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
