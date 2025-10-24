// src/hooks/useQRScanner.ts
import { useState } from 'react';

export const useQRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const handleScan = (result: string) => {
    setScanResult(result);
    setIsScanning(false);
    return result;
  };

  const resetScan = () => {
    setScanResult(null);
  };

  return {
    isScanning,
    scanResult,
    startScanning,
    stopScanning,
    handleScan,
    resetScan,
  };
};