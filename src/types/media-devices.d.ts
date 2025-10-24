// src/types/media-devices.d.ts
declare module 'html5-qrcode' {
  export interface Html5QrcodeScannerConfig {
    fps: number;
    qrbox?: number | { width: number; height: number };
    aspectRatio?: number;
    disableFlip?: boolean;
    supportedScanTypes?: any[];
  }

  export class Html5QrcodeScanner {
    constructor(
      containerId: string,
      config: Html5QrcodeScannerConfig,
      verbose?: boolean
    );
    
    render(
      onScanSuccess: (decodedText: string) => void,
      onScanFailure?: (error: string) => void
    ): Promise<void>;
    
    clear(): Promise<void>;
  }
}