Job Application Auto-Fill Assistant  (v1.2.0)
=============================================

SITES
LinkedIn, Naukri, Shine, Indeed, Foundit and Michael Page (michaelpage.co.in)

HOW TO INSTALL (Chrome / Edge / Brave)
1. Unzip this folder somewhere permanent.
2. Go to chrome://extensions and turn on "Developer mode".
3. Remove any older copy, then click "Load unpacked" and pick this folder.
4. Click the extension icon, fill in your profile (including Full Name and
   Email) and press "Save Profile Settings".

MICHAEL PAGE AUTO-APPLY
1. In the popup press "Michael Page" - it opens michaelpage.co.in/jobs
   (or /jobs/<title>/<city> from your Search Target).
2. Sign in to your Michael Page MyPage account once (recommended).
3. A dark bar with "Start Auto-Apply" appears top-right. Press it.
4. For up to 15 jobs on the page it will: open the job -> click Apply ->
   fill personal information -> click Next/Continue -> tick the privacy / (and UNtick "Email me more jobs") /
   consent box -> click Apply/Submit -> next job. It handles up to 8 form
   steps per job. Progress survives page changes. Press "Stop Auto-Apply"
   at any time.
   TIP: if you are already on a michaelpage.co.in/job-apply/... page,
   just press Start - it continues the application from that page
   (Next -> privacy checkbox -> Apply Now).
5. If it can't find an Apply/Submit button, or you are logged out, it
   skips the job / stops and tells you in the bar.

INDEED AUTO-APPLY (in.indeed.com)
1. Sign in to Indeed once. In the popup press "Indeed" - it opens a search
   for your Target Job Title / City.
2. Press "Start Auto-Apply" in the dark bar (top-right). Use a full-width
   browser window so the job detail pane shows beside the list.
3. For up to 15 jobs it will: open the job -> click "Apply now" -> in the
   Smart Apply tab fill contact/salary/experience fields -> Continue ... ->
   "Submit your application" -> close that tab -> next job.
4. Skipped automatically: "Apply on company site" jobs, jobs already
   applied, and jobs with questions it can't answer from your profile
   (e.g. "years of experience with <specific skill>", yes/no screening
   questions, assessments, CV uploads). Nothing is guessed.
5. If you're already on a smartapply.indeed.com form, Start just finishes
   that one application. Change IND_MAX_JOBS at the top of indeed.js to
   raise/lower the per-run limit.

NOTES
- Michael Page may ask for a CV upload or extra questions; those can't be
  auto-filled, so such jobs are skipped. Check your MyPage "applications"
  list afterwards to confirm what actually went through.
- Automated applying may breach a site's terms of use; use at your own risk
  and keep batches small.
- Change MP_MAX_JOBS at the top of the Michael Page section in content.js
  to raise/lower the per-run limit.
