import { v4 as uuidv4 } from "uuid";
import type {
	HttpRequest,
	HttpMethod,
	BodyType,
	KeyValuePair,
	RequestBody,
	Auth,
	ResponseData,
	EnvVariable,
	Environment,
	Collection,
	Folder,
} from "./types";

// ─── ID generation ─────────────────────────────────────────────────────────────

export const genId = (): string => uuidv4();

// ─── Default builders ──────────────────────────────────────────────────────────

export const createDefaultKeyValue = (): KeyValuePair => ({
	id: genId(),
	key: "",
	value: "",
	description: "",
	enabled: true,
});

export const createDefaultBody = (): RequestBody => ({
	type: "none",
	content: "",
	formFields: [],
});

export const createDefaultAuth = (): Auth => ({ type: "none" });

export const createDefaultRequest = (
	override?: Partial<HttpRequest>,
): HttpRequest => ({
	id: genId(),
	name: "Untitled Request",
	method: "GET",
	url: "",
	headers: [createDefaultKeyValue()],
	params: [createDefaultKeyValue()],
	body: createDefaultBody(),
	auth: createDefaultAuth(),
	createdAt: Date.now(),
	updatedAt: Date.now(),
	...override,
});

export const createDefaultEnvironment = (
	name = "New Environment",
): Environment => ({
	id: genId(),
	name,
	variables: [],
	createdAt: Date.now(),
	updatedAt: Date.now(),
});

export const createDefaultEnvVariable = (): EnvVariable => ({
	id: genId(),
	key: "",
	value: "",
	description: "",
	enabled: true,
	secret: false,
});

// ─── HTTP Method colors ────────────────────────────────────────────────────────

export const METHOD_COLORS: Record<string, string> = {
	GET: "#22c55e", // green
	POST: "#f59e0b", // amber
	PUT: "#3b82f6", // blue
	PATCH: "#8b5cf6", // violet
	DELETE: "#ef4444", // red
	HEAD: "#06b6d4", // cyan
	OPTIONS: "#ec4899", // pink
};

export const getMethodColor = (method: string): string =>
	METHOD_COLORS[method] ?? "#6b7280";

// ─── Environment variable interpolation ───────────────────────────────────────

export const interpolateVariables = (
	text: string,
	variables: EnvVariable[],
): string => {
	const enabledVars = variables.filter((v) => v.enabled);
	return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
		const variable = enabledVars.find((v) => v.key === key.trim());
		return variable ? variable.value : match;
	});
};

// ─── Format bytes ──────────────────────────────────────────────────────────────

export const formatBytes = (bytes: number): string => {
	if (bytes === 0) return "0 B";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Format duration ───────────────────────────────────────────────────────────

export const formatDuration = (ms: number): string => {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
};

// ─── HTTP Status helpers ───────────────────────────────────────────────────────

export const getStatusCategory = (
	status: number,
): "success" | "redirect" | "client-error" | "server-error" | "info" => {
	if (status < 200) return "info";
	if (status < 300) return "success";
	if (status < 400) return "redirect";
	if (status < 500) return "client-error";
	return "server-error";
};

export const STATUS_COLORS: Record<string, string> = {
	success: "#22c55e",
	redirect: "#f59e0b",
	"client-error": "#ef4444",
	"server-error": "#ef4444",
	info: "#6b7280",
};

export const getStatusColor = (status: number): string =>
	STATUS_COLORS[getStatusCategory(status)] ?? "#6b7280";

// ─── JSON helpers ──────────────────────────────────────────────────────────────

export const tryParseJson = (str: string): unknown | null => {
	try {
		return JSON.parse(str);
	} catch {
		return null;
	}
};

export const prettyPrintJson = (str: string): string => {
	try {
		return JSON.stringify(JSON.parse(str), null, 2);
	} catch {
		return str;
	}
};

// ─── Build URL with params ─────────────────────────────────────────────────────

export const buildUrl = (
	baseUrl: string,
	params: KeyValuePair[],
	variables: EnvVariable[],
): string => {
	const interpolated = interpolateVariables(baseUrl, variables);
	const enabled = params.filter((p) => p.enabled && p.key);
	if (!enabled.length) return interpolated;
	const search = new URLSearchParams(
		enabled.map((p) => [
			interpolateVariables(p.key, variables),
			interpolateVariables(p.value, variables),
		]),
	);
	return `${interpolated}${interpolated.includes("?") ? "&" : "?"}${search}`;
};

// ─── Curl generation ──────────────────────────────────────────────────────────

export const generateCurl = (
	req: HttpRequest,
	variables: EnvVariable[],
): string => {
	const url = buildUrl(req.url, req.params, variables);
	const parts: string[] = [
		`curl -X ${req.method} '${interpolateVariables(url, variables)}'`,
	];

	const headers: [string, string][] = req.headers
		.filter((h) => h.enabled && h.key)
		.map((h) => [
			interpolateVariables(h.key, variables),
			interpolateVariables(h.value, variables),
		]);

	if (req.auth.type === "bearer") {
		headers.push([
			"Authorization",
			`Bearer ${interpolateVariables(req.auth.token, variables)}`,
		]);
	} else if (req.auth.type === "basic") {
		const creds = btoa(`${req.auth.username}:${req.auth.password}`);
		headers.push(["Authorization", `Basic ${creds}`]);
	} else if (req.auth.type === "api-key" && req.auth.addTo === "header") {
		headers.push([
			req.auth.key,
			interpolateVariables(req.auth.value, variables),
		]);
	}

	for (const [k, v] of headers) {
		parts.push(`  -H '${k}: ${v}'`);
	}

	if (req.body.type !== "none" && req.body.content) {
		const contentType =
			req.body.type === "json" ? "application/json" : "text/plain";
		if (!headers.find(([k]) => k.toLowerCase() === "content-type")) {
			parts.push(`  -H 'Content-Type: ${contentType}'`);
		}
		parts.push(`  -d '${req.body.content.replace(/'/g, "\\'")}'`);
	}

	return parts.join(" \\\n");
};

// ─── Import from curl ─────────────────────────────────────────────────────────

export const parseCurl = (curl: string): Partial<HttpRequest> | null => {
	try {
		const clean = curl.replace(/\\\n/g, " ").replace(/\s+/g, " ").trim();
		const methodMatch = clean.match(/-X\s+([A-Z]+)/i);
		const urlMatch = clean.match(
			/curl\s+(?:-X\s+[A-Z]+\s+)?['"]?([^'">\s]+)['"]?/i,
		);

		if (!urlMatch) return null;

		const method = (methodMatch?.[1]?.toUpperCase() ??
			"GET") as HttpRequest["method"];
		const rawUrl = urlMatch[1];

		let url = rawUrl;
		const params: KeyValuePair[] = [];
		if (rawUrl.includes("?")) {
			const [base, query] = rawUrl.split("?");
			url = base;
			new URLSearchParams(query).forEach((value, key) => {
				params.push({ id: genId(), key, value, enabled: true });
			});
		}

		const headers: KeyValuePair[] = [];
		const headerMatches = [...clean.matchAll(/-H\s+['"]([^'"]+)['"]/gi)];
		for (const match of headerMatches) {
			const [k, ...vparts] = match[1].split(":");
			headers.push({
				id: genId(),
				key: k.trim(),
				value: vparts.join(":").trim(),
				enabled: true,
			});
		}

		const bodyMatch = clean.match(/-d\s+['"]([^'"]*)['"]/i);
		const body: RequestBody = {
			type: bodyMatch ? "json" : "none",
			content: bodyMatch ? bodyMatch[1] : "",
		};

		return { method, url, headers, params, body };
	} catch {
		return null;
	}
};

// ─── Export collection ─────────────────────────────────────────────────────────

export const downloadJson = (data: unknown, filename: string): void => {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};

// ─── Postman v2.1 collection parser ─────────────────────────────────────────

const VALID_METHODS = new Set([
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"HEAD",
	"OPTIONS",
]);

function convertPostmanRequest(
	item: Record<string, any>,
	collectionId: string,
	folderId?: string,
): HttpRequest {
	const r = item.request ?? {};

	// ── URL + query params ──────────────────────────────────────────────────
	let url = "";
	let params: KeyValuePair[] = [];
	if (typeof r.url === "string") {
		url = r.url;
	} else if (r.url?.raw) {
		url = r.url.raw;
		params = (r.url.query ?? []).map((q: Record<string, any>) => ({
			id: genId(),
			key: q.key ?? "",
			value: q.value ?? "",
			description: q.description ?? "",
			enabled: !q.disabled,
		}));
	}

	// ── Headers ─────────────────────────────────────────────────────────────
	const headers: KeyValuePair[] = (r.header ?? []).map(
		(h: Record<string, any>) => ({
			id: genId(),
			key: h.key ?? "",
			value: h.value ?? "",
			description: h.description ?? "",
			enabled: !h.disabled,
		}),
	);

	// ── Auth ────────────────────────────────────────────────────────────────
	let auth: Auth = { type: "none" };
	const pa = r.auth;
	if (pa) {
		if (pa.type === "bearer") {
			const token =
				(pa.bearer ?? []).find((x: any) => x.key === "token")?.value ?? "";
			auth = { type: "bearer", token };
		} else if (pa.type === "basic") {
			const u =
				(pa.basic ?? []).find((x: any) => x.key === "username")?.value ?? "";
			const p =
				(pa.basic ?? []).find((x: any) => x.key === "password")?.value ?? "";
			auth = { type: "basic", username: u, password: p };
		} else if (pa.type === "apikey") {
			const k =
				(pa.apikey ?? []).find((x: any) => x.key === "key")?.value ?? "";
			const v =
				(pa.apikey ?? []).find((x: any) => x.key === "value")?.value ?? "";
			const loc =
				(pa.apikey ?? []).find((x: any) => x.key === "in")?.value ?? "header";
			auth = {
				type: "api-key",
				key: k,
				value: v,
				addTo: loc === "query" ? "query" : "header",
			};
		}
	}

	// ── Body ────────────────────────────────────────────────────────────────
	let body: RequestBody = { type: "none", content: "", formFields: [] };
	const pb = r.body;
	if (pb) {
		const mode = pb.mode;
		if (mode === "raw") {
			const lang: string = pb.options?.raw?.language ?? "text";
			const bt: BodyType =
				lang === "json" ? "json" : lang === "xml" ? "xml" : "text";
			body = { type: bt, content: pb.raw ?? "", formFields: [] };
		} else if (mode === "urlencoded") {
			body = {
				type: "urlencoded",
				content: "",
				formFields: (pb.urlencoded ?? []).map((f: Record<string, any>) => ({
					id: genId(),
					key: f.key ?? "",
					value: f.value ?? "",
					description: f.description ?? "",
					enabled: !f.disabled,
				})),
			};
		} else if (mode === "formdata") {
			body = {
				type: "form-data",
				content: "",
				formFields: (pb.formdata ?? [])
					.filter((f: any) => f.type !== "file")
					.map((f: Record<string, any>) => ({
						id: genId(),
						key: f.key ?? "",
						value: f.value ?? "",
						description: f.description ?? "",
						enabled: !f.disabled,
					})),
			};
		} else if (mode === "graphql") {
			body = {
				type: "json",
				content: JSON.stringify(pb.graphql ?? {}, null, 2),
				formFields: [],
			};
		}
	}

	const rawMethod = (r.method ?? "GET").toUpperCase();
	const method: HttpMethod = VALID_METHODS.has(rawMethod)
		? (rawMethod as HttpMethod)
		: "GET";

	return {
		id: genId(),
		name: item.name ?? "Untitled Request",
		method,
		url,
		headers,
		params,
		body,
		auth,
		collectionId,
		folderId,
		description: String(item.description ?? r.description ?? ""),
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
}

export function parsePostmanCollection(
	raw: Record<string, any>,
): {
	collection: Collection;
	folders: Folder[];
	requests: HttpRequest[];
} | null {
	// Accept Postman v2.0 and v2.1 (schema URL check OR info+item shape)
	const isPostman =
		raw?.info?.schema?.includes("getpostman.com") ||
		(raw?.info?.name && Array.isArray(raw?.item));
	if (!isPostman) return null;

	const collectionId = genId();
	const collection: Collection = {
		id: collectionId,
		name: raw.info?.name ?? "Imported Collection",
		description:
			typeof raw.info?.description === "string"
				? raw.info.description
				: undefined,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};

	const folders: Folder[] = [];
	const requests: HttpRequest[] = [];

	function processItems(items: Record<string, any>[], parentFolderId?: string) {
		for (const item of items) {
			if (Array.isArray(item.item)) {
				// Folder
				const folder: Folder = {
					id: genId(),
					name: item.name ?? "Folder",
					collectionId,
					parentFolderId,
					description:
						typeof item.description === "string" ? item.description : undefined,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};
				folders.push(folder);
				processItems(item.item, folder.id);
			} else if (item.request) {
				// Request
				requests.push(
					convertPostmanRequest(item, collectionId, parentFolderId),
				);
			}
		}
	}

	processItems(raw.item ?? []);
	return { collection, folders, requests };
}

// ─── Relative time ────────────────────────────────────────────────────────────

export const relativeTime = (ts: number): string => {
	const diff = Date.now() - ts;
	if (diff < 60_000) return "just now";
	if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
	if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
	return `${Math.floor(diff / 86_400_000)}d ago`;
};
