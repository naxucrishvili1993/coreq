import { create } from "zustand";
import type { SidebarPanel } from "@/lib/types";

interface UiState {
	// Sidebar
	sidebarPanel: SidebarPanel;
	sidebarWidth: number;
	sidebarCollapsed: boolean;
	setSidebarPanel: (panel: SidebarPanel) => void;
	toggleSidebarCollapsed: () => void;

	// Command palette
	commandPaletteOpen: boolean;
	openCommandPalette: () => void;
	closeCommandPalette: () => void;
	toggleCommandPalette: () => void;

	// Environment modal
	environmentModalOpen: boolean;
	openEnvironmentModal: () => void;
	closeEnvironmentModal: () => void;

	// Import / Export modal
	importModalOpen: boolean;
	openImportModal: () => void;
	closeImportModal: () => void;

	// Curl import modal
	curlImportOpen: boolean;
	openCurlImport: () => void;
	closeCurlImport: () => void;

	// Mobile sidebar drawer
	mobileSidebarOpen: boolean;
	openMobileSidebar: () => void;
	closeMobileSidebar: () => void;
	toggleMobileSidebar: () => void;

	// Response panel height
	responsePanelHeight: number;
	setResponsePanelHeight: (h: number) => void;
}

export const useUiStore = create<UiState>()((set) => ({
	sidebarPanel: "collections",
	sidebarWidth: 260,
	sidebarCollapsed: false,
	setSidebarPanel: (panel) => set({ sidebarPanel: panel }),
	toggleSidebarCollapsed: () =>
		set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

	commandPaletteOpen: false,
	openCommandPalette: () => set({ commandPaletteOpen: true }),
	closeCommandPalette: () => set({ commandPaletteOpen: false }),
	toggleCommandPalette: () =>
		set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

	environmentModalOpen: false,
	openEnvironmentModal: () => set({ environmentModalOpen: true }),
	closeEnvironmentModal: () => set({ environmentModalOpen: false }),

	importModalOpen: false,
	openImportModal: () => set({ importModalOpen: true }),
	closeImportModal: () => set({ importModalOpen: false }),

	curlImportOpen: false,
	openCurlImport: () => set({ curlImportOpen: true }),
	closeCurlImport: () => set({ curlImportOpen: false }),

	mobileSidebarOpen: false,
	openMobileSidebar: () => set({ mobileSidebarOpen: true }),
	closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
	toggleMobileSidebar: () =>
		set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

	responsePanelHeight: 320,
	setResponsePanelHeight: (h) => set({ responsePanelHeight: h }),
}));
