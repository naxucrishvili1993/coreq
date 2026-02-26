"use client";

import * as React from "react";

// ─── cn helper ────────────────────────────────────────────────────────────────
export function cn(...classes: (string | undefined | false | null)[]): string {
	return classes.filter(Boolean).join(" ");
}

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "ghost" | "danger" | "outline";
	size?: "sm" | "md" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = "ghost", size = "md", className, children, ...rest }, ref) => {
		const base =
			"inline-flex items-center justify-center gap-1.5 font-medium rounded-[6px] transition-all duration-150 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0";
		const variants: Record<string, string> = {
			primary:
				"bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm shadow-[var(--accent-muted)]",
			ghost:
				"text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
			danger: "text-[var(--red)] hover:bg-[rgba(239,68,68,.12)]",
			outline:
				"border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-hover)]",
		};
		const sizes: Record<string, string> = {
			sm: "px-2.5 py-1 text-[11px] h-7",
			md: "px-3 py-1.5 text-[12px] h-8",
			icon: "p-1.5 h-7 w-7 text-[13px]",
		};
		return (
			<button
				ref={ref}
				className={cn(base, variants[variant], sizes[size], className)}
				{...rest}>
				{children}
			</button>
		);
	},
);
Button.displayName = "Button";

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, mono, ...rest }, ref) => (
		<input
			ref={ref}
			className={cn(
				"w-full rounded-[6px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none",
				mono && "font-mono",
				className,
			)}
			{...rest}
		/>
	),
);
Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	mono?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, mono, ...rest }, ref) => (
		<textarea
			ref={ref}
			className={cn(
				"w-full rounded-[6px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none resize-none",
				mono && "mono",
				className,
			)}
			{...rest}
		/>
	),
);
Textarea.displayName = "Textarea";

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
	color?: string;
	children: React.ReactNode;
	className?: string;
}

export const Badge = ({
	color = "var(--accent)",
	children,
	className,
}: BadgeProps) => (
	<span
		className={cn(
			"inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
			className,
		)}
		style={{
			color,
			backgroundColor: `${color}18`,
			border: `1px solid ${color}30`,
		}}>
		{children}
	</span>
);

// ─── Kbd ──────────────────────────────────────────────────────────────────────

export const Kbd = ({ children }: { children: React.ReactNode }) => (
	<kbd className="inline-flex items-center rounded-[3px] bg-[var(--bg-overlay)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)]">
		{children}
	</kbd>
);

// ─── Label ────────────────────────────────────────────────────────────────────

export const Label = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<label
		className={cn(
			"text-[11px] font-medium tracking-wide text-[var(--text-secondary)] uppercase",
			className,
		)}>
		{children}
	</label>
);

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
	({ className, children, ...rest }, ref) => (
		<select
			ref={ref}
			className={cn(
				"rounded-[6px] border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-[12px] text-[var(--text-primary)] transition-colors focus:border-[var(--accent)] focus:outline-none appearance-none cursor-pointer",
				className,
			)}
			{...rest}>
			{children}
		</select>
	),
);
Select.displayName = "Select";

// ─── Divider ──────────────────────────────────────────────────────────────────

export const Divider = ({ className }: { className?: string }) => (
	<div className={cn("divider", className)} />
);

// ─── Tooltip ──────────────────────────────────────────────────────────────────

export const Tooltip = ({
	children,
	tip,
}: {
	children: React.ReactNode;
	tip: string;
}) => (
	<div className="group relative inline-flex">
		{children}
		<div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-[5px] bg-[var(--bg-overlay)] border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-secondary)] opacity-0 transition-opacity group-hover:opacity-100 z-50">
			{tip}
		</div>
	</div>
);

// ─── Switch ───────────────────────────────────────────────────────────────────

interface SwitchProps {
	checked: boolean;
	onChange: (v: boolean) => void;
	disabled?: boolean;
}

export const Switch = ({ checked, onChange, disabled }: SwitchProps) => (
	<button
		role="switch"
		aria-checked={checked}
		disabled={disabled}
		onClick={() => onChange(!checked)}
		className={cn(
			"relative inline-flex h-4 w-7 shrink-0 rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
			checked
				? "bg-[var(--accent)] border-transparent"
				: "bg-[var(--bg-active)] border-[var(--border)]",
			disabled && "opacity-40 cursor-not-allowed",
		)}>
		<span
			className={cn(
				"pointer-events-none absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all duration-200",
				checked ? "left-[calc(100%-14px)]" : "left-0.5",
			)}
		/>
	</button>
);
