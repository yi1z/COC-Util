import { beforeEach, describe, expect, it } from 'vitest';
import {
  cloneImportedDraft,
  createFreshInvestigator,
  loadCurrentDraft,
  parseImportedEnvelope,
  saveCurrentDraft,
  saveSnapshot,
  serializeDraft,
} from './storage';

describe('storage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('serializes and reloads the current draft', () => {
    const draft = createFreshInvestigator();
    draft.profile.investigatorName = '林秋生';
    saveCurrentDraft(draft);

    const loaded = loadCurrentDraft();
    expect(loaded?.profile.investigatorName).toBe('林秋生');
  });

  it('parses valid import envelopes and clones imported drafts', () => {
    const draft = createFreshInvestigator();
    const raw = JSON.stringify(serializeDraft(draft));

    const envelope = parseImportedEnvelope(raw);
    const cloned = cloneImportedDraft(envelope);

    expect(cloned.id).not.toBe(draft.id);
    expect(cloned.profile.age).toBe(draft.profile.age);
  });

  it('rejects invalid import envelopes', () => {
    expect(() => parseImportedEnvelope(JSON.stringify({ foo: 'bar' }))).toThrowError();
  });

  it('saves snapshots with a readable name', () => {
    const draft = createFreshInvestigator();
    draft.profile.investigatorName = '苏曼';

    const snapshot = saveSnapshot(draft);
    expect(snapshot.name).toContain('苏曼');
  });
});
