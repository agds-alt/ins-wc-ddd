// Export/Import Utilities for Inspection Data
import { format } from 'date-fns';

export interface ExportInspectionData {
  // Inspection Info
  inspection_id: string;
  inspection_date: string;
  inspection_time: string;
  submitted_at: string;
  overall_status: string;
  notes: string;

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

  // Photo URLs (comma-separated)
  photo_urls: string;

  // Inspection Details (JSON stringified)
  responses: string;
}

/**
 * Convert inspection data to CSV format
 */
export function exportToCSV(data: ExportInspectionData[], filename?: string): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Define column headers
  const headers = [
    'Inspection ID',
    'Date',
    'Time',
    'Submitted At',
    'Status',
    'Notes',
    'Inspector Name',
    'Email',
    'Phone',
    'Position',
    'Location',
    'Building',
    'Organization',
    'Floor',
    'Area',
    'Section',
    'Photo URLs',
    'Inspection Details',
  ];

  // Convert data to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => [
      escapeCSV(row.inspection_id),
      escapeCSV(row.inspection_date),
      escapeCSV(row.inspection_time),
      escapeCSV(row.submitted_at),
      escapeCSV(row.overall_status),
      escapeCSV(row.notes),
      escapeCSV(row.user_full_name),
      escapeCSV(row.user_email),
      escapeCSV(row.user_phone),
      escapeCSV(row.user_occupation),
      escapeCSV(row.location_name),
      escapeCSV(row.building_name),
      escapeCSV(row.organization_name),
      escapeCSV(row.floor),
      escapeCSV(row.area),
      escapeCSV(row.section),
      escapeCSV(row.photo_urls),
      escapeCSV(row.responses),
    ].join(',')),
  ];

  // Create CSV content
  const csvContent = csvRows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename || `inspections_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Escape CSV field (handle quotes, commas, newlines)
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';

  const str = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape inner quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Parse CSV file to inspection data
 */
export async function parseCSVFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSVText(text);
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse CSV text to array of objects
 */
function parseCSVText(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const data = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj: any = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });

    return obj;
  });

  return data;
}

/**
 * Parse single CSV line (handles quoted fields)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Export to Excel (XLSX format)
 * Note: This requires xlsx library. For now, we'll use CSV.
 * To add Excel support later: npm install xlsx
 */
export function exportToExcel(data: ExportInspectionData[], filename?: string): void {
  // For now, fallback to CSV
  // TODO: Implement Excel export with xlsx library
  console.warn('Excel export not implemented yet, using CSV');
  exportToCSV(data, filename?.replace('.xlsx', '.csv'));
}
