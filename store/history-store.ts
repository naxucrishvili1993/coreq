import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId } from "@/lib/utils";
import type { HistoryEntry, HttpRequest, ResponseData } from "@/lib/types";

const MAX_HISTORY = 200;

interface HistoryState {
	entries: HistoryEntry[];
	addEntry: (request: HttpRequest, response?: ResponseData) => void;
	removeEntry: (id: string) => void;
	clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
	persist(
		(set) => ({
			entries: [],

			addEntry(request, response) {
				const entry: HistoryEntry = {
					id: genId(),
					request: {
						method: request.method,
						url: request.url,
						headers: request.headers,
						params: request.params,
						body: request.body,
						auth: request.auth,
					},
					requestName: request.name,
					response,
					timestamp: Date.now(),
				};
				set((s) => ({
					entries: [entry, ...s.entries].slice(0, MAX_HISTORY),
				}));
			},

			removeEntry(id) {
				set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
			},

			clearHistory() {
				set({ entries: [] });
			},
		}),
		{ name: "coreq-history" },
	),
);
