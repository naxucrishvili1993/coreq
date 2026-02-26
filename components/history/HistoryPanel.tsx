"use client";

import React, { useState } from "react";
import { Clock, Trash2, RotateCcw, X } from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { useRequestStore } from "@/store/request-store";
import { Button, Badge, cn } from "@/components/ui/primitives";
import {
	getMethodColor,
	relativeTime,
	formatDuration,
	getStatusColor,
	createDefaultRequest,
} from "@/lib/utils";
import type { HistoryEntry } from "@/lib/types";

function HistoryEntryRow({ entry }: { entry: HistoryEntry }) {
	const openRequest = useRequestStore((s) => s.openRequest);
	const removeEntry = useHistoryStore((s) => s.removeEntry);
	const methodColor = getMethodColor(entry.request.method);

	const reopen = () => {
		const req = createDefaultRequest({
			...entry.request,
			name: entry.requestName ?? "History Request",
		});
		openRequest(req);
	};

	return (
		<div
			className="group flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors rounded-[5px] cursor-pointer"
			onClick={reopen}>
			<span
				className="text-[10px] font-bold w-12 text-right"
				style={{ color: methodColor }}>
				{entry.request.method}
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-[12px] text-[var(--text-primary)] truncate">
					{entry.request.url || "Unnamed"}
				</p>
				<p className="text-[10px] text-[var(--text-muted)]">
					{relativeTime(entry.timestamp)}
				</p>
			</div>
			{entry.response && (
				<span
					className="text-[11px] font-semibold"
					style={{ color: getStatusColor(entry.response.status) }}>
					{entry.response.status}
				</span>
			)}
			<button
				className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-[var(--red)]"
				onClick={(e) => {
					e.stopPropagation();
					removeEntry(entry.id);
				}}>
				<X size={11} />
			</button>
		</div>
	);
}

export function HistoryPanel() {
	const { entries, clearHistory } = useHistoryStore();

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border)]">
				<span className="flex-1 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
					History
				</span>
				{entries.length > 0 && (
					<Button
						size="icon"
						variant="ghost"
						title="Clear history"
						onClick={clearHistory}>
						<Trash2 size={12} />
					</Button>
				)}
			</div>
			<div className="flex-1 overflow-y-auto px-1 py-1">
				{entries.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 gap-3">
						<Clock size={32} className="text-[var(--text-muted)]" />
						<p className="text-[12px] text-[var(--text-muted)]">
							No history yet
						</p>
					</div>
				) : (
					entries.map((e) => <HistoryEntryRow key={e.id} entry={e} />)
				)}
			</div>
		</div>
	);
}
