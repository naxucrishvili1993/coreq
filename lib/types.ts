// ─── HTTP Methods ──────────────────────────────────────────────────────────────

export type HttpMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "PATCH"
	| "DELETE"
	| "HEAD"
	| "OPTIONS";

// ─── Auth ──────────────────────────────────────────────────────────────────────

export type AuthType = "none" | "bearer" | "basic" | "api-key";

export interface BearerAuth {
	type: "bearer";
	token: string;
}

export interface BasicAuth {
	type: "basic";
	username: string;
	password: string;
}

export interface ApiKeyAuth {
	type: "api-key";
	key: string;
	value: string;
	addTo: "header" | "query";
}

export interface NoAuth {
	type: "none";
}

export type Auth = BearerAuth | BasicAuth | ApiKeyAuth | NoAuth;

// ─── Body ──────────────────────────────────────────────────────────────────────

export type BodyType =
	| "none"
	| "json"
	| "text"
	| "form-data"
	| "urlencoded"
	| "xml";

export interface RequestBody {
	type: BodyType;
	content: string;
	formFields?: KeyValuePair[];
}

// ─── Key-Value Pair ────────────────────────────────────────────────────────────

export interface KeyValuePair {
	id: string;
	key: string;
	value: string;
	description?: string;
	enabled: boolean;
}

// ─── Request ───────────────────────────────────────────────────────────────────

export interface HttpRequest {
	id: string;
	name: string;
	method: HttpMethod;
	url: string;
	headers: KeyValuePair[];
	params: KeyValuePair[];
	body: RequestBody;
	auth: Auth;
	collectionId?: string;
	folderId?: string;
	description?: string;
	createdAt: number;
	updatedAt: number;
}

// ─── Collection / Folder ───────────────────────────────────────────────────────

export interface Folder {
	id: string;
	name: string;
	collectionId: string;
	parentFolderId?: string;
	description?: string;
	createdAt: number;
	updatedAt: number;
}

export interface Collection {
	id: string;
	name: string;
	description?: string;
	color?: string;
	createdAt: number;
	updatedAt: number;
}

// ─── Environment ───────────────────────────────────────────────────────────────

export interface EnvVariable {
	id: string;
	key: string;
	value: string;
	description?: string;
	enabled: boolean;
	secret?: boolean;
}

export interface Environment {
	id: string;
	name: string;
	variables: EnvVariable[];
	createdAt: number;
	updatedAt: number;
}

// ─── Response ──────────────────────────────────────────────────────────────────

export interface ResponseData {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string;
	size: number;
	time: number;
	timestamp: number;
}

// ─── History ───────────────────────────────────────────────────────────────────

export interface HistoryEntry {
	id: string;
	request: Omit<
		HttpRequest,
		"id" | "name" | "collectionId" | "folderId" | "createdAt" | "updatedAt"
	>;
	requestName?: string;
	response?: ResponseData;
	timestamp: number;
	duration?: number;
}

// ─── Tab ───────────────────────────────────────────────────────────────────────

export interface Tab {
	id: string;
	requestId: string | null;
	isDirty: boolean;
	/** Opened from sidebar without interaction — replaced when another item is opened */
	isPreview?: boolean;
	label: string;
}

// ─── UI State ──────────────────────────────────────────────────────────────────

export type SidebarPanel = "collections" | "history" | "environments";

// ─── Search Item ───────────────────────────────────────────────────────────────

export type SearchItemType =
	| "request"
	| "collection"
	| "folder"
	| "environment"
	| "history";

export interface SearchItem {
	id: string;
	type: SearchItemType;
	title: string;
	subtitle?: string;
	method?: HttpMethod;
	meta?: string;
}
