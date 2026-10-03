import { createContext, useContext } from "react";

export interface Notice {
  text: string;
  /** Which inline spot shows it, e.g. "budget" or "area-los-cristianos" */
  where: string;
  n: number;
}

export interface ToastApi {
  toast: (message: string) => void;
  /** Toast + an inline banner at `where` for a few seconds (toasts need iOS 17+). */
  important: (message: string, where: string) => void;
  notice: Notice | null;
}

export const ToastCtx = createContext<ToastApi>({ toast: () => {}, important: () => {}, notice: null });

/** Show a short message (auto-dismisses). */
export const useToast = () => useContext(ToastCtx).toast;
export const useImportant = () => useContext(ToastCtx).important;
export const useNotice = () => useContext(ToastCtx).notice;
