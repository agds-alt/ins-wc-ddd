/**
 * Export Utilities for Excel and PDF
 * Modern implementation with performance optimizations
 *
 * PERFORMANCE: Heavy libraries (jsPDF, XLSX) are loaded on-demand
 * to reduce initial bundle size by ~500KB
 */

import { format } from 'date-fns';
import { loadPDFLibraries, loadXLSX } from '@/lib/lazy';
import type { jsPDF } from 'jspdf';

export interface ExportInspectionData {
  // Inspection Info
  inspection_id: string;
  inspection_date: string;
  inspection_time: string;
  submitted_at: string;
  overall_status: string;
  notes: string | null;

  // User Info
  user_full_name: string;
  user_email: string;
  user_phone: string;
  user_occupation: string;

  // Location Info
  location_name: string;
  building_name: string;
  organization_name: string;
  floor: string;
  area: string;
  section: string;

  // Photo URLs (array)
  photo_urls: string[];

  // Inspection Details
  responses: Record<string, any>;
}

export interface MonthlyReportData {
  month: string;
  year: number;
  totalInspections: number;
  averageScore: number;
  statusBreakdown: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  dailyData: Array<{
    date: string;
    count: number;
    averageScore: number;
  }>;
  inspections: ExportInspectionData[];
}

/**
 * Export inspections to Excel format
 * Dynamically loads XLSX library (~300KB) only when needed
 */
export async function exportToExcel(data: ExportInspectionData[], filename?: string): Promise<void> {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Load XLSX library on-demand
  const XLSX = await loadXLSX();

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare data for Excel
  const excelData = data.map((row) => ({
    'Inspection ID': row.inspection_id,
    'Tanggal': row.inspection_date,
    'Waktu': row.inspection_time,
    'Status': translateStatus(row.overall_status),
    'Catatan': row.notes || '-',
    'Inspector': row.user_full_name,
    'Email': row.user_email,
    'Telepon': row.user_phone,
    'Jabatan': row.user_occupation,
    'Lokasi': row.location_name,
    'Gedung': row.building_name,
    'Organisasi': row.organization_name,
    'Lantai': row.floor,
    'Area': row.area,
    'Seksi': row.section,
    'Jumlah Foto': row.photo_urls.length,
    'Submitted': row.submitted_at,
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = [
    { wch: 30 }, // Inspection ID
    { wch: 12 }, // Tanggal
    { wch: 10 }, // Waktu
    { wch: 15 }, // Status
    { wch: 30 }, // Catatan
    { wch: 20 }, // Inspector
    { wch: 25 }, // Email
    { wch: 15 }, // Telepon
    { wch: 20 }, // Jabatan
    { wch: 25 }, // Lokasi
    { wch: 25 }, // Gedung
    { wch: 25 }, // Organisasi
    { wch: 10 }, // Lantai
    { wch: 15 }, // Area
    { wch: 15 }, // Seksi
    { wch: 12 }, // Jumlah Foto
    { wch: 20 }, // Submitted
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Inspections');

  // Generate filename
  const fileName = filename || `Inspeksi_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;

  // Write file
  XLSX.writeFile(wb, fileName);
}

/**
 * Export monthly report to PDF (5 pages)
 * Page 1: Cover & Summary
 * Page 2: Statistics & Charts (text-based)
 * Page 3: Daily Breakdown
 * Page 4: Status Distribution
 * Page 5: Detailed Inspections List
 *
 * Dynamically loads jsPDF library (~200KB) only when needed
 */
export async function exportMonthlyReportToPDF(data: MonthlyReportData, filename?: string): Promise<void> {
  // Load PDF libraries on-demand
  const { jsPDF, autoTable } = await loadPDFLibraries();

  const doc = new jsPDF();
  const monthName = format(new Date(data.year, parseInt(data.month) - 1, 1), 'MMMM yyyy');

  // PAGE 1: Cover & Summary
  addCoverPage(doc, data, monthName);

  // PAGE 2: Statistics Overview
  doc.addPage();
  addStatisticsPage(doc, data, monthName);

  // PAGE 3: Daily Breakdown
  doc.addPage();
  addDailyBreakdownPage(doc, data, monthName, autoTable);

  // PAGE 4: Status Distribution
  doc.addPage();
  addStatusDistributionPage(doc, data, monthName, autoTable);

  // PAGE 5: Detailed Inspections
  doc.addPage();
  addDetailedInspectionsPage(doc, data, monthName, autoTable);

  // Save PDF
  const fileName = filename || `Laporan_Kebersihan_${monthName.replace(' ', '_')}.pdf`;
  doc.save(fileName);
}

/**
 * Page 1: Cover & Summary
 */
function addCoverPage(doc: jsPDF, data: MonthlyReportData, monthName: string): void {
  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KEBERSIHAN', 105, 40, { align: 'center' });

  doc.setFontSize(18);
  doc.text(monthName.toUpperCase(), 105, 55, { align: 'center' });

  // Summary Box
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const summaryY = 80;
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.5);
  doc.rect(30, summaryY, 150, 80);

  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN BULAN INI', 105, summaryY + 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Total Inspeksi: ${data.totalInspections}`, 40, summaryY + 25);
  doc.text(`Rata-rata Skor: ${data.averageScore}%`, 40, summaryY + 35);

  doc.text('Status Breakdown:', 40, summaryY + 50);
  doc.text(`  Sangat Baik: ${data.statusBreakdown.excellent}`, 40, summaryY + 60);
  doc.text(`  Baik: ${data.statusBreakdown.good}`, 40, summaryY + 65);
  doc.text(`  Cukup: ${data.statusBreakdown.fair}`, 40, summaryY + 70);
  doc.text(`  Buruk: ${data.statusBreakdown.poor}`, 40, summaryY + 75);

  // Footer
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 280, { align: 'center' });
}

/**
 * Page 2: Statistics Overview
 */
function addStatisticsPage(doc: jsPDF, data: MonthlyReportData, monthName: string): void {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('STATISTIK KEBERSIHAN', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(monthName, 105, 30, { align: 'center' });

  // Performance Indicators
  let yPos = 50;
  doc.setFont('helvetica', 'bold');
  doc.text('Indikator Performa:', 20, yPos);

  yPos += 10;
  doc.setFont('helvetica', 'normal');

  const excellentPercentage = ((data.statusBreakdown.excellent / data.totalInspections) * 100).toFixed(1);
  const goodPercentage = ((data.statusBreakdown.good / data.totalInspections) * 100).toFixed(1);
  const fairPercentage = ((data.statusBreakdown.fair / data.totalInspections) * 100).toFixed(1);
  const poorPercentage = ((data.statusBreakdown.poor / data.totalInspections) * 100).toFixed(1);

  doc.text(`• Tingkat Kebersihan Sangat Baik: ${excellentPercentage}%`, 25, yPos);
  yPos += 7;
  doc.text(`• Tingkat Kebersihan Baik: ${goodPercentage}%`, 25, yPos);
  yPos += 7;
  doc.text(`• Tingkat Kebersihan Cukup: ${fairPercentage}%`, 25, yPos);
  yPos += 7;
  doc.text(`• Tingkat Kebersihan Buruk: ${poorPercentage}%`, 25, yPos);

  // Trend Analysis
  yPos += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Analisis Tren:', 20, yPos);

  yPos += 10;
  doc.setFont('helvetica', 'normal');

  const avgInspectionsPerDay = (data.totalInspections / data.dailyData.length).toFixed(1);
  doc.text(`• Rata-rata inspeksi per hari: ${avgInspectionsPerDay}`, 25, yPos);

  yPos += 7;
  const maxDayData = data.dailyData.reduce((max, day) => day.count > max.count ? day : max);
  doc.text(`• Hari dengan inspeksi terbanyak: ${format(new Date(maxDayData.date), 'dd/MM/yyyy')} (${maxDayData.count} inspeksi)`, 25, yPos);

  // Recommendations
  yPos += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Rekomendasi:', 20, yPos);

  yPos += 10;
  doc.setFont('helvetica', 'normal');

  if (data.statusBreakdown.poor > 0) {
    doc.text(`• Terdapat ${data.statusBreakdown.poor} lokasi dengan status Buruk yang memerlukan perhatian khusus`, 25, yPos);
    yPos += 7;
  }

  if (data.averageScore >= 80) {
    doc.text('• Performa kebersihan sangat baik, pertahankan standar yang ada', 25, yPos);
  } else if (data.averageScore >= 60) {
    doc.text('• Performa kebersihan cukup baik, tingkatkan konsistensi', 25, yPos);
  } else {
    doc.text('• Performa kebersihan perlu ditingkatkan, lakukan evaluasi mendalam', 25, yPos);
  }
}

/**
 * Page 3: Daily Breakdown
 */
function addDailyBreakdownPage(doc: jsPDF, data: MonthlyReportData, monthName: string, autoTable: any): void {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RINCIAN HARIAN', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(monthName, 105, 30, { align: 'center' });

  // Table of daily data
  const tableData = data.dailyData.map((day) => [
    format(new Date(day.date), 'dd/MM/yyyy'),
    format(new Date(day.date), 'EEEE'),
    day.count.toString(),
    `${day.averageScore}%`,
    getScoreRating(day.averageScore),
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Tanggal', 'Hari', 'Jumlah', 'Skor Rata-rata', 'Rating']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 102, 204], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
    },
  });
}

/**
 * Page 4: Status Distribution
 */
function addStatusDistributionPage(doc: jsPDF, data: MonthlyReportData, monthName: string, autoTable: any): void {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DISTRIBUSI STATUS', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(monthName, 105, 30, { align: 'center' });

  // Visual representation (text-based bar chart)
  const maxCount = Math.max(
    data.statusBreakdown.excellent,
    data.statusBreakdown.good,
    data.statusBreakdown.fair,
    data.statusBreakdown.poor
  );

  let yPos = 50;
  const barMaxWidth = 120;

  // Calculate percentages
  const excellentPercentage = ((data.statusBreakdown.excellent / data.totalInspections) * 100).toFixed(1);
  const goodPercentage = ((data.statusBreakdown.good / data.totalInspections) * 100).toFixed(1);
  const fairPercentage = ((data.statusBreakdown.fair / data.totalInspections) * 100).toFixed(1);
  const poorPercentage = ((data.statusBreakdown.poor / data.totalInspections) * 100).toFixed(1);

  // Excellent
  doc.setFont('helvetica', 'bold');
  doc.text('Sangat Baik:', 20, yPos);
  const excellentWidth = (data.statusBreakdown.excellent / maxCount) * barMaxWidth;
  doc.setFillColor(34, 197, 94); // Green
  doc.rect(70, yPos - 5, excellentWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.statusBreakdown.excellent}`, 195, yPos, { align: 'right' });

  yPos += 20;

  // Good
  doc.setFont('helvetica', 'bold');
  doc.text('Baik:', 20, yPos);
  const goodWidth = (data.statusBreakdown.good / maxCount) * barMaxWidth;
  doc.setFillColor(59, 130, 246); // Blue
  doc.rect(70, yPos - 5, goodWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.statusBreakdown.good}`, 195, yPos, { align: 'right' });

  yPos += 20;

  // Fair
  doc.setFont('helvetica', 'bold');
  doc.text('Cukup:', 20, yPos);
  const fairWidth = (data.statusBreakdown.fair / maxCount) * barMaxWidth;
  doc.setFillColor(251, 191, 36); // Yellow
  doc.rect(70, yPos - 5, fairWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.statusBreakdown.fair}`, 195, yPos, { align: 'right' });

  yPos += 20;

  // Poor
  doc.setFont('helvetica', 'bold');
  doc.text('Buruk:', 20, yPos);
  const poorWidth = (data.statusBreakdown.poor / maxCount) * barMaxWidth;
  doc.setFillColor(239, 68, 68); // Red
  doc.rect(70, yPos - 5, poorWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.statusBreakdown.poor}`, 195, yPos, { align: 'right' });

  // Summary table
  yPos += 30;
  autoTable(doc, {
    startY: yPos,
    head: [['Status', 'Jumlah', 'Persentase']],
    body: [
      ['Sangat Baik', data.statusBreakdown.excellent, `${excellentPercentage}%`],
      ['Baik', data.statusBreakdown.good, `${goodPercentage}%`],
      ['Cukup', data.statusBreakdown.fair, `${fairPercentage}%`],
      ['Buruk', data.statusBreakdown.poor, `${poorPercentage}%`],
      ['TOTAL', data.totalInspections, '100%'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 102, 204], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 50, halign: 'center' },
    },
    footStyles: { fillColor: [0, 102, 204], fontStyle: 'bold' },
  });
}

/**
 * Page 5: Detailed Inspections List
 */
function addDetailedInspectionsPage(doc: jsPDF, data: MonthlyReportData, monthName: string, autoTable: any): void {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DAFTAR INSPEKSI DETAIL', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(monthName, 105, 30, { align: 'center' });

  // Table of inspections (limited to first 50 for space)
  const tableData = data.inspections.slice(0, 50).map((inspection) => [
    format(new Date(inspection.inspection_date), 'dd/MM'),
    inspection.location_name.substring(0, 25),
    translateStatus(inspection.overall_status),
    inspection.user_full_name.substring(0, 20),
    inspection.notes?.substring(0, 30) || '-',
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Tanggal', 'Lokasi', 'Status', 'Inspector', 'Catatan']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 102, 204], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35 },
      4: { cellWidth: 45 },
    },
  });

  // Add note if more data exists
  if (data.inspections.length > 50) {
    const finalY = (doc as any).lastAutoTable.finalY || 250;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `* Menampilkan 50 dari ${data.inspections.length} total inspeksi`,
      105,
      finalY + 10,
      { align: 'center' }
    );
  }
}

/**
 * Helper: Translate status to Indonesian
 */
function translateStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'excellent':
      return 'Sangat Baik';
    case 'good':
      return 'Baik';
    case 'fair':
      return 'Cukup';
    case 'poor':
      return 'Buruk';
    default:
      return status;
  }
}

/**
 * Helper: Get score rating
 */
function getScoreRating(score: number): string {
  if (score >= 90) return 'Sangat Baik';
  if (score >= 75) return 'Baik';
  if (score >= 60) return 'Cukup';
  return 'Buruk';
}
