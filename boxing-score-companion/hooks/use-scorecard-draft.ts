import { useIsFocused } from 'expo-router/react-navigation';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { scorecardDraftStore, useScorecardDraftReady } from '../contexts/ScorecardDraftContext';
import { makeScorecardDraft, type DraftInputParams, type DraftScreen } from '../utils/active-scorecard-draft';

export function useScorecardDraft(pathname: DraftScreen, params: DraftInputParams) {
  const ready = useScorecardDraftReady();
  const focused = useIsFocused();
  const serialized = JSON.stringify(makeScorecardDraft(pathname, params));

  useEffect(() => {
    if (!ready || !focused) return;
    const draft = JSON.parse(serialized);
    // Save on every edit, not only on background: force quits need no lifecycle event.
    void scorecardDraftStore.save(draft);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void scorecardDraftStore.save(draft);
    });
    return () => subscription.remove();
  }, [focused, ready, serialized]);
}
