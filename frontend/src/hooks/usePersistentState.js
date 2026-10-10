// usePersistentState.js
// Drop-in replacement for useState(initialData) that automatically reads
// from and writes through to the shared storageService (localStorage-backed).
// Usage: const [items, setItems] = usePersistentState("students");
//
// Optimized for high performance and stability:
//   - Deep equality check prevents unnecessary re-renders when data has not changed.
//   - Origin tagging prevents self-triggering render loops.
//   - Real-time cross-component and cross-tab synchronization.

import { useState, useEffect, useRef, useCallback } from "react";
import * as storageService from "../services/storageService";

function isDeepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== "object" || typeof b !== "object") return a === b;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function usePersistentState(key) {
  const [value, setValue] = useState(() => storageService.getData(key));
  const hookId = useRef("hook_" + Math.random().toString(36).substring(2, 9));
  const isFirstRun = useRef(true);
  const lastWritten = useRef(value);

  // Write through to storage whenever THIS hook's own state changes.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!isDeepEqual(value, lastWritten.current)) {
      lastWritten.current = value;
      storageService.setData(key, value, hookId.current);
    }
  }, [key, value]);

  // React to changes made by other components/tabs to this same key.
  useEffect(() => {
    function syncFromStorage() {
      const fresh = storageService.getData(key);
      if (!isDeepEqual(fresh, lastWritten.current)) {
        lastWritten.current = fresh;
        setValue(fresh);
      }
    }

    function onCustomUpdate(e) {
      // Don't re-sync if this hook itself was the author of the update
      if (e.detail?.key === key && e.detail?.source !== hookId.current) {
        syncFromStorage();
      }
    }

    function onNativeStorageEvent(e) {
      if (!e.key || e.key === "educloud_data") {
        syncFromStorage();
      }
    }

    window.addEventListener("educloud-storage-update", onCustomUpdate);
    window.addEventListener("storage", onNativeStorageEvent);
    return () => {
      window.removeEventListener("educloud-storage-update", onCustomUpdate);
      window.removeEventListener("storage", onNativeStorageEvent);
    };
  }, [key]);

  const updateValue = useCallback((updater) => {
    setValue((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (isDeepEqual(prev, next)) {
        return prev;
      }
      return next;
    });
  }, []);

  return [value, updateValue];
}
