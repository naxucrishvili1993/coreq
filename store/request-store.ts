import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId, createDefaultRequest } from "@/lib/utils";
import type { HttpRequest, Tab, ResponseData } from "@/lib/types";

interface RequestState {
	// Tabs
	tabs: Tab[];
	activeTabId: string | null;

	// Dirty requests (unsaved edits keyed by tab.id)
	draftRequests: Record<string, HttpRequest>;

	// Responses keyed by tab.id
	responses: Record<string, ResponseData>;

	// Loading state
	loading: Record<string, boolean>;

	// Tab management
	openRequest: (request: HttpRequest) => void;
	openNewTab: () => void;
	closeTab: (tabId: string) => void;
	setActiveTab: (tabId: string) => void;

	// Draft management
	getDraftRequest: (tabId: string) => HttpRequest | null;
	updateDraft: (tabId: string, patch: Partial<HttpRequest>) => void;

	// Response
	setResponse: (tabId: string, response: ResponseData | null) => void;
	setLoading: (tabId: string, loading: boolean) => void;
}

const newUnsavedRequest = (): HttpRequest =>
	createDefaultRequest({ id: genId() });

export const useRequestStore = create<RequestState>()(
	persist(
		(set, get) => ({
			tabs: [],
			activeTabId: null,
			draftRequests: {},
			responses: {},
			loading: {},

			openRequest(request) {
				const { tabs } = get();

				// Already have a permanent (non-preview) tab for this request
				const existing = tabs.find(
					(t) => t.requestId === request.id && !t.isPreview,
				);
				if (existing) {
					set({ activeTabId: existing.id });
					return;
				}

				// Reuse the existing preview slot (replace its content in-place)
				const preview = tabs.find((t) => t.isPreview);
				if (preview) {
					const tab: Tab = {
						...preview,
						requestId: request.id,
						isDirty: false,
						isPreview: true,
						label: request.name,
					};
					set((s) => ({
						tabs: s.tabs.map((t) => (t.id === preview.id ? tab : t)),
						activeTabId: tab.id,
						draftRequests: { ...s.draftRequests, [tab.id]: request },
					}));
					return;
				}

				// No preview slot yet — open a new preview tab
				const tab: Tab = {
					id: genId(),
					requestId: request.id,
					isDirty: false,
					isPreview: true,
					label: request.name,
				};
				set((s) => ({
					tabs: [...s.tabs, tab],
					activeTabId: tab.id,
					draftRequests: { ...s.draftRequests, [tab.id]: request },
				}));
			},

			openNewTab() {
				const req = newUnsavedRequest();
				const tab: Tab = {
					id: genId(),
					requestId: null,
					isDirty: true,
					label: "Untitled",
				};
				set((s) => ({
					tabs: [...s.tabs, tab],
					activeTabId: tab.id,
					draftRequests: { ...s.draftRequests, [tab.id]: req },
				}));
			},

			closeTab(tabId) {
				const { tabs, activeTabId, draftRequests, responses, loading } = get();
				const idx = tabs.findIndex((t) => t.id === tabId);
				const remaining = tabs.filter((t) => t.id !== tabId);

				let newActiveId: string | null = activeTabId;
				if (activeTabId === tabId) {
					newActiveId =
						remaining[Math.max(0, idx - 1)]?.id ?? remaining[0]?.id ?? null;
				}

				const newDrafts = { ...draftRequests };
				delete newDrafts[tabId];
				const newResponses = { ...responses };
				delete newResponses[tabId];
				const newLoading = { ...loading };
				delete newLoading[tabId];

				set({
					tabs: remaining,
					activeTabId: newActiveId,
					draftRequests: newDrafts,
					responses: newResponses,
					loading: newLoading,
				});
			},

			setActiveTab(tabId) {
				set({ activeTabId: tabId });
			},

			getDraftRequest(tabId) {
				return get().draftRequests[tabId] ?? null;
			},

			updateDraft(tabId, patch) {
				set((s) => ({
					draftRequests: {
						...s.draftRequests,
						[tabId]: s.draftRequests[tabId]
							? { ...s.draftRequests[tabId], ...patch, updatedAt: Date.now() }
							: createDefaultRequest(patch),
					},
					tabs: s.tabs.map((t) =>
						t.id === tabId
							? {
									...t,
									isDirty: true,
									isPreview: false, // first edit promotes to permanent
									label:
										(patch.name ?? s.draftRequests[tabId]?.name) || "Untitled",
								}
							: t,
					),
				}));
			},

			setResponse(tabId, response) {
				set((s) => ({
					responses: response
						? { ...s.responses, [tabId]: response }
						: (() => {
								const r = { ...s.responses };
								delete r[tabId];
								return r;
							})(),
				}));
			},

			setLoading(tabId, loading) {
				set((s) => ({ loading: { ...s.loading, [tabId]: loading } }));
			},
		}),
		{
			name: "coreq-tabs",
			partialize: (s) => ({
				tabs: s.tabs,
				activeTabId: s.activeTabId,
				draftRequests: s.draftRequests,
			}),
		},
	),
);
