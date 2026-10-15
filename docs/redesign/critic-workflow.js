export const meta = {
  name: 'final-player-critic',
  description: 'A mobile-game UI critic panel grades the Final Player redesign 1-10 and ranks its issues',
  phases: [
    { title: 'Review', detail: 'three specialist reviewers, each with their own lens, play and inspect the app' },
    { title: 'Grade', detail: 'the lead critic gives the official grade and the ranked issue list' },
  ],
}

// args: { round, shots, prev }  — shots: screenshot dir; prev: earlier rounds' grades and issues (for regression checks)
const { round, shots, prev } = args
const SCRATCH = '/tmp/claude-0/-home-user/f162495e-1d49-5057-a91b-ee2f08d08edc/scratchpad'

const CONTEXT = `
You are reviewing "Final Player", a fan-made solo iPhone PWA of the board game Final Girl (Van Ryder Games, 2021): an 80s-slasher, one-player board game
where you are the Final Girl, a Killer hunts victims on a location board, you play action cards from your hand, roll horror dice, save victims and try to kill the Killer.
The app was just overhauled (redesign round ${round}). The owner's brief, verbatim: "Its not optimized for an iphone app feel, improve the ui experience in general, it needs a
rethink and an overhaul. Remove also gradients etc everything looks so ai ish. I needs to be better its too similar to the coldwake i dont like it it doesnt look fun.
Analyze how the real game looks and feels and optimize the app for that, maybe in portrait instead of vertical." (Coldwake is another app of theirs: dark, generic, gradient-heavy.)
The chosen art direction ("tabletop"): the phone is a walnut table at night; every UI object is a printed die-cut cardstock game component — flat ink colours, 2–2.5px black outlines,
hard zero-blur offset shadows, no gradients/glows/blur, no emoji. Fonts: Anton, Archivo, Archivo Narrow, Courier Prime (script/log), Permanent Marker (stickers), VT323 (VCR).
Both orientations are first-class: landscape ("the Table": board left at full height, a right rail with killer strip, girl strip and hand tray) is treated as primary and the
portrait title screen shows a "Best played sideways" sticker; portrait ("the Pocket": killer strip, board, girl strip, hand tray stacked) must be fully playable too. Judge both. The full spec is /home/user/Final-player/docs/redesign/spec.md and
research on the real game's look is in /home/user/Final-player/docs/redesign/research-real-game.md (skim them for intent; judge the RESULT, not the spec).

WHAT TO LOOK AT:
1. Screenshots of every main state, both orientations (390x844 portrait and 844x390 landscape at @2x, with simulated notch insets): ${shots}  — Read every PNG there.
   Names: 01-title (video-store title screen), 02-game-action, 03-card-lifted, 04-roll, 05-move, 06-choice, 07-planning, 08-killer-playback, 09-terror-reveal, 10-react,
   11-search, 12-rescue, 13-killer-sheet, 14-end, 15-girl-sheet, 16-log-sheet, 17-menu-sheet, 18-zone-sheet, 20-board-* (every location board). store-* files show the title flow.
2. The live app (dev server with HMR): http://localhost:5179/Final-player/?debug — drive it with Playwright (import { chromium } from '/home/user/Final-player/node_modules/@playwright/test/index.mjs';
   executablePath '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'; viewport 390x844 or 844x390, deviceScaleFactor 2, isMobile true, hasTouch true). Play a few turns yourself by tapping
   (pick up a card, play it, roll, move, end the turn, watch the Killer phase playback, open sheets). The debug hook window.__fp can jump to states: __fp.start({killer, location, finalGirl, seed}),
   __fp.driveTo('roll'|'move'|'choice'|'planning'|'react'|'search'|'rescue'|'main', {test:'g.turn >= 3'}), __fp.finish('killer'), __fp.title(); see /home/user/Final-player/src/ui/debug.ts
   and /home/user/Final-player/scripts/shots.mjs. Put any scripts/screenshots you make in ${SCRATCH}/critic/r${round}/<your-name>/. Do NOT edit any file in /home/user/Final-player.
3. The code if you need it: /home/user/Final-player/src/ui (React + CSS).
${prev ? `\nEARLIER ROUNDS (check whether those issues were really fixed and whether anything regressed):\n${prev}\n` : ''}
GRADING SCALE (be honest and calibrated; do not grade on effort): 10 = a professional studio mobile board-game adaptation (think Asmodee Digital / Twin Sails / Playdigious /
Marvel Snap-level polish in its niche); 8 = could ship on the App Store as a well-reviewed indie adaptation, a player would call it polished and fun; 6 = solid fan project, clearly
designed, but with noticeable rough edges; 4 = functional but amateur; 2 = broken.`

const ISSUE = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'polish'] },
    screens: { type: 'array', items: { type: 'string' } },
    orientation: { type: 'string', enum: ['portrait', 'landscape', 'both'] },
    problem: { type: 'string', description: 'what is wrong, concretely (what you saw where)' },
    why: { type: 'string', description: 'why it matters to a player / to the grade' },
    fix: { type: 'string', description: 'a concrete, implementable fix (sizes, layout, behaviour)' },
  },
  required: ['title', 'severity', 'screens', 'orientation', 'problem', 'why', 'fix'],
}
const REVIEW = {
  type: 'object',
  properties: {
    grade: { type: 'number', description: '1-10, one decimal allowed' },
    summary: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    issues: { type: 'array', items: ISSUE, description: 'ranked, most damaging first' },
  },
  required: ['grade', 'summary', 'strengths', 'issues'],
}

const LENSES = [
  {
    key: 'art',
    who: 'an art director for mobile board-game adaptations (ex-Asmodee Digital), obsessed with whether a digital adaptation captures the physical game\'s look and table presence',
    lens: 'VISUAL DESIGN & ART DIRECTION: does it look like the real Final Girl components on a table (not like an AI-generated dark app)? Typography, colour, hierarchy, consistency of the printed-cardstock language, board readability and clutter (labels, panic tiles, tokens), icon quality, how fun and characterful it is, anything that still looks generic or "AI-ish".',
  },
  {
    key: 'ux',
    who: 'a senior mobile UX designer who has shipped several top-grossing iOS games, an expert on one-thumb ergonomics and iPhone conventions',
    lens: 'MOBILE UX & ERGONOMICS: tap targets, thumb reach, safe areas, information density, legibility at arm\'s length, what is tappable and whether it reads as tappable, flow of each prompt (how many taps, is the next action obvious), sheets and dismissal, orientation support, iPhone SE fit, "iPhone app feel" vs "web page".',
  },
  {
    key: 'feel',
    who: 'a game designer specialised in solo board-game adaptations and game feel ("juice")',
    lens: 'GAME FEEL & CLARITY OF PLAY: does playing feel tactile and fun (card lift, dice, killer playback, reveals, hits, deaths, end screen)? Is game state legible (who is where, threats, time, horror, bloodlust, terror deck clock)? Are rules surfaced at the right moment? Does the Killer phase read as a dramatic sequence? Pacing of animations, feedback for every action.',
  },
]

phase('Review')
const reviews = await parallel(LENSES.map((l) => () => agent(`${CONTEXT}

YOU ARE ${l.who}. Review with this lens first and foremost (but note anything else serious): ${l.lens}
Play the live app for real, in both orientations, and read every screenshot. Return your own grade on the scale above, a short summary, the strengths worth keeping,
and a RANKED list of concrete issues (most damaging first, at least 10 if you can find them), each with a concrete implementable fix.`, { label: `review:${l.key}`, phase: 'Review', schema: REVIEW })))

const notes = reviews
  .map((r, i) => (r ? `### ${LENSES[i].key.toUpperCase()} reviewer — grade ${r.grade}\n${r.summary}\nStrengths: ${r.strengths.join(' | ')}\nIssues:\n${r.issues.map((x, j) => `${j + 1}. [${x.severity}] ${x.title} (${x.screens.join(', ')}; ${x.orientation}) — ${x.problem} WHY: ${x.why} FIX: ${x.fix}`).join('\n')}` : `### ${LENSES[i].key} reviewer — no result`))
  .join('\n\n')

phase('Grade')
const lead = await agent(`${CONTEXT}

YOU ARE THE LEAD CRITIC: a veteran game designer and UI critic who reviews mobile games professionally and has shipped board-game adaptations. Your grade is the one that counts.
Three specialist reviewers have already played it; their notes are below. Do your OWN pass first (look at the screenshots in ${shots} yourself and play the live app for a few turns
in both orientations), then weigh their notes: drop anything you can't confirm, merge duplicates, correct severities. Then give the OFFICIAL grade (1-10, one decimal) on the scale
above, a summary of where it stands versus a professional studio mobile game, the strengths to keep, and ONE RANKED LIST of issues (most damaging to the grade first; 12–25 items),
each with a concrete implementable fix. Also say, in "summary", what specifically would have to change to reach 8/10.

SPECIALIST NOTES:
${notes}`, { label: 'lead-critic', phase: 'Grade', schema: REVIEW })

return { round, lead, specialists: reviews.map((r, i) => (r ? { lens: LENSES[i].key, grade: r.grade, summary: r.summary } : null)) }
