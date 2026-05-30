import { useEffect, useRef, useState, type FormEvent } from 'react';
import { lookupBarcode, type BarcodeProduct } from '../../services/openFoodFacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { Meal, FoodLog } from '../../types/db';

interface Props {
  meal: Meal;
  onSave: (entry: Partial<FoodLog>) => Promise<unknown>;
}

interface QrScanner {
  start(camera: unknown, config: unknown, onDecoded: (text: string) => void, onError: () => void): Promise<void>;
  stop(): Promise<void>;
  clear?(): void;
}

export default function BarcodeScannerTab({ meal, onSave }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState('');
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      const scanner = new Html5Qrcode(id) as unknown as QrScanner;
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decoded: string) => {
          await scanner.stop();
          setScanning(false);
          lookup(decoded);
        },
        () => {}
      );
    } catch {
      setError('Camera not available. Enter barcode manually below.');
      setScanning(false);
    }
  };

  const lookup = async (code: string): Promise<void> => {
    setBusy(true);
    setError(null);
    setProduct(null);
    try {
      const p = await lookupBarcode(code);
      if (!p) setError('Product not found. Try manual entry.');
      else setProduct(p);
    } catch (e) {
      setError((e as Error).message || 'Lookup failed');
    } finally {
      setBusy(false);
    }
  };

  const onManualSearch = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!manual.trim()) return;
    lookup(manual.trim());
  };

  const addToLog = async (): Promise<void> => {
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
        <Button onClick={startScanner} className="w-full">📷 Start camera scan</Button>
      )}
      <form onSubmit={onManualSearch} className="flex gap-2">
        <Input placeholder="Or enter barcode" value={manual} onChange={(e) => setManual(e.target.value)} />
        <Button variant="secondary">Look up</Button>
      </form>
      {busy && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Searching…</div>}
      {error && <div className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
      {product && (
        <Card className="p-3 space-y-1" data-testid="barcode-product">
          <div className="font-semibold">{product.name}</div>
          {product.brand && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{product.brand}</div>}
          <div className="text-sm">{product.calories} kcal · P {product.protein_g}g · C {product.carbs_g}g · F {product.fat_g}g</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>per {product.serving_size}</div>
          <Button onClick={addToLog} className="w-full mt-2">Add to Log</Button>
        </Card>
      )}
    </div>
  );
}
