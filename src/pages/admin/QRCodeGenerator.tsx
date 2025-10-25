// Fix for QRCodeGenerator.tsx useReactToPrint API
// Error di line 27: 'content' does not exist

// src/pages/admin/QRCodeGenerator.tsx (FIXED VERSION)

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer } from 'lucide-react';
import { Tables } from '../../types/database.types';

type Location = Tables<'locations'>;

interface QRCodeGeneratorProps {
  locations: Location[];
  onClose: () => void;
}

export const QRCodeGenerator = ({ locations, onClose }: QRCodeGeneratorProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  // ✅ FIXED: useReactToPrint v3.x API
  const handlePrint = useReactToPrint({
    contentRef: printRef, // v3.x menggunakan contentRef bukan content
    documentTitle: 'WC-Check-QR-Codes',
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page-break {
          page-break-after: always;
        }
      }
    `,
  });

  const handleDownloadPDF = () => {
    if (handlePrint) {
      handlePrint();
    }
  };

  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Generate QR Codes</h2>
            <p className="text-sm text-gray-600 mt-1">
              {locations.length} location{locations.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-6">
          <div ref={printRef} className="space-y-8">
            {locations.map((location, index) => (
              <div
                key={location.id}
                className={`bg-white border-2 border-gray-200 rounded-2xl p-8 ${
                  index < locations.length - 1 ? 'page-break' : ''
                }`}
              >
                {/* Location Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {location.name}
                  </h3>
                  <div className="text-gray-600 space-y-1">
                    {location.building && (
                      <p className="text-lg">Building: {location.building}</p>
                    )}
                    {location.floor && (
                      <p className="text-lg">Floor: {location.floor}</p>
                    )}
                    {location.code && (
                      <p className="text-sm font-mono bg-gray-100 inline-block px-3 py-1 rounded">
                        {location.code}
                      </p>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-6 rounded-2xl border-4 border-gray-900">
                    <QRCodeSVG
                      value={`${baseUrl}/locations/${location.id}`}
                      size={300}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-center text-gray-600 space-y-2">
                  <p className="text-lg font-medium">Scan to Inspect</p>
                  <p className="text-sm">
                    Use the WC Check app to scan this QR code and start your inspection
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                  <p>WC Check - Toilet Monitoring System</p>
                  <p className="mt-1 font-mono">{location.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};