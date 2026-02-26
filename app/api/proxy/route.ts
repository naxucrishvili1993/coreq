import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
	let payload: {
		method: string;
		url: string;
		headers: Record<string, string>;
		body?: string;
		formFields?: { key: string; value: string }[];
		bodyType?: "raw" | "urlencoded" | "form-data";
	};

	try {
		payload = await req.json();
	} catch {
		return NextResponse.json(
			{ error: "Invalid JSON payload" },
			{ status: 400 },
		);
	}

	const { method, url, headers, body: rawBody, formFields, bodyType } = payload;

	if (!url) {
		return NextResponse.json({ error: "Missing url" }, { status: 400 });
	}

	const HOP_BY_HOP = new Set([
		"host",
		"connection",
		"keep-alive",
		"proxy-authenticate",
		"proxy-authorization",
		"proxy-connection",
		"te",
		"trailers",
		"transfer-encoding",
		"upgrade",
		"content-length",
	]);

	const forwardHeaders: Record<string, string> = {};
	for (const [k, v] of Object.entries(headers ?? {})) {
		if (!HOP_BY_HOP.has(k.toLowerCase())) forwardHeaders[k] = v;
	}

	let fetchBody: string | URLSearchParams | FormData | undefined;
	if (bodyType === "urlencoded" && formFields) {
		const usp = new URLSearchParams();
		for (const { key, value } of formFields) usp.append(key, value);
		fetchBody = usp;
		delete forwardHeaders["content-type"];
		delete forwardHeaders["Content-Type"];
	} else if (bodyType === "form-data" && formFields) {
		const fd = new FormData();
		for (const { key, value } of formFields) fd.append(key, value);
		fetchBody = fd;
		delete forwardHeaders["content-type"];
		delete forwardHeaders["Content-Type"];
	} else if (rawBody !== undefined) {
		fetchBody = rawBody;
	}

	const canHaveBody = method !== "GET" && method !== "HEAD";
	const start = Date.now();

	let response: Response;
	try {
		response = await fetch(url, {
			method: method ?? "GET",
			headers: forwardHeaders,
			body: canHaveBody ? fetchBody : undefined,
			redirect: "follow",
			signal: AbortSignal.timeout(30_000),
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: message }, { status: 502 });
	}

	const timing = Date.now() - start;

	const responseHeaders: Record<string, string> = {};
	response.headers.forEach((v, k) => {
		responseHeaders[k] = v;
	});

	const responseBody = await response.text();

	return NextResponse.json({
		status: response.status,
		statusText: response.statusText,
		headers: responseHeaders,
		body: responseBody,
		timing,
	});
}
