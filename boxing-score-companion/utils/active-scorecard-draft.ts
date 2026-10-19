export const ACTIVE_SCORECARD_KEY = 'activeScorecardDraft.v1';

export const DRAFT_SCREENS = ['/createMatch', '/matchInfo', '/matchNotes', '/exportCard'] as const;
export type DraftScreen = typeof DRAFT_SCREENS[number];
export type DraftParams = Record<string, string | string[]>;
export type DraftInputParams = Record<string, string | string[] | number | undefined>;
export type ActiveScorecardDraft = { version: 1; pathname: DraftScreen; params: DraftParams };

export function makeScorecardDraft(pathname: DraftScreen, params: DraftInputParams): ActiveScorecardDraft {
  const normalized: DraftParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) normalized[key] = typeof value === 'number' ? String(value) : value;
  }
  return { version: 1, pathname, params: normalized };
}

export function parseScorecardDraft(raw: string | null): ActiveScorecardDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw);
    if (draft?.version !== 1 || !DRAFT_SCREENS.includes(draft.pathname) ||
        !draft.params || typeof draft.params !== 'object' || Array.isArray(draft.params)) return null;
    if (!Object.values(draft.params).every((value) => typeof value === 'string' ||
        (Array.isArray(value) && value.every((item) => typeof item === 'string')))) return null;
    return draft;
  } catch {
    return null;
  }
}

export function getDraftRestoreRoutes(draft: ActiveScorecardDraft) {
  if (draft.pathname === '/matchInfo' || (draft.pathname === '/createMatch' && !draft.params.isEdit)) {
    return [{ pathname: draft.pathname, params: draft.params }];
  }
  const cardParams = { ...draft.params };
  for (const key of ['detailsMode', 'notesMode', 'title', 'buttonText', 'backText']) delete cardParams[key];
  return [
    { pathname: '/matchInfo' as const, params: cardParams },
    { pathname: draft.pathname, params: draft.params },
  ];
}

type DraftStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
};

// Serialize writes and deletion so a slower earlier save cannot resurrect an old draft.
export function createDraftStore(storage: DraftStorage, onError: (error: unknown) => void) {
  let pending = Promise.resolve();
  const enqueue = (operation: () => Promise<unknown>) => {
    pending = pending.then(operation).then(() => undefined).catch(onError);
    return pending;
  };
  return {
    read: async () => {
      await pending;
      return parseScorecardDraft(await storage.getItem(ACTIVE_SCORECARD_KEY));
    },
    save: (draft: ActiveScorecardDraft) => {
      const serialized = JSON.stringify(draft);
      return enqueue(() => storage.setItem(ACTIVE_SCORECARD_KEY, serialized));
    },
    clear: () => enqueue(() => storage.removeItem(ACTIVE_SCORECARD_KEY)),
  };
}
