# Session C: positioning rewrite and ship the new landing page today

You are finishing the Apperio landing page redesign so it can be **deployed today, 2026-10-08**. The user's friends start testing tomorrow.

A previous session (B) built the new page. Another session (the screenshot session) is re-running the Demo Shop story right now and will drop the real screenshots into the page this evening.

Read first, in order:

1. `remote-logger/docs/redesign/PHASE3-NOTES.md`: what session B built, decisions already made, and every `TODO`.
2. `remote-logger/docs/redesign/SESSION-B-PROMPT.md`: the ground rules, the screenshot contract and the coordination rules. **All of it still applies.**
3. `remote-logger/docs/redesign/PLAN.md`: product facts (what is shipped versus not).
4. Your memory index (`MEMORY.md`) and `landing-redesign.md`.

## The user's new direction (verbatim intent)

> The subtitle text in the header undersells what you can get from Apperio. It's a full monitoring and debugging suite that can be used by anyone, to find anything and understand everything happening on their app or website. Anyone should be able to read it and want to try it out, not just developers or engineers.

The hero subtitle today is in `components/waitlist/WaitlistPage.tsx` (about line 60), and the same text is the meta description in `app/page.tsx` (about line 11):

> Apperio watches every error, every deploy and every commit in between, then tells you in plain English which change caused the break and what to do about it. One npm install. Nothing to configure.

It frames Apperio as a developer's error-and-commit tool. The new framing:

- **A full monitoring and debugging suite.** Errors, slow pages and failed requests, what visitors actually do (page views, clicks, sessions, replay), how fast the site feels (Web Vitals), what changed and which change broke it, alerts, and drafted fixes for whoever does the fixing.
- **For anyone who has an app or website:** founders, product people, agencies, solo builders, people building with AI tools, not only engineers.
- **Find anything, understand everything.** Plain English is the point: Apperio explains what happened and why, so you don't need to read stack traces.

## Your tasks, in this order

### 1. Rewrite the hero subtitle for everyone

Write 3 options and ask the user to pick, with your recommendation first. Each one:

- is readable by a non-technical founder in one breath, under about 40 words
- names breadth (errors, speed, what visitors do, what changed) without a feature list
- keeps the voice: plain, specific, second person, no hype, **no em dashes or en dashes**

After they pick:

- Apply it to the hero and the meta and OG descriptions in `app/page.tsx`.
- Do a light jargon pass on the hero area (badge, form helper text) and on the section intros (eyebrow, headline, sub) so the top of the page doesn't assume an engineer. Keep the existing section structure and deeper sections; engineers still need the specifics further down.
- Keep the 3-line headline ("Your code shipped at {RUN.commitTime}. It broke at {RUN.errorTime}. Apperio already knows why."). Ask the user if it should broaden too, but don't change it without a yes.

**Honesty limits on "anyone":**

- Reading and using Apperio needs no technical skill.
- **Installing it does:** someone adds the SDK to the site once (npm, with `apiKey` and `projectId`). Check `remote-logger/lib/docs/` and `loghive-sdk/README.md` for any no-npm install path (a script tag or CDN import) before you claim one. If none exists, say something true, like "one snippet, added once by you or whoever built your site". Never "no code".
- Only name capabilities that are shipped; PLAN.md section 3 has the list. Session replay is beta. The weekly digest is not built.
- No invented numbers or social proof.

### 2. Make the page deployable today, with or without screenshots

Right now every missing shot renders a dashed "Screenshot pending" frame. **That must never reach production.**

- Change `ProductShot` (and anything that wraps it) so that in **production builds** a shot missing from `lib/screenshots/manifest.json` renders **nothing**: the slot collapses, with no empty frame and no layout gap. Keep the placeholder in dev and keep the build-time warning.
- Check every section reads well text-only: the hero (no image under the form), the product tour tabs (text plus whatever shots exist), each timeline step, setup steps 2 and 3, and the bento cards (a card with no shot must not look broken).
- Prove it: run `npm run build && npm start` with the current empty manifest, then run `node scripts/capture-landing.mjs --url http://localhost:3000 --out docs/redesign/after-noshots`. Look at every image at all 4 widths, in both themes.

This is the fallback. If tonight's run fails, the page can still ship today with zero mocks and zero placeholders.

### 3. Leave the run facts and images to the screenshot session

Do not touch any of these:

- `components/landing/run-facts.ts` (`RUN`)
- `lib/screenshots/manifest.json`
- `public/screenshots/`
- `public/videos/`
- the OG image `TODO(run)`

The screenshot session fills them this evening. The story is being re-run today, so the headline times will move. The bug push is planned for about **16:02**, or **17:02** if setup runs late. The fix's verdict lands an hour after its deploy, then the captures happen. `RUN` drives the headline, the timeline, "N minutes" phrases and the weekday, so nothing else needs editing when the times change. If you find a hardcoded time or release anywhere else, route it through `RUN`.

### 4. Remaining small items from PHASE3-NOTES

- The Comparison table says "Under 5 minutes". Verify it or soften it.
- Any other copy you find that over-claims against the code.
- **Optional, only if time allows and the user agrees:** the mobile LCP follow-up (static sections as Server Components). Don't start it before tasks 1 and 2 are done and verified.

### 5. QA, then ship on the user's word

- `npx tsc --noEmit`, `npx eslint` on the changed files, `npx vitest run` (3 known stale sidebar failures, not yours), and `npm run build`.
- After screenshots at 1440, 1024, 768 and 390, in both themes.
- Waitlist forms checked **without sending** (mock the network in the browser). The local backend writes to the production database.
- **Commit:** stage files by name, never `git add -A`, `git add .` or `git commit -a`. The working tree also holds the screenshot session's files. Use one commit for the landing redesign, or a few logical ones. Commit messages end with the attribution line the harness gives you.
- **Push only when the user says so.** Pushing `remote-logger` `main` deploys production on Vercel. After pushing, verify the live page at https://www.apperio.dev (logged out, both themes, a waitlist form renders), and check that `/screenshots/...` assets are not redirected to `/login`.

## Coordination

- The screenshot session will tell the user when the manifest, images and `RUN` are filled. You then rerun QA with the real images (they replace the collapsed slots) and ship on the user's word.
- If the user wants to ship before the images exist, ship the fallback from task 2. The screenshot session's images can go out in a second deploy tonight.
- Still off limits: `app/(dashboard)/**`, shared dashboard components, `demo/`, `logger_backend/`, `.env.screenshots`, `.auth/`.
- The user wants short numbered steps with the answer first, and no em dashes anywhere you write.
