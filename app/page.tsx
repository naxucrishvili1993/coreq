"use client";

import React from "react";
import { useRequestStore } from "@/store/request-store";
import { useUiStore } from "@/store/ui-store";
import { useEnvironmentStore } from "@/store/environment-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { CollectionsSidebar } from "@/components/collections/CollectionsSidebar";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { EnvironmentManager } from "@/components/environment/EnvironmentManager";
import { RequestEditor } from "@/components/request/RequestEditor";
import { ResponsePanel } from "@/components/response/ResponsePanel";
import { ResizableVSplit } from "@/components/ui/resizable";
import {
	Header,
	SidebarNav,
	TabBar,
	EnvironmentModal,
	CurlImportModal,
} from "@/components/layout/AppLayout";
import { Plus, Send, Terminal, Globe, ChevronDown, X } from "lucide-react";

// ─── Welcome screen ────────────────────────────────────────────────────────────

function WelcomeScreen() {
	const openNewTab = useRequestStore((s) => s.openNewTab);
	const openCommandPalette = useUiStore((s) => s.openCommandPalette);
	const openCurlImport = useUiStore((s) => s.openCurlImport);

	return (
		<div className="flex flex-col items-center justify-center h-full gap-8 text-center px-8">
			<div className="flex flex-col items-center gap-3">
				<div className="w-14 h-14 rounded-[14px] bg-[var(--accent)] flex items-center justify-center shadow-lg">
					<Terminal size={26} className="text-white" />
				</div>
				<h1 className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight">
					Welcome to Coreq
				</h1>
				<p className="text-[13px] text-[var(--text-secondary)] max-w-[300px] leading-relaxed">
					The fastest way to talk to APIs.
					<br />
					Keyboard-first. Dark-mode-only. Instant.
				</p>
			</div>

			<div className="flex flex-col gap-2.5 w-full max-w-[280px]">
				<button
					onClick={openNewTab}
					className="flex items-center gap-3 px-4 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-[8px] text-[13px] font-medium transition-colors">
					<Plus size={14} />
					<span>New Request</span>
					<span className="ml-auto opacity-70 text-[11px]">Ctrl+T</span>
				</button>
				<button
					onClick={openCommandPalette}
					className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-[8px] text-[13px] font-medium transition-colors">
					<Send size={14} />
					<span>Open Command Palette</span>
					<span className="ml-auto opacity-50 text-[11px]">⌘K</span>
				</button>
				<button
					onClick={openCurlImport}
					className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-[8px] text-[13px] font-medium transition-colors">
					<Terminal size={14} />
					<span>Import from cURL</span>
				</button>
			</div>

			<div className="flex flex-wrap justify-center gap-6 text-[11px] text-[var(--text-muted)]">
				<span>
					<kbd className="text-[var(--text-secondary)] mr-1">Ctrl+K</kbd>Command
					palette
				</span>
				<span>
					<kbd className="text-[var(--text-secondary)] mr-1">Ctrl+T</kbd>New tab
				</span>
				<span>
					<kbd className="text-[var(--text-secondary)] mr-1">Ctrl+↵</kbd>Send
					request
				</span>
				<span>
					<kbd className="text-[var(--text-secondary)] mr-1">Ctrl+W</kbd>Close
					tab
				</span>
			</div>
		</div>
	);
}

// ─── Sidebar panel switcher ────────────────────────────────────────────────────

function SidebarContent() {
	const sidebarPanel = useUiStore((s) => s.sidebarPanel);
	return (
		<div className="h-full">
			{sidebarPanel === "collections" && <CollectionsSidebar />}
			{sidebarPanel === "history" && <HistoryPanel />}
			{sidebarPanel === "environments" && <EnvironmentManager />}
		</div>
	);
}

// ─── Main workspace ────────────────────────────────────────────────────────────

function Workspace() {
	const { tabs, activeTabId } = useRequestStore();

	if (!activeTabId || tabs.length === 0) {
		return <WelcomeScreen />;
	}

	return (
		<ResizableVSplit
			className="h-full"
			initialBottomHeight={300}
			topSlot={<RequestEditor tabId={activeTabId} />}
			bottomSlot={
				<div className="bg-[var(--bg-surface)] h-full border-t border-[var(--border)]">
					<ResponsePanel tabId={activeTabId} />
				</div>
			}
		/>
	);
}

// ─── Mobile sidebar drawer ──────────────────────────────────────────────────

function MobileSidebar() {
	const { mobileSidebarOpen, closeMobileSidebar, openEnvironmentModal } =
		useUiStore();
	const { environments, activeEnvironmentId, setActiveEnvironment } =
		useEnvironmentStore();

	if (!mobileSidebarOpen) return null;

	return (
		<div className="fixed inset-0 z-40 md:hidden">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60"
				onClick={closeMobileSidebar}
			/>
			{/* Drawer */}
			<div className="absolute inset-y-0 left-0 flex flex-col w-[280px] max-w-[85vw] bg-[var(--bg-surface)] border-r border-[var(--border)] shadow-2xl">
				{/* Drawer header – env picker */}
				<div className="flex items-center gap-2 px-3 h-11 border-b border-[var(--border)] shrink-0">
					<Globe size={13} className="text-[var(--text-muted)] shrink-0" />
					<select
						value={activeEnvironmentId ?? ""}
						onChange={(e) => setActiveEnvironment(e.target.value || null)}
						className="flex-1 text-[12px] bg-transparent text-[var(--text-secondary)] border-none outline-none cursor-pointer appearance-none min-w-0">
						<option value="">No Environment</option>
						{environments.map((e) => (
							<option key={e.id} value={e.id}>
								{e.name}
							</option>
						))}
					</select>
					<button
						onClick={openEnvironmentModal}
						className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
						title="Manage environments">
						<ChevronDown size={12} />
					</button>
					<button
						onClick={closeMobileSidebar}
						className="ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0">
						<X size={14} />
					</button>
				</div>
				{/* Nav icons + panel content */}
				<div className="flex flex-1 overflow-hidden">
					<SidebarNav />
					<div className="flex-1 overflow-hidden border-l border-[var(--border)]">
						<SidebarContent />
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Root app ──────────────────────────────────────────────────────────────────

export default function App() {
	useKeyboardShortcuts();

	return (
		<div className="flex flex-col h-screen bg-[var(--bg-base)] overflow-hidden">
			<Header />

			<div className="flex flex-1 overflow-hidden">
				{/* Desktop-only sidebar nav */}
				<div className="hidden md:flex">
					<SidebarNav />
				</div>

				{/* Desktop-only sidebar panel */}
				<div
					className="hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shrink-0"
					style={{ width: 240 }}>
					<SidebarContent />
				</div>

				{/* Main workspace – always full width on mobile */}
				<div className="flex flex-col flex-1 overflow-hidden min-w-0">
					<TabBar />
					<div className="flex-1 overflow-hidden">
						<Workspace />
					</div>
				</div>
			</div>

			{/* Mobile drawer */}
			<MobileSidebar />

			{/* Global overlays */}
			<CommandPalette />
			<EnvironmentModal />
			<CurlImportModal />
		</div>
	);
}
