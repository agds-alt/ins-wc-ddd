// src/components/admin/QRCodeGenerator.tsx - UPDATED: Use full URL with location ID
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

  // Generate URL for location
  const getLocationURL = (id: string) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${baseUrl}/locations/${id}`;
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `QR-Codes-${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  const handleDownloadSingle = (location: Location) => {
    const svg = document.getElementById(`qr-${location.id}`)?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
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
              {locations.length} location{locations.length > 1 ? 's' : ''} • URL Format
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

        {/* Print Content (Hidden) */}
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            <style>
              {`
                @media print {
                  .qr-print-item {
                    page-break-inside: avoid;
                    page-break-after: auto;
                    margin-bottom: 30mm;
                  }
                  .qr-print-item:last-child {
                    page-break-after: avoid;
                  }
                }
              `}
            </style>
            {locations.map((location) => {
              const locationURL = getLocationURL(location.id);
              
              return (
                <div key={location.id} className="qr-print-item">
                  <div style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20mm',
                    textAlign: 'center',
                    background: 'white',
                  }}>
                    {/* QR Code */}
                    <div style={{ marginBottom: '10mm' }}>
                      <QRCodeSVG
                        value={locationURL}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>

                    {/* Location Info */}
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#111827',
                      }}>
                        {location.name}
                      </h2>
                      
                      {location.code && (
                        <p style={{
                          fontSize: '18px',
                          color: '#2563eb',
                          fontWeight: '600',
                          marginBottom: '8px',
                        }}>
                          {location.code}
                        </p>
                      )}

                      {location.building && (
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '2px' }}>
                          🏢 {location.building}
                        </p>
                      )}

                      {location.floor && (
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '2px' }}>
                          📍 {location.floor}
                        </p>
                      )}

                      {location.area && (
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '2px' }}>
                          📌 {location.area}
                        </p>
                      )}

                      {/* URL - Small print at bottom */}
                      <div style={{
                        marginTop: '12mm',
                        paddingTop: '8px',
                        borderTop: '1px solid #e5e7eb',
                      }}>
                        <p style={{
                          fontSize: '9px',
                          color: '#9ca3af',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                          lineHeight: '1.4',
                        }}>
                          {locationURL}
                        </p>
                      </div>

                      <p style={{
                        marginTop: '12px',
                        fontSize: '14px',
                        color: '#374151',
                        fontWeight: '500',
                      }}>
                        📱 Scan untuk mulai inspeksi
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};