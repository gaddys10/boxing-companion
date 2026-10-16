import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRootNavigationState, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createDraftStore, getDraftRestoreRoutes, type ActiveScorecardDraft } from '../utils/active-scorecard-draft';

export const scorecardDraftStore = createDraftStore(AsyncStorage, (error) => {
  console.warn('Scorecard draft persistence failed:', error);
});

const DraftReadyContext = createContext(false);
export const useScorecardDraftReady = () => useContext(DraftReadyContext);

export function ScorecardDraftProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const navigation = useRootNavigationState();
  const [startup, setStartup] = useState<{ draft: ActiveScorecardDraft | null } | null>(null);
  const restoreStarted = useRef(false);
  const restoreFinished = useRef(false);

  useEffect(() => {
    let mounted = true;
    void scorecardDraftStore.read().then((draft) => {
      if (mounted) setStartup({ draft });
    }).catch((error) => {
      console.warn('Scorecard draft restore failed:', error);
      if (mounted) setStartup({ draft: null });
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!startup || !navigation?.key || restoreStarted.current) return;
    restoreStarted.current = true;
    const draft = startup.draft;
    if (!draft) return;
    // Rebuild a scorecard parent so Back from a restored editor stays in the card.
    for (const route of getDraftRestoreRoutes(draft)) router.push(route);
  }, [navigation?.key, router, startup]);

  const ready = startup !== null && Boolean(navigation?.key);

  useEffect(() => {
    if (!ready) return;
    if (startup?.draft && !restoreFinished.current && pathname !== startup.draft.pathname) return;
    restoreFinished.current = true;
    if (pathname === '/') void scorecardDraftStore.clear();
  }, [pathname, ready, startup]);

  return <DraftReadyContext.Provider value={ready}>{children}</DraftReadyContext.Provider>;
}
