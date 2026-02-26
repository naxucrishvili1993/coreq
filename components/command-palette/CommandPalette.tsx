"use client";

import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Command } from "cmdk";
import Fuse from "fuse.js";
import {
	Send,
	Plus,
	Layers,
	Clock,
	Settings2,
	FileJson,
	FolderOpen,
	Globe,
	Search,
	X,
	Zap,
	Terminal,
	Trash2,
	Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUiStore } from "@/store/ui-store";
import { useCollectionsStore } from "@/store/collections-store";
import { useEnvironmentStore } from "@/store/environment-store";
import { useHistoryStore } from "@/store/history-store";
import { useRequestStore } from "@/store/request-store";
import { cn, Kbd } from "@/components/ui/primitives";
import { getMethodColor, relativeTime } from "@/lib/utils";
import type { SearchItem } from "@/lib/types";

// ─── Search index builder ─────────────────────────────────────────────────────

function useSearchItems(): SearchItem[] {
	const { collections, folders, requests } = useCollectionsStore();
	const { environments } = useEnvironmentStore();
	const { entries: history } = useHistoryStore();

	return useMemo<SearchItem[]>(() => {
		const items: SearchItem[] = [];

		requests.forEach((r) => {
			const col = collections.find((c) => c.id === r.collectionId);
			items.push({
				id: r.id,
				type: "request",
				title: r.name,
				subtitle: r.url || "No URL",
				method: r.method,
				meta: col?.name,
			});
		});

		collections.forEach((c) =>
			items.push({
				id: c.id,
				type: "collection",
				title: c.name,
				subtitle: `${requests.filter((r) => r.collectionId === c.id).length} requests`,
			}),
		);

		folders.forEach((f) => {
			const col = collections.find((c) => c.id === f.collectionId);
			items.push({ id: f.id, type: "folder", title: f.name, meta: col?.name });
		});

		environments.forEach((e) =>
			items.push({
				id: e.id,
				type: "environment",
				title: e.name,
				subtitle: `${e.variables.length} variables`,
			}),
		);

		history.slice(0, 30).forEach((h) =>
			items.push({
				id: h.id,
				type: "history",
				title: h.requestName ?? h.request.url,
				subtitle: h.request.url,
				method: h.request.method,
				meta: relativeTime(h.timestamp),
			}),
		);

		return items;
	}, [collections, folders, requests, environments, history]);
}

// ─── Icons per type ───────────────────────────────────────────────────────────

function ItemIcon({ item }: { item: SearchItem }) {
	switch (item.type) {
		case "request":
			return (
				<span
					className="text-[10px] font-bold w-10 text-right shrink-0"
					style={{ color: getMethodColor(item.method ?? "GET") }}>
					{item.method}
				</span>
			);
		case "collection":
			return <FileJson size={14} className="text-[var(--accent)] shrink-0" />;
		case "folder":
			return <FolderOpen size={14} className="text-[var(--amber)] shrink-0" />;
		case "environment":
			return <Globe size={14} className="text-[var(--green)] shrink-0" />;
		case "history":
			return (
				<span
					className="text-[10px] font-bold w-10 text-right shrink-0"
					style={{ color: getMethodColor(item.method ?? "GET") }}>
					{item.method}
				</span>
			);
		default:
			return <Search size={14} className="text-[var(--text-muted)] shrink-0" />;
	}
}

// ─── CommandPalette ───────────────────────────────────────────────────────────

export function CommandPalette() {
	const { commandPaletteOpen, closeCommandPalette } = useUiStore();
	const { addCollection, addRequest: storeAddReq } = useCollectionsStore();
	const { addEnvironment, setActiveEnvironment } = useEnvironmentStore();
	const { openNewTab, openRequest } = useRequestStore();
	const { requests } = useCollectionsStore();
	const openEnvModal = useUiStore((s) => s.openEnvironmentModal);
	const openCurlImport = useUiStore((s) => s.openCurlImport);
	const setSidebarPanel = useUiStore((s) => s.setSidebarPanel);

	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const allItems = useSearchItems();

	// Reset query on open
	useEffect(() => {
		if (commandPaletteOpen) {
			setQuery("");
			setTimeout(() => inputRef.current?.focus(), 30);
		}
	}, [commandPaletteOpen]);

	// Fuse.js fuzzy search
	const fuse = useMemo(
		() =>
			new Fuse(allItems, {
				keys: ["title", "subtitle", "method", "meta"],
				threshold: 0.35,
				includeScore: true,
			}),
		[allItems],
	);

	const filteredItems = useMemo<SearchItem[]>(() => {
		if (!query.trim()) return allItems.slice(0, 20);
		return fuse
			.search(query)
			.map((r) => r.item)
			.slice(0, 15);
	}, [query, fuse, allItems]);

	const grouped = useMemo(() => {
		const groups: Record<string, SearchItem[]> = {};
		filteredItems.forEach((item) => {
			if (!groups[item.type]) groups[item.type] = [];
			groups[item.type].push(item);
		});
		return groups;
	}, [filteredItems]);

	const handleSelect = useCallback(
		(item: SearchItem) => {
			closeCommandPalette();
			if (item.type === "request") {
				const req = requests.find((r) => r.id === item.id);
				if (req) openRequest(req);
			} else if (item.type === "history") {
				// handled via history store
			} else if (item.type === "environment") {
				setActiveEnvironment(item.id);
				setSidebarPanel("environments");
			} else if (item.type === "collection") {
				setSidebarPanel("collections");
			}
		},
		[
			requests,
			openRequest,
			closeCommandPalette,
			setActiveEnvironment,
			setSidebarPanel,
		],
	);

	const GROUP_LABELS: Record<string, string> = {
		request: "Requests",
		collection: "Collections",
		folder: "Folders",
		environment: "Environments",
		history: "History",
	};

	return (
		<AnimatePresence>
			{commandPaletteOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.12 }}
						className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
						onClick={closeCommandPalette}
					/>

					{/* Panel */}
					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: -8 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: -8 }}
						transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
						className="fixed left-1/2 top-[18%] z-50 -translate-x-1/2 w-full max-w-[620px] px-4">
						<div className="glass rounded-[12px] overflow-hidden shadow-2xl shadow-black/60">
							<Command
								shouldFilter={false}
								className="flex flex-col"
								onKeyDown={(e) => e.key === "Escape" && closeCommandPalette()}>
								{/* Search input */}
								<div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
									<Search
										size={15}
										className="text-[var(--text-muted)] shrink-0"
									/>
									<Command.Input
										ref={inputRef}
										value={query}
										onValueChange={setQuery}
										placeholder="Search requests, collections, environments…"
									/>
									{query && (
										<button onClick={() => setQuery("")}>
											<X
												size={13}
												className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
											/>
										</button>
									)}
									<Kbd>Esc</Kbd>
								</div>

								{/* Results */}
								<Command.List className="max-h-[380px] overflow-y-auto py-2">
									{/* ── Quick actions (always visible when no query) ─── */}
									{!query && (
										<Command.Group
											heading={<GroupHeader label="Quick Actions" />}>
											<CmdItem
												icon={
													<Plus size={13} className="text-[var(--accent)]" />
												}
												label="New Request"
												shortcut="N"
												onSelect={() => {
													closeCommandPalette();
													openNewTab();
												}}
											/>
											<CmdItem
												icon={
													<Layers size={13} className="text-[var(--violet)]" />
												}
												label="New Collection"
												onSelect={() => {
													closeCommandPalette();
													addCollection("New Collection");
													setSidebarPanel("collections");
												}}
											/>
											<CmdItem
												icon={
													<Globe size={13} className="text-[var(--green)]" />
												}
												label="New Environment"
												onSelect={() => {
													closeCommandPalette();
													addEnvironment();
													openEnvModal();
												}}
											/>
											<CmdItem
												icon={
													<Terminal size={13} className="text-[var(--amber)]" />
												}
												label="Import from cURL"
												onSelect={() => {
													closeCommandPalette();
													openCurlImport();
												}}
											/>
											<CmdItem
												icon={
													<Clock
														size={13}
														className="text-[var(--text-muted)]"
													/>
												}
												label="View History"
												onSelect={() => {
													closeCommandPalette();
													setSidebarPanel("history");
												}}
											/>
										</Command.Group>
									)}

									{/* ── Search results ────────────────────────────────── */}
									{Object.entries(grouped).map(([type, items]) => (
										<Command.Group
											key={type}
											heading={
												<GroupHeader label={GROUP_LABELS[type] ?? type} />
											}>
											{items.map((item) => (
												<Command.Item
													key={item.id}
													value={item.id}
													onSelect={() => handleSelect(item)}
													className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-[7px] cursor-pointer aria-selected:bg-[var(--bg-hover)] transition-colors">
													<ItemIcon item={item} />
													<div className="flex-1 min-w-0">
														<p className="text-[13px] text-[var(--text-primary)] truncate">
															{item.title}
														</p>
														{item.subtitle && (
															<p className="text-[11px] text-[var(--text-muted)] truncate mono">
																{item.subtitle}
															</p>
														)}
													</div>
													{item.meta && (
														<span className="text-[10px] text-[var(--text-muted)] shrink-0">
															{item.meta}
														</span>
													)}
												</Command.Item>
											))}
										</Command.Group>
									))}

									{query && filteredItems.length === 0 && (
										<Command.Empty>
											<div className="py-10 text-center text-[13px] text-[var(--text-muted)]">
												No results for &ldquo;{query}&rdquo;
											</div>
										</Command.Empty>
									)}
								</Command.List>

								{/* Footer */}
								<div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
									<span className="flex items-center gap-1">
										<Kbd>↑</Kbd>
										<Kbd>↓</Kbd> navigate
									</span>
									<span className="flex items-center gap-1">
										<Kbd>↵</Kbd> select
									</span>
									<span className="flex items-center gap-1">
										<Kbd>Esc</Kbd> close
									</span>
								</div>
							</Command>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

function GroupHeader({ label }: { label: string }) {
	return (
		<div className="px-4 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
			{label}
		</div>
	);
}

function CmdItem({
	icon,
	label,
	shortcut,
	onSelect,
}: {
	icon?: React.ReactNode;
	label: string;
	shortcut?: string;
	onSelect: () => void;
}) {
	return (
		<Command.Item
			value={label}
			onSelect={onSelect}
			className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-[7px] cursor-pointer aria-selected:bg-[var(--bg-hover)] transition-colors">
			<span className="shrink-0">{icon}</span>
			<span className="flex-1 text-[13px] text-[var(--text-primary)]">
				{label}
			</span>
			{shortcut && <Kbd>{shortcut}</Kbd>}
		</Command.Item>
	);
}
