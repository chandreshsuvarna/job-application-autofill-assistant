// ================= INDEED (in.indeed.com / smartapply.indeed.com) =================
// Flow:  search results (listing tab)  ->  click job -> click "Apply now"  ->
//        Indeed Smart Apply form (usually opens in a NEW tab)  ->  fill -> Continue... -> Submit  ->
//        apply tab closes itself  ->  listing tab moves to the next job.
// Shared state lives in chrome.storage.local (indState) so it survives page changes and works across tabs.
// Only "Easily apply" jobs are attempted; "Apply on company site" jobs are skipped.
// Questions we cannot answer from your profile are left blank, and such jobs are skipped (nothing is guessed).
const IND_MAX_JOBS = 15;            // jobs per run
const IND_APPLY_TIMEOUT = 150000;   // ms to wait for one application before skipping it

function isIndeed() { return /(^|\.)indeed\.com$/.test(window.location.hostname); }
function indIsApplyPage() { return window.location.hostname.startsWith('smartapply.') || /\/indeedapply\//.test(window.location.pathname); }
const indGet = () => new Promise(res => chrome.storage.local.get(['indState'], r => res(r.indState || null)));
const indSet = (s) => new Promise(res => chrome.storage.local.set({ indState: s }, res));
const indTabId = () => new Promise(res => chrome.runtime.sendMessage({ action: 'whoami' }, r => res(r && r.tabId)));

function indNeedsLogin() {
  return /^(secure|accounts)\./.test(window.location.hostname) || /\/(auth|account\/login)/i.test(window.location.pathname);
}
function indStop(msg) {
  indGet().then(st => { if (st) indSet({ ...st, running: false }); });
  mpButton(false);
  mpStatus(msg);
}

// ---------- listing page helpers ----------
function indCards() {
  let cards = Array.from(document.querySelectorAll('.job_seen_beacon')).filter(mpVisible);
  if (!cards.length) {
    cards = Array.from(document.querySelectorAll('a.jcs-JobTitle, h2.jobTitle a'))
      .map(a => a.closest('li') || a.parentElement).filter(Boolean);
    cards = Array.from(new Set(cards));
  }
  return cards;
}

function indFindApply() {
  const pane = document.querySelector('#jobsearch-ViewjobPaneWrapper, .jobsearch-RightPane, #viewJobSSRRoot') || document;
  let btn = pane.querySelector('#indeedApplyButton, button[id^="indeedApply"], [data-testid="indeedApplyButton"]');
  if (btn && mpVisible(btn)) return btn;
  btn = Array.from(pane.querySelectorAll('button, a')).find(el => mpVisible(el) && /^(apply now|easily apply|apply)$/.test(mpText(el)));
  return btn || null;
}

async function indRunList() {
  while (true) {
    let st = await indGet();
    if (!st || !st.running) return;
    mpButton(true);

    if (indNeedsLogin()) { indStop('Please sign in to Indeed first, then press Start.'); return; }

    // We navigated into a full job page (narrow window) - skip that job and go back to the list.
    if (/^\/viewjob/.test(window.location.pathname)) {
      await indSet({ ...st, idx: st.idx + 1, skipped: st.skipped + 1, stage: 'list' });
      window.location.href = st.listUrl;
      return;
    }

    // An application is in progress in another tab (or this one) - wait for it.
    if (st.stage === 'apply') {
      if (Date.now() - (st.stageAt || 0) > IND_APPLY_TIMEOUT) {
        await indSet({ ...st, stage: 'list', idx: st.idx + 1, skipped: st.skipped + 1 });
        continue;
      }
      mpStatus(`[${st.idx + 1}/${st.max}] Application in progress...`);
      await mpSleep(1500);
      continue;
    }

    const cards = indCards();
    if (st.idx >= st.max || st.idx >= cards.length) {
      await indSet({ ...st, running: false });
      mpButton(false);
      mpStatus(`Done: ${st.applied} applied, ${st.skipped} skipped.`);
      return;
    }

    const tag = `[${st.idx + 1}/${st.max}]`;
    const card = cards[st.idx];
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await mpSleep(800);

    if (/\bapplied\b/i.test(card.innerText || '')) {
      mpStatus(`${tag} Already applied - skipping`);
      await indSet({ ...st, idx: st.idx + 1, skipped: st.skipped + 1 });
      continue;
    }

    mpStatus(`${tag} Opening job...`);
    const link = card.querySelector('a.jcs-JobTitle, h2.jobTitle a, a[data-jk]') || card;
    link.click();
    await mpSleep(2500 + Math.random() * 1000);
    if (/^\/viewjob/.test(window.location.pathname)) return; // page is navigating; resume logic handles it

    const btn = indFindApply();
    if (!btn) {
      mpStatus(`${tag} No Easy Apply button (company site?) - skipping`);
      await indSet({ ...st, idx: st.idx + 1, skipped: st.skipped + 1 });
      await mpSleep(800);
      continue;
    }

    mpStatus(`${tag} Clicking Apply...`);
    await indSet({ ...st, stage: 'apply', stageAt: Date.now(), formStep: 0 });
    btn.click();
    await mpSleep(3000);
    // loop continues: waits until the application finishes (this tab or the new tab)
  }
}

// ---------- application form helpers ----------
function indSetValue(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value); else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
}

// "Years of experience with Python" is NOT your total experience - never answer those from the generic field.
const IND_SKILL_EXP = /(experience|years)[^?]{0,40}\b(with|using|in|on)\s+(?!total\b|all\b|years\b)\S/;

function indFillForm(p) {
  let n = 0;
  document.querySelectorAll('input, textarea').forEach(el => {
    const t = (el.type || 'text').toLowerCase();
    if (!['text', 'tel', 'email', 'number', 'textarea'].includes(t === 'textarea' ? 'textarea' : t)) return;
    if (el.disabled || el.readOnly || mpIgnored(el) || !mpVisible(el) || (el.value && el.value.trim())) return;
    const label = mpLabel(el);
    if (IND_SKILL_EXP.test(label)) return;
    let v = t === 'email' ? p.email : t === 'tel' ? p.phone : null;
    if (!v) v = mpValueFor(label, p);
    if (!v) return;
    indSetValue(el, String(v));
    el.style.outline = '2px solid #3b82f6';
    n++;
  });
  return n;
}

function indClickables() {
  return Array.from(document.querySelectorAll('button, a[role="button"], input[type="submit"], [role="button"]'))
    .filter(el => mpVisible(el) && !mpIgnored(el) && !el.disabled && el.getAttribute('aria-disabled') !== 'true');
}
function indFindSubmit() {
  return indClickables().find(el => /^(submit( your)? application|submit)$/.test(mpText(el))) || null;
}
function indFindContinue() {
  return indClickables().find(el => /^(continue|next|review( your application)?|continue applying)$/.test(mpText(el))) || null;
}
function indLooksSuccessful() {
  return /post-apply|\/confirmation|application-submitted/i.test(window.location.pathname) ||
    /your application has been submitted|application submitted|thanks for applying|you['’]ve applied|application sent|already applied/i.test(document.body.innerText || '');
}

async function indFinish(st, result) {
  st = { ...(st || await indGet()) };
  if (!st || st.stage !== 'apply') return;       // guard against double-counting
  if (result === 'applied') st.applied++; else st.skipped++;
  st.idx++;
  st.stage = 'list';
  if (st.standalone) {
    st.running = false;
    await indSet(st);
    mpButton(false);
    mpStatus(result === 'applied' ? 'Application submitted.' : 'Could not complete - skipped.');
    return;
  }
  await indSet(st);
  mpStatus(result === 'applied' ? 'Applied. Returning to the list...' : 'Skipped. Returning to the list...');
  await mpSleep(1200 + Math.random() * 1000);
  const me = await indTabId();
  if (st.listTabId && me && st.listTabId !== me) chrome.runtime.sendMessage({ action: 'close_tab' }); // new tab -> close it
  else window.location.href = st.listUrl;                                                            // same tab -> go back
}

async function indFormLoop() {
  const MAX_STEPS = 12;
  let lastSig = '', stuck = 0, noBtn = 0;
  for (let g = 0; g < MAX_STEPS; g++) {
    let st = await indGet();
    if (!st || !st.running || st.stage !== 'apply') return;
    const tag = `[${st.idx + 1}/${st.max}]`;

    if (indNeedsLogin()) { indStop('Please sign in to Indeed first, then press Start.'); return; }
    await mpSleep(1500);
    if (indLooksSuccessful()) return indFinish(st, 'applied');

    const profile = await new Promise(r => chrome.storage.local.get(null, r));
    mpStatus(`${tag} Step ${g + 1}: filling details...`);
    const filled = indFillForm(profile);
    await mpSleep(700);

    const submit = indFindSubmit();
    if (submit) {
      mpStatus(`${tag} Submitting application...`);
      submit.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await mpSleep(600);
      submit.click();
      await mpSleep(4000);                       // if the page navigates, this script restarts and detects success
      if (indLooksSuccessful()) return indFinish(await indGet(), 'applied');
      if (mpHasErrors(document)) { mpStatus(`${tag} Form has errors (extra question?) - skipped`); await mpSleep(1200); return indFinish(await indGet(), 'skipped'); }
      continue;
    }

    const next = indFindContinue();
    if (next) {
      const sig = ((document.querySelector('h1, h2') || {}).innerText || '') + '|' + document.querySelectorAll('input, textarea, select').length;
      stuck = (sig === lastSig) ? stuck + 1 : 0;
      lastSig = sig;
      if (stuck >= 2) { mpStatus(`${tag} Stuck on a question I can't answer - skipped`); await mpSleep(1200); return indFinish(st, 'skipped'); }
      mpStatus(`${tag} Clicking ${mpText(next)} (filled ${filled})...`);
      next.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await mpSleep(500);
      next.click();
      await mpSleep(2500);
      continue;
    }

    noBtn++;
    if (noBtn >= 3) { mpStatus(`${tag} No Continue/Submit button - skipped`); await mpSleep(1200); return indFinish(st, 'skipped'); }
    await mpSleep(1500);
  }
  const st = await indGet();
  if (st && st.stage === 'apply') { mpStatus('Too many steps - skipped'); return indFinish(st, 'skipped'); }
}

// ---------- start / stop / resume ----------
async function indToggle() {
  const st = await indGet();
  if (st && st.running) {
    await indSet({ ...st, running: false });
    mpButton(false);
    mpStatus('Stopped');
    return;
  }
  if (indNeedsLogin()) { mpStatus('Please sign in to Indeed first.'); return; }

  const base = { running: true, idx: 0, applied: 0, skipped: 0, formStep: 0, stageAt: 0 };

  if (indIsApplyPage()) {       // already on an application form: just finish this one
    await indSet({ ...base, stage: 'apply', stageAt: Date.now(), max: 1, standalone: true, listUrl: 'https://in.indeed.com/jobs' });
    mpButton(true);
    mpStatus('Continuing application on this page...');
    indFormLoop();
    return;
  }

  const cards = indCards();
  if (!cards.length) { mpStatus('No jobs found. Open an Indeed job search first (use the popup).'); return; }
  const tabId = await indTabId();
  await indSet({ ...base, stage: 'list', max: Math.min(IND_MAX_JOBS, cards.length), listUrl: window.location.href, listTabId: tabId });
  mpButton(true);
  mpStatus(`Found ${Math.min(IND_MAX_JOBS, cards.length)} job(s). Starting...`);
  indRunList();
}

async function indResume() {
  const st = await indGet();
  if (!st || !st.running) return;
  mpButton(true);
  if (indNeedsLogin()) { indStop('Please sign in to Indeed first, then press Start.'); return; }
  if (indIsApplyPage()) {
    if (st.stage === 'apply') { mpStatus('Resuming application...'); indFormLoop(); }
    return;
  }
  const me = await indTabId();
  if (st.listTabId && me === st.listTabId) { mpStatus('Resuming...'); indRunList(); } // only the original tab drives the list
}
