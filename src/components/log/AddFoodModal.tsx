import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ManualEntryTab from './ManualEntryTab';
import PhotoUploadTab from './PhotoUploadTab';
import BarcodeScannerTab from './BarcodeScannerTab';
import MealTemplatesTab from './MealTemplatesTab';
import NLPFoodTab from './NLPFoodTab';
import type { Meal, FoodLog } from '../../types/db';

type TabId = 'nlp' | 'manual' | 'photo' | 'barcode' | 'templates';

interface Props {
  open: boolean;
  onClose: () => void;
  meal: Meal;
  onAddEntry: (entry: Partial<FoodLog>) => Promise<unknown>;
  onAddEntries: (rows: Partial<FoodLog>[]) => Promise<unknown>;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'nlp', label: '✏️ Describe It' },
  { id: 'manual', label: '📝 Manual' },
  { id: 'photo', label: '📸 Photo' },
  { id: 'barcode', label: '📦 Barcode' },
  { id: 'templates', label: '📋 Templates' },
];

export default function AddFoodModal({ open, onClose, meal, onAddEntry, onAddEntries }: Props) {
  const [tab, setTab] = useState<TabId>('manual');

  const handleSave = async (entry: Partial<FoodLog>): Promise<void> => {
    await onAddEntry(entry);
    onClose();
  };
  const handleSaveMany = async (rows: Partial<FoodLog>[]): Promise<void> => {
    await onAddEntries(rows);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to {meal}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)} className="w-full">
          <TabsList className="w-full justify-start">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                data-testid={`tab-${t.id}`}
                style={{
                  backgroundColor: tab === t.id ? 'var(--brand)' : 'var(--surface-2)',
                  color: tab === t.id ? '#fff' : 'var(--text-soft)',
                }}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="nlp"><NLPFoodTab meal={meal} onSaveMany={handleSaveMany} /></TabsContent>
          <TabsContent value="manual"><ManualEntryTab meal={meal} onSave={handleSave} /></TabsContent>
          <TabsContent value="photo"><PhotoUploadTab meal={meal} onSave={handleSave} /></TabsContent>
          <TabsContent value="barcode"><BarcodeScannerTab meal={meal} onSave={handleSave} /></TabsContent>
          <TabsContent value="templates"><MealTemplatesTab meal={meal} onSaveMany={handleSaveMany} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
