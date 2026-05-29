import { useState } from 'react';
import Modal from '../common/Modal';
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
    <Modal open={open} onClose={onClose} title={`Add to ${meal}`}>
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            data-testid={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${tab === t.id ? 'bg-brand-500 text-white' : 'btn-secondary'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'nlp' && <NLPFoodTab meal={meal} onSaveMany={handleSaveMany} />}
      {tab === 'manual' && <ManualEntryTab meal={meal} onSave={handleSave} />}
      {tab === 'photo' && <PhotoUploadTab meal={meal} onSave={handleSave} />}
      {tab === 'barcode' && <BarcodeScannerTab meal={meal} onSave={handleSave} />}
      {tab === 'templates' && <MealTemplatesTab meal={meal} onSaveMany={handleSaveMany} />}
    </Modal>
  );
}
