import { Registration } from '../types/yagya';

/**
 * Export registrations list to CSV with UTF-8 BOM for Microsoft Excel / Google Sheets
 */
export const exportDatabaseToCSV = (dataList: Registration[]): void => {
  if (!dataList || dataList.length === 0) {
    const emptyCsv = '\uFEFFटोकन सं.,हवन कुंड,मुख्य यजमान,सह-यजमान,मोबाइल,नगर,गोत्र,यज्ञ दिवस,सत्र,दक्षिणा (₹),स्थिति,बैंक UTR,पंजीकरण तिथि\n';
    const blob = new Blob([emptyCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Maharishi_Yagya_Database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const headers = [
    'टोकन सं.',
    'हवन कुंड',
    'मुख्य यजमान',
    'सह-यजमान',
    'मोबाइल',
    'नगर',
    'गोत्र',
    'यज्ञ दिवस',
    'सत्र',
    'दक्षिणा (₹)',
    'स्थिति',
    'बैंक UTR',
    'पंजीकरण तिथि'
  ];

  const rows = dataList.map((r) => [
    `"${r.token}"`,
    `"#${String(r.kundNumber).padStart(3, '0')}"`,
    `"${(r.fullName || r.husbandName || '').replace(/"/g, '""')}"`,
    `"${(r.wifeName || '-').replace(/"/g, '""')}"`,
    `"'+91 ${r.mobile}"`,
    `"${(r.city || 'नोएडा').replace(/"/g, '""')}"`,
    `"${(r.gotra || '-').replace(/"/g, '""')}"`,
    `"${r.date}"`,
    `"${(r.timeSlot || '').replace(/"/g, '""')}"`,
    r.amount,
    `"${r.paymentStatus === 'paid' ? 'सत्यापित (PAID)' : r.paymentStatus === 'pending' ? 'सत्यापन प्रतीक्षित' : r.paymentStatus === 'counter_pay' ? 'काउंटर भुगतान' : r.paymentStatus}"`,
    `"${r.utrNumber || '-'}"`,
    `"${r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '-'}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Maharishi_Yagya_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
