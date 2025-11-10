/**
 * Lazy loading utilities for heavy dependencies
 *
 * This module provides dynamic imports for large libraries to reduce initial bundle size.
 * Libraries are loaded on-demand only when their functionality is needed.
 *
 * Impact:
 * - jsPDF + jspdf-autotable: ~200KB
 * - XLSX: ~300KB
 * - browser-image-compression: ~50KB
 * Total savings on initial load: ~550KB
 */

// Lazy load jsPDF and jspdf-autotable for PDF generation
export async function loadPDFLibraries() {
  const [jsPDF, autoTable] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ])

  return {
    jsPDF: jsPDF.default,
    autoTable: autoTable.default
  }
}

// Lazy load XLSX for Excel export
export async function loadXLSX() {
  const XLSX = await import('xlsx')
  return XLSX
}

// Lazy load browser-image-compression
export async function loadImageCompression() {
  const compression = await import('browser-image-compression')
  return compression.default
}

/**
 * Type helpers for lazy loaded modules
 */
export type LazyJsPDF = Awaited<ReturnType<typeof loadPDFLibraries>>['jsPDF']
export type LazyAutoTable = Awaited<ReturnType<typeof loadPDFLibraries>>['autoTable']
export type LazyXLSX = Awaited<ReturnType<typeof loadXLSX>>
export type LazyImageCompression = Awaited<ReturnType<typeof loadImageCompression>>
