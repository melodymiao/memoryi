export interface ConfirmDialogProps {
  title: string
  message: string
  /** The safe choice — dismisses the dialog and stays put. */
  cancelLabel: string
  /** The destructive / leaving choice. */
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}

/** Small centered confirmation modal. Backdrop tap = cancel. */
export function ConfirmDialog({ title, message, cancelLabel, confirmLabel, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-screen-x" role="alertdialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label={cancelLabel} onClick={onCancel} className="absolute inset-0 cursor-default bg-ink/40" />
      <div className="relative flex w-full max-w-sm flex-col gap-4 rounded-card bg-background p-6 shadow-float">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-[19px] font-bold text-ink">{title}</h2>
          <p className="text-sm text-ink-soft">{message}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={onCancel} className="w-full rounded-pill bg-accent py-3.5 text-[13.5px] font-bold text-on-accent">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="w-full rounded-pill bg-surface py-3.5 text-[13.5px] font-bold text-ink">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
