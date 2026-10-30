import assert from 'node:assert/strict';
import {validateBrowserShotText} from '../lib/episode-workflow-validation';

const base = {
  episodeId: 'demo',
  shotId: 'shot-001',
  title: '每次都要跑很远',
  captions: ['如果每次用工具，都要跑到很远的地方拿，会不会很慢？'],
};

assert.throws(
  () => validateBrowserShotText({...base, source: '<body><div>缓存是什么 / 01</div><h1>每次都要跑很远</h1></body>'}),
  /title|sequence|序号/i,
);

assert.throws(
  () => validateBrowserShotText({...base, source: '<body><div>SHOT / 001</div><div>远处来源</div></body>'}),
  /sequence|序号/i,
);

assert.throws(
  () => validateBrowserShotText({...base, source: '<body><p>如果每次用工具，都要跑到很远的地方拿，会不会很慢？</p></body>'}),
  /caption|字幕/i,
);

// A short in-shot label may legitimately contain a phrase that also appears
// inside a longer caption; only ten-character narration overlaps are banned.
assert.doesNotThrow(
  () => validateBrowserShotText({...base, source: '<body><div class="path-label">远处来源</div><div class="question-mark">?</div></body>'}),
);

assert.doesNotThrow(
  () => validateBrowserShotText({...base, source: '<body><div>手边的小盒子</div></body>', captions: ['所以，我们把常用的东西，先放到手边的小盒子里。']}),
);

// Ten characters of duplicated narration still count as repeating the caption.
assert.throws(
  () => validateBrowserShotText({...base, source: '<body><div>把常用的东西先放到手边的小盒子</div></body>', captions: ['所以，我们把常用的东西，先放到手边的小盒子里。']}),
  /caption|字幕/i,
);

// Overlap made only of common connective phrasing is not a narration repeat.
assert.doesNotThrow(
  () => validateBrowserShotText({...base, source: '<body><div>我们这样就可以看到变</div></body>', captions: ['我们这样就可以看到变化了']}),
);

console.log('browser shot text contract behaves as expected');