// STUB — replaced by the sheets implementation. Interface is fixed.
import type { ReactNode } from 'react';

export interface SheetProps {
  title: string;
  onClose: () => void;
  /** Stock the sheet is printed on. */
  tone?: 'bone' | 'black' | 'paper';
  children: ReactNode;
  /** Optional element shown at the right of the title row. */
  aside?: ReactNode;
}

export function Sheet({ title, onClose, children }: SheetProps) {
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}
