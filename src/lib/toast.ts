import { createContext, useContext } from "react";

export const ToastCtx = createContext<(message: string) => void>(() => {});

/** Show a short message (auto-dismisses). */
export const useToast = () => useContext(ToastCtx);
