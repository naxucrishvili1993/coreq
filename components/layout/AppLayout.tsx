"use client";

import React, { useState } from "react";
import {
	X,
	Plus,
	Command,
	Globe,
	Clock,
	Layers,
	Terminal,
	ChevronDown,
	Menu,
} from "lucide-react";
import { useRequestStore } from "@/store/request-store";
import { useUiStore } from "@/store/ui-store";
import { useEnvironmentStore } from "@/store/environment-store";
import { EnvironmentManager } from "@/components/environment/EnvironmentManager";
import { Button, Kbd, cn } from "@/components/ui/primitives";
import { getMethodColor, parseCurl, createDefaultRequest } from "@/lib/utils";
import type { Tab } from "@/lib/types";

// ─── TabItem ──────────────────────────────────────────────────────────────────

function TabItem({ tab }: { tab: Tab }) {
	const { activeTabId, setActiveTab, closeTab, draftRequests } =
		useRequestStore();
	const isActive = activeTabId === tab.id;
	const req = draftRequests[tab.id];
	const methodColor = req ? getMethodColor(req.method) : undefined;

	return (
		<div
			className={cn(
				"group flex items-center gap-2 px-3 h-9 border-r border-[var(--border)] cursor-pointer transition-colors shrink-0 max-w-[180px] min-w-[100px] select-none",
				isActive && !tab.isPreview
					? "bg-[var(--bg-elevated)] border-b-2 border-b-[var(--accent)] border-r-[var(--border)]"
					: isActive && tab.isPreview
						? "bg-[var(--bg-elevated)] border-b border-b-[var(--border)]"
						: "bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]",
			)}
			onClick={() => setActiveTab(tab.id)}
			onAuxClick={(e) => {
				if (e.button === 1) {
					e.preventDefault();
					closeTab(tab.id);
				}
			}}>
			{methodColor && (
				<span
					className="text-[9px] font-bold shrink-0"
					style={{ color: methodColor }}>
					{req?.method.slice(0, 3)}
				</span>
			)}
			<span className="flex-1 text-[12px] truncate">{tab.label}</span>
			{tab.isDirty && (
				<span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 group-hover:hidden" />
			)}
			<button
				className={cn(
					"shrink-0 hover:text-[var(--red)] transition-colors",
					tab.isDirty
						? "hidden group-hover:block"
						: "opacity-0 group-hover:opacity-100",
				)}
				onClick={(e) => {
					e.stopPropagation();
					closeTab(tab.id);
				}}>
				<X size={11} />
			</button>
		</div>
	);
}

// ─── TabBar ───────────────────────────────────────────────────────────────────

function TabBar() {
	const { tabs, openNewTab } = useRequestStore();

	return (
		<div className="flex items-stretch border-b border-[var(--border)] overflow-x-auto bg-[var(--bg-surface)] shrink-0">
			{tabs.map((tab) => (
				<TabItem key={tab.id} tab={tab} />
			))}
			<button
				className="flex items-center px-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors shrink-0"
				onClick={openNewTab}
				title="New tab (Ctrl+T)">
				<Plus size={13} />
			</button>
		</div>
	);
}

// ─── SidebarNav ───────────────────────────────────────────────────────────────

function SidebarNav() {
	const { sidebarPanel, setSidebarPanel } = useUiStore();

	const items = [
		{ id: "collections", icon: <Layers size={16} />, label: "Collections" },
		{ id: "history", icon: <Clock size={16} />, label: "History" },
		{ id: "environments", icon: <Globe size={16} />, label: "Environments" },
	] as const;

	return (
		<div className="flex flex-col gap-1 p-2 border-r border-[var(--border)] bg-[var(--bg-surface)] w-12 shrink-0">
			{items.map((item) => (
				<button
					key={item.id}
					title={item.label}
					onClick={() => setSidebarPanel(item.id)}
					className={cn(
						"flex items-center justify-center h-9 w-8 rounded-[6px] transition-colors",
						sidebarPanel === item.id
							? "bg-[var(--accent-muted)] text-[var(--accent)]"
							: "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
					)}>
					{item.icon}
				</button>
			))}
		</div>
	);
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
	const openCommandPalette = useUiStore((s) => s.openCommandPalette);
	const openEnvModal = useUiStore((s) => s.openEnvironmentModal);
	const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);
	const { environments, activeEnvironmentId, setActiveEnvironment } =
		useEnvironmentStore();

	return (
		<header className="flex items-center gap-2 px-3 h-11 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
			{/* Hamburger – mobile only */}
			<button
				onClick={toggleMobileSidebar}
				className="md:hidden flex items-center justify-center w-8 h-8 rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors shrink-0">
				<Menu size={16} />
			</button>

			{/* Logo */}
			<div className="flex items-center gap-2 mr-2 shrink-0">
				<div className="w-6 h-6 rounded-[5px] bg-[var(--accent)] flex items-center justify-center">
					<Terminal size={12} className="text-white" />
				</div>
				<span className="text-[13px] font-bold tracking-tight text-[var(--text-primary)]">
					Coreq
				</span>
			</div>

			{/* Command palette trigger */}
			<button
				onClick={openCommandPalette}
				className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] text-[12px] hover:border-[var(--accent)] transition-colors flex-1 max-w-[280px] min-w-0">
				<Command size={11} className="shrink-0" />
				<span className="hidden sm:block flex-1 text-left truncate">
					Search or run command…
				</span>
				<span className="hidden sm:flex">
					<Kbd>⌘K</Kbd>
				</span>
			</button>

			<div className="flex-1" />

			{/* Environment picker – hidden on small screens, shown in mobile drawer */}
			<div className="hidden sm:flex items-center gap-2 shrink-0">
				<Globe size={13} className="text-[var(--text-muted)]" />
				<select
					value={activeEnvironmentId ?? ""}
					onChange={(e) => setActiveEnvironment(e.target.value || null)}
					className="text-[12px] bg-transparent text-[var(--text-secondary)] border-none outline-none cursor-pointer hover:text-[var(--text-primary)] transition-colors appearance-none">
					<option value="">No Environment</option>
					{environments.map((e) => (
						<option key={e.id} value={e.id}>
							{e.name}
						</option>
					))}
				</select>
				<button
					className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
					onClick={openEnvModal}
					title="Manage environments">
					<ChevronDown size={12} />
				</button>
			</div>
		</header>
	);
}

// ─── CurlImportModal ──────────────────────────────────────────────────────────

function CurlImportModal() {
	const { curlImportOpen, closeCurlImport } = useUiStore();
	const { openNewTab, updateDraft } = useRequestStore();
	const [curl, setCurl] = useState("");
	const [error, setError] = useState("");

	const handleImport = () => {
		const parsed = parseCurl(curl);
		if (!parsed) {
			setError("Could not parse cURL command");
			return;
		}
		openNewTab();
		setTimeout(() => {
			const { activeTabId } = useRequestStore.getState();
			if (activeTabId) {
				updateDraft(activeTabId, {
					...createDefaultRequest(parsed),
					name: "Imported from cURL",
				});
			}
		}, 10);
		closeCurlImport();
		setCurl("");
		setError("");
	};

	if (!curlImportOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="glass rounded-[12px] w-full max-w-[540px] mx-4 p-5 shadow-2xl animate-slide-in">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
						Import from cURL
					</h2>
					<button
						onClick={() => {
							closeCurlImport();
							setCurl("");
							setError("");
						}}
						className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
						<X size={14} />
					</button>
				</div>
				<textarea
					className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[6px] p-3 mono text-[12px] text-[var(--text-primary)] resize-none focus:border-[var(--accent)] outline-none"
					rows={6}
					placeholder="curl -X POST https://api.example.com/ -H 'Content-Type: application/json' -d '{...}'"
					value={curl}
					onChange={(e) => {
						setCurl(e.target.value);
						setError("");
					}}
				/>
				{error && <p className="text-[11px] text-[var(--red)] mt-1">{error}</p>}
				<div className="flex justify-end gap-2 mt-3">
					<button
						onClick={() => {
							closeCurlImport();
							setCurl("");
							setError("");
						}}
						className="px-3 py-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
						Cancel
					</button>
					<button
						onClick={handleImport}
						className="px-4 py-1.5 rounded-[6px] bg-[var(--accent)] text-white text-[12px] font-medium hover:bg-[var(--accent-hover)]">
						Import
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── EnvironmentModal ─────────────────────────────────────────────────────────

function EnvironmentModal() {
	const { environmentModalOpen, closeEnvironmentModal } = useUiStore();

	if (!environmentModalOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="glass rounded-[12px] w-full max-w-[680px] max-h-[70vh] mx-4 flex flex-col shadow-2xl animate-slide-in overflow-hidden">
				<div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
					<h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
						Environments
					</h2>
					<button
						onClick={closeEnvironmentModal}
						className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
						<X size={14} />
					</button>
				</div>
				<div className="flex-1 overflow-hidden">
					<EnvironmentManager />
				</div>
			</div>
		</div>
	);
}

// ─── AppLayout (exported) ─────────────────────────────────────────────────────

export { Header, SidebarNav, TabBar, EnvironmentModal, CurlImportModal };
