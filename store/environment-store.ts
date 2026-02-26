import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId, createDefaultEnvironment } from "@/lib/utils";
import type { Environment, EnvVariable } from "@/lib/types";

interface EnvironmentState {
	environments: Environment[];
	activeEnvironmentId: string | null;

	addEnvironment: (name?: string) => Environment;
	updateEnvironment: (id: string, patch: Partial<Environment>) => void;
	deleteEnvironment: (id: string) => void;
	setActiveEnvironment: (id: string | null) => void;

	upsertVariable: (envId: string, variable: EnvVariable) => void;
	deleteVariable: (envId: string, varId: string) => void;

	getActiveVariables: () => EnvVariable[];
}

export const useEnvironmentStore = create<EnvironmentState>()(
	persist(
		(set, get) => ({
			environments: [],
			activeEnvironmentId: null,

			addEnvironment(name) {
				const env = createDefaultEnvironment(name);
				set((s) => ({ environments: [...s.environments, env] }));
				return env;
			},

			updateEnvironment(id, patch) {
				set((s) => ({
					environments: s.environments.map((e) =>
						e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e,
					),
				}));
			},

			deleteEnvironment(id) {
				set((s) => ({
					environments: s.environments.filter((e) => e.id !== id),
					activeEnvironmentId:
						s.activeEnvironmentId === id ? null : s.activeEnvironmentId,
				}));
			},

			setActiveEnvironment(id) {
				set({ activeEnvironmentId: id });
			},

			upsertVariable(envId, variable) {
				set((s) => ({
					environments: s.environments.map((e) => {
						if (e.id !== envId) return e;
						const exists = e.variables.some((v) => v.id === variable.id);
						return {
							...e,
							variables: exists
								? e.variables.map((v) => (v.id === variable.id ? variable : v))
								: [...e.variables, variable],
							updatedAt: Date.now(),
						};
					}),
				}));
			},

			deleteVariable(envId, varId) {
				set((s) => ({
					environments: s.environments.map((e) =>
						e.id === envId
							? {
									...e,
									variables: e.variables.filter((v) => v.id !== varId),
									updatedAt: Date.now(),
								}
							: e,
					),
				}));
			},

			getActiveVariables() {
				const { environments, activeEnvironmentId } = get();
				if (!activeEnvironmentId) return [];
				return (
					environments.find((e) => e.id === activeEnvironmentId)?.variables ??
					[]
				);
			},
		}),
		{ name: "coreq-environments" },
	),
);
