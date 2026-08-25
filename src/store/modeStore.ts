import { create } from "zustand";

interface ModeState {
  isExpertMode: boolean;
  toggleExpertMode: () => void;
  setExpertMode: (enabled: boolean) => void;
  // 扩展状态：专家模式下的高级功能开关
  showRawJsonPayloads: boolean;
  showTraceTokens: boolean;
  showMcpMetadata: boolean;
  toggleShowRawJsonPayloads: () => void;
  toggleShowTraceTokens: () => void;
  toggleShowMcpMetadata: () => void;
}

const STORAGE_KEY = "no_code_platform_is_expert_mode";

const getInitialExpertMode = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? JSON.parse(saved) : false;
  } catch {
    return false;
  }
};

export const useModeStore = create<ModeState>((set) => ({
  isExpertMode: getInitialExpertMode(),

  toggleExpertMode: () =>
    set((state) => {
      const nextValue = !state.isExpertMode;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
      } catch {
        // ignore storage error
      }
      return { isExpertMode: nextValue };
    }),

  setExpertMode: (enabled: boolean) =>
    set(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
      } catch {
        // ignore storage error
      }
      return { isExpertMode: enabled };
    }),

  showRawJsonPayloads: true,
  showTraceTokens: true,
  showMcpMetadata: true,

  toggleShowRawJsonPayloads: () =>
    set((state) => ({ showRawJsonPayloads: !state.showRawJsonPayloads })),

  toggleShowTraceTokens: () =>
    set((state) => ({ showTraceTokens: !state.showTraceTokens })),

  toggleShowMcpMetadata: () =>
    set((state) => ({ showMcpMetadata: !state.showMcpMetadata })),
}));
