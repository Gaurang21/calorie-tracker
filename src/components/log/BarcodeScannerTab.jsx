import { useEffect, useRef, useState } from 'react';
import { lookupBarcode } from '../../services/openFoodFacts.js';

export default function BarcodeScannerTab({ meal, onSave }) {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState('');
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear?.();
      }
    };
  }, []);

  const startScanner = async () => {
    setError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const id = 'barcode-scanner';
      if (!containerRef.current) return;
      containerRef.current.innerHTML = `<div id="${id}" class="w-full"></div>`;
      const scanner = new Html5Qrcode(id);
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decoded) => {
          await scanner.stop();
          setScanning(false);
          lookup(decoded);
        },
        () => {}
      );
    } catch (e) {
      setError('Camera not available. Enter barcode manually below.');
      setScanning(false);
    }
  };

  const lookup = async (code) => {
    setBusy(true);
    setError(null);
    setProduct(null);
    try {
      const p = await lookupBarcode(code);
      if (!p) setError('Product not found. Try manual entry.');
      else setProduct(p);
    } catch (e) {
      setError(e.message || 'Lookup failed');
    } finally {
      setBusy(false);
    }
  };

  const onManualSearch = (e) => {
    e.preventDefault();
    if (!manual.trim()) return;
    lookup(manual.trim());
  };

  const addToLog = async () => {
    if (!product) return;
    await onSave({
      meal,
      name: product.brand ? `${product.brand} ${product.name}` : product.name,
      calories: product.calories,
      protein_g: product.protein_g,
      carbs_g: product.carbs_g,
      fat_g: product.fat_g,
      serving_size: product.serving_size,
      source: 'barcode',
    });
  };

  return (
    <div className="space-y-3">
      <div ref={containerRef} />
      {!scanning && !product && (
        <button onClick={startScanner} className="btn-primary w-full">📷 Start camera scan</button>
      )}
      <form onSubmit={onManualSearch} className="flex gap-2">
        <input className="input" placeholder="Or enter barcode" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button className="btn-secondary">Look up</button>
      </form>
      {busy && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Searching…</div>}
      {error && <div className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
      {product && (
        <div className="card p-3 space-y-1" data-testid="barcode-product">
          <div className="font-semibold">{product.name}</div>
          {product.brand && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{product.brand}</div>}
          <div className="text-sm">{product.calories} kcal · P {product.protein_g}g · C {product.carbs_g}g · F {product.fat_g}g</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>per {product.serving_size}</div>
          <button onClick={addToLog} className="btn-primary w-full mt-2">Add to Log</button>
        </div>
      )}
    </div>
  );
}
