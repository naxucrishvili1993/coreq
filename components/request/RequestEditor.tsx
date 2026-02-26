"use client";

import React, { useState, useCallback } from "react";
import { Send, Save, Copy, Loader2, Terminal } from "lucide-react";
import { useRequestStore } from "@/store/request-store";
import { useCollectionsStore } from "@/store/collections-store";
import { useEnvironmentStore } from "@/store/environment-store";
import { useHistoryStore } from "@/store/history-store";
import { useUiStore } from "@/store/ui-store";
import {
	Button,
	Input,
	Select,
	Badge,
	Kbd,
	cn,
} from "@/components/ui/primitives";
import { KVEditor, BodyEditor, AuthEditor } from "./RequestEditorPanels";
import { getMethodColor, generateCurl } from "@/lib/utils";
import { executeRequest } from "@/lib/http-client";
import type { HttpMethod } from "@/lib/types";

const METHODS: HttpMethod[] = [
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"HEAD",
	"OPTIONS",
];

const REQUEST_TABS = [
	{ id: "params", label: "Params" },
	{ id: "headers", label: "Headers" },
	{ id: "body", label: "Body" },
	{ id: "auth", label: "Auth" },
] as const;
type ReqTab = (typeof REQUEST_TABS)[number]["id"];

interface RequestEditorProps {
	tabId: string;
}

export function RequestEditor({ tabId }: RequestEditorProps) {
	const { getDraftRequest, updateDraft, setResponse, setLoading, loading } =
		useRequestStore();
	const { updateRequest } = useCollectionsStore();
	const { getActiveVariables } = useEnvironmentStore();
	const addHistoryEntry = useHistoryStore((s) => s.addEntry);
	const openCurlImport = useUiStore((s) => s.openCurlImport);

	const [activeTab, setActiveTab] = useState<ReqTab>("params");
	const [curlCopied, setCurlCopied] = useState(false);

	const req = getDraftRequest(tabId);
	const isLoading = loading[tabId] ?? false;
	const variables = getActiveVariables();

	const update = useCallback(
		(patch: Parameters<typeof updateDraft>[1]) => updateDraft(tabId, patch),
		[tabId, updateDraft],
	);

	const send = useCallback(async () => {
		if (!req || isLoading) return;
		setLoading(tabId, true);
		setResponse(tabId, null);
		try {
			const response = await executeRequest(req, variables);
			setResponse(tabId, response);
			addHistoryEntry(req, response);
			if (req.id) updateRequest(req.id, req);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Request failed";
			setResponse(tabId, {
				status: 0,
				statusText: "Error",
				headers: {},
				body: msg,
				size: new Blob([msg]).size,
				time: 0,
				timestamp: Date.now(),
			});
		} finally {
			setLoading(tabId, false);
		}
	}, [req, tabId, variables, isLoading]);

	const copyCurl = useCallback(() => {
		if (!req) return;
		const curl = generateCurl(req, variables);
		navigator.clipboard.writeText(curl).then(() => {
			setCurlCopied(true);
			setTimeout(() => setCurlCopied(false), 1500);
		});
	}, [req, variables]);

	if (!req) {
		return (
			<div className="flex items-center justify-center h-full text-[var(--text-muted)] text-[13px]">
				No request open
			</div>
		);
	}

	const methodColor = getMethodColor(req.method);

	return (
		<div className="flex flex-col h-full overflow-hidden">
			{/* ── Name bar ──────────────────────────────────────────────────────── */}
			<div className="px-4 pt-3 pb-2 border-b border-[var(--border)]">
				<Input
					className="bg-transparent border-none text-[15px] font-semibold px-0 placeholder:text-[var(--text-muted)] focus:border-none"
					placeholder="Request name..."
					value={req.name}
					onChange={(e) => update({ name: e.target.value })}
				/>
			</div>

			{/* ── URL bar ───────────────────────────────────────────────────────── */}
			<div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border-b border-[var(--border)]">
				<Select
					value={req.method}
					onChange={(e) => update({ method: e.target.value as HttpMethod })}
					className="w-[80px] sm:w-[110px] font-bold text-[12px] shrink-0"
					style={{ color: methodColor }}>
					{METHODS.map((m) => (
						<option key={m} value={m}>
							{m}
						</option>
					))}
				</Select>

				<Input
					mono
					className="flex-1 min-w-0"
					placeholder="https://api.example.com/endpoint"
					value={req.url}
					onChange={(e) => update({ url: e.target.value })}
					onKeyDown={(e) => e.key === "Enter" && send()}
				/>

				<Button
					variant="ghost"
					size="icon"
					title="Copy as cURL"
					className="hidden sm:flex shrink-0"
					onClick={copyCurl}>
					{curlCopied ? (
						<span className="text-[var(--green)] text-[10px] font-bold">✓</span>
					) : (
						<Terminal size={13} />
					)}
				</Button>

				<Button
					variant="primary"
					size="md"
					onClick={send}
					disabled={isLoading}
					className="gap-2 min-w-[72px] shrink-0">
					{isLoading ? (
						<Loader2 size={13} className="animate-spin" />
					) : (
						<Send size={12} />
					)}
					Send
				</Button>
			</div>

			{/* ── Tab nav ───────────────────────────────────────────────────────── */}
			<div className="flex items-center px-4 border-b border-[var(--border)]">
				{REQUEST_TABS.map((tab) => {
					let count = 0;
					if (tab.id === "params")
						count = req.params.filter((p) => p.enabled && p.key).length;
					if (tab.id === "headers")
						count = req.headers.filter((h) => h.enabled && h.key).length;
					return (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								"px-3 py-2 text-[12px] font-medium border-b-2 transition-colors flex items-center gap-1.5",
								activeTab === tab.id
									? "border-[var(--accent)] text-[var(--text-primary)]"
									: "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
							)}>
							{tab.label}
							{count > 0 && (
								<span className="text-[9px] bg-[var(--accent-muted)] text-[var(--accent)] px-1 rounded-full font-bold">
									{count}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{/* ── Tab content ───────────────────────────────────────────────────── */}
			<div className="flex-1 overflow-y-auto p-4">
				{activeTab === "params" && (
					<KVEditor
						pairs={req.params}
						onChange={(params) => update({ params })}
						keyPlaceholder="Parameter"
						valuePlaceholder="Value"
					/>
				)}
				{activeTab === "headers" && (
					<KVEditor
						pairs={req.headers}
						onChange={(headers) => update({ headers })}
						keyPlaceholder="Header name"
						valuePlaceholder="Header value"
					/>
				)}
				{activeTab === "body" && (
					<BodyEditor body={req.body} onChange={(body) => update({ body })} />
				)}
				{activeTab === "auth" && (
					<AuthEditor auth={req.auth} onChange={(auth) => update({ auth })} />
				)}
			</div>
		</div>
	);
}
