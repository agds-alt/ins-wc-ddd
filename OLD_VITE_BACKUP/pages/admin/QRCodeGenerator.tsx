// src/components/admin/QRCodeGenerator.tsx - FIXED: Production URL
import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Tables } from '../../types/database.types';
import { X, Printer, Download } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type Location = Tables<'locations'>;

interface QRCodeGeneratorProps {
  locations: Location[];
  onClose: () => void;
}

export const QRCodeGenerator = ({ locations, onClose }: QRCodeGeneratorProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  // FIXED: Prioritize production URL
  const getLocationURL = (id: string) => {
    const productionUrl = 'https://wc-checks.vercel.app';
    const envUrl = import.meta.env.VITE_APP_URL;

    // Use production URL if not in dev mode
    const baseUrl = import.meta.env.DEV ? (envUrl || window.location.origin) : productionUrl;

    return `${baseUrl}/locations/${id}`;
  };

  const isSingleQR = locations.length === 1;

  // ✅ FIXED: react-to-print v3 API - use contentRef instead of content
  const handlePrint = useReactToPrint({
    contentRef: printRef,  // v3: Pass ref directly, not a function
    documentTitle: `QR-Codes-${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: A4;
        margin: ${isSingleQR ? '10mm' : '15mm'};
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    onBeforeGetContent: () => {
      console.log('🖨️ Preparing to print...', { locations: locations.length });
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log('✅ Print completed');
    },
    onPrintError: (error) => {
      console.error('❌ Print error:', error);
    },
  });

  const handleDownloadSingle = (location: Location) => {
    const svg = document.getElementById(`qr-${location.id}`)?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Set canvas size to match desired output
    const size = 512;
    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      if (!ctx) return;

      // Fill white background first
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      // Get original SVG dimensions
      const svgWidth = svg.width.baseVal.value || 120;
      const svgHeight = svg.height.baseVal.value || 120;

      // Calculate scaling to fill canvas while maintaining aspect ratio
      const scale = Math.min(size / svgWidth, size / svgHeight);
      const scaledWidth = svgWidth * scale;
      const scaledHeight = svgHeight * scale;

      // Center the QR code
      const x = (size - scaledWidth) / 2;
      const y = (size - scaledHeight) / 2;

      // Draw scaled and centered QR code
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `QR-${location.code || location.name}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white pb-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">QR Code Generator</h2>
            <p className="text-sm text-gray-600 mt-1">
              {locations.length} location{locations.length > 1 ? 's' : ''} • Production URL
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 my-4">
          <Button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            <Printer className="w-5 h-5" />
            <span>Print All ({locations.length})</span>
          </Button>
        </div>

        {/* QR Codes Preview */}
        <div className="space-y-4">
          {locations.map((location) => {
            const locationURL = getLocationURL(location.id);
            
            return (
              <Card key={location.id} className="bg-gray-50">
                <div className="flex items-center space-x-4">
                  {/* QR Code */}
                  <div id={`qr-${location.id}`} className="flex-shrink-0 bg-white p-2 rounded-lg">
                    <QRCodeSVG
                      value={locationURL}
                      size={120}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  {/* Location Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {location.name}
                    </h3>
                    {location.code && (
                      <p className="text-sm text-blue-600 font-medium">
                        Code: {location.code}
                      </p>
                    )}
                    <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                      {location.building && <p>🏢 {location.building}</p>}
                      {location.floor && <p>📍 {location.floor}</p>}
                      {location.area && <p>📌 {location.area}</p>}
                    </div>
                    
                    {/* URL Display */}
                    <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">QR URL:</p>
                      <p className="text-xs font-mono text-gray-700 break-all">
                        {locationURL}
                      </p>
                    </div>
                  </div>

                  {/* Download Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadSingle(location)}
                    className="flex-shrink-0"
                    title="Download PNG"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Print Content (Hidden Off-Screen) */}
        <div style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '210mm',  // A4 width
          background: 'white'
        }}>
          <div ref={printRef}>
            {isSingleQR ? (
              // SINGLE QR: Full Page, Large Size
              <div style={{
                width: '100%',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '20mm',
              }}>
                {locations.map((location) => {
                  const locationURL = getLocationURL(location.id);
                  return (
                    <div key={location.id}>
                      {/* Large QR Code */}
                      <div style={{ marginBottom: '15mm' }}>
                        <QRCodeSVG
                          value={locationURL}
                          size={400}
                          level="H"
                          includeMargin={true}
                        />
                      </div>

                      {/* Location Info */}
                      <h1 style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        marginBottom: '12px',
                        color: '#111827',
                      }}>
                        {location.name}
                      </h1>

                      {location.code && (
                        <p style={{
                          fontSize: '24px',
                          color: '#2563eb',
                          fontWeight: '600',
                          marginBottom: '12px',
                        }}>
                          Code: {location.code}
                        </p>
                      )}

                      <div style={{ fontSize: '18px', color: '#6b7280', marginTop: '8mm' }}>
                        {location.building && <p style={{ marginBottom: '6px' }}>🏢 {location.building}</p>}
                        {location.floor && <p style={{ marginBottom: '6px' }}>📍 {location.floor}</p>}
                        {location.area && <p>📌 {location.area}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // BULK QR: Grid Layout - 6 per page (2 columns x 3 rows)
              <div>
                <style>
                  {`
                    @media print {
                      .qr-grid-container {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 8mm;
                        page-break-inside: avoid;
                      }
                      .qr-grid-item {
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        padding: 6mm;
                        text-align: center;
                        background: white;
                        page-break-inside: avoid;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                      }
                      .qr-code-wrapper {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        margin-bottom: 3mm;
                      }
                      .qr-page-break {
                        page-break-after: always;
                      }
                    }
                  `}
                </style>
                {Array.from({ length: Math.ceil(locations.length / 6) }).map((_, pageIndex) => {
                  const pageLocations = locations.slice(pageIndex * 6, (pageIndex + 1) * 6);
                  const isLastPage = pageIndex === Math.ceil(locations.length / 6) - 1;

                  return (
                    <div key={pageIndex} className={!isLastPage ? 'qr-page-break' : ''}>
                      <div className="qr-grid-container">
                        {pageLocations.map((location) => {
                          const locationURL = getLocationURL(location.id);
                          return (
                            <div key={location.id} className="qr-grid-item">
                              {/* QR Code - Centered */}
                              <div className="qr-code-wrapper">
                                <QRCodeSVG
                                  value={locationURL}
                                  size={140}
                                  level="H"
                                  includeMargin={true}
                                />
                              </div>

                              {/* Location Info */}
                              <h3 style={{
                                fontSize: '15px',
                                fontWeight: 'bold',
                                marginBottom: '3px',
                                color: '#111827',
                              }}>
                                {location.name}
                              </h3>

                              {location.code && (
                                <p style={{
                                  fontSize: '13px',
                                  color: '#2563eb',
                                  fontWeight: '600',
                                  marginBottom: '3px',
                                }}>
                                  {location.code}
                                </p>
                              )}

                              <div style={{ fontSize: '10px', color: '#6b7280' }}>
                                {location.building && <div>{location.building}</div>}
                                {location.floor && <div>{location.floor}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};