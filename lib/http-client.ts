import type { HttpRequest, ResponseData, EnvVariable } from "./types";
import { interpolateVariables, buildUrl } from "./utils";

export const executeRequest = async (
	req: HttpRequest,
	variables: EnvVariable[],
): Promise<ResponseData> => {
	const start = performance.now();

	const url = buildUrl(req.url, req.params, variables);

	// Headers
	const headers: Record<string, string> = {};
	for (const h of req.headers) {
		if (h.enabled && h.key) {
			headers[interpolateVariables(h.key, variables)] = interpolateVariables(
				h.value,
				variables,
			);
		}
	}

	// Auth
	if (req.auth.type === "bearer") {
		headers["Authorization"] =
			`Bearer ${interpolateVariables(req.auth.token, variables)}`;
	} else if (req.auth.type === "basic") {
		const creds = btoa(
			`${interpolateVariables(req.auth.username, variables)}:${interpolateVariables(req.auth.password, variables)}`,
		);
		headers["Authorization"] = `Basic ${creds}`;
	} else if (req.auth.type === "api-key" && req.auth.addTo === "header") {
		headers[req.auth.key] = interpolateVariables(req.auth.value, variables);
	}

	// Body
	type FormField = { key: string; value: string };
	let bodyString: string | undefined;
	let formFields: FormField[] | undefined;
	let proxyBodyType: "raw" | "urlencoded" | "form-data" | undefined;

	if (req.body.type === "json") {
		if (!headers["Content-Type"] && !headers["content-type"])
			headers["Content-Type"] = "application/json";
		bodyString = interpolateVariables(req.body.content, variables);
		proxyBodyType = "raw";
	} else if (req.body.type === "text") {
		if (!headers["Content-Type"]) headers["Content-Type"] = "text/plain";
		bodyString = interpolateVariables(req.body.content, variables);
		proxyBodyType = "raw";
	} else if (req.body.type === "xml") {
		if (!headers["Content-Type"]) headers["Content-Type"] = "application/xml";
		bodyString = interpolateVariables(req.body.content, variables);
		proxyBodyType = "raw";
	} else if (req.body.type === "urlencoded") {
		headers["Content-Type"] = "application/x-www-form-urlencoded";
		formFields = (req.body.formFields ?? [])
			.filter((f) => f.enabled && f.key)
			.map((f) => ({
				key: interpolateVariables(f.key, variables),
				value: interpolateVariables(f.value, variables),
			}));
		proxyBodyType = "urlencoded";
	} else if (req.body.type === "form-data") {
		formFields = (req.body.formFields ?? [])
			.filter((f) => f.enabled && f.key)
			.map((f) => ({
				key: interpolateVariables(f.key, variables),
				value: interpolateVariables(f.value, variables),
			}));
		proxyBodyType = "form-data";
	}

	// Send through server-side proxy to avoid CORS
	const proxyRes = await fetch("/api/proxy", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			method: req.method,
			url,
			headers,
			body: bodyString,
			formFields,
			bodyType: proxyBodyType,
		}),
	});

	if (!proxyRes.ok) {
		const err = await proxyRes.json().catch(() => ({ error: "Proxy error" }));
		throw new Error(err.error ?? "Proxy request failed");
	}

	const clientEnd = performance.now();
	const result = await proxyRes.json();

	return {
		status: result.status,
		statusText: result.statusText,
		headers: result.headers ?? {},
		body: result.body ?? "",
		size: new Blob([result.body ?? ""]).size,
		time: result.timing ?? Math.round(clientEnd - start),
		timestamp: Date.now(),
	};
};
