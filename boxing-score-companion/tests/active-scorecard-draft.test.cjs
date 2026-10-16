const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'utils', 'active-scorecard-draft.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const compiledModule = new Module(sourcePath, module);
compiledModule.filename = sourcePath;
compiledModule.paths = module.paths;
compiledModule._compile(compiled.outputText, sourcePath);
const { DRAFT_SCREENS, makeScorecardDraft, parseScorecardDraft, createDraftStore, getDraftRestoreRoutes } = compiledModule.exports;

function memoryStorage() {
  const values = new Map();
  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async (key) => { values.delete(key); },
  };
}

test('every supported screen restores card data after creating a fresh store', async () => {
  for (const pathname of DRAFT_SCREENS) {
    const storage = memoryStorage();
    const draft = makeScorecardDraft(pathname, {
      fighter1: 'Unfinished name', fighter2: '', rounds: 15, gender: 'womens',
      weight: '200+', fightDate: '2026-10-12', rating: 3.5,
      description: '["Bloody","Close"]', notesMode: 'review-before-share',
      savedScores: JSON.stringify({ 1: { left: '10', right: '8', leftKnockdowns: '1', scoringMethod: 'quick' },
        15: { stoppageReason: 'TKO', stoppageWinner: 'Unfinished name' } }),
      id: undefined,
    });
    await createDraftStore(storage, assert.fail).save(draft);
    const recovered = await createDraftStore(storage, assert.fail).read();
    assert.deepEqual(recovered, draft);
    assert.equal(recovered.params.rounds, '15');
    assert.equal(recovered.params.fighter2, '');
    assert.ok(!('id' in recovered.params));
  }
});

test('corrupt, unknown-version and unsupported-route drafts do not restore', () => {
  for (const raw of [null, '{', 'null', '[]',
    JSON.stringify({ version: 2, pathname: '/matchInfo', params: {} }),
    JSON.stringify({ version: 1, pathname: '/roundScoring', params: {} }),
    JSON.stringify({ version: 1, pathname: '/matchInfo', params: { rating: {} } }),
    JSON.stringify({ version: 1, pathname: '/matchInfo', params: [] }),
  ]) assert.equal(parseScorecardDraft(raw), null);
});

test('queued older edits cannot overwrite newer edits or resurrect a discarded draft', async () => {
  const storage = memoryStorage();
  let release;
  const blocked = new Promise((resolve) => { release = resolve; });
  const setItem = storage.setItem;
  let first = true;
  storage.setItem = async (...args) => {
    if (first) { first = false; await blocked; }
    await setItem(...args);
  };
  const store = createDraftStore(storage, assert.fail);
  const old = store.save(makeScorecardDraft('/createMatch', { fighter1: 'Old' }));
  const latest = store.save(makeScorecardDraft('/matchInfo', { fighter1: 'Latest' }));
  release();
  await Promise.all([old, latest]);
  assert.equal((await store.read()).params.fighter1, 'Latest');
  const saving = store.save(makeScorecardDraft('/matchNotes', { rating: 5 }));
  const clearing = store.clear();
  await Promise.all([saving, clearing]);
  assert.equal(await createDraftStore(storage, assert.fail).read(), null);
});

test('a failed write does not prevent the next edit from being saved', async () => {
  const storage = memoryStorage();
  const setItem = storage.setItem;
  let failNext = true;
  const errors = [];
  storage.setItem = async (...args) => {
    if (failNext) { failNext = false; throw new Error('disk unavailable'); }
    await setItem(...args);
  };
  const store = createDraftStore(storage, (error) => errors.push(error));
  await store.save(makeScorecardDraft('/createMatch', { fighter1: 'First' }));
  await store.save(makeScorecardDraft('/createMatch', { fighter1: 'Recovered' }));
  assert.equal(errors.length, 1);
  assert.equal((await store.read()).params.fighter1, 'Recovered');
});

test('restored editors have a card parent and retain their review mode', () => {
  for (const pathname of ['/matchNotes', '/exportCard', '/createMatch']) {
    const draft = makeScorecardDraft(pathname, {
      fighter1: 'A', savedScores: '{"1":{"left":"10","right":"9"}}',
      isEdit: 'true', notesMode: 'review-before-share', detailsMode: 'review-before-share',
    });
    const routes = getDraftRestoreRoutes(draft);
    assert.equal(routes[0].pathname, '/matchInfo');
    assert.equal(routes[0].params.savedScores, draft.params.savedScores);
    assert.ok(!('notesMode' in routes[0].params));
    assert.deepEqual(routes[1], { pathname, params: draft.params });
  }
  const draft = makeScorecardDraft('/createMatch', { fighter1: 'Draft' });
  assert.deepEqual(getDraftRestoreRoutes(draft), [{ pathname: '/createMatch', params: draft.params }]);
});
