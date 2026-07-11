#!/usr/bin/env node
// 問題データの機械検証。使い方: node validate.js [期待問題数]
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'questions.js'), 'utf8');
eval(src + '; globalThis.ALL_Q = ALL_Q;');

const EXPECT = parseInt(process.argv[2] || '0', 10);
const THEMES = ['life', 'risk', 'finance', 'tax', 'estate', 'inherit'];
const errs = [];
const ids = new Set();
const themes = Object.fromEntries(THEMES.map(t => [t, { ox: 0, three: 0 }]));

for (const q of ALL_Q) {
  const tag = `id:${q.id}`;
  if (ids.has(q.id)) errs.push(`${tag} duplicate id`);
  ids.add(q.id);
  if (!THEMES.includes(q.theme)) { errs.push(`${tag} bad theme ${q.theme}`); continue; }
  if (!['ox', 'three'].includes(q.type)) { errs.push(`${tag} bad type ${q.type}`); continue; }
  themes[q.theme][q.type]++;
  if (![1, 2, 3].includes(q.diff)) errs.push(`${tag} bad diff`);
  if (!q.text || q.text.length < 15) errs.push(`${tag} text too short`);
  const keys = (q.choices || []).map(c => c.key);
  if (q.type === 'ox' && keys.join() !== '○,×') errs.push(`${tag} ox choices must be ○,×`);
  if (q.type === 'three' && keys.join() !== '1,2,3') errs.push(`${tag} three choices must be 1,2,3`);
  if (q.type === 'three' && q.choices.some(c => !c.text)) errs.push(`${tag} empty choice text`);
  if (!Array.isArray(q.correct) || q.correct.length !== 1 || !keys.includes(q.correct[0]))
    errs.push(`${tag} bad correct`);
  if (!q.explanation || q.explanation.length < 40) errs.push(`${tag} explanation too short (<40 chars)`);
  if (q.type === 'three') {
    const wrong = keys.filter(k => k !== q.correct[0]);
    for (const k of wrong) {
      if (!q.wrong_reasons || !q.wrong_reasons[k] || q.wrong_reasons[k].length < 10)
        errs.push(`${tag} missing/short wrong_reason for ${k}`);
    }
    if (q.wrong_reasons && q.wrong_reasons[q.correct[0]]) errs.push(`${tag} wrong_reason on correct key`);
  }
}
const max = Math.max(...ALL_Q.map(q => q.id));
for (let i = 1; i <= max; i++) if (!ids.has(i)) errs.push(`missing id ${i}`);
if (EXPECT && ALL_Q.length !== EXPECT) errs.push(`expected ${EXPECT} questions, got ${ALL_Q.length}`);

console.log('total:', ALL_Q.length);
for (const t of THEMES) console.log(`  ${t}: ox=${themes[t].ox} three=${themes[t].three}`);
if (errs.length) { console.log('ERRORS (' + errs.length + '):\n' + errs.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
