import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full md:max-w-lg md:rounded-2xl rounded-t-3xl shadow-xl max-h-[90vh] flex flex-col"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
