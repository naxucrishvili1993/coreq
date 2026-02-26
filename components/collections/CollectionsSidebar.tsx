"use client";

import React, { useState, useCallback } from "react";
import {
	ChevronRight,
	ChevronDown,
	FolderOpen,
	Folder as FolderIcon,
	FileJson,
	MoreHorizontal,
	Plus,
	Edit2,
	Trash2,
	Copy,
	Download,
	Upload,
} from "lucide-react";
import { useCollectionsStore } from "@/store/collections-store";
import { useRequestStore } from "@/store/request-store";
import { useUiStore } from "@/store/ui-store";
import { Button, Badge, cn } from "@/components/ui/primitives";
import {
	getMethodColor,
	downloadJson,
	parsePostmanCollection,
} from "@/lib/utils";
import type { Collection, Folder, HttpRequest } from "@/lib/types";

// ─── ContextMenu ──────────────────────────────────────────────────────────────

interface ContextMenuItem {
	label: string;
	icon?: React.ReactNode;
	danger?: boolean;
	onClick: () => void;
}

function ContextMenu({
	items,
	onClose,
	x,
	y,
}: {
	items: ContextMenuItem[];
	onClose: () => void;
	x: number;
	y: number;
}) {
	React.useEffect(() => {
		const handler = () => onClose();
		window.addEventListener("mousedown", handler);
		return () => window.removeEventListener("mousedown", handler);
	}, [onClose]);

	return (
		<div
			className="fixed z-50 glass rounded-[8px] py-1 shadow-xl min-w-[160px] animate-slide-in"
			style={{ left: x, top: y }}
			onMouseDown={(e) => e.stopPropagation()}>
			{items.map((item, i) => (
				<button
					key={i}
					className={cn(
						"flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors hover:bg-[var(--bg-hover)]",
						item.danger ? "text-[var(--red)]" : "text-[var(--text-primary)]",
					)}
					onClick={() => {
						item.onClick();
						onClose();
					}}>
					{item.icon}
					{item.label}
				</button>
			))}
		</div>
	);
}

function useContextMenu() {
	const [menu, setMenu] = useState<{
		x: number;
		y: number;
		items: ContextMenuItem[];
	} | null>(null);
	const open = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
		e.preventDefault();
		e.stopPropagation();
		setMenu({ x: e.clientX, y: e.clientY, items });
	}, []);
	const close = useCallback(() => setMenu(null), []);
	return { menu, open, close };
}

// ─── RequestItem ──────────────────────────────────────────────────────────────

function RequestItem({ req }: { req: HttpRequest }) {
	const openRequest = useRequestStore((s) => s.openRequest);
	const { addRequest, deleteRequest } = useCollectionsStore();
	const activeTabId = useRequestStore((s) => s.activeTabId);
	const draftRequests = useRequestStore((s) => s.draftRequests);
	const { menu, open: openCtx, close } = useContextMenu();

	const isActive = Object.values(draftRequests).some((d) => d.id === req.id);
	const methodColor = getMethodColor(req.method);

	return (
		<>
			<div
				className={cn(
					"group flex items-center gap-2 px-2 py-1 rounded-[5px] cursor-pointer transition-colors hover:bg-[var(--bg-hover)]",
					isActive && "bg-[var(--bg-active)]",
				)}
				onClick={() => openRequest(req)}
				onContextMenu={(e) =>
					openCtx(e, [
						{ label: "Open", onClick: () => openRequest(req) },
						{
							label: "Duplicate",
							icon: <Copy size={12} />,
							onClick: () =>
								addRequest({
									collectionId: req.collectionId,
									folderId: req.folderId,
									clone: req,
								}),
						},
						{
							label: "Delete",
							icon: <Trash2 size={12} />,
							danger: true,
							onClick: () => deleteRequest(req.id),
						},
					])
				}>
				<span
					className="shrink-0 text-[10px] font-bold w-12 text-right"
					style={{ color: methodColor }}>
					{req.method}
				</span>
				<span className="flex-1 text-[12px] text-[var(--text-primary)] truncate">
					{req.name}
				</span>
				<button
					className="opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={(e) => {
						e.stopPropagation();
						openCtx(e, [
							{
								label: "Duplicate",
								icon: <Copy size={12} />,
								onClick: () => addRequest({ clone: req }),
							},
							{
								label: "Delete",
								icon: <Trash2 size={12} />,
								danger: true,
								onClick: () => deleteRequest(req.id),
							},
						]);
					}}>
					<MoreHorizontal size={12} className="text-[var(--text-muted)]" />
				</button>
			</div>
			{menu && <ContextMenu {...menu} onClose={close} />}
		</>
	);
}

// ─── FolderItem ───────────────────────────────────────────────────────────────

function FolderItem({ folder, depth = 0 }: { folder: Folder; depth?: number }) {
	const [open, setOpen] = useState(true);
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState(folder.name);
	const {
		requests,
		folders,
		addRequest,
		addFolder,
		updateFolder,
		deleteFolder,
	} = useCollectionsStore();
	const { menu, open: openCtx, close } = useContextMenu();

	const childFolders = folders.filter((f) => f.parentFolderId === folder.id);
	const childReqs = requests.filter((r) => r.folderId === folder.id);

	const commitRename = () => {
		if (name.trim()) updateFolder(folder.id, { name: name.trim() });
		setRenaming(false);
	};

	return (
		<>
			<div style={{ paddingLeft: depth * 12 }}>
				<div
					className="group flex items-center gap-1.5 px-2 py-1 rounded-[5px] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
					onClick={() => setOpen((v) => !v)}
					onContextMenu={(e) =>
						openCtx(e, [
							{
								label: "Add Request",
								icon: <Plus size={12} />,
								onClick: () =>
									addRequest({
										collectionId: folder.collectionId,
										folderId: folder.id,
									}),
							},
							{
								label: "Add Subfolder",
								icon: <FolderIcon size={12} />,
								onClick: () =>
									addFolder(folder.collectionId, "New Folder", folder.id),
							},
							{
								label: "Rename",
								icon: <Edit2 size={12} />,
								onClick: () => setRenaming(true),
							},
							{
								label: "Delete",
								icon: <Trash2 size={12} />,
								danger: true,
								onClick: () => deleteFolder(folder.id),
							},
						])
					}>
					{open ? (
						<ChevronDown size={12} className="text-[var(--text-muted)]" />
					) : (
						<ChevronRight size={12} className="text-[var(--text-muted)]" />
					)}
					{open ? (
						<FolderOpen size={12} className="text-[var(--amber)]" />
					) : (
						<FolderIcon size={12} className="text-[var(--amber)]" />
					)}
					{renaming ? (
						<input
							autoFocus
							value={name}
							onChange={(e) => setName(e.target.value)}
							onBlur={commitRename}
							onKeyDown={(e) => {
								if (e.key === "Enter") commitRename();
								if (e.key === "Escape") setRenaming(false);
							}}
							className="flex-1 bg-[var(--bg-overlay)] text-[12px] text-[var(--text-primary)] border border-[var(--accent)] rounded px-1 outline-none"
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<span className="flex-1 text-[12px] text-[var(--text-primary)] truncate">
							{folder.name}
						</span>
					)}
				</div>
				{open && (
					<div>
						{childFolders.map((f) => (
							<FolderItem key={f.id} folder={f} depth={depth + 1} />
						))}
						{childReqs.map((r) => (
							<div key={r.id} style={{ paddingLeft: (depth + 1) * 12 }}>
								<RequestItem req={r} />
							</div>
						))}
					</div>
				)}
			</div>
			{menu && <ContextMenu {...menu} onClose={close} />}
		</>
	);
}

// ─── CollectionItem ───────────────────────────────────────────────────────────

function CollectionItem({ collection }: { collection: Collection }) {
	const [open, setOpen] = useState(true);
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState(collection.name);
	const {
		requests,
		folders,
		addRequest,
		addFolder,
		updateCollection,
		deleteCollection,
	} = useCollectionsStore();
	const { menu, open: openCtx, close } = useContextMenu();

	const topFolders = folders.filter(
		(f) => f.collectionId === collection.id && !f.parentFolderId,
	);
	const topReqs = requests.filter(
		(r) => r.collectionId === collection.id && !r.folderId,
	);

	const commitRename = () => {
		if (name.trim()) updateCollection(collection.id, { name: name.trim() });
		setRenaming(false);
	};

	const handleExport = () => {
		const colFolders = folders.filter((f) => f.collectionId === collection.id);
		const colRequests = requests.filter(
			(r) => r.collectionId === collection.id,
		);
		downloadJson(
			{ collection, folders: colFolders, requests: colRequests },
			`${collection.name}.json`,
		);
	};

	return (
		<>
			<div
				className="group flex items-center gap-1.5 px-2 py-1.5 rounded-[6px] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
				onClick={() => setOpen((v) => !v)}
				onContextMenu={(e) =>
					openCtx(e, [
						{
							label: "Add Request",
							icon: <Plus size={12} />,
							onClick: () => addRequest({ collectionId: collection.id }),
						},
						{
							label: "Add Folder",
							icon: <FolderIcon size={12} />,
							onClick: () => addFolder(collection.id, "New Folder"),
						},
						{
							label: "Rename",
							icon: <Edit2 size={12} />,
							onClick: () => setRenaming(true),
						},
						{
							label: "Export",
							icon: <Download size={12} />,
							onClick: handleExport,
						},
						{
							label: "Delete",
							icon: <Trash2 size={12} />,
							danger: true,
							onClick: () => deleteCollection(collection.id),
						},
					])
				}>
				{open ? (
					<ChevronDown size={13} className="text-[var(--text-muted)]" />
				) : (
					<ChevronRight size={13} className="text-[var(--text-muted)]" />
				)}
				<FileJson size={13} className="text-[var(--accent)] shrink-0" />
				{renaming ? (
					<input
						autoFocus
						value={name}
						onChange={(e) => setName(e.target.value)}
						onBlur={commitRename}
						onKeyDown={(e) => {
							if (e.key === "Enter") commitRename();
							if (e.key === "Escape") setRenaming(false);
						}}
						className="flex-1 bg-[var(--bg-overlay)] text-[12px] text-[var(--text-primary)] border border-[var(--accent)] rounded px-1 outline-none"
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					<span className="flex-1 text-[13px] font-medium text-[var(--text-primary)] truncate">
						{collection.name}
					</span>
				)}
				<span className="text-[10px] text-[var(--text-muted)] group-hover:opacity-100 opacity-0">
					{topReqs.length +
						requests.filter((r) => r.collectionId === collection.id).length}
				</span>
			</div>
			{open && (
				<div className="ml-3 border-l border-[var(--border)] pl-1 mb-1">
					{topFolders.map((f) => (
						<FolderItem key={f.id} folder={f} depth={0} />
					))}
					{topReqs.map((r) => (
						<RequestItem key={r.id} req={r} />
					))}
				</div>
			)}
			{menu && <ContextMenu {...menu} onClose={close} />}
		</>
	);
}

// ─── CollectionsSidebar ───────────────────────────────────────────────────────

export function CollectionsSidebar() {
	const { collections, addCollection, importCollection } =
		useCollectionsStore();
	const openRequest = useRequestStore((s) => s.openRequest);
	const fileRef = React.useRef<HTMLInputElement>(null);

	const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		if (!files.length) return;

		files.forEach((file) => {
			const reader = new FileReader();
			reader.onload = (ev) => {
				try {
					const data = JSON.parse(ev.target?.result as string);
					// Native Coreq format
					if (data.collection && data.requests) {
						importCollection(data);
						return;
					}
					// Postman v2.0 / v2.1
					const parsed = parsePostmanCollection(data);
					if (parsed) {
						importCollection(parsed);
						return;
					}
					console.warn("[Coreq] Unrecognised collection format in", file.name);
				} catch (err) {
					console.error("[Coreq] Failed to parse", file.name, err);
				}
			};
			reader.readAsText(file);
		});

		e.target.value = "";
	};

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border)]">
				<span className="flex-1 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
					Collections
				</span>
				<Button
					size="icon"
					variant="ghost"
					title="Import collection"
					onClick={() => fileRef.current?.click()}>
					<Upload size={13} />
				</Button>
				<Button
					size="icon"
					variant="ghost"
					title="New collection"
					onClick={() => addCollection("New Collection")}>
					<Plus size={13} />
				</Button>
				<input
					ref={fileRef}
					type="file"
					accept=".json"
					multiple
					className="hidden"
					onChange={handleImport}
				/>
			</div>

			{/* List */}
			<div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
				{collections.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 gap-3">
						<FileJson size={32} className="text-[var(--text-muted)]" />
						<p className="text-[12px] text-[var(--text-muted)] text-center leading-relaxed">
							No collections yet.{"\n"}
							<button
								className="text-[var(--accent)] hover:underline"
								onClick={() => addCollection("My Collection")}>
								Create one
							</button>
						</p>
					</div>
				) : (
					collections.map((c) => <CollectionItem key={c.id} collection={c} />)
				)}
			</div>
		</div>
	);
}
