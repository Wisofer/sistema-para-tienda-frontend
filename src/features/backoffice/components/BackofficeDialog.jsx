import { cn } from "../../../utils/cn.js";

/**
 * Overlay + panel centrado en todos los tamaños (evita sheet inferior + teclado que tapa inputs).
 * El panel tiene altura máxima y scroll interno para móvil / teclado virtual.
 */
export function BackofficeDialog({
  open,
  onClose,
  onBackdropClick,
  children,
  maxWidthClass = "max-w-lg",
  className,
  panelClassName,
}) {
  if (open === false) return null;

  const handleClose = onClose || onBackdropClick;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-y-contain bg-slate-900/45 p-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:bg-slate-900/35 sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose?.();
      }}
    >
      <div
        className={cn(
          "relative my-auto w-full touch-manipulation overflow-x-hidden overflow-y-auto overscroll-y-contain rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-2xl sm:px-5 sm:py-5",
          "max-h-[min(88dvh,calc(100svh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-1.5rem))]",
          "sm:max-h-[min(92dvh,94vh)]",
          maxWidthClass,
          panelClassName,
          className
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
