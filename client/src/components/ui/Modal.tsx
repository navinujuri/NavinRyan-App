import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from './icons';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal to <body> so the modal's `position: fixed` is relative to the
  // viewport, not to any transformed ancestor (e.g. the page-transition
  // wrapper in Layout, whose lingering `transform` would otherwise become the
  // containing block and push the panel off-screen behind the backdrop).
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} animate-fade-in rounded-2xl border border-hair2 bg-ink-850 shadow-card`}
      >
        <div className="flex items-center justify-between border-b border-hair px-5 py-4">
          <h3 className="text-base font-semibold text-fg">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-fg-faint transition hover:bg-ink-750 hover:text-fg"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-hair px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
