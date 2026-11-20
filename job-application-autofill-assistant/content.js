let isRunning = false;

function injectControlPanel() {
  if (document.getElementById('auto-applier-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'auto-applier-bar';
  bar.style.cssText = 'position:fixed;top:70px;right:20px;z-index:999999;background:#161b22;border:1px solid #30363d;padding:12px 16px;border-radius:8px;color:white;box-shadow:0 4px 16px rgba(0,0,0,0.6);display:flex;align-items:center;gap:12px;font-family:sans-serif;font-size:13px;';
  
  bar.innerHTML = `
    <span id="auto-status" style="color:#7ee787;font-weight:bold;">Ready</span>
    <button id="start-auto-btn" style="background:#238636;color:white;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:bold;">Start Auto-Apply</button>
  `;

  document.body.appendChild(bar);

  document.getElementById('start-auto-btn').addEventListener('click', () => {
    if (isMichaelPage()) { mpToggle(); return; }
    if (typeof isIndeed === 'function' && isIndeed()) { indToggle(); return; }
    isRunning = !isRunning;
    const btn = document.getElementById('start-auto-btn');
    const status = document.getElementById('auto-status');

    if (isRunning) {
      btn.innerText = "Stop Auto-Apply";
      btn.style.background = "#da3633";
      status.innerText = "Scanning page...";
      routeAutomation();
    } else {
      btn.innerText = "Start Auto-Apply";
      btn.style.background = "#238636";
      status.innerText = "Stopped";
    }
  });
}

function setNativeInputValue(input, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  input.focus && input.focus();
  if (valueSetter) valueSetter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: false }));
  input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
}

async function routeAutomation() {
  const host = window.location.hostname;

  if (host.includes('naukri.com')) {
    await runNaukriAutomation();
  } else if (host.includes('shine.com')) {
    await runShineAutomation();
  } else if (host.includes('linkedin.com')) {
    await runLinkedInAutomation();
  }
}

// ---------------- UNIVERSAL NAUKRI AUTOMATION ----------------
async function runNaukriAutomation() {
  // Method 1: Target links pointing to job listing details
  let links = Array.from(document.querySelectorAll('a[href*="job-listings"], a.title, a.job-title'));

  // Method 2: Dynamic fallback - scan all links on page if specific selectors return nothing
  if (links.length === 0) {
    links = Array.from(document.querySelectorAll('a')).filter(a => {
      const href = a.getAttribute('href') || '';
      return href.includes('/job-listings-') || href.includes('-jobs-in-');
    });
  }

  // Deduplicate links based on URL to prevent clicking the same job multiple times
  const uniqueJobLinks = [];
  const seenUrls = new Set();

  for (let link of links) {
    const url = link.href;
    if (url && !seenUrls.has(url) && link.innerText.trim().length > 3) {
      seenUrls.add(url);
      uniqueJobLinks.push(link);
    }
  }

  if (uniqueJobLinks.length === 0) {
    document.getElementById('auto-status').innerText = "No job links detected on this page.";
    isRunning = false;
    document.getElementById('start-auto-btn').innerText = "Start Auto-Apply";
    document.getElementById('start-auto-btn').style.background = "#238636";
    return;
  }

  document.getElementById('auto-status').innerText = `Found ${uniqueJobLinks.length} jobs. Applying...`;

  for (let i = 0; i < uniqueJobLinks.length; i++) {
    if (!isRunning) break;

    const link = uniqueJobLinks[i];
    const parentContainer = link.closest('article') || link.closest('div[class*="tuple"]') || link.closest('div[class*="job"]') || link.parentElement;

    if (parentContainer) {
      parentContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      link.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    await new Promise(r => setTimeout(r, 1200));

    // Check if there is an explicit Apply button right on the card container
    const inlineApplyBtn = parentContainer ? parentContainer.querySelector('button, .apply-button, [class*="apply"]') : null;
    
    if (inlineApplyBtn && inlineApplyBtn.innerText.toLowerCase().includes('apply')) {
      document.getElementById('auto-status').innerText = `[${i+1}/${uniqueJobLinks.length}] Direct Apply...`;
      inlineApplyBtn.click();
      await new Promise(r => setTimeout(r, 2500));
    } else {
      // Click title to open side panel / drawer or new tab view
      document.getElementById('auto-status').innerText = `[${i+1}/${uniqueJobLinks.length}] Opening job...`;
      link.click();
      await new Promise(r => setTimeout(r, 3000));

      // Attempt to locate apply button inside opened detail panel
      const detailApplyBtn = Array.from(document.querySelectorAll('button, a')).find(el => {
        const txt = el.innerText.trim().toLowerCase();
        return (txt === 'apply' || txt === 'apply on company site' || txt.includes('easy apply')) && el.offsetParent !== null;
      });

      if (detailApplyBtn) {
        document.getElementById('auto-status').innerText = `[${i+1}/${uniqueJobLinks.length}] Submitting application...`;
        detailApplyBtn.click();
        await new Promise(r => setTimeout(r, 2500));
      }
    }
  }

  document.getElementById('auto-status').innerText = "All jobs processed on page!";
  isRunning = false;
  document.getElementById('start-auto-btn').innerText = "Start Auto-Apply";
  document.getElementById('start-auto-btn').style.background = "#238636";
}

// ---------------- SHINE AUTOMATION ----------------
async function runShineAutomation() {
  const applyBtns = Array.from(document.querySelectorAll('button, a')).filter(el => el.innerText.trim().toLowerCase().includes('apply now'));

  if (applyBtns.length === 0) {
    document.getElementById('auto-status').innerText = "No Shine jobs found.";
    return;
  }

  for (let btn of applyBtns) {
    if (!isRunning) break;
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('auto-status').innerText = "Applying on Shine...";
    btn.click();
    await new Promise(r => setTimeout(r, 2500));
  }
  document.getElementById('auto-status').innerText = "Shine Page Finished!";
}

// ---------------- LINKEDIN AUTOMATION ----------------
async function runLinkedInAutomation() {
  const profile = await new Promise(resolve => chrome.storage.local.get(null, resolve));
  const jobCards = Array.from(document.querySelectorAll('.job-card-container, .jobs-search-results__list-item'));

  for (let card of jobCards) {
    if (!isRunning) break;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.click();
    await new Promise(r => setTimeout(r, 2000));

    const easyApplyBtn = document.querySelector('.jobs-apply-button--top-card button, .jobs-apply-button');
    if (easyApplyBtn && easyApplyBtn.innerText.includes("Easy Apply")) {
      document.getElementById('auto-status').innerText = "Applying on LinkedIn...";
      easyApplyBtn.click();
      await new Promise(r => setTimeout(r, 2500));
      await handleLinkedInModal(profile);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  document.getElementById('auto-status').innerText = "LinkedIn Page Finished!";
}

async function handleLinkedInModal(profile) {
  const modal = document.querySelector('.jobs-easy-apply-modal');
  if (!modal) return;

  const inputs = modal.querySelectorAll('input[type="text"], textarea');
  for (let input of inputs) {
    if (!input.value) {
      const label = input.closest('div')?.querySelector('label')?.innerText || "";
      const response = await chrome.runtime.sendMessage({ action: "answer_question", question: label, profile });
      if (response && response.answer) {
        setNativeInputValue(input, response.answer);
        if (label.toLowerCase().includes("city") || label.toLowerCase().includes("location")) {
          await new Promise(r => setTimeout(r, 800));
          const suggestion = document.querySelector('.search-basic-typeahead__search-result-list-item, [role="option"]');
          if (suggestion) suggestion.click();
        }
      }
    }
  }

  await new Promise(r => setTimeout(r, 1000));
  const submitBtn = modal.querySelector('button[aria-label*="Submit"]');
  const nextBtn = modal.querySelector('button[aria-label*="Continue"], button[aria-label*="Next"]');

  if (submitBtn) {
    submitBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    const closeBtn = modal.querySelector('button[aria-label*="Dismiss"]');
    if (closeBtn) closeBtn.click();
  } else if (nextBtn) {
    nextBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    return handleLinkedInModal(profile);
  }
}


// ================= MICHAEL PAGE (michaelpage.co.in) =================
// Flow:  /jobs listing  ->  each /job-detail/ page  ->  click Apply  ->  fill form  ->  submit  ->  next job
// Progress is kept in chrome.storage.local so it survives page navigations.
const MP_MAX_JOBS = 15; // jobs per run (keeps activity human-sized)

function isMichaelPage() { return window.location.hostname.includes('michaelpage.co.in'); }
const mpSleep = (ms) => new Promise(r => setTimeout(r, ms));
const mpGet = () => new Promise(res => chrome.storage.local.get(['mpState'], r => res(r.mpState || null)));
const mpSet = (s) => new Promise(res => chrome.storage.local.set({ mpState: s }, res));

function mpStatus(text) {
  const el = document.getElementById('auto-status');
  if (el) el.innerText = text;
}
function mpButton(running) {
  const btn = document.getElementById('start-auto-btn');
  if (!btn) return;
  btn.innerText = running ? 'Stop Auto-Apply' : 'Start Auto-Apply';
  btn.style.background = running ? '#da3633' : '#238636';
}
function mpVisible(el) { return !!(el && (el.offsetParent !== null || el.getClientRects().length)); }
function mpText(el) { return ((el.innerText || el.value || el.textContent || '') + '').trim().toLowerCase(); }

async function mpToggle() {
  const st = await mpGet();
  if (st && st.running) {
    await mpSet({ ...st, running: false });
    mpButton(false);
    mpStatus('Stopped');
    return;
  }
  // START
  const path = window.location.pathname;
  const isDetail = path.includes('/job-detail/');
  const isApplyPage = path.includes('/job-apply');
  if (isApplyPage) {            // already on the application form: just continue from here
    await mpSet({ running: true, queue: [window.location.href], idx: 0, stage: 'form', formStep: 0, noBtn: 0, listUrl: 'https://www.michaelpage.co.in/jobs', applied: 0, skipped: 0 });
    mpButton(true);
    mpStatus('Continuing application on this page...');
    mpRunStep();
    return;
  }
  let queue = [];
  if (isDetail) {
    queue = [window.location.href];
  } else {
    const seen = new Set();
    document.querySelectorAll('a[href*="/job-detail/"]').forEach(a => {
      const url = a.href.split('#')[0];
      if (!seen.has(url) && mpText(a).length > 2) { seen.add(url); queue.push(url); }
    });
    queue = queue.slice(0, MP_MAX_JOBS);
  }
  if (queue.length === 0) {
    mpStatus('No jobs found. Open michaelpage.co.in/jobs first.');
    return;
  }
  await mpSet({ running: true, queue, idx: 0, stage: 'detail', formStep: 0, noBtn: 0, listUrl: isDetail ? 'https://www.michaelpage.co.in/jobs' : window.location.href, applied: 0, skipped: 0 });
  mpButton(true);
  mpStatus(`Found ${queue.length} job(s). Starting...`);
  if (isDetail) { mpResume(); } else { window.location.href = queue[0]; }
}

async function mpNext(st, result) {
  st = { ...st };
  if (result === 'applied') st.applied++; else st.skipped++;
  st.idx++;
  st.stage = 'detail';
  if (st.idx >= st.queue.length) {
    st.running = false;
    await mpSet(st);
    mpButton(false);
    mpStatus(`Done: ${st.applied} applied, ${st.skipped} skipped.`);
    await mpSleep(1500);
    if (!window.location.pathname.includes('/job-apply') && !window.location.href.startsWith(st.listUrl)) window.location.href = st.listUrl;
    return;
  }
  await mpSet(st);
  mpStatus(`[${st.idx + 1}/${st.queue.length}] Next job...`);
  await mpSleep(1500 + Math.random() * 1500);
  window.location.href = st.queue[st.idx];
}

function mpNeedsLogin() {
  if (/\/(mypage|login|sign-?in)/i.test(window.location.pathname) && document.querySelector('input[type="password"]')) return true;
  return false;
}

function mpFindApplyControl() {
  const els = Array.from(document.querySelectorAll('a, button, input[type="submit"], input[type="button"]')).filter(mpVisible);
  // 1) exact text match
  let hit = els.find(el => /^(apply( now| for this job| for job)?|quick apply|easy apply)$/.test(mpText(el)));
  if (hit) return hit;
  // 2) link to an apply page
  hit = els.find(el => el.tagName === 'A' && /\/apply|job-apply|apply-job/i.test(el.getAttribute('href') || '') && !/recruitment-jobs/.test(el.getAttribute('href')));
  if (hit) return hit;
  // 3) text starts with apply
  return els.find(el => /^apply\b/.test(mpText(el)) && mpText(el).length < 30) || null;
}

function mpLabel(el) {
  const parts = [];
  if (el.id) { const l = document.querySelector(`label[for="${el.id.replace(/"/g, '\\"')}"]`); if (l) parts.push(l.innerText || l.textContent); }
  const w = el.closest('label'); if (w) parts.push(w.innerText || w.textContent);
  ['aria-label', 'placeholder', 'name', 'id', 'autocomplete'].forEach(a => { const v = el.getAttribute(a); if (v) parts.push(v); });
  const g = el.closest('.form-item, .form-group, .form-wrapper, fieldset, [class*="form-item"], [class*="field"]');
  if (g) { const l = g.querySelector('label, legend'); if (l) parts.push(l.innerText || l.textContent); }
  return parts.join(' ').toLowerCase().replace(/[_\-]+/g, ' ');
}

function mpValueFor(label, p) {
  const name = (p.fullName || '').trim();
  const parts = name.split(/\s+/);
  const rules = [
    [/first ?name|given name|fname/, parts[0]],
    [/last ?name|family name|surname|lname/, parts.slice(1).join(' ')],
    [/full ?name|your name|^name\b/, name],
    [/e ?mail/, p.email],
    [/phone|mobile|contact (no|number)|tel\b/, p.phone],
    [/expected (ctc|salary|compensation|package)|desired (ctc|salary)|salary expectation/, p.expectedCtc],
    [/current (annual )?(ctc|salary|compensation|package)|present (ctc|salary)|annual salary/, p.currentCtc],
    [/expected (ctc|salary|compensation|package)|desired (ctc|salary)|salary expectation/, p.expectedCtc],
    [/notice/, p.notice],
    [/total (work )?experience|years of experience|how many years|\bexperience\b/, p.exp],
    [/city|location/, p.city]
  ];
  for (const [re, v] of rules) if (v && re.test(label)) return v;
  return null;
}

function mpFillForm(p) {
  let n = 0;
  document.querySelectorAll('input, textarea').forEach(el => {
    const t = (el.type || 'text').toLowerCase();
    if (['hidden', 'checkbox', 'radio', 'file', 'submit', 'button', 'password', 'search'].includes(t)) return;
    if (el.disabled || el.readOnly || mpIgnored(el) || !mpVisible(el) || (el.value && el.value.trim())) return;
    let v = t === 'email' ? p.email : t === 'tel' ? p.phone : null;
    if (!v) v = mpValueFor(mpLabel(el), p);
    if (!v) return;
    setNativeInputValue(el, v);
    el.style.outline = '2px solid #3b82f6';
    n++;
  });
  document.querySelectorAll('select').forEach(sel => {
    if (sel.disabled || mpIgnored(sel) || !mpVisible(sel)) return;
    // keep whatever the site/you already chose; only fill untouched placeholder selects
    const cur = sel.options[sel.selectedIndex];
    if (cur && cur.value && !/^(select|choose|please|--|-)/i.test(cur.text.trim())) return;
    const v = mpValueFor(mpLabel(sel), p);
    if (!v) return;
    const want = String(v).toLowerCase();
    let opt = Array.from(sel.options).find(o => o.text.toLowerCase().includes(want));
    if (!opt && /notice/.test(mpLabel(sel))) {            // "30 Days" -> "1 Month", "0/Immediate" -> "Immediate"
      const days = parseInt((want.match(/\d+/) || [0])[0], 10);
      const months = Math.max(1, Math.round(days / 30));
      opt = (days === 0 || /immediate/.test(want))
        ? Array.from(sel.options).find(o => /immediate/i.test(o.text))
        : Array.from(sel.options).find(o => new RegExp('^\\s*' + months + '\\s*month', 'i').test(o.text));
    }
    if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event('change', { bubbles: true })); sel.style.outline = '2px solid #3b82f6'; n++; }
  });
  return n;
}

// Elements we must never touch: site header/nav/footer and cookie banners
const MP_IGNORE = 'header, nav, footer, [role="navigation"], [role="banner"], [id*="cookie" i], [class*="cookie" i], [id*="onetrust" i], [class*="onetrust" i], [id*="consent-banner" i]';
function mpIgnored(el) { return !!el.closest(MP_IGNORE); }

// The whole page (buttons like Next / Apply Now live OUTSIDE the <form> on Michael Page)
function mpScope() { return document; }

function mpClickables(scope) {
  return Array.from(scope.querySelectorAll('button, input[type="submit"], input[type="button"], a.button, a.btn, a[role="button"], [role="button"], a[class*="btn"], a[class*="button"]'))
    .filter(el => mpVisible(el) && !mpIgnored(el) && !el.disabled && el.getAttribute('aria-disabled') !== 'true' && !el.classList.contains('disabled'));
}

// A Next/Continue button that exists but is disabled (form not valid yet)
function mpFindDisabledNext() {
  return Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.button, a.btn, [role="button"]'))
    .find(el => mpVisible(el) && !mpIgnored(el) && /^(next( step)?|continue)\b/.test(mpText(el)) &&
      (el.disabled || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('disabled'))) || null;
}
function mpEmptyRequired() {
  const out = [];
  document.querySelectorAll('input, textarea, select').forEach(el => {
    const t = (el.type || 'text').toLowerCase();
    if (['hidden', 'submit', 'button', 'password', 'search'].includes(t) || mpIgnored(el)) return;
    const req = el.required || el.getAttribute('aria-required') === 'true';
    const empty = t === 'checkbox' || t === 'radio' ? !el.checked : !(el.value && el.value.trim());
    if (req && empty && (mpVisible(el) || t === 'checkbox')) out.push((mpLabel(el).split(' ')[0] || el.name || el.id || 'field'));
  });
  return out;
}

// Final action: Apply / Submit
function mpFindSubmit(scope) {
  return mpClickables(scope || document).find(el => /^(submit( application)?|apply( now| for this job| for job)?|send( application)?|confirm|finish|complete)$/.test(mpText(el))) || null;
}
// Step action: Next / Continue
function mpFindNext(scope) {
  return mpClickables(scope || document).find(el => /^(next( step)?|continue|proceed|save (&|and) continue|go to next step)$/.test(mpText(el)) || /^next\b/.test(mpText(el))) || null;
}

// Text that belongs to ONE checkbox only (its own label / the smallest wrapper holding just that checkbox)
function mpCheckboxText(cb) {
  const parts = [];
  if (cb.id) { const l = document.querySelector(`label[for="${cb.id.replace(/"/g, '\\"')}"]`); if (l) parts.push(l.innerText || l.textContent || ''); }
  const w = cb.closest('label'); if (w) parts.push(w.innerText || w.textContent || '');
  ['aria-label', 'name', 'id'].forEach(a => { const v = cb.getAttribute(a); if (v) parts.push(v); });
  let node = cb.parentElement, best = null;
  while (node && node !== document.body) {            // climb while the wrapper still contains only this one checkbox
    if (node.querySelectorAll('input[type="checkbox"]').length > 1) break;
    best = node; node = node.parentElement;
  }
  if (best) parts.push(best.innerText || best.textContent || '');
  return parts.join(' ').toLowerCase();
}
function mpIsMarketing(cb) {
  const t = mpCheckboxText(cb);
  return /email me more jobs|more jobs like this|newsletter|job alerts? (by|via)|similar jobs/.test(t) && !/privacy|consent|terms and conditions|submitting your/.test(t);
}
function mpAllBoxes(scope) {
  return Array.from(scope.querySelectorAll('input[type="checkbox"]')).filter(cb => !cb.disabled && !mpIgnored(cb));
}
// Privacy / consent: checkbox "IMPORTANT: By submitting your email address..."
function mpConsentBoxes(scope) {
  return mpAllBoxes(scope).filter(cb => !mpIsMarketing(cb) &&
    /agree|consent|terms|privacy|policy|important|submitting your|acknowledge|read and (accepted|understood)|declar/.test(mpCheckboxText(cb)));
}
function mpMarketingBoxes(scope) { return mpAllBoxes(scope).filter(mpIsMarketing); }

function mpSetChecked(cb, want) {
  if (cb.checked === want) return false;
  const lab = (cb.id && document.querySelector(`label[for="${cb.id.replace(/"/g, '\\"')}"]`)) || cb.closest('label');
  cb.scrollIntoView({ block: 'center' });
  cb.click();                                            // normal click (fires Angular/React handlers)
  if (cb.checked !== want && lab) lab.click();           // custom-styled checkbox
  if (cb.checked !== want) {                             // last resort
    cb.checked = want;
    cb.dispatchEvent(new Event('input', { bubbles: true }));
    cb.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return true;
}
function mpTickConsent(scope) {
  let n = 0;
  mpConsentBoxes(scope).forEach(cb => { if (mpSetChecked(cb, true)) n++; });
  mpMarketingBoxes(scope).forEach(cb => { if (mpSetChecked(cb, false)) n++; });   // "Email me more jobs like this" must stay UNticked
  return n;
}

function mpHasErrors(scope) {
  return !!Array.from(scope.querySelectorAll('[aria-invalid="true"], .error, .form-error, .is-invalid, .has-error, [class*="error-message"], [class*="invalid"]')).find(el => mpVisible(el) && (el.innerText || '').trim().length > 0);
}
function mpLooksSuccessful() {
  return /thank you|application (has been |was )?(submitted|received|sent)|successfully (applied|submitted)|you have applied|already applied/i.test(document.body.innerText || '');
}

async function mpRunStep() {
  let st = await mpGet();
  if (!st || !st.running) return;
  const total = st.queue.length;
  const tag = `[${st.idx + 1}/${total}]`;

  if (mpNeedsLogin()) {
    await mpSet({ ...st, running: false });
    mpButton(false);
    mpStatus('Please sign in to Michael Page (MyPage) first, then press Start.');
    return;
  }

  // Make sure we are on the right job; if not, go there.
  const current = st.queue[st.idx];
  const onDetail = window.location.pathname.includes('/job-detail/');

  if (st.stage === 'detail') {
    if (!onDetail || window.location.href.split('#')[0] !== current.split('#')[0]) {
      if (onDetail) { /* different detail URL variant */ } else { window.location.href = current; return; }
    }
    mpStatus(`${tag} Looking for Apply button...`);
    await mpSleep(2500);
    const applyEl = mpFindApplyControl();
    if (!applyEl) { mpStatus(`${tag} No Apply button - skipping`); await mpSleep(1000); return mpNext(st, 'skipped'); }
    st.stage = 'form';
    st.stageAt = Date.now();
    await mpSet(st);
    applyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await mpSleep(800);
    mpStatus(`${tag} Clicking Apply...`);
    applyEl.click();
    await mpSleep(3500);
    // If page navigated, the script restarts on the new page and resumes at stage 'form'. Otherwise continue here.
  }

  st = await mpGet();
  if (!st || !st.running) return;
  if (st.stage === 'form') await mpFormLoop();
}

// Multi-step application: personal info -> Next -> privacy -> Apply
async function mpFormLoop() {
  const MAX_STEPS = 8;
  for (let guard = 0; guard < MAX_STEPS; guard++) {
    let st = await mpGet();
    if (!st || !st.running || st.stage !== 'form') return;
    const tag = `[${st.idx + 1}/${st.queue.length}]`;
    st.formStep = (st.formStep || 0);

    if (mpNeedsLogin()) {
      await mpSet({ ...st, running: false });
      mpButton(false);
      mpStatus('Please sign in to Michael Page (MyPage) first, then press Start.');
      return;
    }
    if (st.formStep >= MAX_STEPS) { mpStatus(`${tag} Too many steps - skipping`); return mpNext({ ...st, formStep: 0 }, 'skipped'); }

    // Wait for the form to appear / the next step to render
    let scope = document;
    for (let i = 0; i < 6; i++) { scope = mpScope(); if (scope !== document || mpFindSubmit(document) || mpFindNext(document)) break; await mpSleep(1000); }
    await mpSleep(800);

    const profile = await new Promise(r => chrome.storage.local.get(null, r));
    mpStatus(`${tag} Step ${st.formStep + 1}: filling details...`);
    scope = mpScope();
    const filled = mpFillForm(profile);
    const ticked = mpTickConsent(scope);
    await mpSleep(1000);           // let the site enable the button after ticking
    scope = mpScope();

    const submit = mpFindSubmit(scope);
    const next = mpFindNext(scope);

    if (submit) {                   // FINAL: Apply / Submit
      mpTickConsent(document); await mpSleep(500);   // consent ON, marketing OFF, just before applying
      mpStatus(`${tag} Clicking ${mpText(submit) || 'Apply'}...`);
      submit.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await mpSleep(600);
      const after = { ...st, formStep: 0, applied: st.applied + 1, idx: st.idx + 1, stage: 'detail' };
      if (after.idx >= after.queue.length) after.running = false;
      await mpSet(after);
      submit.click();
      await mpSleep(3500);
      // still on a form with validation errors? then it did NOT go through
      if (!mpLooksSuccessful() && mpHasErrors(mpScope())) {
        const fixed = { ...(await mpGet()), applied: after.applied - 1, skipped: after.skipped + 1 };
        await mpSet(fixed);
        mpStatus(`${tag} Form has errors (CV/required field?) - skipped`);
        await mpSleep(1500);
      }
      const cur = await mpGet();
      if (cur && cur.running) {
        mpStatus(`${tag} Applied. Next job...`);
        await mpSleep(1000 + Math.random() * 1500);
        window.location.href = cur.queue[cur.idx];
      } else if (cur) {
        mpButton(false);
        mpStatus(`Done: ${cur.applied} applied, ${cur.skipped} skipped.`);
      }
      return;
    }

    if (next) {                     // STEP: Next / Continue
      mpStatus(`${tag} Clicking ${mpText(next)}...`);
      next.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await mpSleep(600);
      await mpSet({ ...st, formStep: st.formStep + 1 }); // persisted in case Next reloads the page
      next.click();
      await mpSleep(2500);
      continue;                     // loop again for the next step (or the script restarts on a new page)
    }

    // "Choose Apply Method" style first step: pick a plain continue/upload option (never social logins)
    const method = mpClickables(scope).find(el => /^(continue|upload (my |your )?cv|apply with (my )?cv|apply manually|continue as guest)$/.test(mpText(el)));
    if (method) {
      mpStatus(`${tag} Choosing: ${mpText(method)}`);
      await mpSet({ ...st, formStep: st.formStep + 1 });
      method.click();
      await mpSleep(2500);
      continue;
    }

    // Next exists but is disabled -> the form is incomplete. Do NOT navigate away (that triggers "Leave site?"); stop and tell the user.
    if (mpFindDisabledNext()) {
      st.noBtn = (st.noBtn || 0) + 1;
      await mpSet(st);
      if (st.noBtn >= 3) {
        const missing = mpEmptyRequired();
        await mpSet({ ...st, running: false, noBtn: 0 });
        mpButton(false);
        mpStatus(`${tag} Next is disabled. Fill manually` + (missing.length ? ': ' + missing.join(', ') : ' (check email/last name/CV)') + ' - then press Start again.');
        return;
      }
      await mpSleep(1500);
      continue;
    }

    // Nothing clickable yet: wait a little and retry before giving up
    st.noBtn = (st.noBtn || 0) + 1;
    await mpSet(st);
    if (st.noBtn >= 3) {
      mpStatus(`${tag} No Next/Apply button found (filled ${filled}, ticked ${ticked}) - skipping`);
      await mpSleep(1500);
      return mpNext({ ...st, noBtn: 0, formStep: 0 }, 'skipped');
    }
    await mpSleep(1500);
  }
}

async function mpResume() {
  const st = await mpGet();
  if (st && st.running) {
    mpButton(true);
    mpStatus('Resuming...');
    mpRunStep();
  }
}

setTimeout(() => {
  injectControlPanel();
  if (isMichaelPage()) mpResume();
  if (typeof isIndeed === 'function' && isIndeed()) indResume();
}, 2000);