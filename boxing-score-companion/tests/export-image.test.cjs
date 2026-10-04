const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(path.dirname(module.filename), '..', 'utils', 'export-image.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const compiledModule = new Module(sourcePath, module);
compiledModule.filename = sourcePath;
compiledModule.paths = module.paths;
compiledModule._compile(compiled.outputText, sourcePath);
const { getExportCanvasSize } = compiledModule.exports;

const envelopes = [
  { name: 'tall scorecard', source: [1080, 2400], vertical: [1350, 2400], feed: [1920, 2400] },
  { name: 'square scorecard', source: [1080, 1080], vertical: [1080, 1920], feed: [1080, 1350] },
  { name: 'wide scorecard', source: [1920, 1080], vertical: [1926, 3424], feed: [1920, 2400] },
  { name: 'odd pixel dimensions', source: [1079, 1919], vertical: [1080, 1920], feed: [1536, 1920] },
];

for (const format of ['instagram-reels', 'instagram-stories', 'instagram-feed']) {
  test(`${format} preserves the whole scorecard inside an exact integer aspect ratio`, () => {
    for (const envelope of envelopes) {
      const [imageWidth, imageHeight] = envelope.source;
      const [expectedWidth, expectedHeight] = format === 'instagram-feed'
        ? envelope.feed
        : envelope.vertical;
      const result = getExportCanvasSize(imageWidth, imageHeight, format);
      assert.deepEqual(result, { width: expectedWidth, height: expectedHeight }, envelope.name);
      assert.ok(result.width >= imageWidth, `${envelope.name}: no horizontal crop`);
      assert.ok(result.height >= imageHeight, `${envelope.name}: no vertical crop`);
      assert.ok(Number.isInteger(result.width) && Number.isInteger(result.height));
      const [ratioWidth, ratioHeight] = format === 'instagram-feed' ? [4, 5] : [9, 16];
      assert.equal(result.width * ratioHeight, result.height * ratioWidth, envelope.name);
    }
  });
}

test('already matching Instagram dimensions require no padding', () => {
  assert.deepEqual(getExportCanvasSize(1080, 1920, 'instagram-reels'), { width: 1080, height: 1920 });
  assert.deepEqual(getExportCanvasSize(1080, 1920, 'instagram-stories'), { width: 1080, height: 1920 });
  assert.deepEqual(getExportCanvasSize(1080, 1350, 'instagram-feed'), { width: 1080, height: 1350 });
});

test('original exports retain their exact dimensions', () => {
  for (const { source: [width, height] } of envelopes) {
    assert.deepEqual(getExportCanvasSize(width, height, 'original'), { width, height });
  }
});

test('invalid pixel dimensions are rejected for all formats', () => {
  const invalidDimensions = [0, -1, 0.5, 1080.5, NaN, Infinity, -Infinity];
  for (const format of ['original', 'instagram-reels', 'instagram-stories', 'instagram-feed']) {
    for (const invalid of invalidDimensions) {
      assert.throws(() => getExportCanvasSize(invalid, 1920, format), RangeError);
      assert.throws(() => getExportCanvasSize(1080, invalid, format), RangeError);
    }
  }
});
