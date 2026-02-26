"use client";

import { useEffect } from "react";
import { useUiStore } from "@/store/ui-store";
import { useRequestStore } from "@/store/request-store";

export function useKeyboardShortcuts() {
	const { toggleCommandPalette, commandPaletteOpen } = useUiStore();
	const { openNewTab, closeTab, activeTabId, tabs, setActiveTab } =
		useRequestStore();

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const ctrl = e.ctrlKey || e.metaKey;

			// Ctrl+K / Cmd+K — command palette
			if (ctrl && e.key === "k") {
				e.preventDefault();
				toggleCommandPalette();
				return;
			}

			if (commandPaletteOpen) return; // don't intercept in palette

			// Ctrl+Enter — send request
			if (ctrl && e.key === "Enter") {
				e.preventDefault();
				// Trigger send on active request — dispatched via custom event
				window.dispatchEvent(new CustomEvent("coreq:send"));
				return;
			}

			// Ctrl+T — new tab
			if (ctrl && e.key === "t") {
				e.preventDefault();
				openNewTab();
				return;
			}

			// Ctrl+W — close current tab
			if (ctrl && e.key === "w") {
				e.preventDefault();
				if (activeTabId) closeTab(activeTabId);
				return;
			}

			// Ctrl+Tab / Ctrl+Shift+Tab — cycle tabs
			if (ctrl && e.key === "Tab") {
				e.preventDefault();
				if (!tabs.length) return;
				const idx = tabs.findIndex((t) => t.id === activeTabId);
				const next = e.shiftKey
					? (idx - 1 + tabs.length) % tabs.length
					: (idx + 1) % tabs.length;
				setActiveTab(tabs[next].id);
				return;
			}

			// Ctrl+1..9 — jump to tab
			if (ctrl && e.key >= "1" && e.key <= "9") {
				e.preventDefault();
				const idx = parseInt(e.key) - 1;
				const tab = tabs[idx];
				if (tab) setActiveTab(tab.id);
				return;
			}
		};

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [
		commandPaletteOpen,
		toggleCommandPalette,
		openNewTab,
		closeTab,
		activeTabId,
		tabs,
		setActiveTab,
	]);
}
