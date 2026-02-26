"use client";

import React, { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Check, X, Edit2 } from "lucide-react";
import { useEnvironmentStore } from "@/store/environment-store";
import {
	Button,
	Input,
	Switch,
	Label,
	cn,
	Divider,
} from "@/components/ui/primitives";
import { genId, createDefaultEnvVariable } from "@/lib/utils";
import type { Environment, EnvVariable } from "@/lib/types";

// ── Variable row ─────────────────────────────────────────────────────────────

function VarRow({
	variable,
	onUpdate,
	onDelete,
}: {
	variable: EnvVariable;
	onUpdate: (v: EnvVariable) => void;
	onDelete: () => void;
}) {
	const [show, setShow] = useState(!variable.secret);

	return (
		<div className="flex items-center gap-2 group">
			<Switch
				checked={variable.enabled}
				onChange={(v) => onUpdate({ ...variable, enabled: v })}
			/>
			<Input
				className="flex-1 min-w-0"
				mono
				placeholder="KEY"
				value={variable.key}
				onChange={(e) => onUpdate({ ...variable, key: e.target.value })}
			/>
			<div className="relative flex-1 min-w-0">
				<Input
					className="flex-1 min-w-0 pr-8"
					mono
					type={show || !variable.secret ? "text" : "password"}
					placeholder="VALUE"
					value={variable.value}
					onChange={(e) => onUpdate({ ...variable, value: e.target.value })}
				/>
				{variable.secret && (
					<button
						className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
						onClick={() => setShow((v) => !v)}>
						{show ? <EyeOff size={11} /> : <Eye size={11} />}
					</button>
				)}
			</div>
			<Button
				size="icon"
				variant="ghost"
				onClick={() => onUpdate({ ...variable, secret: !variable.secret })}
				title={variable.secret ? "Make public" : "Mark secret"}>
				{variable.secret ? (
					<EyeOff size={11} className="text-[var(--amber)]" />
				) : (
					<Eye size={11} />
				)}
			</Button>
			<Button size="icon" variant="danger" onClick={onDelete}>
				<Trash2 size={11} />
			</Button>
		</div>
	);
}

// ── Environment panel ─────────────────────────────────────────────────────────

function EnvEditor({ env }: { env: Environment }) {
	const { upsertVariable, deleteVariable, updateEnvironment } =
		useEnvironmentStore();
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState(env.name);

	const addVar = () => {
		upsertVariable(env.id, createDefaultEnvVariable());
	};

	const commitRename = () => {
		if (name.trim()) updateEnvironment(env.id, { name: name.trim() });
		setRenaming(false);
	};

	return (
		<div className="space-y-3">
			{/* Name */}
			<div className="flex items-center gap-2">
				{renaming ? (
					<>
						<Input
							autoFocus
							value={name}
							onChange={(e) => setName(e.target.value)}
							onBlur={commitRename}
							onKeyDown={(e) => {
								if (e.key === "Enter") commitRename();
								if (e.key === "Escape") {
									setName(env.name);
									setRenaming(false);
								}
							}}
						/>
						<Button size="icon" variant="ghost" onClick={commitRename}>
							<Check size={12} />
						</Button>
					</>
				) : (
					<>
						<span className="flex-1 text-[13px] font-semibold text-[var(--text-primary)]">
							{env.name}
						</span>
						<Button
							size="icon"
							variant="ghost"
							onClick={() => setRenaming(true)}>
							<Edit2 size={12} />
						</Button>
					</>
				)}
			</div>

			{/* Column headers */}
			<div className="flex items-center gap-2 px-1">
				<div className="w-8" />
				<Label className="flex-1">Key</Label>
				<Label className="flex-1">Value</Label>
				<div className="w-16" />
			</div>

			{/* Variables */}
			<div className="space-y-1.5">
				{env.variables.map((v) => (
					<VarRow
						key={v.id}
						variable={v}
						onUpdate={(updated) => upsertVariable(env.id, updated)}
						onDelete={() => deleteVariable(env.id, v.id)}
					/>
				))}
			</div>

			<Button variant="outline" size="sm" onClick={addVar} className="gap-1">
				<Plus size={11} /> Add Variable
			</Button>
		</div>
	);
}

// ── EnvironmentManager ────────────────────────────────────────────────────────

export function EnvironmentManager() {
	const {
		environments,
		activeEnvironmentId,
		addEnvironment,
		deleteEnvironment,
		setActiveEnvironment,
	} = useEnvironmentStore();
	const [selected, setSelected] = useState<string | null>(null);

	const selectedEnv = environments.find((e) => e.id === selected);

	return (
		<div className="flex h-full">
			{/* Env list */}
			<div className="w-40 border-r border-[var(--border)] flex flex-col shrink-0">
				<div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border)]">
					<span className="flex-1 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
						Envs
					</span>
					<Button
						size="icon"
						variant="ghost"
						onClick={() => {
							const env = addEnvironment("New Env");
							setSelected(env.id);
						}}>
						<Plus size={12} />
					</Button>
				</div>
				<div className="flex-1 overflow-y-auto py-1 px-1">
					{environments.map((env) => (
						<div
							key={env.id}
							className={cn(
								"flex items-center gap-2 px-2 py-1.5 rounded-[5px] cursor-pointer transition-colors group",
								selected === env.id
									? "bg-[var(--bg-active)]"
									: "hover:bg-[var(--bg-hover)]",
							)}
							onClick={() => setSelected(env.id)}>
							<button
								className={cn(
									"h-2 w-2 rounded-full shrink-0 transition-colors",
									activeEnvironmentId === env.id
										? "bg-[var(--green)]"
										: "bg-[var(--text-muted)]",
								)}
								title={activeEnvironmentId === env.id ? "Active" : "Set active"}
								onClick={(e) => {
									e.stopPropagation();
									setActiveEnvironment(
										activeEnvironmentId === env.id ? null : env.id,
									);
								}}
							/>
							<span className="flex-1 text-[12px] text-[var(--text-primary)] truncate">
								{env.name}
							</span>
							<button
								className="opacity-0 group-hover:opacity-100 hover:text-[var(--red)] transition-all"
								onClick={(e) => {
									e.stopPropagation();
									deleteEnvironment(env.id);
									if (selected === env.id) setSelected(null);
								}}>
								<Trash2 size={10} />
							</button>
						</div>
					))}
				</div>
			</div>

			{/* Editor */}
			<div className="flex-1 overflow-y-auto p-4">
				{selectedEnv ? (
					<EnvEditor env={selectedEnv} />
				) : (
					<div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-muted)]">
						<p className="text-[12px]">Select an environment to edit</p>
					</div>
				)}
			</div>
		</div>
	);
}
