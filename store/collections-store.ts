import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId, createDefaultRequest } from "@/lib/utils";
import type { Collection, Folder, HttpRequest } from "@/lib/types";

interface CollectionsState {
	collections: Collection[];
	folders: Folder[];
	requests: HttpRequest[];

	// Collections
	addCollection: (name: string) => Collection;
	updateCollection: (id: string, patch: Partial<Collection>) => void;
	deleteCollection: (id: string) => void;

	// Folders
	addFolder: (
		collectionId: string,
		name: string,
		parentFolderId?: string,
	) => Folder;
	updateFolder: (id: string, patch: Partial<Folder>) => void;
	deleteFolder: (id: string) => void;

	// Requests
	addRequest: (opts?: {
		collectionId?: string;
		folderId?: string;
		clone?: HttpRequest;
	}) => HttpRequest;
	updateRequest: (id: string, patch: Partial<HttpRequest>) => void;
	deleteRequest: (id: string) => void;
	moveRequest: (id: string, collectionId?: string, folderId?: string) => void;

	// Import / export
	importCollection: (data: {
		collection: Collection;
		folders: Folder[];
		requests: HttpRequest[];
	}) => void;
}

export const useCollectionsStore = create<CollectionsState>()(
	persist(
		(set, get) => ({
			collections: [],
			folders: [],
			requests: [],

			addCollection(name) {
				const c: Collection = {
					id: genId(),
					name,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};
				set((s) => ({ collections: [...s.collections, c] }));
				return c;
			},

			updateCollection(id, patch) {
				set((s) => ({
					collections: s.collections.map((c) =>
						c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c,
					),
				}));
			},

			deleteCollection(id) {
				const { folders, requests } = get();
				const folderIds = folders
					.filter((f) => f.collectionId === id)
					.map((f) => f.id);
				set((s) => ({
					collections: s.collections.filter((c) => c.id !== id),
					folders: s.folders.filter((f) => f.collectionId !== id),
					requests: s.requests.filter(
						(r) =>
							r.collectionId !== id && !folderIds.includes(r.folderId ?? ""),
					),
				}));
			},

			addFolder(collectionId, name, parentFolderId) {
				const f: Folder = {
					id: genId(),
					name,
					collectionId,
					parentFolderId,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};
				set((s) => ({ folders: [...s.folders, f] }));
				return f;
			},

			updateFolder(id, patch) {
				set((s) => ({
					folders: s.folders.map((f) =>
						f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f,
					),
				}));
			},

			deleteFolder(id) {
				set((s) => ({
					folders: s.folders.filter((f) => f.id !== id),
					requests: s.requests.filter((r) => r.folderId !== id),
				}));
			},

			addRequest({ collectionId, folderId, clone } = {}) {
				const r = createDefaultRequest({
					...(clone
						? {
								...clone,
								id: genId(),
								name: `${clone.name} (copy)`,
								createdAt: Date.now(),
								updatedAt: Date.now(),
							}
						: {}),
					collectionId,
					folderId,
				});
				set((s) => ({ requests: [...s.requests, r] }));
				return r;
			},

			updateRequest(id, patch) {
				set((s) => ({
					requests: s.requests.map((r) =>
						r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r,
					),
				}));
			},

			deleteRequest(id) {
				set((s) => ({ requests: s.requests.filter((r) => r.id !== id) }));
			},

			moveRequest(id, collectionId, folderId) {
				set((s) => ({
					requests: s.requests.map((r) =>
						r.id === id
							? { ...r, collectionId, folderId, updatedAt: Date.now() }
							: r,
					),
				}));
			},

			importCollection({ collection, folders, requests }) {
				set((s) => ({
					collections: [
						...s.collections.filter((c) => c.id !== collection.id),
						collection,
					],
					folders: [
						...s.folders.filter((f) => f.collectionId !== collection.id),
						...folders,
					],
					requests: [
						...s.requests.filter((r) => r.collectionId !== collection.id),
						...requests,
					],
				}));
			},
		}),
		{ name: "coreq-collections" },
	),
);
