"use client";

import { useCallback } from "react";
import { toast } from "sonner";

interface UseDeleteWithUndoOptions<T> {
  removeFn: (id: string) => void;
  restoreFn: (item: T) => void;
  label: string;
}

export function useDeleteWithUndo<T>(
  opts: UseDeleteWithUndoOptions<T>
): (item: T & { id: string }) => void {
  const { removeFn, restoreFn, label } = opts;
  return useCallback(
    (item: T & { id: string }) => {
      removeFn(item.id);
      toast(label, {
        duration: 7000,
        action: {
          label: "되돌리기",
          onClick: () => restoreFn(item),
        },
      });
    },
    [removeFn, restoreFn, label]
  );
}

interface CustomItemsStore<T> {
  setState: (
    updater: (state: { customItems: T[] }) => { customItems: T[] }
  ) => void;
}

export function restoreAtIndex<T>(
  store: CustomItemsStore<T>,
  item: T,
  atIndex: number
): void {
  store.setState((state) => {
    const insertAt = Math.min(Math.max(atIndex, 0), state.customItems.length);
    const next = [...state.customItems];
    next.splice(insertAt, 0, item);
    return { customItems: next };
  });
}
