(function (global) {
  'use strict';
  const LETTERS = ['A', 'B', 'C', 'D'];
  const SUBJECTS = {
    company: { name: '公司法', description: '從股東權利到董事職責，掌握公司的運作規則。', accent: '#0f766e', pale: '#eaf6f2', icon: 'building' },
    securities: { name: '證券交易法', description: '認識資訊揭露與交易規範，看懂資本市場的秩序。', accent: '#2563eb', pale: '#edf4ff', icon: 'chart' },
    accounting: { name: '商業會計法', description: '釐清會計人員、決算期限與責任，建立實務觀念。', accent: '#346b80', pale: '#edf5f7', icon: 'book' }
  };
  function validateBank(bank) {
    if (!Array.isArray(bank)) throw new Error('題庫必須為陣列。');
    const ids = new Set();
    return bank.filter(q => q.status === 'verified').map(q => {
      if (!q.id || ids.has(q.id)) throw new Error('題目 ID 遺漏或重複。');
      if (!SUBJECTS[q.subject] || !LETTERS.includes(q.answer)) throw new Error('分類或答案不正確。');
      if (!q.question || !q.explanation || !q.topic || !Number.isInteger(q.year) || !Number.isInteger(q.questionNumber)) throw new Error('題目內容不完整。');
      if (Object.keys(q.options || {}).length !== 4 || LETTERS.some(k => !q.options[k] || !q.optionExplanations?.[k])) throw new Error('選項或選項解析不完整。');
      if (!q.legalBasis?.length || !q.verifiedAt || !q.source?.questionUrl || !q.source?.answerUrl) throw new Error('來源不完整。');
      ids.add(q.id);
      return q;
    });
  }
  class QuizSession {
    constructor(bank) {
      this.bank = validateBank(bank);
      this.subject = null;
      this.states = Object.fromEntries(Object.keys(SUBJECTS).map(key => [key, { index: 0, answers: {}, drafts: {} }]));
    }
    questions(subject = this.subject) { return this.bank.filter(q => q.subject === subject).sort((a, b) => b.year - a.year || a.questionNumber - b.questionNumber); }
    start(subject) { if (!SUBJECTS[subject]) throw new Error('未知法別。'); this.subject = subject; return this.current(); }
    get state() { return this.states[this.subject]; }
    current() { return this.subject ? this.questions()[this.state.index] || null : null; }
    select(letter) {
      const q = this.current();
      if (!q || !LETTERS.includes(letter) || this.state.answers[q.id]) return false;
      this.state.drafts[q.id] = letter;
      return true;
    }
    submit() {
      const q = this.current();
      if (!q || this.state.answers[q.id] || !LETTERS.includes(this.state.drafts[q.id])) return false;
      const selected = this.state.drafts[q.id];
      this.state.answers[q.id] = { selected, correct: selected === q.answer };
      return true;
    }
    next() {
      const q = this.current();
      if (!q || !this.state.answers[q.id] || this.state.index >= this.questions().length - 1) return false;
      this.state.index++;
      return true;
    }
    previous() { if (!this.state || this.state.index === 0) return false; this.state.index--; return true; }
    review(index) {
      const q = this.questions()[index];
      if (!q || !this.state.answers[q.id]) return false;
      this.state.index = index;
      return true;
    }
    stats(subject = this.subject) {
      const questions = this.questions(subject), state = this.states[subject];
      const answers = questions.map(q => state?.answers[q.id]).filter(Boolean);
      const correct = answers.filter(a => a.correct).length;
      return { total: questions.length, answered: answers.length, correct, rate: answers.length ? Math.round(correct / answers.length * 100) : null };
    }
    reset() { if (this.subject) this.states[this.subject] = { index: 0, answers: {}, drafts: {} }; }
  }
  global.CpaQuiz = { QuizSession, validateBank, SUBJECTS };
  if (!global.document) return;
  const d = global.document, main = d.getElementById('main');
  const el = (tag, attrs = {}, children = []) => {
    const node = d.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'text') node.textContent = value;
      else if (key === 'class') node.className = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else if (key === 'disabled' || key === 'checked') node[key] = value;
      else node.setAttribute(key, value);
    });
    children.forEach(child => node.append(child));
    return node;
  };
  const txt = (tag, text, cls = '') => el(tag, { text, class: cls });
  const button = (text, fn, cls = 'btn btn-secondary', disabled = false) => el('button', { type: 'button', text, class: cls, onclick: fn, disabled });
  const link = (text, url) => {
    let target;
    try { target = new URL(url); } catch { return txt('span', text); }
    if (target.protocol !== 'https:') return txt('span', text);
    return el('a', { text, href: target.href, target: '_blank', rel: 'noopener noreferrer' });
  };
  const svgPaths = {
    building: '<path d="M4 10h24M6 10v16m7-16v16m6-16v16m7-16v16M3 27h26M16 3l13 6H3l13-6Z"/>',
    chart: '<path d="M5 4v23h23M10 21v-6m7 6V9m7 12v-9M9 10l7-5 7 2 5-4"/>',
    book: '<path d="M6 4h19v24H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm0 0v20m0 0h19M11 10h9m-9 5h7"/>',
    pencil: '<path d="m7 22-2 6 6-2L27 10l-4-4L7 22Zm0 0 4 4M20 9l4 4M4 30h24"/>'
  };
  function icon(name) {
    const wrap = el('span', { 'aria-hidden': 'true' });
    // The SVG below is developer-authored artwork, never question/source text.
    wrap.innerHTML = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + svgPaths[name] + '</svg>';
    return wrap;
  }
  let quiz;
  try { quiz = new QuizSession(global.QUESTION_BANK); }
  catch (err) {
    main.append(el('section', { class: 'empty-state' }, [txt('h1', '題庫暫時無法載入'), txt('p', '請確認完整解壓縮專案，並保留 data 資料夾及原有檔案位置。')]));
    console.error(err);
    return;
  }
  function focusAfterRender(selector) {
    const target = main.querySelector(selector);
    if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    global.scrollTo({ top: 0, behavior: 'instant' });
  }
  function guide() {
    const box = el('details', { class: 'home-info', id: 'guide' });
    box.append(txt('summary', '使用說明與題庫來源'));
    box.append(el('div', { class: 'guide-content' }, [
      txt('p', '選一個法別開始練習，每題選擇一個答案後按「送出答案」。讀完解析，再進入下一題；可以返回已答題複習。'),
      txt('p', '本次進度只保留在目前開啟的網頁，重新整理後會清空。三個法別分開計分，「重新練習」只重設目前法別。'),
      txt('p', '題庫收錄 113、114 年會計師歷屆試題節選，並非完整題庫。正解依考選部答案更正清冊；學習解析由 AI 依據法條整理，非官方解析。每題附法條版本與查核日期。'),
      el('div', { class: 'source-links' }, [link('114 年官方試題 ↗', 'https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=803&code=114130&q=1&s=0204&t=Q'), link('113 年官方試題 ↗', 'https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=803&code=113130&q=1&s=0204&t=Q'), link('全國法規資料庫 ↗', 'https://law.moj.gov.tw/')])
    ]));
    return box;
  }
  function renderHome(focus = false) {
    const total = quiz.bank.length;
    const answered = Object.keys(SUBJECTS).reduce((n, key) => n + quiz.stats(key).answered, 0);
    const heroTitle = el('h1', {}, [d.createTextNode('會計師三法，'), el('br'), txt('span', '從一題開始。')]);
    const left = el('div', {}, [txt('p', '小小練習，累積大大理解', 'eyebrow'), heroTitle, txt('p', '從歷屆試題出發，作答後看清答案、理由與法條。選一個法別，開始今天的學習。', 'hero-description'), el('div', { class: 'hero-meta' }, [txt('b', '考選部歷屆試題'), txt('span', '·', 'dot'), txt('span', `${total} 題精選練習`), txt('span', '·', 'dot'), txt('span', '附法條與出處')])]);
    const note = el('aside', { class: 'study-note', 'aria-label': '練習方式' }, [el('div', { class: 'note-heading' }, [txt('span', '今日的小目標'), icon('pencil')]), txt('h2', '選一個法別，完成一輪練習。'), el('ol', { class: 'note-steps' }, [
      ['01', '讀懂題目', '留意條件與關鍵字'], ['02', '選出答案', '每題都試著想一想'], ['03', '理解理由', '把觀念帶到下一題']
    ].map(([n, title, sub]) => el('li', {}, [txt('span', n, 'step-number'), el('div', {}, [txt('strong', title), txt('small', sub)])]))) ]);
    const grid = el('div', { class: 'subject-grid' });
    Object.entries(SUBJECTS).forEach(([key, subject], index) => {
      const stats = quiz.stats(key);
      const cta = stats.total === 0 ? `查看${subject.name}` : stats.answered === stats.total ? `查看${subject.name}成果` : stats.answered ? `繼續${subject.name}練習` : `開始${subject.name}練習`;
      const card = el('article', { class: 'subject-card', style: `--card-accent:${subject.accent};--card-pale:${subject.pale}` }, [
        el('div', { class: 'card-top' }, [el('div', { class: 'subject-icon' }, [icon(subject.icon)]), txt('span', `0${index + 1}`, 'card-no')]),
        txt('h3', subject.name), txt('p', subject.description, 'card-description'),
        el('div', { class: 'card-info' }, [txt('span', `${stats.total} 題選擇題`, 'card-count'), txt('span', stats.answered ? `本次完成 ${stats.answered} / ${stats.total}` : '準備好了就開始')]),
        button(cta + ' →', () => { quiz.start(key); if (stats.total && stats.answered === stats.total) renderResults(); else renderQuestion(); }, 'btn btn-primary card-button')
      ]);
      grid.append(card);
    });
    main.replaceChildren(el('div', { class: 'container' }, [el('section', { class: 'hero' }, [left, note]), el('section', { 'aria-labelledby': 'practice-title' }, [el('div', { class: 'section-heading' }, [el('div', {}, [el('h2', { id: 'practice-title', text: '選擇今天的練習' }), txt('p', '三個法別，各自累積你的理解。')]), txt('span', `本次已完成 ${answered} / ${total} 題`, 'session-pill')]), grid]), guide()]));
    d.title = '會計師三法學習小教室';
    if (focus) focusAfterRender('h1');
  }
  function sourceDetail(q) {
    return el('details', { class: 'source-detail' }, [txt('summary', '查看法條版本與出處'), txt('p', q.lawUpdateNote), txt('p', `來源查核日期：${q.verifiedAt}。${q.source.correctionNote}`), txt('p', `${q.exam}｜${q.examSubject}｜原第 ${q.questionNumber} 題。`), el('div', { class: 'source-links' }, [link(`官方試題（第 ${q.source.questionPage} 頁）↗`, q.source.questionUrl + `#page=${q.source.questionPage}`), link(`官方答案（第 ${q.source.answerPage} 頁）↗`, q.source.answerUrl + `#page=${q.source.answerPage}`)])]);
  }
  function feedback(q, response) {
    return el('section', { class: 'feedback' + (response.correct ? '' : ' wrong'), 'aria-live': 'polite', 'aria-labelledby': 'feedback-title' }, [
      el('div', { class: 'feedback-status' }, [el('h2', { id: 'feedback-title', text: response.correct ? '✓ 答對了，把觀念記下來。' : '答錯了，再看一次解析。' }), txt('p', `你的答案 ${response.selected}　｜　官方答案 ${q.answer}`, 'answer-label')]),
      el('div', { class: 'feedback-body' }, [txt('h3', '學習解析'), txt('p', '依據法條整理，非官方解析', 'origin-label'), txt('p', q.explanation, 'explanation'), el('ul', { class: 'option-reasons' }, LETTERS.map(letter => el('li', { class: letter === q.answer ? 'reason-correct' : '' }, [txt('span', letter, 'reason-letter'), txt('span', q.optionExplanations[letter])]))), txt('h3', '回到法條看一看'), el('div', { class: 'legal-links' }, q.legalBasis.map(item => link(`${item.law} ${item.article} ↗`, item.url))), sourceDetail(q)])
    ]);
  }
  function renderQuestion(focusTarget = 'h1') {
    const q = quiz.current(), subject = SUBJECTS[quiz.subject], stats = quiz.stats();
    if (!q) {
      main.replaceChildren(el('section', { class: 'empty-state' }, [txt('p', subject.name, 'eyebrow'), txt('h1', '這個法別還沒有題目'), txt('p', '可以先選擇其他法別練習。'), button('返回練習首頁', () => renderHome(true), 'btn btn-primary')]));
      focusAfterRender('h1'); return;
    }
    const response = quiz.state.answers[q.id];
    const draft = response?.selected || quiz.state.drafts[q.id];
    const container = el('div', { class: 'quiz-container' });
    container.append(el('div', { class: 'quiz-topline' }, [button('← 返回練習首頁', () => renderHome(true), 'btn btn-quiet'), txt('span', '單選練習', 'small-badge')]), el('div', { class: 'quiz-title-row' }, [txt('h1', subject.name), txt('span', `第 ${quiz.state.index + 1} 題，共 ${stats.total} 題`, 'progress-label')]), el('div', { class: 'progress-track', role: 'progressbar', 'aria-label': '本法別作答進度', 'aria-valuemin': '0', 'aria-valuemax': String(stats.total), 'aria-valuenow': String(stats.answered) }, [el('div', { class: 'progress-fill', style: `width:${stats.answered / stats.total * 100}%` })]));
    const form = el('form', { class: 'question-card', 'aria-label': '選擇題作答' });
    form.append(el('div', { class: 'question-meta' }, [txt('span', `${q.year} 年會計師　·　原第 ${String(q.questionNumber).padStart(2, '0')} 題`), txt('span', q.topic, 'topic-tag')]), el('h2', { class: 'question-text', id: 'question-heading', text: q.question }));
    const fieldset = el('fieldset', { 'aria-labelledby': 'question-heading' }, [txt('legend', '請選擇一個答案', 'visually-hidden')]);
    const submit = el('button', { type: 'submit', class: 'btn btn-primary', text: response ? '已送出答案' : '送出答案', disabled: !!response || !draft });
    LETTERS.forEach(letter => {
      const selected = draft === letter;
      const classes = ['option'];
      if (selected) classes.push('is-selected');
      if (response) { classes.push('is-locked'); if (letter === q.answer) classes.push('is-correct'); else if (selected) classes.push('is-wrong'); }
      const input = el('input', { type: 'radio', name: 'answer', value: letter, checked: selected, disabled: !!response, id: `answer-${letter}` });
      input.addEventListener('change', () => {
        if (quiz.select(letter)) {
          fieldset.querySelectorAll('.option').forEach(label => label.classList.toggle('is-selected', label.querySelector('input').checked));
          submit.disabled = false;
        }
      });
      const label = el('label', { class: classes.join(' '), for: `answer-${letter}` }, [input, txt('span', letter, 'option-letter'), txt('span', q.options[letter], 'option-copy')]);
      if (response && letter === q.answer) label.append(txt('span', '正確答案', 'option-state'));
      else if (response && selected) label.append(txt('span', '你的答案', 'option-state'));
      fieldset.append(label);
    });
    form.append(fieldset, el('div', { class: 'submit-row' }, [txt('p', response ? '答案已保留，可以閱讀下方解析。' : '選出一個答案，送出後查看解析。'), submit]));
    form.addEventListener('submit', event => { event.preventDefault(); if (quiz.submit()) { renderQuestion('#feedback-title'); main.querySelector('.feedback').scrollIntoView({ block: 'start', behavior: 'instant' }); } });
    container.append(form);
    if (response) container.append(feedback(q, response));
    const last = quiz.state.index === stats.total - 1;
    container.append(el('div', { class: 'quiz-navigation' }, [button('← 上一題', () => { if (quiz.previous()) renderQuestion(); }, 'btn btn-secondary', quiz.state.index === 0), button(last ? '查看本次成果 →' : '下一題 →', () => { if (last && quiz.stats().answered === stats.total) renderResults(); else if (quiz.next()) renderQuestion(); }, 'btn btn-primary', !response)]), txt('p', `本次已答 ${stats.answered} / ${stats.total} 題　·　${stats.rate === null ? '尚未作答' : `答對 ${stats.correct} 題，正確率 ${stats.rate}%`}\n重新整理網頁會清空本次進度。`, 'session-note'));
    main.replaceChildren(container);
    d.title = `${subject.name}練習｜會計師三法學習小教室`;
    focusAfterRender(focusTarget.startsWith('#') ? focusTarget : focusTarget);
  }
  function renderResults() {
    const stats = quiz.stats(), subject = SUBJECTS[quiz.subject];
    if (!stats.total || stats.answered < stats.total) { renderQuestion(); return; }
    const ring = el('div', { class: 'score-ring', style: `--angle:${stats.rate * 3.6}deg`, 'aria-label': `本次正確率 ${stats.rate}%` }, [el('div', { class: 'score-ring-inner' }, [txt('strong', `${stats.rate}%`), txt('small', '本次正確率')])]);
    const review = el('section', { class: 'review-list' }, [txt('h2', '回顧這一輪的觀念')]);
    quiz.questions().forEach((q, index) => {
      const response = quiz.state.answers[q.id];
      const row = button('', () => { if (quiz.review(index)) renderQuestion(); }, 'review-button');
      row.setAttribute('aria-label', `複習第 ${index + 1} 題：${q.topic}，${response.correct ? '答對' : '答錯'}`);
      row.append(txt('span', response.correct ? '✓' : '×', 'result-mark' + (response.correct ? '' : ' bad')), el('span', { class: 'review-title' }, [txt('span', q.topic), txt('small', `${q.year} 年原第 ${q.questionNumber} 題 · 你的答案 ${response.selected} / 官方答案 ${q.answer}`)]), txt('span', '看解析 →', 'review-action'));
      review.append(row);
    });
    main.replaceChildren(el('div', { class: 'result-container' }, [el('section', { class: 'result-hero' }, [txt('p', '完成一輪，就是一次累積', 'eyebrow'), txt('h1', `${subject.name}，練習完成！`), txt('p', stats.rate === 100 ? '這一輪全部答對了，別忘了看看每個選項背後的理由。' : '把還不熟的觀念再看一次，每一道錯題都是下一次的進步。'), ring, el('div', { class: 'result-stats' }, [[stats.answered, '完成題數'], [stats.correct, '答對題數'], [stats.answered - stats.correct, '待複習題數']].map(([n, label]) => el('div', {}, [txt('strong', String(n)), txt('span', label)])))]), review, el('div', { class: 'result-actions' }, [button('重新練習這個法別', () => { quiz.reset(); renderQuestion(); }, 'btn btn-primary'), button('選擇其他法別', () => renderHome(true), 'btn btn-secondary')]), txt('p', '這是本次練習正確率，不是會計師考試總分。\n重新整理網頁會清空本次進度。', 'session-note')]));
    d.title = `${subject.name}練習成果｜會計師三法學習小教室`;
    focusAfterRender('h1');
  }
  d.getElementById('brand-home').addEventListener('click', () => renderHome(true));
  d.getElementById('nav-home').addEventListener('click', () => renderHome(true));
  d.getElementById('nav-guide').addEventListener('click', () => { renderHome(); const box = d.getElementById('guide'); box.open = true; box.scrollIntoView({ block: 'start', behavior: 'smooth' }); box.querySelector('summary').focus({ preventScroll: true }); });
  renderHome();
})(typeof window === 'undefined' ? globalThis : window);
