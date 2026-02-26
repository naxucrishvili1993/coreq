"use client";

import React, { useCallback, useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import {
	Button,
	Input,
	Textarea,
	Switch,
	Select,
	Label,
	cn,
} from "@/components/ui/primitives";
import { createDefaultKeyValue, createDefaultEnvVariable } from "@/lib/utils";
import type {
	KeyValuePair,
	RequestBody,
	Auth,
	BodyType,
	AuthType,
} from "@/lib/types";

// ─── KeyValue Editor ──────────────────────────────────────────────────────────

interface KVEditorProps {
	pairs: KeyValuePair[];
	onChange: (pairs: KeyValuePair[]) => void;
	keyPlaceholder?: string;
	valuePlaceholder?: string;
}

export function KVEditor({
	pairs,
	onChange,
	keyPlaceholder = "Key",
	valuePlaceholder = "Value",
}: KVEditorProps) {
	const update = (id: string, patch: Partial<KeyValuePair>) => {
		onChange(pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
	};

	const remove = (id: string) => {
		onChange(pairs.filter((p) => p.id !== id));
	};

	const addRow = () => {
		onChange([...pairs, createDefaultKeyValue()]);
	};

	return (
		<div className="space-y-1">
			{pairs.map((pair) => (
				<div key={pair.id} className="flex items-center gap-1.5">
					<Switch
						checked={pair.enabled}
						onChange={(v) => update(pair.id, { enabled: v })}
					/>
					<Input
						mono
						className="flex-1"
						placeholder={keyPlaceholder}
						value={pair.key}
						onChange={(e) => update(pair.id, { key: e.target.value })}
					/>
					<Input
						mono
						className="flex-1"
						placeholder={valuePlaceholder}
						value={pair.value}
						onChange={(e) => update(pair.id, { value: e.target.value })}
					/>
					<Button size="icon" variant="danger" onClick={() => remove(pair.id)}>
						<Trash2 size={11} />
					</Button>
				</div>
			))}
			<Button variant="ghost" size="sm" onClick={addRow} className="gap-1 mt-1">
				<Plus size={11} /> Add Row
			</Button>
		</div>
	);
}

// ─── Body Editor ──────────────────────────────────────────────────────────────

interface BodyEditorProps {
	body: RequestBody;
	onChange: (body: RequestBody) => void;
}

const BODY_TYPES: { label: string; value: BodyType }[] = [
	{ label: "None", value: "none" },
	{ label: "JSON", value: "json" },
	{ label: "Text", value: "text" },
	{ label: "Form Data", value: "form-data" },
	{ label: "URL Encoded", value: "urlencoded" },
	{ label: "XML", value: "xml" },
];

export function BodyEditor({ body, onChange }: BodyEditorProps) {
	const prettify = () => {
		if (body.type === "json") {
			try {
				onChange({
					...body,
					content: JSON.stringify(JSON.parse(body.content), null, 2),
				});
			} catch {}
		}
	};

	return (
		<div className="flex flex-col gap-3 h-full">
			<div className="flex items-center gap-3">
				<Label>Type</Label>
				<Select
					value={body.type}
					onChange={(e) =>
						onChange({ ...body, type: e.target.value as BodyType })
					}>
					{BODY_TYPES.map((t) => (
						<option key={t.value} value={t.value}>
							{t.label}
						</option>
					))}
				</Select>
				{(body.type === "json" || body.type === "xml") && (
					<Button variant="outline" size="sm" onClick={prettify}>
						Format
					</Button>
				)}
			</div>

			{body.type === "none" && (
				<p className="text-[12px] text-[var(--text-muted)] py-4 text-center">
					No body for this request.
				</p>
			)}

			{(body.type === "json" ||
				body.type === "text" ||
				body.type === "xml") && (
				<Textarea
					mono
					className="flex-1 h-full resize-none text-[12px]"
					placeholder={
						body.type === "json"
							? '{\n  "key": "value"\n}'
							: body.type === "xml"
								? "<root>\n  <key>value</key>\n</root>"
								: "Request body..."
					}
					value={body.content}
					onChange={(e) => onChange({ ...body, content: e.target.value })}
					rows={12}
				/>
			)}

			{(body.type === "form-data" || body.type === "urlencoded") && (
				<KVEditor
					pairs={body.formFields ?? []}
					onChange={(formFields) => onChange({ ...body, formFields })}
					keyPlaceholder="Field name"
					valuePlaceholder="Field value"
				/>
			)}
		</div>
	);
}

// ─── Auth Editor ──────────────────────────────────────────────────────────────

interface AuthEditorProps {
	auth: Auth;
	onChange: (auth: Auth) => void;
}

const AUTH_TYPES: { label: string; value: AuthType }[] = [
	{ label: "No Auth", value: "none" },
	{ label: "Bearer Token", value: "bearer" },
	{ label: "Basic Auth", value: "basic" },
	{ label: "API Key", value: "api-key" },
];

export function AuthEditor({ auth, onChange }: AuthEditorProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<Label>Type</Label>
				<Select
					value={auth.type}
					onChange={(e) => {
						const t = e.target.value as AuthType;
						if (t === "none") onChange({ type: "none" });
						else if (t === "bearer") onChange({ type: "bearer", token: "" });
						else if (t === "basic")
							onChange({ type: "basic", username: "", password: "" });
						else
							onChange({
								type: "api-key",
								key: "X-API-Key",
								value: "",
								addTo: "header",
							});
					}}>
					{AUTH_TYPES.map((a) => (
						<option key={a.value} value={a.value}>
							{a.label}
						</option>
					))}
				</Select>
			</div>

			{auth.type === "bearer" && (
				<div className="space-y-2">
					<Label>Token</Label>
					<Input
						mono
						placeholder="Bearer token..."
						value={auth.token}
						onChange={(e) => onChange({ ...auth, token: e.target.value })}
					/>
				</div>
			)}

			{auth.type === "basic" && (
				<div className="space-y-2">
					<div>
						<Label>Username</Label>
						<Input
							className="mt-1"
							placeholder="Username"
							value={auth.username}
							onChange={(e) => onChange({ ...auth, username: e.target.value })}
						/>
					</div>
					<div>
						<Label>Password</Label>
						<Input
							className="mt-1"
							type="password"
							placeholder="Password"
							value={auth.password}
							onChange={(e) => onChange({ ...auth, password: e.target.value })}
						/>
					</div>
				</div>
			)}

			{auth.type === "api-key" && (
				<div className="space-y-2">
					<div className="flex items-center gap-3">
						<Label>Add to</Label>
						<Select
							value={auth.addTo}
							onChange={(e) =>
								onChange({
									...auth,
									addTo: e.target.value as "header" | "query",
								})
							}>
							<option value="header">Header</option>
							<option value="query">Query Param</option>
						</Select>
					</div>
					<div>
						<Label>Key name</Label>
						<Input
							className="mt-1"
							mono
							placeholder="X-API-Key"
							value={auth.key}
							onChange={(e) => onChange({ ...auth, key: e.target.value })}
						/>
					</div>
					<div>
						<Label>Value</Label>
						<Input
							className="mt-1"
							mono
							placeholder="API key value..."
							value={auth.value}
							onChange={(e) => onChange({ ...auth, value: e.target.value })}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
