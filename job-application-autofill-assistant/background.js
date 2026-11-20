// Answers form-field questions from the saved profile.
// Answers questions from the profile (returns text only). It also tells a tab its own id and
// can close the calling tab (used by the Indeed flow to close a finished application tab).

function answerFor(questionRaw, profile) {
  const q = (questionRaw || "").toLowerCase();
  const p = profile || {};

  if (q.includes("city") || q.includes("location") || q.includes("address") || q.includes("where do you live")) {
    return p.city || "";
  }
  if (q.includes("state") || q.includes("region") || q.includes("province")) {
    return p.state || "";
  }
  if (q.includes("country") || q.includes("nation")) {
    return p.country || "";
  }
  if (q.includes("current ctc") || q.includes("present ctc") || q.includes("current salary") || q.includes("current package")) {
    return p.currentCtc || "";
  }
  if (q.includes("expected ctc") || q.includes("expected salary") || q.includes("salary expectation") || q.includes("desired ctc")) {
    return p.expectedCtc || "";
  }
  if (q.includes("phone") || q.includes("mobile") || q.includes("contact number") || q.includes("telephone")) {
    return p.phone || "";
  }
  if (q.includes("email")) {
    return p.email || "";
  }
  if (q.includes("linkedin") || q.includes("profile url") || q.includes("portfolio") || q.includes("website")) {
    return p.linkedinUrl || "";
  }
  if (q.includes("total experience") || q.includes("years of experience") || q.includes("how many years")) {
    return p.exp || "";
  }
  if (q.includes("notice") || q.includes("joining") || q.includes("availability") || q.includes("how soon")) {
    return p.notice || "";
  }
  if (q.includes("authorized") || q.includes("legally") || q.includes("right to work") || q.includes("work permit")) {
    return p.authorized || "";
  }
  if (q.includes("sponsor") || q.includes("visa")) {
    return p.sponsorship || "";
  }
  if (q.includes("relocate") || q.includes("commute") || q.includes("onsite") || q.includes("in-office") || q.includes("hybrid")) {
    return p.commute || "";
  }
  if (q.includes("summary") || q.includes("about yourself") || q.includes("cover letter") || q.includes("why should we") || q.includes("why hire")) {
    return p.summary || "";
  }
  // No confident match — leave blank rather than guess. Guessing on an
  // unrecognized field is how wrong answers end up in front of a recruiter.
  return "";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "answer_question") {
    const answer = answerFor(request.question, request.profile);
    sendResponse({ answer });
  } else if (request.action === "whoami") {
    sendResponse({ tabId: sender.tab ? sender.tab.id : null });
  } else if (request.action === "close_tab") {
    if (sender.tab) chrome.tabs.remove(sender.tab.id);
    sendResponse({ ok: true });
  }
  return true;
});
