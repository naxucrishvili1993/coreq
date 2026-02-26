"use client";

import React, { useCallback, useRef, useState } from "react";
import { cn } from "./primitives";

// ─── Resizable vertical split ─────────────────────────────────────────────────

interface ResizablePanelProps {
	topSlot: React.ReactNode;
	bottomSlot: React.ReactNode;
	initialBottomHeight?: number;
	minTop?: number;
	minBottom?: number;
	className?: string;
	onBottomHeightChange?: (h: number) => void;
}

export function ResizableVSplit({
	topSlot,
	bottomSlot,
	initialBottomHeight = 320,
	minTop = 200,
	minBottom = 120,
	className,
	onBottomHeightChange,
}: ResizablePanelProps) {
	const [bottomHeight, setBottomHeight] = useState(initialBottomHeight);
	const containerRef = useRef<HTMLDivElement>(null);
	const dragging = useRef(false);
	const startY = useRef(0);
	const startH = useRef(0);

	const onMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			dragging.current = true;
			startY.current = e.clientY;
			startH.current = bottomHeight;

			const onMove = (me: MouseEvent) => {
				if (!dragging.current || !containerRef.current) return;
				const totalH = containerRef.current.clientHeight;
				const delta = startY.current - me.clientY;
				const next = Math.max(
					minBottom,
					Math.min(totalH - minTop, startH.current + delta),
				);
				setBottomHeight(next);
				onBottomHeightChange?.(next);
			};

			const onUp = () => {
				dragging.current = false;
				window.removeEventListener("mousemove", onMove);
				window.removeEventListener("mouseup", onUp);
			};

			window.addEventListener("mousemove", onMove);
			window.addEventListener("mouseup", onUp);
		},
		[bottomHeight, minBottom, minTop, onBottomHeightChange],
	);

	const onTouchStart = useCallback(
		(e: React.TouchEvent) => {
			const touch = e.touches[0];
			dragging.current = true;
			startY.current = touch.clientY;
			startH.current = bottomHeight;

			const onMove = (te: TouchEvent) => {
				if (!dragging.current || !containerRef.current) return;
				const t = te.touches[0];
				const totalH = containerRef.current.clientHeight;
				const delta = startY.current - t.clientY;
				const next = Math.max(
					minBottom,
					Math.min(totalH - minTop, startH.current + delta),
				);
				setBottomHeight(next);
				onBottomHeightChange?.(next);
			};

			const onEnd = () => {
				dragging.current = false;
				window.removeEventListener("touchmove", onMove);
				window.removeEventListener("touchend", onEnd);
			};

			window.addEventListener("touchmove", onMove);
			window.addEventListener("touchend", onEnd);
		},
		[bottomHeight, minBottom, minTop, onBottomHeightChange],
	);

	return (
		<div
			ref={containerRef}
			className={cn("flex flex-col overflow-hidden", className)}>
			<div className="flex-1 overflow-auto min-h-0">{topSlot}</div>
			<div
				className="resize-handle touch-none"
				onMouseDown={onMouseDown}
				onTouchStart={onTouchStart}
			/>
			<div
				style={{ height: bottomHeight, flexShrink: 0 }}
				className="overflow-hidden">
				{bottomSlot}
			</div>
		</div>
	);
}

// ─── Resizable horizontal split ───────────────────────────────────────────────

interface HResizableProps {
	leftSlot: React.ReactNode;
	rightSlot: React.ReactNode;
	initialLeftWidth?: number;
	minLeft?: number;
	minRight?: number;
	className?: string;
}

export function ResizableHSplit({
	leftSlot,
	rightSlot,
	initialLeftWidth = 260,
	minLeft = 160,
	minRight = 300,
	className,
}: HResizableProps) {
	const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
	const containerRef = useRef<HTMLDivElement>(null);
	const dragging = useRef(false);
	const startX = useRef(0);
	const startW = useRef(0);

	const onMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			dragging.current = true;
			startX.current = e.clientX;
			startW.current = leftWidth;

			const onMove = (me: MouseEvent) => {
				if (!dragging.current || !containerRef.current) return;
				const totalW = containerRef.current.clientWidth;
				const delta = me.clientX - startX.current;
				const next = Math.max(
					minLeft,
					Math.min(totalW - minRight, startW.current + delta),
				);
				setLeftWidth(next);
			};

			const onUp = () => {
				dragging.current = false;
				window.removeEventListener("mousemove", onMove);
				window.removeEventListener("mouseup", onUp);
			};

			window.addEventListener("mousemove", onMove);
			window.addEventListener("mouseup", onUp);
		},
		[leftWidth, minLeft, minRight],
	);

	return (
		<div ref={containerRef} className={cn("flex overflow-hidden", className)}>
			<div
				style={{ width: leftWidth, flexShrink: 0 }}
				className="overflow-hidden">
				{leftSlot}
			</div>
			<div
				className="w-[3px] cursor-col-resize bg-[var(--border)] hover:bg-[var(--accent)] transition-colors flex-shrink-0"
				onMouseDown={onMouseDown}
			/>
			<div className="flex-1 overflow-hidden min-w-0">{rightSlot}</div>
		</div>
	);
}
