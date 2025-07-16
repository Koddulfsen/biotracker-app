import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    startScanner();
    
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setError(null);
      setScanning(true);

      const html5Qrcode = new Html5Qrcode("reader");
      html5QrcodeRef.current = html5Qrcode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5Qrcode.BARCODE_FORMATS.UPC_A,
          Html5Qrcode.BARCODE_FORMATS.UPC_E,
          Html5Qrcode.BARCODE_FORMATS.EAN_13,
          Html5Qrcode.BARCODE_FORMATS.EAN_8,
          Html5Qrcode.BARCODE_FORMATS.CODE_128,
          Html5Qrcode.BARCODE_FORMATS.CODE_39,
        ]
      };

      await html5Qrcode.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore frequent scan errors
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      if (err.toString().includes('NotAllowedError')) {
        setPermissionDenied(true);
        setError('Camera permission denied. Please allow camera access to scan barcodes.');
      } else if (err.toString().includes('NotFoundError')) {
        setError('No camera found. Please ensure your device has a camera.');
      } else {
        setError('Failed to start scanner. Please try again.');
      }
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleScanSuccess = async (barcode) => {
    // Stop scanning to prevent multiple scans
    await stopScanner();
    setScanning(false);
    
    // Vibrate if available
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Call parent callback with barcode
    onScanSuccess(barcode);
  };

  const handleManualEntry = () => {
    const barcode = prompt('Enter barcode number:');
    if (barcode && barcode.trim()) {
      onScanSuccess(barcode.trim());
    }
  };

  const handleRetry = () => {
    setError(null);
    setPermissionDenied(false);
    startScanner();
  };

  return (
    <div className="barcode-scanner-modal">
      <div className="scanner-container">
        <div className="scanner-header">
          <h2>Scan Barcode</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="scanner-body">
          {error ? (
            <div className="error-container">
              <div className="error-message">{error}</div>
              {permissionDenied ? (
                <div className="permission-help">
                  <p>To enable camera access:</p>
                  <ol>
                    <li>Click the camera icon in your browser's address bar</li>
                    <li>Select "Allow" for camera permissions</li>
                    <li>Refresh the page and try again</li>
                  </ol>
                </div>
              ) : null}
              <div className="error-actions">
                <button className="retry-button" onClick={handleRetry}>
                  Try Again
                </button>
                <button className="manual-button" onClick={handleManualEntry}>
                  Enter Manually
                </button>
              </div>
            </div>
          ) : (
            <>
              <div id="reader" ref={scannerRef} className="scanner-viewfinder"></div>
              <div className="scanner-instructions">
                <p>Position the barcode within the frame</p>
                {scanning && <div className="scanning-indicator">Scanning...</div>}
              </div>
            </>
          )}
        </div>

        <div className="scanner-footer">
          <button className="manual-entry-link" onClick={handleManualEntry}>
            Enter barcode manually
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;