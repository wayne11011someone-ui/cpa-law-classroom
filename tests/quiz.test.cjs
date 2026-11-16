const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'data/questions.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8'), context);
const { QuizSession } = context.window.CpaQuiz;
const bank = context.window.QUESTION_BANK;
const make = () => new QuizSession(bank);
test('9 official questions: unique IDs, 3 per law, official answer keys and sources', () => {
  assert.equal(bank.length, 9);
  assert.equal(new Set(bank.map(q => q.id)).size, 9);
  const keys = {114: 'DCCDCBBABACDADDBDDBBABDAD',113: 'ADDCDDCDCBCCACCBCCDCCDBDC'};
  for (const q of bank) {
    assert.equal(q.answer, keys[q.year][q.questionNumber-1]);
    assert.equal(q.source.answerPage, 16);
    for (const url of [q.source.questionUrl,q.source.answerUrl,...q.legalBasis.map(x => x.url)]) assert.equal(new URL(url).protocol, 'https:');
    assert.equal(Object.keys(q.options).join(''), 'ABCD');
    assert.ok(q.legalBasis.every(x=>x.law && x.article && x.versionNote));
    assert.ok(q.lawUpdateNote && q.verifiedAt);
  }
  const q=make();
  for(const s of ['company','securities','accounting']) assert.equal(q.stats(s).total,3);
});
test('unanswered question: cannot submit or advance; score is not a fabricated zero',()=>{
  const q=make();q.start('company');
  assert.equal(q.submit(),false);assert.equal(q.next(),false);assert.equal(q.previous(),false);
  assert.equal(q.stats().rate,null);assert.equal(q.select('E'),false);
  assert.equal(q.stats().answered,0);
});
test('answer locking, wrong and right outcomes, previous navigation, no duplicate score',()=>{
  const q=make();q.start('company');q.select('A');q.select('C');assert.equal(q.submit(),true);
  assert.equal(q.submit(),false);assert.equal(q.select('A'),false);assert.equal(q.stats().correct,1);
  assert.equal(q.next(),true);q.select('A');q.submit();assert.equal(q.stats().rate,50);
  q.previous();assert.equal(q.current().questionNumber,3);assert.equal(q.state.answers[q.current().id].selected,'C');
  q.next();q.next();q.select('D');q.submit();assert.equal(q.stats().rate,67);assert.equal(q.stats().answered,3);assert.equal(q.next(),false);
});
test('law sessions and reset remain independent; drafts survive navigation',()=>{
  const q=make();q.start('company');q.select('C');q.submit();
  q.start('securities');assert.equal(q.stats().answered,0);q.select('D');
  q.start('company');assert.equal(q.stats().correct,1);q.reset();assert.equal(q.stats().answered,0);
  q.start('securities');assert.equal(q.state.drafts[q.current().id],'D');q.submit();assert.equal(q.stats().correct,1);
  q.start('company');assert.equal(q.stats().answered,0);
});
test('complete all laws, review final and earlier answers, official answers score 100%',()=>{
  const q=make();
  for(const s of ['company','securities','accounting']) {
    q.start(s);
    for(let i=0;i<q.questions().length;i++){q.select(q.current().answer);q.submit();if(i<q.questions().length-1)assert.equal(q.next(),true);}
    assert.equal(q.stats().rate,100);assert.equal(q.review(0),true);assert.equal(q.state.answers[q.current().id].correct,true);
  }
});
test('empty and pending-only subjects stay valid and cannot score or advance',()=>{
  const q=new QuizSession([]);q.start('accounting');assert.equal(q.current(),null);assert.equal(q.stats().rate,null);assert.equal(q.next(),false);assert.equal(q.submit(),false);q.reset();
  const pending=JSON.parse(JSON.stringify(bank[0]));pending.status='pending';assert.equal(new QuizSession([pending]).bank.length,0);
});
test('data extension: adding real Q06 grows 9 to 10, company 3 to 4, scoring uses new denominator',()=>{
  const extra=JSON.parse(fs.readFileSync(path.join(root,'templates/company-q06-example.json'),'utf8'));
  assert.equal(extra.id,'cpa-114-5803-q06');assert.equal(extra.answer,'B');
  const q=new QuizSession([...bank,extra]);assert.equal(q.bank.length,10);q.start('company');assert.equal(q.stats().total,4);
  for(let i=0;i<4;i++){q.select(i===3?'A':q.current().answer);q.submit();q.next();}
  assert.equal(q.stats().answered,4);assert.equal(q.stats().correct,3);assert.equal(q.stats().rate,75);
  assert.equal(make().bank.length,9);
});
test('duplicate IDs, invalid options and wrong subjects cannot silently enter the bank',()=>{
  assert.throws(()=>new QuizSession([...bank,bank[0]]));
  const bad=JSON.parse(JSON.stringify(bank[0]));bad.answer='E';assert.throws(()=>new QuizSession([bad]));
  bad.answer='C';bad.subject='unknown';assert.throws(()=>new QuizSession([bad]));
});
