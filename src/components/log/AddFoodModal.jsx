import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import ManualEntryTab from './ManualEntryTab.jsx';
import PhotoUploadTab from './PhotoUploadTab.jsx';
import BarcodeScannerTab from './BarcodeScannerTab.jsx';
import MealTemplatesTab from './MealTemplatesTab.jsx';
import NLPFoodTab from './NLPFoodTab.jsx';

const TABS = [
  { id: 'nlp', label: '✏️ Describe It' },
  { id: 'manual', label: '📝 Manual' },
  { id: 'photo', label: '📸 Photo' },
  { id: 'barcode', label: '📦 Barcode' },
  { id: 'templates', label: '📋 Templates' },
];

export default function AddFoodModal({ open, onClose, meal, onAddEntry, onAddEntries }) {
  const [tab, setTab] = useState('manual');

  const handleSave = async (entry) => {
    await onAddEntry(entry);
    onClose();
  };
  const handleSaveMany = async (rows) => {
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
