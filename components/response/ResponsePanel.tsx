"use client";

import React, { useState, useMemo } from "react";
import { Copy, Download, Clock, HardDrive, Hash } from "lucide-react";
import { useRequestStore } from "@/store/request-store";
import { Button, Badge, cn } from "@/components/ui/primitives";
import {
	prettyPrintJson,
	tryParseJson,
	formatBytes,
	formatDuration,
	getStatusColor,
} from "@/lib/utils";
import { downloadJson } from "@/lib/utils";
import type { ResponseData } from "@/lib/types";

// ─── JSON Syntax Highlighter ──────────────────────────────────────────────────

function highlightJson(json: string): string {
	return json
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(
			/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
			(match) => {
				if (/^"/.test(match)) {
					if (/:$/.test(match)) return `<span class="json-key">${match}</span>`;
					return `<span class="json-string">${match}</span>`;
				}
				if (/true|false/.test(match))
					return `<span class="json-boolean">${match}</span>`;
				if (/null/.test(match))
					return `<span class="json-null">${match}</span>`;
				return `<span class="json-number">${match}</span>`;
			},
		);
}

// ─── Response tabs ────────────────────────────────────────────────────────────

const RESP_TABS = [
	{ id: "body", label: "Body" },
	{ id: "headers", label: "Headers" },
	{ id: "info", label: "Info" },
] as const;
type RespTab = (typeof RESP_TABS)[number]["id"];

// ─── ResponsePanel ────────────────────────────────────────────────────────────

interface ResponsePanelProps {
	tabId: string;
}

export function ResponsePanel({ tabId }: ResponsePanelProps) {
	const response = useRequestStore((s) => s.responses[tabId]);
	const isLoading = useRequestStore((s) => s.loading[tabId] ?? false);
	const [activeTab, setActiveTab] = useState<RespTab>("body");
	const [viewMode, setViewMode] = useState<"pretty" | "raw">("pretty");
	const [copied, setCopied] = useState(false);

	const pretty = useMemo(() => {
		if (!response) return "";
		const ct =
			Object.entries(response.headers).find(
				([k]) => k.toLowerCase() === "content-type",
			)?.[1] ?? "";
		if (ct.includes("json")) return prettyPrintJson(response.body);
		return response.body;
	}, [response]);

	const isJson = useMemo(() => {
		if (!response) return false;
		return tryParseJson(response.body) !== null;
	}, [response]);

	const copyBody = () => {
		if (!response) return;
		navigator.clipboard.writeText(response.body).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	};

	const downloadBody = () => {
		if (!response) return;
		const ct =
			Object.entries(response.headers).find(
				([k]) => k.toLowerCase() === "content-type",
			)?.[1] ?? "";
		const ext = ct.includes("json")
			? "json"
			: ct.includes("xml")
				? "xml"
				: "txt";
		const blob = new Blob([response.body], { type: ct || "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `response.${ext}`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full gap-3 text-[var(--text-muted)]">
				<div className="h-4 w-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
				<span className="text-[13px]">Sending request…</span>
			</div>
		);
	}

	if (!response) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-muted)]">
				<div className="text-2xl">⬆️</div>
				<p className="text-[13px]">Hit Send to see the response</p>
				<p className="text-[11px] text-[var(--text-muted)]">
					Press Ctrl+Enter to send
				</p>
			</div>
		);
	}

	const statusColor = getStatusColor(response.status);

	return (
		<div className="flex flex-col h-full overflow-hidden">
			{/* ── Status bar ────────────────────────────────────────────────────── */}
			<div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--border)] shrink-0">
				<span className="text-[13px] font-bold" style={{ color: statusColor }}>
					{response.status} {response.statusText}
				</span>
				<div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
					<Clock size={11} />
					<span>{formatDuration(response.time)}</span>
				</div>
				<div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
					<HardDrive size={11} />
					<span>{formatBytes(response.size)}</span>
				</div>
				<div className="flex-1" />
				<Button
					size="icon"
					variant="ghost"
					title="Copy response"
					onClick={copyBody}>
					{copied ? (
						<span className="text-[var(--green)] text-[10px]">✓</span>
					) : (
						<Copy size={12} />
					)}
				</Button>
				<Button
					size="icon"
					variant="ghost"
					title="Download"
					onClick={downloadBody}>
					<Download size={12} />
				</Button>
			</div>

			{/* ── Tabs ──────────────────────────────────────────────────────────── */}
			<div className="flex items-center px-4 gap-1 border-b border-[var(--border)] shrink-0">
				{RESP_TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={cn(
							"px-3 py-2 text-[12px] font-medium border-b-2 transition-colors",
							activeTab === tab.id
								? "border-[var(--accent)] text-[var(--text-primary)]"
								: "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
						)}>
						{tab.label}
						{tab.id === "headers" && (
							<span className="ml-1 text-[9px] bg-[var(--bg-active)] rounded px-1">
								{Object.keys(response.headers).length}
							</span>
						)}
					</button>
				))}
				{activeTab === "body" && isJson && (
					<div className="ml-auto flex items-center gap-0.5">
						{(["pretty", "raw"] as const).map((m) => (
							<button
								key={m}
								onClick={() => setViewMode(m)}
								className={cn(
									"px-2 py-1 text-[10px] rounded transition-colors capitalize",
									viewMode === m
										? "bg-[var(--bg-active)] text-[var(--text-primary)]"
										: "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
								)}>
								{m}
							</button>
						))}
					</div>
				)}
			</div>

			{/* ── Body ──────────────────────────────────────────────────────────── */}
			<div className="flex-1 overflow-auto p-4">
				{activeTab === "body" && (
					<pre
						className="mono text-[12px] leading-6 whitespace-pre-wrap break-all"
						dangerouslySetInnerHTML={{
							__html:
								viewMode === "pretty" && isJson
									? highlightJson(pretty)
									: (response.body || "<empty response>")
											.replace(/</g, "&lt;")
											.replace(/>/g, "&gt;"),
						}}
					/>
				)}

				{activeTab === "headers" && (
					<table className="w-full text-[12px] border-separate border-spacing-y-0.5">
						<thead>
							<tr>
								<th className="text-left text-[11px] text-[var(--text-secondary)] font-medium pb-2 pr-4 uppercase">
									Header
								</th>
								<th className="text-left text-[11px] text-[var(--text-secondary)] font-medium pb-2 uppercase">
									Value
								</th>
							</tr>
						</thead>
						<tbody>
							{Object.entries(response.headers).map(([k, v]) => (
								<tr key={k} className="hover:bg-[var(--bg-hover)] rounded">
									<td className="pr-4 py-1 text-[var(--text-secondary)] font-mono align-top">
										{k}
									</td>
									<td className="py-1 text-[var(--text-primary)] font-mono break-all">
										{v}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}

				{activeTab === "info" && (
					<div className="space-y-3">
						{[
							{
								label: "Status",
								value: `${response.status} ${response.statusText}`,
								color: statusColor,
							},
							{ label: "Time", value: formatDuration(response.time) },
							{ label: "Size", value: formatBytes(response.size) },
							{
								label: "Timestamp",
								value: new Date(response.timestamp).toLocaleString(),
							},
						].map(({ label, value, color }) => (
							<div key={label} className="flex items-center gap-4">
								<span className="text-[11px] text-[var(--text-secondary)] w-24 uppercase tracking-wide">
									{label}
								</span>
								<span
									className="text-[13px] font-medium"
									style={{ color: color ?? "var(--text-primary)" }}>
									{value}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
