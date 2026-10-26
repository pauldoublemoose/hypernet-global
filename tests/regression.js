/* Hypernet feed — end-to-end regression (usability rounds 1 and 2).
   Serve:  python3 -m http.server 8936 --bind 127.0.0.1 --directory <repo>
   Run:    npx -y -p playwright node tests/regression.js
   Browser: Playwright's own Chromium when it is installed; otherwise PW_CHROME=<chromium binary>; otherwise
            the newest Chromium found in the Playwright cache (~/Library/Caches/ms-playwright, ~/.cache/ms-playwright).
            If none is found it says how to get one (npx playwright install chromium-headless-shell).
   HN_URL=<url> points it at another server.
   HN_ROOT=<repo dir> serves that folder at http://hn.test/ through Playwright request routing instead: no port is bound,
            so it runs where localhost is off limits (sandboxes, CI).  e.g.  HN_ROOT=. npx -y -p playwright node tests/regression.js
   HN_NOW=<date-time> pins the browser's clock (default 2026-10-01T10:00:00, local); HN_NOW=real runs on the real clock.
            The app runs on the real date and moves its mock fixtures with it, so a pinned clock keeps the real events
            (data/real-events.json) where these checks expect them.
   Covers: open event → Going; create horizon → add events → customize → reload; new chat is a direct message;
   right-click → Add to horizon; long-press sheet; back/forward/reload restore; console errors, failed
   requests (404s) and horizontal overflow at 375 (touch), 768 and 1440; plus the round-2 majors: toasts vs the
   phone verb bar, private horizons, horizon as a desktop destination, volunteer shifts, safe Cancel/Discard;
   and the 2026-09-27 owner changes: the logged-out preview bar, one-view Home, the always-there sidebar;
   one button style on every event page; 2026-09-28: the reading pane closed to an empty pane (now: the window, below), event / horizon / person share one page template, uncustomised things are plain, a customised profile
   persists; and 2026-10-01: a look is three colours and a square image on the calm plain layout (no canvas art, nothing
   moves, nothing covers a control, text AA on every look), Customize shows exactly 3 colour inputs and 1 image upload (2026-10-05: 1 to 3, in Edit),
   an uploaded image shows in the page square and in list rows and survives reload, a too-faint text colour is
   corrected, bad files are refused, the profile photo comes from Edit profile, old looks migrate; and 2026-10-01 (v1): Home is the network's
   activity (newest first, an inverted call-out card, friends of friends, your own actions live at the top, the whole
   network when logged out or following nobody), Explore holds events / Event Horizons / call outs / people (old
   #/horizons and #/people land there), chat is person to person only; and 2026-10-01 (v1 social): a call out is in the
   strip or the stream, never both; a skill-matched call out from beyond your follows reaches a new account, saying why;
   following one person keeps "Around the network"; "Coming up with your people" is sorted by event date; your own day
   is one "You: …" line; lines group within three hours; @handle on name clashes; Who's going leads with people you
   follow and "and N more" opens everyone; Explore says who you follow is going; Answer opens the call out with its reply
   box focused (a textarea: Enter posts, Shift+Enter new line), no chat is made, and the poster sees the reply; New call out defaults to
   the event you are on; no role=button around buttons on Home; whole call-out tiles with the dock and pane open; and 2026-10-01 (trust): the app runs on today's
   date, "Only me" / Friends events are seen only by who may, joined accounts are people to everyone, expired call outs
   are closed, non-hex colours and non-picture images fall back to plain, storage writes on change and warns once; and
   2026-10-04 (navigation): every desktop list opens with an empty reading pane and ↓ starts from nothing (old ?pane=closed
   links still land there), the list frame's left edge is never covered on Home and Coming-up dates are centred, Explore's
   overview is squares at every width with its kinds and old section links intact, Add events has six filters with counts
   and empty states, and the New event wizard won't go on until a step has what it needs (inline, never a toast);
   2026-10-04 (conversations): replies under a call out (thread, Home tile count and latest replies, "X replied to" on
   Home, delete your own, the poster deletes any), an event with no call outs has no Call outs heading and its host has
   New call out in the toolbar (event preselected), a profile opened from a chat is a window with a close that leaves
   the chat as it was (1440, 768, 375), a conversation keeps its place (dock on desktop / tablet, the Chats tab on a
   phone: same chat, draft and scroll after Home and after a reload), and Share copies the item's link;
   2026-10-04 (B2, "windows"): no reading pane — the list is one centred 680 column, and whatever you open is one window
   over it (a pick opens it, another pick replaces it, ×, Esc and back close it, forward and reload bring it back, the
   title bar drags it inside the main area, □ / double-click maximise and restore, things opened inside it stack with ‹),
   it fits between the sidebar and the chat dock and whichever was touched last is in front, a phone's window is a
   full-screen sheet whose × and back gesture return to the feed where it was; Home steps its call outs one at a time in
   their band, Coming up rows are 48 squares with the date at the right, the social line is words, and an event's call
   out carries its latest replies (2026-10-05: no box there; Answer opens the call out, no chat). Older checks that spoke of the
   reading pane, the empty pane, ?pane=closed and the call-out strip now say the same things of the window;
   2026-10-04 (layout): logged out there is no Home (Explore is the landing, no Home row or tab, #/home lands on Explore
   without ever drawing Home; logging in from the landing goes Home), the white spans the centre and each view sits in
   its container (Home 640, lists 720, Explore's overview and the calendar 1120, the heading on its edge), Explore's
   overview is one row of whole squares per section, and the window steps the list aside (beside it at 1280, 1440 with
   and without the dock and 1920, the list whole and clickable; over the centre only where both can't fit), with no
   overflow at 1920 either. Checks that spoke of Home logged out now use an account that follows nobody;
   2026-10-05 (v5-homechats): Home starts with what happened and ends with what it is and how to see more (Find people,
   All events) — the whole page only when nothing is above it, never "nothing happened" under activity (offline, and
   online on a mocked /api/bootstrap: only your own row, following a quiet person, nothing at all); an empty chat list
   says "No chats yet" and how a chat starts, over the people to message when there are any;
   2026-10-05 (v5-calendar): the List / Calendar switch keeps one place at the top right in both views (the heading's right
   end at 1280, 1440, 1920 and 768 — a list with a calendar keeps the calendar's slot — and the phone's app bar), ‹ Today ›
   lead the calendar's bar and never move with the title, a narrow month's events are readable titled lines, and a narrow
   day is a page of its own (one event opens straight away, an empty day is just a date; back, forward, reload, ‹ month,
   a cold link with its month underneath);
   2026-10-05 (v5-editlook): One Edit — your Event Horizon's toolbar is Add events · Edit · Share · ⋯ (Delete only; no
   Publish that turns into Share, no Published ✓), Share on a private one explains and offers to make it public, Edit
   holds name, description, Private / Public, picture and colours in one save; an event you host has one Edit (no
   Customize; the phone's bar Edit · Call out · ⋯) of sections; your page has one Edit profile whose look controls save
   with Done; the whole page wears its look
   (ground, band, hairlines, labels, accent) while its toolbar stays chrome; one to three colours (Add accent, Add header
   colour, each removable) and the text is never picked — AA on light, dark, neon, mid-grey and 2–3 colour pages, a
   mid-tone moves off the middle and says so, looks saved before picks still render; your own avatar wears your look
   after Neon and your account id reads it too; the New event wizard has one primary at a time on one row (Next, Next,
   Publish event), short tabs, legible waiting buttons, and × keeps the draft with Discard in the toast;
   2026-10-05 (v5-callout): a call out's page is the call out (its band holds the ask, the event, who and until when; no
   card inside, one short line at most, Edit · Close / Answer · Share), the icon is a megaphone and both new icons stay in
   their box, an event's call out says "No replies yet" (no box; Answer / Reply open the call out, box focused), and on a
   phone the reply box keeps focus as the keyboard shrinks the viewport and through a redraw;
   2026-10-05 (v5-feed): your own actions keep their time — one "You: …" line per sitting (within 30 minutes, nothing
   else between), in its band among everyone's (the owner's morning replayed online); "N people joined Hypernet" once
   per band, never you, the near ones first with Follow, See who's new → Explore → People newest first; an event
   picking up ("4 people decided to go to … this week") once per band with Who's going;
   2026-10-05 (v5-whosgoing): Who's going always has someone or a sentence in it — when no one going is known by name
   (only a count) it says "18 people are going" and shows who is interested (the ones you follow first), never a bare
   "and N more"; a few going (none followed), some followed and many going still show people (offline and online).;
   2026-10-05 (v5-retro): the Windows scrollbar (arrow buttons with black triangles, read from the pixels) flush inside
   the white's 2px frame, nothing painted over it, native overlay bars on a phone; no space above the first band in any
   list; bands are a grey line on the white (sticky, one line, never two); your "You: …" rows unfilled like every entry;
   a long title in a sentence flows as words (", followed Sebastian" right after it) and opens with Enter. */
let chromium;
try { ({ chromium } = require('playwright')); } catch(e){
  try { ({ chromium } = require('playwright-core')); } catch(e2){
    console.error('Needs Playwright: run it as  npx -y -p playwright node tests/regression.js'); process.exit(2);
  }
}
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = process.env.HN_ROOT ? path.resolve(process.env.HN_ROOT) : null;
const URL = process.env.HN_URL || (ROOT ? 'http://hn.test/' : 'http://127.0.0.1:8936/');
const NOWPIN = process.env.HN_NOW === 'real' ? null : new Date(process.env.HN_NOW || '2026-10-01T10:00:00');
const TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon',
                '.jpg':'image/jpeg', '.webp':'image/webp' };
/* HN_ROOT: answer every request to the test origin from the folder on disk */
async function serveRoot(route){
  const u = new (require('url').URL)(route.request().url());
  let f = path.join(ROOT, decodeURIComponent(u.pathname));
  if (f.endsWith(path.sep) || f.endsWith('/')) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status:404, body:'not found' });
  return route.fulfill({ status:200, contentType:TYPES[path.extname(f)] || 'application/octet-stream', body:fs.readFileSync(f) });
}
const SHOTS = path.join(os.tmpdir(), 'hypernet-shots');
fs.mkdirSync(SHOTS, { recursive: true });

/* any Chromium Playwright has downloaded before, newest first */
function cachedChromes(){
  var roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, path.join(os.homedir(), 'Library/Caches/ms-playwright'), path.join(os.homedir(), '.cache/ms-playwright')].filter(Boolean);
  var bins = [];
  roots.forEach(function(r){
    var dirs; try { dirs = fs.readdirSync(r); } catch(e){ return; }
    dirs.filter(function(d){ return /^chromium(_headless_shell)?-\d+$/.test(d); })
      .sort(function(a, b){ return +b.split('-').pop() - +a.split('-').pop(); })
      .forEach(function(d){
        ['chrome-headless-shell-mac-arm64/chrome-headless-shell', 'chrome-headless-shell-mac-x64/chrome-headless-shell',
         'chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/chrome', 'chrome-linux64/chrome',
         'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
         'chrome-mac/Chromium.app/Contents/MacOS/Chromium'].forEach(function(b){ var f = path.join(r, d, b); if (fs.existsSync(f)) bins.push(f); });
      });
  });
  return bins;
}
let browser;
async function launch(){
  if (browser) return browser;
  var tries = [process.env.PW_CHROME || undefined].concat(process.env.PW_CHROME ? [] : cachedChromes());
  for (var i = 0; i < tries.length; i++){
    /* scrollbars painted (headless hides them by default): the v5-retro checks look at the Windows bar's pixels */
    try { browser = await chromium.launch({ executablePath: tries[i], args: ['--no-sandbox'], ignoreDefaultArgs: ['--hide-scrollbars'] }); if (tries[i]) console.log('browser: ' + tries[i]); return browser; }
    catch(e){ if (i === tries.length - 1){
      console.error('No Chromium to run. Install one with  npx playwright install chromium-headless-shell  or set PW_CHROME=<path>.\n' + String(e.message).split('\n')[0]);
      process.exit(2);
    } }
  }
}
const PHONE = { viewport:{ width:375, height:812 }, hasTouch:true, isMobile:true, deviceScaleFactor:2,
  userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0 Mobile Safari/537.36' };
const DESK = { viewport:{ width:1440, height:900 } };
const TAB = { viewport:{ width:768, height:1024 }, hasTouch:true };
async function ctx(kind, opts){
  const b = await launch();
  const c = await b.newContext(Object.assign({}, kind === 'phone' ? PHONE : kind === 'tab' ? TAB : DESK, opts || {}));
  /* the product default is Y2Fresh; these checks describe the Windows look, so pin it before first paint */
  await c.addInitScript(() => { try { localStorage.setItem('hypernet-theme', 'win2k'); } catch (e) {} });
  if (ROOT) await c.route(new (require('url').URL)(URL).origin + '/**', serveRoot);
  if (NOWPIN) await c.clock.install({ time:NOWPIN });
  const p = await c.newPage();
  p.errors = [];
  p.on('console', m => { if (m.type() === 'error') p.errors.push(m.text()); });
  p.on('pageerror', e => p.errors.push('PAGEERROR ' + e.message));
  p.on('response', r => { if (r.status() >= 400) p.errors.push(r.status() + ' ' + r.url()); });
  return p;
}
async function open(p, hash, clear){
  await p.goto(URL + (hash || ''));
  if (clear){ await p.evaluate(() => localStorage.clear()); await p.goto(URL + (hash || '')); }
  await p.waitForTimeout(400);
}
async function overflow(p){ return p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); }
/* 2026-10-04 (B2): whatever you open is in one window over the list. Clicks on a list go where the list shows: its
   left part, which the window (by default over the list's right) leaves in view */
async function pick(p, sel){ await p.click(sel, { position:{ x:6, y:6 } }); }
const winState = p => p.evaluate(() => { const w = document.getElementById('win'), r = w.getBoundingClientRect(), m = document.getElementById('main').getBoundingClientRect();
  return { open:!w.hidden, stack:S.stack.length, top:S.stack.length ? S.stack[S.stack.length - 1].type + ':' + S.stack[S.stack.length - 1].id : '', hash:location.hash,
           x:Math.round(r.left), y:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height), inside:w.hidden || (r.left >= m.left - 1 && r.top >= m.top - 1 && r.right <= m.right + 1 && r.bottom <= m.bottom + 1),
           title:(document.getElementById('wtitle') || {}).textContent || '' }; });
/* 2026-10-04 (layout): where the white and the view's container sit. panelL / panelR: the white's distance from the sidebar
   and from the dock (or the main area's edge); cw: the container's width; cl / cr: its insets in the white (cr counts the
   list's scrollbar, sb); head: the heading's offset from the container's edge (2026-10-05: 0 — the heading stands on the
   white's left edge, which is the container's). 2026-10-05 (v5-retro): the white is framed by a 2px border (fr) with the
   scrollbar inside it, so panelW, cl and cr are measured inside the frame (the white itself) */
const geoOf = p => p.evaluate(() => {
  const app = document.getElementById('app'), cal = app.classList.contains('v-cal'), lb = document.getElementById('listbody'), cp = document.querySelector('#calcol .calpanel');
  const panel = (cal ? cp : document.getElementById('listcol')).getBoundingClientRect(), nav = document.getElementById('nav').getBoundingClientRect();
  const dock = document.getElementById('chats'), m = document.getElementById('main').getBoundingClientRect();
  const edge = dock.offsetParent && !app.classList.contains('dock-over') ? dock.getBoundingClientRect().left : m.right;
  let left, right, sb = 0, fr = 0;
  if (cal){ const r = cp.getBoundingClientRect(), cs = getComputedStyle(cp); fr = cp.clientLeft; left = r.left + fr + parseFloat(cs.paddingLeft) - 16; right = r.left + fr + cp.clientWidth - parseFloat(cs.paddingRight) + 16; }
  else { const r = lb.getBoundingClientRect(), cs = getComputedStyle(lb); fr = lb.clientLeft; sb = lb.offsetWidth - lb.clientWidth - 2 * fr; left = r.left + fr + parseFloat(cs.paddingLeft); right = r.left + fr + lb.clientWidth - parseFloat(cs.paddingRight); }
  const h2 = document.querySelector('#chead h2').getBoundingClientRect();
  return { panelL:Math.round(panel.left - nav.right), panelR:Math.round(edge - panel.right), panelW:Math.round(panel.width - 2 * fr), sb, fr, cw:Math.round(right - left),
           cl:Math.round(left - panel.left - fr), cr:Math.round(panel.right - fr - right), head:Math.round(h2.left - left + fr), win:L.win || '' };
});
async function shot(p, name){ await p.screenshot({ path: path.join(SHOTS, name + '.png') }); }
let fails = 0;
function ok(cond, msg){ console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; }
async function done(){ if (browser) await browser.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exitCode = fails ? 1 : 0; }

const ev = (p, f, a) => p.evaluate(f, a);
/* an account of its own that follows nobody, beside the one 'me' account join() makes (2026-10-04: Home is for accounts only) */
const guest = (p, name, handle) => p.evaluate(([n, h]) => { ACCTS[h] = blankAcct({ displayName:n, handle:h, bio:'', skills:[], cities:[], city:'' }); useAcct(h); }, [name, handle]).then(() => p.waitForTimeout(350));
async function join(p, name, handle){
  await p.evaluate(() => loginDialog()); await p.waitForTimeout(150);
  await p.fill('#pf-name', name); await p.fill('#pf-handle', handle); await p.click('#pfsave'); await p.waitForTimeout(300);
}
/* the New event wizard filled the way a host has to (2026-10-04): Basics, Next, About; then Next, Publish unless told not to */
async function answerHost(c, who, when){
  who = who || 'mine'; when = when || 'upcoming';
  if (!(await c.$('.dlg [data-act="hostask"][data-id="' + who + '"]'))) return false;
  await c.click('.dlg [data-act="hostask"][data-id="' + who + '"]');
  await c.click('.dlg [data-act="hostwhen"][data-id="' + when + '"]');
  await c.click('.dlg [data-act="hostask-go"]');
  await c.waitForTimeout(220);
  return true;
}
async function newEvent(c, o){
  await c.evaluate(() => newEventDialog()); await c.waitForTimeout(200);
  await answerHost(c, 'mine', 'upcoming');
  await c.fill('#w-t', o.title); await c.fill('#w-d', o.date);
  if (o.online) await c.check('#w-on'); else await c.fill('#w-c', o.city || 'Brno');
  if (o.privacy) await c.selectOption('#w-p', o.privacy);
  await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]'); await c.waitForTimeout(200);
  await c.fill('#w-desc', o.desc || 'A slow evening with friends.');
  /* 2026-10-05: Publish event is the Look step's one primary (Next, Next, Publish event) */
  if (o.publish !== false){ await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]'); await c.waitForTimeout(200);
                            await c.click('.dlg .dfoot [data-act="wiz"][data-id="finish"]'); await c.waitForTimeout(500); }
}
async function overflowEverywhere(p, label){
  const worst = [];
  for (const h of ['#/home', '#/explore', '#/explore/events?view=calendar', '#/explore/horizons', '#/explore/callouts', '#/explore/people', '#/event/borderland-2027', '#/event/burning-man-2027', '#/horizon/season', '#/person/anna', '#/callout/sound', '#/search?q=sound', '#/explore/soon', '#/chats']){
    await p.goto(URL + h); await p.waitForTimeout(350);
    const o = await overflow(p); if (o > 0) worst.push(h + ':' + o);
  }
  ok(!worst.length, label + ': no horizontal overflow on 14 screens ' + worst.join(' '));
}
(async () => {
  /* ---------------- phone ---------------- */
  const p = await ctx('phone');
  await open(p, '', true);
  // open event → Going (logged out → join → Going on), from a square on Explore, where a visitor lands
  await p.tap('#listbody .srow .card2 >> nth=0'); await p.waitForTimeout(250);
  const e1 = await ev(p, () => S.stack[0].id);
  await p.tap('#evbar [data-act="v-going"]'); await p.waitForTimeout(200);
  await p.fill('#pf-name', 'Leo Park'); await p.fill('#pf-handle', 'leo'); await p.tap('#pfsave'); await p.waitForTimeout(300);
  ok(await ev(p, id => RSVP[id] === 'going' && document.querySelector('#evbar [data-act="v-going"]').classList.contains('on'), e1), 'phone: open event → Going (via Join)');
  /* the window is a sheet over the whole screen; × closes it, the feed behind kept its place */
  ok(await ev(p, () => { const w = document.getElementById('win').getBoundingClientRect(); return !document.getElementById('win').hidden && w.top <= 0 && w.width >= innerWidth - 1 && w.bottom >= innerHeight - 1; }), 'phone: an event opens as a full-screen sheet');
  await p.tap('#dbar [data-act="closewin"]'); await p.waitForTimeout(250);
  ok(await ev(p, () => document.getElementById('win').hidden && !S.stack.length), 'phone: × closes the sheet');
  // create horizon → add events → customize → reload
  await p.tap('[data-act="newsheet"]'); await p.waitForTimeout(150);
  await p.tap('.sheetrow[data-id="new-horizon"]'); await p.waitForTimeout(200);
  await p.fill('#nh-n', 'Autumn builds'); await p.tap('#nh-go'); await p.waitForTimeout(300);
  const hz = await ev(p, () => S.stack[0].id);
  await p.tap('#dscroll [data-act="addevents"]'); await p.waitForTimeout(250);
  await p.evaluate(() => { [...document.querySelectorAll('#pk-list input[data-act="pkpick"]')].slice(0, 3).forEach(i => i.click()); });
  await p.tap('.dlg [data-act="pkdone"]'); await p.waitForTimeout(250);
  ok(await ev(p, h => HORIZONS[h].eventIds.length === 3, hz), 'phone: horizon filled with 3 events');
  /* 2026-10-05: the horizon's look is in its one Edit; one colour colours the page */
  await p.tap('#dscroll [data-act="edithz"]'); await p.waitForTimeout(250);
  await p.fill('#cz-c1', '#000000'); await p.waitForTimeout(150);
  await p.tap('.dlg [data-act="wiz"][data-id="finish"]'); await p.waitForTimeout(250);
  await p.reload(); await p.waitForTimeout(700);
  ok(await ev(p, h => HORIZONS[h] && HORIZONS[h].eventIds.length === 3 && HZTHEME[h] && HZTHEME[h].bg === '#000000' && S.stack[0].id === h && !!document.querySelector('#dscroll .pg-horizon:not(.plain)'), hz), 'phone: horizon, its events and its look survive reload, page restored');
  // new chat: one person, straight into the conversation; nothing in it can make a group
  await p.tap('#dbar [data-act="closewin"]'); await p.waitForTimeout(250);
  await p.tap('[data-act="newsheet"]'); await p.waitForTimeout(150);
  await p.tap('.sheetrow[data-id="newchat"]'); await p.waitForTimeout(200);
  ok(await ev(p, () => !document.querySelector('.dlg input[type="checkbox"], #nc-name') && !/group/i.test(document.querySelector('.dlg').textContent) &&
     document.querySelectorAll('#nc-list [data-act="ncdm"]').length >= 5), 'phone: New chat picks one person (no group name, no multi-select)');
  await p.tap('#nc-list [data-act="ncdm"][data-id="p-kai"]'); await p.waitForTimeout(300);
  await p.fill('#chatbox', 'who has the van'); await p.tap('[data-act="sendchat"]'); await p.waitForTimeout(200);
  ok(await ev(p, () => /Kai Okonkwo/.test(document.getElementById('appbar').textContent) && Object.keys(CHATS).every(k => CHATS[k].kind === 'dm' && CHATS[k].memberIds.length === 1)),
     'phone: the chat with Kai is open, and every chat is a direct message');
  // long-press sheet (Explore's overview keeps the old Home shelves)
  await p.goto(URL + '#/explore'); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('.srow[data-shelf="announced"]').scrollIntoView({ block:'center' })); await p.waitForTimeout(300);
  const box = await p.locator('.srow[data-shelf="announced"] .card2').first().boundingBox();
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{ x:box.x + 40, y:box.y + 40 }] });
  await p.waitForTimeout(650);
  await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] }); await p.waitForTimeout(450);
  ok(await ev(p, () => !!document.querySelector('.ctxsheet')), 'phone: long-press opens the sheet');
  await p.tap('.ctxsheet .sheetrow:has-text("Add to horizon")'); await p.waitForTimeout(200);
  await p.tap('.ctxsheet .sheetrow:has-text("Autumn builds")'); await p.waitForTimeout(250);
  ok(await ev(p, h => HORIZONS[h].eventIds.length === 4, hz), 'phone: long-press → Add to horizon adds it');
  // back / forward / reload restore
  await p.tap('.srow[data-shelf="soon"] .card2 >> nth=2'); await p.waitForTimeout(250);
  await p.goto(URL + '#/event/burning-man-2027'); await p.waitForTimeout(500);
  await p.evaluate(() => { document.getElementById('dscroll').scrollTop = 1500; }); await p.waitForTimeout(350);
  const h2 = await ev(p, () => location.hash);
  await p.goBack(); await p.waitForTimeout(300);
  ok(await ev(p, () => /^#\/event\//.test(location.hash) && location.hash !== '#/event/burning-man-2027'), 'phone: back to the previous event');
  await p.goForward(); await p.waitForTimeout(300);
  ok(await ev(p, h => location.hash === h && document.getElementById('dscroll').scrollTop === 1500, h2), 'phone: forward restores the event and its scroll');
  await p.reload(); await p.waitForTimeout(700);
  ok(await ev(p, h => location.hash === h && document.getElementById('dscroll').scrollTop === 1500, h2), 'phone: reload restores it too');
  await overflowEverywhere(p, 'phone 375');
  console.log('phone errors', p.errors); ok(!p.errors.length, 'phone: no console errors');

  /* ---------------- desktop ---------------- */
  const d = await ctx('desk');
  await open(d, '', true);
  await pick(d, '#listbody .srow .card2 >> nth=1'); await d.waitForTimeout(200);
  const e2 = await ev(d, () => S.stack[0].id);
  await join(d, 'Jonas Berg', 'jonas');
  await d.click('#dscroll .actbar [data-act="v-going"]'); await d.waitForTimeout(200);
  ok(await ev(d, id => RSVP[id] === 'going', e2), 'desktop: open event → Going');
  await d.evaluate(() => runCmd('new-horizon')); await d.waitForTimeout(150);
  await d.fill('#nh-n', 'Driftwood'); await d.click('#nh-go'); await d.waitForTimeout(300);
  const dh = await ev(d, () => S.stack[0].id);
  await d.click('#dscroll [data-act="addevents"]'); await d.waitForTimeout(250);
  await d.fill('#pk-q', 'decompression'); await d.waitForTimeout(150);
  await d.evaluate(() => { [...document.querySelectorAll('#pk-list input[data-act="pkpick"]')].slice(0, 2).forEach(i => i.click()); });
  await d.click('.dlg [data-act="pkdone"]'); await d.waitForTimeout(250);
  await d.click('#dscroll [data-act="edithz"]'); await d.waitForTimeout(250);
  await d.click('.dlg [data-czact="start"][data-i="3"]'); await d.waitForTimeout(150);
  await d.click('.dlg [data-act="wiz"][data-id="finish"]'); await d.waitForTimeout(250);
  await d.reload(); await d.waitForTimeout(700);
  ok(await ev(d, h => HORIZONS[h].eventIds.length === 2 && !!HZTHEME[h] && !!document.querySelector('#dscroll .pg-horizon:not(.plain)') && S.stack[0].type === 'horizon' && S.stack[0].id === h, dh), 'desktop: horizon + events + look survive reload (in its window)');
  // right-click → Add to horizon
  await d.goto(URL + '#/explore/events'); await d.waitForTimeout(500);
  /* a row from the 4th on that is not on the horizon yet */
  const ti = await ev(d, h => [...document.querySelectorAll('#listbody .row[data-type="event"]')].findIndex((r, i) => i >= 3 && HORIZONS[h].eventIds.indexOf(r.getAttribute('data-id')) < 0), dh);
  const target = await ev(d, i => document.querySelectorAll('#listbody .row[data-type="event"]')[i].getAttribute('data-id'), ti);
  await d.click('#listbody .row[data-type="event"] >> nth=' + ti, { button:'right' }); await d.waitForTimeout(150);
  await d.hover('.ctxmenu .ci:has-text("Add to horizon")'); await d.waitForTimeout(350);
  await d.click('.ctxmenu >> nth=1 >> .ci:has-text("Driftwood")'); await d.waitForTimeout(250);
  ok(await ev(d, ([h, t]) => HORIZONS[h].eventIds.indexOf(t) >= 0, [dh, target]), 'desktop: right-click → Add to horizon');
  // new chat in the dock: one person; the list keeps its column
  await d.evaluate(() => runCmd('newchat')); await d.waitForTimeout(150);
  ok(await ev(d, () => !document.querySelector('.dlg input[type="checkbox"], #nc-name') && !/create group/i.test(document.querySelector('.dlg').textContent)), 'desktop: New chat cannot make a group');
  await d.click('#nc-list [data-act="ncdm"][data-id="p-rio"]'); await d.waitForTimeout(300);
  ok(await ev(d, () => S.rightOpen && CHATS[S.chatOpen] && CHATS[S.chatOpen].kind === 'dm' && CHATS[S.chatOpen].memberIds[0] === 'p-rio' && document.getElementById('listcol').offsetWidth >= 400), 'desktop: new chat with Rio in the dock, the list keeps its column');
  // back / forward / reload
  await pick(d, '#listbody .row[data-type="event"] >> nth=5'); await d.waitForTimeout(200);
  const h3 = await ev(d, () => location.hash);
  await pick(d, '#listbody .row[data-type="event"] >> nth=6'); await d.waitForTimeout(200);
  await d.goBack(); await d.waitForTimeout(300);
  ok(await ev(d, h => location.hash === h, h3), 'desktop: back');
  await d.goForward(); await d.waitForTimeout(300); await d.goBack(); await d.waitForTimeout(300);
  await d.reload(); await d.waitForTimeout(700);
  ok(await ev(d, h => location.hash === h && !!document.querySelector('#listbody .row.sel') && S.rightOpen, h3), 'desktop: reload restores selection and the dock');
  await overflowEverywhere(d, 'desktop 1440');
  console.log('desk errors', d.errors); ok(!d.errors.length, 'desktop: no console errors');

  /* ---------------- round 2 majors ---------------- */
  // CREW-R2-1: toasts sit above the phone's verb bar; a late tap where a toast button was never sets Going
  const r = await ctx('phone');
  await open(r, '#/event/led-forest-walk', true);
  await r.evaluate(() => loginDialog()); await r.waitForTimeout(150);
  await r.tap('.dlg [data-act="useacct"][data-id="demo"]'); await r.waitForTimeout(300);
  await r.tap('#evbar [data-act="v-interested"]'); await r.waitForTimeout(150);
  ok(await ev(r, () => document.querySelector('#toasts .toast').getBoundingClientRect().bottom <= document.getElementById('evbar').getBoundingClientRect().top), 'R2: toast sits above the phone verb bar');
  /* Share in the ⋯ sheet copies the link (no clipboard API on this origin: the hidden-field fallback) */
  await r.evaluate(() => { window.__exec = []; Object.defineProperty(navigator, 'clipboard', { value:undefined, configurable:true }); document.execCommand = function(cmd){ window.__exec.push([cmd, (document.activeElement || {}).value]); return true; }; });
  await r.tap('#evbar [data-act="share"]'); await r.waitForTimeout(250);
  ok(await ev(r, () => window.__exec.length === 1 && window.__exec[0][0] === 'copy' && window.__exec[0][1] === linkOf('event', 'evt-fill-3') && /Link copied/.test(document.getElementById('toasts').textContent) && !DLGS.length),
     'R2: phone ⋯ → Share copies the event\'s link, without a clipboard API (fallback)');
  /* a toast with a button (Undo), then a late tap where its button was */
  await r.evaluate(() => toast('Reply deleted', '', function(){}));
  const tb = await r.locator('#toasts [data-act="toastundo"]').boundingBox();
  await r.waitForTimeout(6200);
  const rs = await ev(r, () => RSVP['evt-fill-3'] || null);
  await r.touchscreen.tap(tb.x + tb.width / 2, tb.y + tb.height / 2); await r.waitForTimeout(250);
  ok(await ev(r, b => (RSVP['evt-fill-3'] || null) === b, rs), 'R2: a late tap on a vanished toast button changes no RSVP');
  // CREW-R2-2: a volunteer shift can be taken
  await r.goto(URL + '#/event/temple-volunteer-shift'); await r.waitForTimeout(500);
  await r.evaluate(() => document.querySelector('[data-act="takeshift"][data-i="2"]').scrollIntoView({ block:'center' }));
  await r.tap('[data-act="takeshift"][data-i="2"]'); await r.waitForTimeout(200);
  ok(await ev(r, () => SHIFT['evt-fill-5'] === 2 && RSVP['evt-fill-5'] === 'going' && !/Pick a shift/.test(document.body.innerText)), 'R2: taking a shift sets Going with that shift');
  // PHONEBROWSER-R2-1: Cancel keeps a draft; Discard is not where Cancel is, and can be undone
  await r.evaluate(() => runCmd('new-callout')); await r.waitForTimeout(200);
  await r.fill('#co-t', 'Two builders'); await r.waitForTimeout(100);
  ok(await ev(r, () => document.querySelector('.dlg .dfoot .btn').textContent.trim() === 'Cancel' && !!document.querySelector('.dlg .dbar [data-act="discarddraft"]')), 'R2: Cancel in the footer, Discard in the title bar');
  await r.tap('.dlg .dfoot [data-act="closedlg"]'); await r.waitForTimeout(250);
  ok(await ev(r, () => FORMDRAFTS.callout && FORMDRAFTS.callout['co-t'] === 'Two builders'), 'R2: Cancel keeps the draft');
  console.log('r2 phone errors', r.errors); ok(!r.errors.length, 'R2 phone: no console errors');
  // ORGANISER-R2-1 / -2: a private horizon offers Publish, not Share; it opens in the window, its sidebar row marked
  const o = await ctx('desk');
  await open(o, '', true);
  await join(o, 'Jonas Berg', 'jonas');
  await o.evaluate(() => runCmd('new-horizon')); await o.waitForTimeout(150);
  await o.fill('#nh-n', 'Driftwood crew season'); await o.click('#nh-go'); await o.waitForTimeout(300);
  ok(await ev(o, () => S.stack[0].type === 'horizon' && !document.getElementById('win').hidden && document.querySelectorAll('#navbody .nrow.sel').length === 1 && document.querySelectorAll('#navbody .nrow.open').length === 1),
     'R2: a new horizon opens in the window; one sidebar row lit (the list), its own row marked open');
  /* 2026-10-05: no Publish button that turns into Share — Edit holds who can see it, Share is always Share */
  ok(await ev(o, () => !!document.querySelector('#dscroll [data-act="edithz"]') && !!document.querySelector('#dscroll [data-act="share"]') && !document.querySelector('#dscroll [data-act="publishhz"]')),
     'R2: a private horizon has Edit and Share, no Publish button');
  const priv = await ev(o, () => location.hash);
  const x = await ctx('desk');
  await open(x, priv, true);
  ok(await ev(x, () => /private or no longer here/.test(document.body.innerText) && location.hash.indexOf('#/horizon/') === 0), 'R2: its link elsewhere says it is private, not a silent redirect');
  console.log('r2 desk errors', o.errors, x.errors); ok(!o.errors.length && !x.errors.length, 'R2 desktop: no console errors');

  /* ---------------- owner feedback 2026-09-27: preview bar, one-view Home, fixed sidebar ---------------- */
  const rb = (pg, sel) => ev(pg, s => { const e = document.querySelector(s); if (!e || !e.offsetParent) return null; const r = e.getBoundingClientRect(); return { top:r.top, bottom:r.bottom, w:r.width }; }, sel);
  for (const [kind, w, h] of [['phone', 375, 812], ['tab', 768, 1024], ['desk', 1280, 800], ['desk', 1440, 900]]){
    const f = await ctx(kind, kind === 'desk' ? { viewport:{ width:w, height:h } } : {});
    await open(f, '', true);
    const pb = await rb(f, '#previewbar');
    ok(!!pb && Math.abs(pb.w - w) < 2 && await ev(f, () => (() => { const b = [...document.querySelectorAll('#previewbar button')]; return b.length === 1 && b[0].textContent.trim() === 'Join or log in'; })()), w + ': logged out, the preview bar spans the bottom with one button, Join or log in');
    /* 2026-10-04: logged out there is no Home — an old Home link lands on Explore */
    await f.goto(URL + '#/home?view=calendar'); await f.waitForTimeout(400);
    ok(await ev(f, () => location.hash === '#/explore' && S.folder.kind === 'explore' && !document.getElementById('app').classList.contains('v-cal')), w + ': logged out, an old #/home?view=calendar link lands on Explore');
    await f.evaluate(() => { const l = document.getElementById('listbody'); l.scrollTop = l.scrollHeight; }); await f.waitForTimeout(150);
    const last = await ev(f, () => { const els = document.querySelectorAll('#listbody .row, #listbody .card2, #listbody .fitem, #listbody .fend'); return els.length ? els[els.length - 1].getBoundingClientRect().bottom : 0; });
    ok(last <= (await rb(f, '#previewbar')).top + 1, w + ': the last row/card is above the preview bar');
    if (kind === 'phone'){
      /* 2026-10-05 (v5-shell): logged out a phone has no tabs; the preview bar is the foot (was: directly above the tab bar) */
      ok(!(await rb(f, '#tabbar')) && Math.abs((await rb(f, '#previewbar')).bottom - 812) < 1, 'phone: logged out there is no tab bar; the preview bar is the foot of the screen');
      await f.goto(URL + '#/event/led-forest-walk'); await f.waitForTimeout(400);
      ok((await rb(f, '#evbar')).bottom <= (await rb(f, '#previewbar')).top + 1, 'phone: the event verb bar is not covered by the preview bar');
      await f.evaluate(() => toast('Test', 'toast')); await f.waitForTimeout(100);
      ok((await rb(f, '#toasts .toast')).bottom <= (await rb(f, '#evbar')).top + 1, 'phone: toasts stack above both bars');
      await f.evaluate(() => useAcct('demo')); await f.waitForTimeout(300);
      await f.goto(URL + '#/home?view=calendar'); await f.waitForTimeout(400);
      ok(await ev(f, () => location.hash === '#/home' && !document.getElementById('app').classList.contains('v-cal') && !document.querySelector('#chead .seg')), 'phone: logged in, an old #/home?view=calendar link lands on Home, which has no view switch');
    } else {
      ok(await ev(f, () => !document.getElementById('tg-left') && document.getElementById('nav').getBoundingClientRect().width >= 190), w + ': sidebar always visible, no toggle');
      await join(f, 'Mia Lind', 'mialind');
      ok(!(await rb(f, '#previewbar')), w + ': the preview bar goes once logged in');
      await f.goto(URL + '#/home?view=calendar'); await f.waitForTimeout(400);
      ok(await ev(f, () => location.hash === '#/home' && !document.getElementById('app').classList.contains('v-cal') && !document.querySelector('#chead .seg')), w + ': logged in, an old #/home?view=calendar link lands on Home, which has no view switch');
      await f.evaluate(() => doLogout()); await f.waitForTimeout(200);
      await f.evaluate(() => loginDialog()); await f.waitForTimeout(150);
      await f.click('.dlg [data-act="useacct"][data-id="demo"]'); await f.waitForTimeout(300);
      await f.click('#tg-right'); await f.waitForTimeout(200);
      await f.click('.chrow[data-id="c-kai"]'); await f.waitForTimeout(200);
      ok(await ev(f, () => document.getElementById('nav').getBoundingClientRect().width >= 190 && !!document.querySelector('#chats .conv')), w + ': sidebar stays with the chat dock open');
      /* open an event: its window sits between the sidebar and the dock, covering neither */
      if (w >= 1280){ await pick(f, '#listbody .fev .fct >> nth=0'); await f.waitForTimeout(250); }
      if (w >= 1280) ok(await ev(f, () => { const wr = document.getElementById('win').getBoundingClientRect(), dk = document.getElementById('chats').getBoundingClientRect(), nv = document.getElementById('nav').getBoundingClientRect();
        return !document.getElementById('win').hidden && S.stack.length === 1 && wr.width >= 440 && wr.left >= nv.right && wr.right <= dk.left; }), w + ': the window opens between the sidebar and the chat dock');
    }
    ok((await overflow(f)) <= 0, w + ': no overflow');
    console.log(w + ' feedback errors', f.errors); ok(!f.errors.length, w + ': no console errors');
  }

  /* ---------------- controls are system chrome: the same button on every event page ---------------- */
  const KEYS = ['height','fontFamily','fontSize','fontWeight','color','backgroundColor','boxShadow','borderTopWidth','borderRadius'];
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    const sigs = {};
    for (const sl of ['burning-man-2027', 'ridge-dawn-stretch', 'led-forest-walk', 'night-kitchen-line', 'zurich-decompression-2026']){
      await c.goto(URL + '#/event/' + sl); await c.waitForTimeout(400);
      for (const act of ['v-interested', 'v-going', 'share']){
        const sig = await ev(c, ([a, K, ph]) => { const b = document.querySelector((ph ? '#evbar' : '#dscroll .actbar') + ' [data-act="'+a+'"]'); if (!b) return 'missing'; const st = getComputedStyle(b); return K.map(k => st[k]).join('|'); }, [act, KEYS, kind === 'phone']);
        (sigs[act] = sigs[act] || new Set()).add(sig);
      }
    }
    ok(Object.keys(sigs).every(a => sigs[a].size === 1 && !sigs[a].has('missing')), kind + ': Interested, Going and Share have identical computed styles on 5 event pages');
    ok(new Set(Object.keys(sigs).map(a => [...sigs[a]][0])).size === 1, kind + ': and the three verbs share one style');
    ok(!c.errors.length, kind + ': no console errors (controls)');
  }

  /* ---------------- 2026-10-01: a look is colours on the calm layout — readable, still, never in the way ---------------- */
  const ARTPAGES = ['burning-man-2027', 'ridge-dawn-stretch', 'led-forest-walk', 'borderland-2026', 'night-kitchen-line', 'deep-listening-lab'];
  /* worst-case contrast of text against what is actually painted behind it: hide the text, sample the pixels */
  const contrastOf = async (p, sels) => {
    const out = [];
    for (const sel of sels) for (const el of await p.$$(sel)){
      await el.evaluate(n => n.scrollIntoView({ block:'center' })); await p.waitForTimeout(60);
      const b0 = await el.boundingBox(); if (!b0) continue;
      const vp = p.viewportSize(), top = Math.max(0, b0.y), bot = Math.min(vp.height, b0.y + b0.height);
      const box = { x:Math.max(0, b0.x), y:top, width:Math.min(vp.width, b0.x + b0.width) - Math.max(0, b0.x), height:bot - top };
      if (box.width < 4 || box.height < 4) continue;
      const fg = await el.evaluate(n => getComputedStyle(n).color);
      await el.evaluate(n => { n.dataset.c = n.style.color; n.style.setProperty('color', 'transparent', 'important'); n.style.setProperty('-webkit-text-stroke-color', 'transparent', 'important'); n.style.setProperty('text-shadow', 'none', 'important'); n.querySelectorAll('*').forEach(k => k.style.setProperty('color', 'transparent', 'important')); });
      const png = await p.screenshot({ clip:box, animations:'disabled' });
      await el.evaluate(n => { n.style.color = n.dataset.c; n.style.removeProperty('-webkit-text-stroke-color'); n.style.removeProperty('text-shadow'); n.querySelectorAll('*').forEach(k => k.style.removeProperty('color')); });
      out.push({ sel, fg, png:png.toString('base64') });
    }
    return out;
  };
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    let worst = 99, where = '', low = [];
    for (const sl of ARTPAGES){
      await c.goto(URL + '#/event/' + sl); await c.waitForTimeout(500);
      const lay = await ev(c, () => {
        const cv = document.querySelector('#dscroll .canvas');
        /* every control in the page and its bar, scrolled into view one by one: under its centre is itself, or the window's own bars */
        const ctrls = [...document.querySelectorAll('#dscroll .canvas button, #dscroll .canvas a.btn, #evbar .btn')].filter(b => b.getBoundingClientRect().width);
        const blocked = ctrls.filter(b => { b.scrollIntoView({ block:'center' }); const r = b.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return hit && !b.contains(hit) && cv.contains(hit); });
        document.getElementById('dscroll').scrollTop = 0;
        return { art:document.querySelectorAll('#dscroll .art, #dscroll canvas, #dscroll .heroart, #dscroll .surf, #dscroll [class*="orn-"], #dscroll .mood').length,
                 moving:document.getAnimations().filter(a => document.getElementById('dscroll').contains(a.effect && a.effect.target)).length,
                 ctrls:ctrls.length, blocked:blocked.map(b => b.textContent.trim()) };
      });
      ok(!lay.art && !lay.moving, kind + ' ' + sl + ': no canvas art, nothing moves ' + JSON.stringify([lay.art, lay.moving]));
      ok(lay.ctrls > 0 && !lay.blocked.length, kind + ' ' + sl + ': nothing covers a control ' + JSON.stringify(lay.blocked));
      await measure(sl, ['#dscroll .canvas .eyebrow', '#dscroll .canvas .hl', '#dscroll .canvas .fk', '#dscroll .canvas .fv', '#dscroll .canvas .evdesc', '#dscroll .canvas .sect h3', '#dscroll .canvas .fs']);
    }
    /* a customised horizon, in four different looks */
    for (const look of ['evt-world-borderland-2026', 'evt-fill-9', 'evt-fill-11', 'evt-deep-listening']){
      await c.goto(URL + '#/horizon/season'); await c.waitForTimeout(300);
      await ev(c, k => { HZTHEME.season = JSON.parse(JSON.stringify(TH(k))); render(); }, look); await c.waitForTimeout(400);
      await measure('horizon ' + look, ['.pg-horizon .eyebrow', '.pg-horizon .hl', '.pg-horizon .psub2', '.pg-horizon .fk', '.pg-horizon .fv', '.pg-horizon .tt', '.pg-horizon .ts']);
    }
    async function measure(sl, sels){
      for (const shot of await contrastOf(c, sels)){
        const r = await ev(c, async s => {
          const img = new Image(); img.src = 'data:image/png;base64,' + s.png; await img.decode();
          const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
          const d = g.getImageData(0, 0, cv.width, cv.height).data;
          const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
          const L = (r, gg, b) => .2126 * lin(r) + .7152 * lin(gg) + .0722 * lin(b);
          const m = s.fg.match(/\d+(\.\d+)?/g).map(Number), lf = L(m[0], m[1], m[2]);
          const cr = []; for (let i = 0; i < d.length; i += 16){ const lb = L(d[i], d[i + 1], d[i + 2]); cr.push((Math.max(lf, lb) + .05) / (Math.min(lf, lb) + .05)); }
          cr.sort((a, b) => a - b); return cr[Math.floor(cr.length * .05)];
        }, shot);
        /* big display type needs 3:1, running text 4.5:1 (AA), measured at the 5th percentile of the background */
        const need = /\.hl/.test(shot.sel) ? 3 : 4.5;
        if (r / need < worst){ worst = r / need; where = sl + ' ' + shot.sel + ' ' + r.toFixed(2); }
        if (r < need) low.push(sl + ' ' + shot.sel + ' ' + r.toFixed(2));
      }
    }
    ok(worst >= 1, kind + ': page text meets AA on every look (worst: ' + where + ')' + (low.length ? '\n   ' + low.join('\n   ') : ''));
    ok(!c.errors.length, kind + ': no console errors (looks)');
  }

  /* ---------------- 2026-10-04 (B2): one window over a centred list — open, close (×, Esc, back), drag, maximise, replace, stack ---------------- */
  {
    const c = await ctx('desk');
    await open(c, '', true);
    await join(c, 'Win Tester', 'wintest');
    /* 2026-10-04 (layout): the white spans the centre; Home's container is 640 — 2026-10-05 (v5-shell): at the white's left, no longer centred */
    await c.goto(URL + '#/home'); await c.waitForTimeout(450);
    const col = await geoOf(c);
    ok(col.panelL === 8 && col.panelR === 8 && col.cw === 640 && col.cl === 0 && col.head === 0, 'window: at 1440 the white spans the centre and Home sits in a 640 container at its left ' + JSON.stringify(col));
    for (const [name, h, sel] of [['home', '#/home', '#listbody .fev .fct'], ['explore section', '#/explore/soon', '#listbody .row[data-type="event"]'],
        ['search', '#/search?q=burn', '#listbody .row[data-type="event"]'], ['people → person', '#/explore/people', '#listbody .row'], ['horizons', '#/explore/horizons', '#listbody .row[data-type="horizon"]']]){
      await c.goto(URL + h); await c.waitForTimeout(450);
      const z = await winState(c);
      await pick(c, sel + ' >> nth=1'); await c.waitForTimeout(350);
      const a = await winState(c);
      await c.goBack(); await c.waitForTimeout(400);
      const bk = await winState(c);
      await c.goForward(); await c.waitForTimeout(400);
      const fw = await winState(c);
      await c.keyboard.press('Escape'); await c.waitForTimeout(300);
      const es = await winState(c);
      await pick(c, sel + ' >> nth=0'); await c.waitForTimeout(350);
      const p0 = await winState(c);
      await pick(c, sel + ' >> nth=1'); await c.waitForTimeout(350);
      const p1 = await winState(c);
      await c.click('#dbar [data-act="closewin"]'); await c.waitForTimeout(300);
      const x = await winState(c);
      await c.reload(); await c.waitForTimeout(650);
      const r = await winState(c);
      ok(!z.open && !z.stack && z.hash === h, 'window: ' + name + ' opens with nothing open ' + JSON.stringify(z));
      ok(a.open && a.stack === 1 && a.hash !== h && a.inside && a.title.length > 0, 'window: ' + name + ': a pick opens it in the window, the URL names it ' + JSON.stringify(a));
      ok(!bk.open && bk.hash === h && fw.open && fw.top === a.top && !es.open && es.hash === h, 'window: ' + name + ': back closes it, forward reopens it, Esc closes it ' + JSON.stringify([bk.hash, fw.top, es.hash]));
      ok(p0.open && p1.open && p1.stack === 1 && p1.top !== p0.top && p1.x === p0.x, 'window: ' + name + ': opening another item from the list replaces what the one window shows ' + JSON.stringify([p0.top, p1.top]));
      ok(!x.open && !x.stack && x.hash === h && !r.open && r.hash === h, 'window: ' + name + ': × closes it; a reload keeps it closed');
    }
    /* reload restores what is open */
    await c.goto(URL + '#/event/borderland-2027'); await c.waitForTimeout(500);
    await c.reload(); await c.waitForTimeout(700);
    ok((await winState(c)).top === 'event:evt-world-borderland-2026--next', 'window: a reload restores the open item');
    /* drag by the title bar: it moves, and stays inside the main area however far you pull */
    const w0 = await winState(c);
    const bar = await c.locator('#dbar .dtitle').boundingBox();
    await c.mouse.move(bar.x + 20, bar.y + 8); await c.mouse.down(); await c.mouse.move(bar.x - 180, bar.y + 20, { steps:6 }); await c.mouse.up(); await c.waitForTimeout(150);
    const w1 = await winState(c);
    await c.mouse.move(bar.x - 160, bar.y + 20); await c.mouse.down(); await c.mouse.move(bar.x + 2000, bar.y + 2000, { steps:6 }); await c.mouse.up(); await c.waitForTimeout(150);
    const w2 = await winState(c);
    ok(w1.x === w0.x - 200 && w1.y >= w0.y && w1.inside && w2.inside && w2.x > w1.x, 'window: dragging the title bar moves it, kept inside the main area ' + JSON.stringify([w0.x, w1.x, w2.x, w2.y]));
    /* a button on the title bar is not a handle */
    await c.mouse.move((await c.locator('#dbar [data-act="maxwin"]').boundingBox()).x + 5, (await c.locator('#dbar [data-act="maxwin"]').boundingBox()).y + 5);
    await c.click('#dbar [data-act="maxwin"]'); await c.waitForTimeout(200);
    const mx = await ev(c, () => { const r = document.getElementById('win').getBoundingClientRect(), m = document.getElementById('main').getBoundingClientRect(); return r.width >= m.width - 20 && r.height >= m.height - 20; });
    await c.dblclick('#dbar .dtitle'); await c.waitForTimeout(200);
    const rs = await winState(c);
    ok(mx && rs.w === w2.w && rs.x === w2.x, 'window: □ maximises it, a double-click on the title bar restores it where it was ' + JSON.stringify([mx, rs.x, w2.x]));
    /* inside the window things stack: a horizon's event opens over it, ‹ steps back */
    await c.goto(URL + '#/horizon/season'); await c.waitForTimeout(450);
    await c.click('#dscroll .track >> nth=0'); await c.waitForTimeout(350);
    const st = await winState(c);
    const hasBack = await ev(c, () => !!document.querySelector('#dbar [data-act="back"]'));
    await c.click('#dbar [data-act="back"]'); await c.waitForTimeout(350);
    const sb = await winState(c);
    ok(st.stack === 2 && /^event:/.test(st.top) && hasBack && sb.stack === 1 && /^horizon:/.test(sb.top), 'window: a horizon\'s event stacks in the window, ‹ steps back to the horizon ' + JSON.stringify([st.top, sb.top]));
    /* the keyboard starts from nothing: ↓ opens the first row in the window, ↓ again the second */
    for (const [name, h] of [['home', '#/home'], ['events', '#/explore/events'], ['horizons', '#/explore/horizons'], ['search', '#/search?q=burn']]){
      await c.goto(URL + h); await c.waitForTimeout(450);
      await c.evaluate(() => document.activeElement && document.activeElement.blur());
      const rows = await ev(c, () => S.rows.map(it => it.type + ':' + it.id));
      await c.keyboard.press('ArrowDown'); await c.waitForTimeout(250);
      const k1 = await ev(c, () => S.stack.map(it => it.type + ':' + it.id).join('>'));
      await c.keyboard.press('ArrowDown'); await c.waitForTimeout(250);
      const k2 = await ev(c, () => S.stack.map(it => it.type + ':' + it.id).join('>'));
      ok(rows.length > 1 && k1 === rows[0] && k2 === rows[1], 'window: ' + name + ': ↓ from nothing opens the first item, ↓ again the second ' + JSON.stringify([k1, k2, rows.slice(0, 2)]));
    }
    /* an old ?pane=closed link lands on the list with nothing open, and the flag is gone */
    await c.goto(URL + '#/explore/events?pane=closed'); await c.waitForTimeout(450);
    const o = await winState(c);
    ok(!o.open && !o.stack && o.hash === '#/explore/events', 'window: an old ?pane=closed link opens the list with nothing open ' + o.hash);
    /* the reading pane is gone, not hidden */
    ok(await ev(c, () => !document.getElementById('detailcol') && typeof closePane === 'undefined' && typeof fitStrip === 'undefined' && !document.querySelector('.panempty')), 'window: the old reading pane, its empty state and the call-out strip code are removed');
    ok(!c.errors.length, 'window: no console errors ' + c.errors.join(' '));
  }
  /* tablet and 1440 + dock: the window fits what the dock leaves; phone: the sheet closes back to the same scroll */
  for (const kind of ['tab', 'desk']){
    const c = await ctx(kind);
    await open(c, '#/home', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    await c.evaluate(() => { S.rightOpen = true; render(); }); await c.waitForTimeout(300);
    await pick(c, '#listbody .fev .fct >> nth=0'); await c.waitForTimeout(350);
    const g = await ev(c, () => { const w = document.getElementById('win').getBoundingClientRect(), n = document.getElementById('nav').getBoundingClientRect(), d = document.getElementById('chats').getBoundingClientRect(), m = document.getElementById('main').getBoundingClientRect();
      return { open:!document.getElementById('win').hidden, w:Math.round(w.width), clearNav:w.left >= n.right - 1, clearDock:w.right <= d.left + 1, inside:w.left >= m.left && w.right <= m.right && w.bottom <= m.bottom }; });
    ok(g.open && g.w >= 440 && g.clearNav && g.inside && (kind === 'tab' || g.clearDock), kind + ' + dock: the window opens clear of the sidebar' + (kind === 'tab' ? '' : ' and the dock') + ', inside the main area ' + JSON.stringify(g));
    /* the dock and the window: whichever you touched last is in front */
    const dk = await c.locator('#chats').boundingBox();
    await c.click('#chats', { position:{ x:dk.width - 12, y:dk.height - 4 } }); await c.waitForTimeout(150);
    const f1 = await ev(c, () => document.getElementById('app').classList.contains('dock-front'));
    await c.click('#dbar .dtitle', { position:{ x:8, y:6 } }); await c.waitForTimeout(150);
    const f2 = await ev(c, () => document.getElementById('app').classList.contains('dock-front'));
    ok(f1 && !f2, kind + ': the dock or the window comes to the front when touched');
    ok((await overflow(c)) <= 0 && !c.errors.length, kind + ' + dock + window: no overflow, no console errors ' + c.errors.join(' '));
    if (kind === 'desk') await shot(c, 'b2-desk-window-dock');
  }
  {
    const c = await ctx('phone');
    await open(c, '#/home', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    /* down the feed, with an event in view (2026-10-05, v5-feed: from 900 down to the first event card, wherever the stream puts it) */
    await c.evaluate(() => { const l = document.getElementById('listbody'), top = l.getBoundingClientRect().top;
      const e = [...l.querySelectorAll('.fev .fct')].find(x => x.getBoundingClientRect().top - top + l.scrollTop > 900 + 200);
      l.scrollTop = e ? e.getBoundingClientRect().top - top + l.scrollTop - 200 : 900; }); await c.waitForTimeout(300);
    const s0 = await ev(c, () => document.getElementById('listbody').scrollTop);
    const t = await ev(c, () => { const lb = document.getElementById('listbody').getBoundingClientRect(); return [...document.querySelectorAll('#listbody .fev .fct')].findIndex(x => { const r = x.getBoundingClientRect(); return r.top > lb.top + 20 && r.bottom < lb.bottom - 20; }); });
    await c.tap('#listbody .fev .fct >> nth=' + t); await c.waitForTimeout(350);
    const sh = await ev(c, () => { const w = document.getElementById('win').getBoundingClientRect(); return { open:!document.getElementById('win').hidden, full:w.top <= 0 && w.left <= 0 && w.width >= innerWidth - 1 && w.bottom >= innerHeight - 1,
      x:!!document.querySelector('#dbar [data-act="closewin"]') && document.querySelector('#dbar [data-act="closewin"]').getBoundingClientRect().width >= 44, verbs:!!document.querySelector('#evbar [data-act="v-going"]') }; });
    ok(sh.open && sh.full && sh.x && sh.verbs, 'phone: the window is a full-screen sheet, × at least 44 wide, the verbs at its foot ' + JSON.stringify(sh));
    await c.tap('#dbar [data-act="closewin"]'); await c.waitForTimeout(350);
    const s1 = await ev(c, () => ({ open:!document.getElementById('win').hidden, scroll:document.getElementById('listbody').scrollTop, hash:location.hash }));
    ok(!s1.open && s1.scroll === s0 && s1.hash === '#/home', 'phone: × goes back to the feed exactly where you were ' + JSON.stringify([s0, s1]));
    await c.tap('#listbody .fev .fct >> nth=' + t); await c.waitForTimeout(350);
    await c.goBack(); await c.waitForTimeout(400);
    const s2 = await ev(c, () => ({ open:!document.getElementById('win').hidden, scroll:document.getElementById('listbody').scrollTop }));
    ok(!s2.open && s2.scroll === s0, 'phone: the back gesture closes the sheet, the feed where it was ' + JSON.stringify(s2));
    await shot(c, 'b2-phone-home');
    await c.goto(URL + '#/event/baltic-circuit-build-weekend'); await c.waitForTimeout(500);
    await shot(c, 'b2-phone-event-sheet');
    ok((await overflow(c)) <= 0 && !c.errors.length, 'phone sheet: no overflow, no console errors ' + c.errors.join(' '));
  }

  /* ---------------- 2026-09-28: event, horizon and person are one page template ---------------- */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    const sigs = {};
    for (const [type, h] of [['event', '#/event/ridge-dawn-stretch'], ['event', '#/event/afrikaburn-2027'], ['horizon', '#/horizon/season?pane=closed'], ['person', '#/person/anna'], ['person', '#/person/kai']]){
      await c.goto(URL + h); await c.waitForTimeout(500);
      sigs[h] = await ev(c, t => {
        const pg = document.querySelector('.canvas.pg[data-page="' + t + '"]'); if (!pg) return 'missing';
        /* the skeleton, ignoring optional pieces (a ribbon, an entry panel, editions, a second art layer) */
        const top = [...pg.children].map(x => x.classList[0]).filter(k => /^(art|banner|actbar|layer|tail)$/.test(k)).filter((k, i, a) => a.indexOf(k) === i).join('>');
        const q = s => !!pg.querySelector(s);
        /* a profile name sits in .pnamerow; an event or horizon heading is still the direct child of .btxt */
        return top + '|' + ['header.banner > .bin > .sqwrap', 'header.banner > .bin > .btxt > h1.hl, header.banner > .bin > .btxt > .pnamerow > h1.hl', '.actbar > .verbs', '.layer > .lin > .facts', '.layer > .lin > .sect'].map(q).join(',');
      }, type);
    }
    const uniq = new Set(Object.values(sigs));
    ok(uniq.size === 1 && !uniq.has('missing'), kind + ': event, horizon and person render through one template ' + JSON.stringify(sigs));
    ok(!c.errors.length, kind + ': no console errors (template)');
  }

  /* ---------------- 2026-09-28: customising is optional; a profile can be customised and keeps it ---------------- */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    await join(c, 'Plain Pat', 'plainpat' + kind);
    /* an event published without visiting the Look step, and a new horizon, are plain */
    await newEvent(c, { title:'Plain supper', date:'2026-11-02', city:'Brno' }); await c.waitForTimeout(100);
    const pe = await ev(c, () => { const id = MYEVENTS[MYEVENTS.length - 1]; return { stored:!!window.HYPERNET_THEMES.themes[id], page:!!document.querySelector('.pg-event.plain') }; });
    ok(!pe.stored && pe.page, kind + ': an event published without a look wears the plain default');
    await c.evaluate(() => runCmd('new-horizon')); await c.waitForTimeout(250);
    await c.fill('#nh-n', 'Plain places'); await c.click('#nh-go'); await c.waitForTimeout(500);
    const ph = await ev(c, () => { const k = MYHORIZONS[MYHORIZONS.length - 1]; return { stored:!!HZTHEME[k], page:!!document.querySelector('.pg-horizon.plain') }; });
    ok(!ph.stored && ph.page, kind + ': a new horizon wears the plain default');
    /* your profile: its colours from Edit profile on your page, kept across reload; nobody else's page offers it */
    await c.evaluate(() => { openItem('person', 'self'); }); await c.waitForTimeout(400);
    await c.click('.pg-person .actbar [data-act="editprofile"]'); await c.waitForTimeout(250);
    await c.click('#dscroll [data-czact="start"][data-i="1"]'); await c.waitForTimeout(150);
    await c.click('#dscroll [data-act="profiledone"]'); await c.waitForTimeout(500);
    await c.reload(); await c.waitForTimeout(800);
    const pp = await ev(c, () => ({ look:!!PTHEME.self, page:!!document.querySelector('.pg-person:not(.plain)') }));
    ok(pp.look && pp.page, kind + ': a customised profile persists across reload');
    await c.goto(URL + '#/person/kai'); await c.waitForTimeout(400);
    ok(await ev(c, () => !!document.querySelector('.pg-person.plain') && !document.querySelector('#dscroll [data-act="editprofile"], #dscroll [data-act="customizeme"]')), kind + ': someone else\'s profile has no Edit profile, and an uncustomised one is plain');
    ok(!c.errors.length, kind + ': no console errors (optional customize) ' + c.errors.join(' '));
  }

  /* ---------------- 2026-10-01 (v1): Home is the network's activity; Explore holds the rest; chat is person to person ---------------- */
  const lum = c => { const m = c.match(/\d+(\.\d+)?/g).map(Number); return (.2126 * m[0] + .7152 * m[1] + .0722 * m[2]) / 255; };
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '#/home', true);
    /* 2026-10-04: logged out there is no Home; an account that follows nobody sees the network's activity there */
    ok(await ev(c, () => !S.loggedIn && S.folder.kind === 'explore' && location.hash === '#/explore'), kind + ': logged out, #/home lands on Explore');
    await guest(c, 'Ola Open', 'olaopen');
    /* following nobody: the public activity, newest first, with the call outs popping */
    const pub = await ev(c, () => {
      const its = [...document.querySelectorAll('#listbody .fitem[data-ts]')], ts = its.map(x => x.getAttribute('data-ts'));
      const co = document.querySelector('#listbody .costrip .fco'), st = co && getComputedStyle(co), lb = getComputedStyle(document.getElementById('listbody'));
      const cards = [...document.querySelectorAll('#listbody .fcard')].map(x => getComputedStyle(x).backgroundColor);
      return { n:its.length, sorted:ts.every((t, i) => !i || ts[i - 1] >= t), bands:[...document.querySelectorAll('#listbody > .band, #listbody > .costrip > .band')].map(b => b.firstChild.textContent.trim()),
               co:!!co, coBg:st && st.backgroundColor, coFg:st && st.color, coSize:co && parseFloat(getComputedStyle(co.querySelector('.fcoa')).fontSize),
               bodySize:parseFloat(getComputedStyle(document.querySelector('#listbody .fsent')).fontSize), listBg:lb.backgroundColor, cards,
               strip:document.querySelectorAll('#listbody .costrip .cotile').length, fof:!!document.querySelector('#listbody .ffof .fcard.fp [data-act="followp"]'),
               verbs:!!document.querySelector('#listbody .fev [data-act="v-going"]') && !!document.querySelector('#listbody .fev [data-act="v-interested"]'),
               times:[...document.querySelectorAll('#listbody .fitem .ftime')].slice(0, 6).map(t => t.textContent) };
    });
    ok(pub.n >= 20 && pub.sorted, kind + ': following nobody, Home is the network\'s activity, newest first (' + pub.n + ' entries)');
    ok(pub.bands[0] && /call outs/i.test(pub.bands[0]) && pub.bands.indexOf('Today') > 0 && pub.bands.indexOf('Yesterday') > pub.bands.indexOf('Today'), kind + ': open call outs on top, then day bands ' + JSON.stringify(pub.bands));
    ok(pub.times.every(t => /^(now|\d+m ago|\d+h ago|yesterday|\d+ days ago|\d+ \w{3})$/.test(t)), kind + ': relative times read as ages ' + JSON.stringify(pub.times));
    ok(pub.co && lum(pub.coBg) < .12 && lum(pub.coFg) > .9 && lum(pub.listBg) > .9 && pub.coSize >= 1.3 * pub.bodySize, kind + ': a call out is the inverted card, the ask at 20 (the one headline size)');
    ok(pub.cards.every(b => lum(b) > .8), kind + ': and nothing else on Home is inverted');
    ok(pub.strip === 1 && pub.fof && pub.verbs, kind + ': one call out at a time in its band, people to follow, and Interested / Going on event cards');
    /* Explore: the four kinds; the old destinations land on them */
    if (kind === 'desk'){
      ok(await ev(c, () => [...document.querySelectorAll('#navbody .nsubrow .nlab')].map(x => x.textContent).join('|') === 'Events|Event Horizons|Call outs|People' &&
         !document.querySelector('#navbody [data-kind="horizons"], #navbody [data-kind="people"]')), 'desk: Explore has its four kinds in the sidebar, the old Horizons / People rows are gone');
    } else {
      await c.tap('#tabbar [data-id="explore"]'); await c.waitForTimeout(350);
      ok(await ev(c, () => [...document.querySelectorAll('#chead .kinds .kind')].map(x => x.textContent).join('|') === 'All|Events|Horizons|Call outs|People' && !!document.querySelector('#listbody .srow[data-shelf]')),
         'phone: the Explore tab has its kinds as tabs over the old shelves');
    }
    for (const [h, type, path] of [['#/explore/events', 'event', '#/explore/events'], ['#/explore/horizons', 'horizon', '#/explore/horizons'], ['#/explore/callouts', 'callout', '#/explore/callouts'],
                                   ['#/explore/people', 'person', '#/explore/people'], ['#/horizons', 'horizon', '#/explore/horizons'], ['#/people', 'person', '#/explore/people']]){
      await c.goto(URL + h); await c.waitForTimeout(350);
      ok(await ev(c, ([t, pth]) => location.hash.indexOf(pth) === 0 && document.querySelectorAll('#listbody .row[data-type="' + t + '"]').length >= 2, [type, path]), kind + ': ' + h + ' lists ' + type + 's');
    }
    await c.goto(URL + '#/explore/horizons'); await c.waitForTimeout(350);
    ok(await ev(c, () => /list of events someone curates/.test(document.querySelector('#listbody .kdesc').textContent)), kind + ': Event Horizon says what it is in a line');
    /* logged in: your own actions are on top, live; friends of friends; un-going takes it off */
    await c.goto(URL + '#/home'); await c.waitForTimeout(300);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    ok(await ev(c, () => /friends follow/i.test((document.querySelector('#listbody .ffof .ffh') || {}).textContent || '') && !document.querySelector('#listbody .ffof [data-id="p-anna"]')),
       kind + ': demo: people your friends follow, never someone you already follow');
    const target = await ev(c, () => { const b = [...document.querySelectorAll('#listbody .fev [data-act="v-going"]')].find(x => !x.classList.contains('on')); return b.getAttribute('data-id'); });
    await c.click('#listbody .fev [data-act="v-going"][data-id="' + target + '"] >> nth=0'); await c.waitForTimeout(400);
    const live = await ev(c, id => { const f = document.querySelector('#listbody .fitem[data-ts]');
      return { you:f.classList.contains('fyou'), s:f.querySelector('.fsent').textContent, t:f.querySelector('.ftime').textContent, title:EVENTS[id].title, on:RSVP[id] === 'going' }; }, target);
    ok(live.on && live.you && /^You: /.test(live.s) && live.s.indexOf('going to ' + live.title) >= 0 && live.t === 'now', kind + ': Going from a card puts "You: going to …" at the top, now ' + JSON.stringify(live));
    await c.evaluate(() => followP('p-jon')); await c.waitForTimeout(300);
    /* 2026-10-05 (v5-feed): one line per sitting, where its time puts it — never two of your lines one after the other */
    const youl = await ev(c, () => { const its = [...document.querySelectorAll('#listbody > .fitem')];
      return { s:(document.querySelector('#listbody .fyou .fsent') || {}).textContent || '', first:its[0] && its[0].classList.contains('fyou'),
               adjacent:its.some((x, i) => i && x.classList.contains('fyou') && its[i - 1].classList.contains('fyou')),
               youWords:[...document.querySelectorAll('#listbody .fitem:not(.fyou) .fsent')].filter(x => /^You\b/.test(x.textContent)).length }; });
    ok(/followed Jon/.test(youl.s) && youl.first && !youl.adjacent && !youl.youWords, kind + ': what you just did is one line ("You: …, followed Jon"), newest first, never a run of "You …" items ' + JSON.stringify(youl));
    await c.click('#listbody .fitem .fev [data-act="v-going"][data-id="' + target + '"] >> nth=0'); await c.waitForTimeout(400);
    ok(await ev(c, id => !RSVP[id] && ((document.querySelector('#listbody .fyou .fsent') || {}).textContent || '').indexOf(EVENTS[id].title) < 0, target), kind + ': un-going takes it off your line');
    await c.reload(); await c.waitForTimeout(700);
    ok(await ev(c, () => /^You: .*followed/.test((document.querySelector('#listbody .fyou .fsent') || {}).textContent || '')), kind + ': your activity survives a reload');
    /* a new account follows nobody: the whole network, and a nudge to follow people */
    await c.evaluate(() => doLogout()); await c.waitForTimeout(200);
    await join(c, 'Nora Field', 'nora' + kind);
    /* 2026-10-05 (v5-homechats): the nudge is at the end of Home, not over it */
    ok(await ev(c, () => { const lb = document.querySelector('#listbody'), end = lb.querySelector('.fend');
      return document.querySelectorAll('#listbody .fitem[data-ts]').length >= 20 && !!end && lb.lastElementChild === end && /You don’t follow anyone yet/.test(end.textContent) &&
        !!end.querySelector('[data-act="explorekind"][data-id="people"]') && !/Make Home yours/.test(lb.textContent); }),
       kind + ': following nobody, Home is the whole network with a nudge to follow people at its end');
    ok(!c.errors.length, kind + ': no console errors (v1 Home / Explore) ' + c.errors.join(' '));
    ok((await overflow(c)) <= 0, kind + ': no overflow (v1 Home)');
  }

  /* ---------------- 2026-10-01 (v1 social): call outs reach the right people once; Home blends; your people's next weeks ---------------- */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '#/home', true);
    await guest(c, 'Ned Open', 'nedopen');
    const a11y = () => ev(c, () => [...document.querySelectorAll('#listbody [role="button"]')].filter(x => x.querySelector('button, a, [role="button"]')).length +
                                   document.querySelectorAll('#listbody button button').length);
    const noDup = () => ev(c, () => { const strip = homeCallouts().map(x => x.id);
      const stream = [...document.querySelectorAll('#listbody > .fitco .fco')].map(x => x.getAttribute('data-id'));
      return { strip, shown:[...document.querySelectorAll('#listbody .costrip .fco')].map(x => x.getAttribute('data-id')), count:(document.querySelector('#listbody .coband .cnt') || {}).textContent, dup: stream.filter(x => strip.indexOf(x) >= 0) }; });
    let nd = await noDup();
    ok(nd.strip.length >= 2 && nd.shown.length === 1 && nd.shown[0] === nd.strip[0] && nd.count === '1 of ' + nd.strip.length && !nd.dup.length,
       kind + ': following nobody, the open call outs are one at a time in their band ("1 of N"), none repeated in the stream ' + JSON.stringify(nd));
    await c.click('#listbody .coband [data-act="costep"][data-id="1"]'); await c.waitForTimeout(300);
    const nd2 = await noDup();
    ok(nd2.shown[0] === nd.strip[1] && nd2.count === '2 of ' + nd.strip.length, kind + ': › steps to the next call out ' + JSON.stringify(nd2));
    await c.click('#listbody .coband [data-act="costep"][data-id="-1"]'); await c.waitForTimeout(300);
    ok((await a11y()) === 0, kind + ': no role=button wrapper around real buttons on Home (following nobody)');
    /* the demo follows four people: what they are going to in the next three weeks, by date, who in words */
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    const up = await ev(c, () => { const rows = [...document.querySelectorAll('#listbody .fup .fuprow')];
      return { n:rows.length, dates:rows.map(r => EVENTS[r.getAttribute('data-id')].date), soc:rows.map(r => (r.querySelector('.soc') || {}).textContent || ''),
               sq:rows.every(r => { const q = r.querySelector('.sq'); return q && q.offsetWidth === 48; }), head:(document.querySelector('#listbody .fupband') || {}).textContent || '' }; });
    ok(up.n >= 2 && up.dates.every((d, i) => !i || up.dates[i - 1] <= d) && up.sq && up.soc.every(t => /(is|are) (going|interested)/.test(t)) && /Coming up with your people/.test(up.head),
       kind + ': "Coming up with your people" lists the next weeks by event date, with who you follow ' + JSON.stringify(up));
    nd = await noDup();
    ok(!nd.dup.length && (await a11y()) === 0, kind + ': logged in, no call out twice and no nested buttons ' + JSON.stringify(nd));
    if (kind === 'desk'){
      /* "Show N more" opens the rest of the next weeks */
      const more = await ev(c, () => { const b = document.querySelector('#listbody [data-act="upall"]'); if (!b) return null; const n0 = document.querySelectorAll('#listbody .fuprow').length; b.click(); return { n0, n1:document.querySelectorAll('#listbody .fuprow').length }; });
      ok(!more || more.n1 > more.n0, kind + ': the shelf opens to all of the next weeks ' + JSON.stringify(more));
      /* a fresh "going" invites a message */
      ok(await ev(c, () => [...document.querySelectorAll('#listbody .fitem[data-verb="going"], #listbody .fitem[data-verb="interested"]')].some(x => x.querySelector('.ftime.fresh') && x.querySelector('.fmsg[data-act="dm"]'))),
         kind + ': a fresh going / interested line carries Message');
      /* grouping stays within a few hours */
      /* a line groups rows within three hours of its newest one: every actor on it acted in that window */
      ok(await ev(c, () => homeParts().stream.every(e => { if (e.actors.length < 2 || !MANYACTORS[e.verb]) return true;
           return e.actors.every(p => activityRows().some(a => a.actor === p && a.verb === e.verb && a.objId === e.objId && actTime(a) <= e.ms && e.ms - actTime(a) <= GROUPWIN)); })),
         kind + ': lines group only rows within three hours of each other');
      /* the event page: people you follow first, with when they decided; "and N more" opens everyone */
      const evId = await ev(c, () => upWithPeople().map(x => x.e.id).find(id => whoGoing(id).some(x => PFOLLOW[x.pid] && x.ms)) || upWithPeople()[0].e.id);
      await c.evaluate(id => openItem('event', id), evId); await c.waitForTimeout(400);
      const who = await ev(c, () => { const ch = [...document.querySelectorAll('#dscroll .whochips .chip.who')];
        return { n:ch.length, firstFol:ch[0] && ch[0].classList.contains('fol'), subs:ch.map(x => x.querySelector('small').textContent),
                 order:ch.map(x => x.classList.contains('fol') ? 1 : 0), more:!!document.querySelector('#dscroll .whochips button[data-act="whoall"]') }; });
      ok(who.n >= 1 && who.firstFol && who.order.every((v, i) => !i || who.order[i - 1] >= v) && who.subs.some(t => /going · (\d+m ago|\d+h ago|yesterday|\d+ days ago|\d+ \w{3})/.test(t)),
         kind + ': Who’s going puts the people you follow first, each with when they decided ' + JSON.stringify(who));
      if (who.more){
        await c.click('#dscroll .whochips [data-act="whoall"]'); await c.waitForTimeout(300);
        ok(await ev(c, () => document.querySelectorAll('.dlg .whorow').length >= 1 && !!document.querySelector('.dlg .whorow [data-act="whodm"]')), kind + ': "and N more" opens everyone going, with Message');
        await c.evaluate(() => closeDialogs()); await c.waitForTimeout(150);
      }
      await shot(c, 'v1-social-event-who');
      /* Explore's events carry who you follow */
      await c.goto(URL + '#/explore/events'); await c.waitForTimeout(450);
      ok(await ev(c, () => [...document.querySelectorAll('#listbody .row .rsoc')].some(x => /(is|are) (going|interested)/.test(x.textContent) && !x.querySelector('.av'))), kind + ': Explore → Events rows say who you follow is going, in words');
      /* New → Call out is for the event you are looking at, or the event of the call out you are on */
      const host = await ev(c, () => MYEVENTS.filter(id => EVENTS[id] && !isPast(lastDay(EVENTS[id])))[0]);
      const other = await ev(c, h => feedEvents().filter(e => !isPast(lastDay(e)) && e.id !== h && MYEVENTS.indexOf(e.id) < 0)[3].id, host);
      await c.evaluate(id => openItem('event', id), other); await c.waitForTimeout(300);
      await c.evaluate(() => runCmd('new-callout')); await c.waitForTimeout(250);
      ok(await ev(c, id => document.getElementById('co-e').value === id, other), kind + ': New → Call out defaults to the event you are looking at');
      await c.evaluate(() => { closeDialogs(); FORMDRAFTS.callout = null; }); await c.evaluate(() => openItem('callout', 'co-kitchen')); await c.waitForTimeout(300);
      await c.evaluate(() => runCmd('new-callout')); await c.waitForTimeout(250);
      ok(await ev(c, () => document.getElementById('co-e').value === calloutEventId(calloutOf('co-kitchen'))), kind + ': … or the event of the call out you are on');
      await c.evaluate(() => { closeDialogs(); FORMDRAFTS.callout = null; S.stack = []; render(); }); await c.waitForTimeout(200);
      await c.evaluate(() => runCmd('new-callout')); await c.waitForTimeout(250);
      ok(await ev(c, h => document.getElementById('co-e').value === h && !!document.querySelector('#co-s option[value="CAMP OPERATIONS/KITCHEN & COOKING"]'), host), kind + ': … otherwise your next hosted event; the form has a skill');
      await c.evaluate(() => closeDialogs());
      /* width: the white spans the centre, Home's container is 640; nothing else beside it */
      await c.evaluate(() => { closeDialogs(); goFolder({ kind:'home' }); S.stack = []; render(); }); await c.waitForTimeout(300);
      ok(await ev(c, () => S.folder.kind === 'home' && document.getElementById('listcol').offsetWidth === document.getElementById('center').offsetWidth && document.getElementById('win').hidden) && (await geoOf(c)).cw === 640, kind + ': at 1440 Home is a 640 container in the white, nothing open');
      await shot(c, 'v1-social-home-desk');
    } else {
      await c.goto(URL + '#/explore'); await c.waitForTimeout(450);
      ok(await ev(c, () => [...document.querySelectorAll('#listbody .card2 .csoc')].some(x => /(is|are) (going|interested)/.test(x.textContent))), kind + ': Explore cards say who you follow is going');
    }
    /* the demo posts a call out for Kitchen, for no event: it must reach a stranger who cooks */
    await c.evaluate(() => { closeDialogs(); FORMDRAFTS.callout = null; runCmd('new-callout'); }); await c.waitForTimeout(250);
    await c.fill('#co-t', 'Second cook'); await c.selectOption('#co-e', ''); await c.selectOption('#co-s', 'CAMP OPERATIONS/KITCHEN & COOKING');
    await c.click('#co-go'); await c.waitForTimeout(300);
    ok(await ev(c, () => CALLOUTS[0].title === 'Second cook' && CALLOUTS[0].skill === 'CAMP OPERATIONS/KITCHEN & COOKING' && !CALLOUTS[0].eventId), kind + ': the call out keeps its skill');
    /* a new account with a skill, following three strangers: the Kitchen call outs still reach it, saying why */
    await c.evaluate(() => { closeDialogs(); S.tab = 'home'; goFolder({ kind:'home' }); S.stack = []; doLogout(); }); await c.waitForTimeout(200);
    await c.evaluate(() => loginDialog()); await c.waitForTimeout(150);
    await c.fill('#pf-name', 'Cora Pan'); await c.fill('#pf-handle', 'cora' + kind);
    /* Join's tags replaced the old skill chips. Kitchen is the same label the call out matches. */
    await c.click('.dlg [data-act="ptagopen"]'); await c.waitForTimeout(150);
    await c.click('.dlg [data-act="ptagcat"][data-id="skill"]'); await c.waitForTimeout(100);
    await c.fill('#ptag-q', 'Kitchen'); await c.waitForTimeout(150);
    await c.evaluate(() => { const b = document.querySelector('.dlg [data-act="ptagpick"][data-id="c:skill:Kitchen"]') || document.querySelector('.dlg [data-act="ptagcreate"]'); b.click(); }); await c.waitForTimeout(150);
    await c.click('#pfsave'); await c.waitForTimeout(300);
    /* following one person: Home still shows the network around them */
    await c.evaluate(() => followP('p-mira')); await c.waitForTimeout(300);
    const blend = await ev(c, () => ({ net:document.querySelectorAll('#listbody .fitem.fnet').length, band:[...document.querySelectorAll('#listbody .band')].some(b => /Around the network/.test(b.textContent)),
      mine:homeParts().stream.every(e => e.verb === 'you' || e.actors.every(a => a === 'p-mira')), strip:homeCallouts().length }));
    ok(blend.net >= 3 && blend.band && blend.mine && blend.strip >= 2, kind + ': following one person, Home is theirs first, then "Around the network" — and the network’s call outs stay ' + JSON.stringify(blend));
    await c.evaluate(() => { followP('p-jon'); followP('p-sasha'); }); await c.waitForTimeout(300);
    const reach = await ev(c, () => homeCallouts().map(x => calloutOf(x.id).title + ' | ' + (x.why && x.why.t || '')));
    ok(await ev(c, () => { const x = homeCallouts()[0]; return /Matches your skill: Kitchen/.test((document.querySelector('#listbody .costrip .fmeta') || {}).textContent || '') && document.querySelector('#listbody .costrip .fco').getAttribute('data-id') === x.id; }),
       kind + ': the call out shown says why it reached you');
    ok(reach.some(t => /^Second cook \| Matches your skill: Kitchen/.test(t)) && reach.some(t => /^Kitchen lead \| Matches your skill: Kitchen/.test(t)),
       kind + ': a skill-matched call out from beyond your follows reaches you, labelled why ' + JSON.stringify(reach));
    ok(await ev(c, () => !document.querySelector('#listbody .fnet')), kind + ': following three people, Home is yours (no network section)');
    ok(await ev(c, () => { PEOPLE['u-tmpkai'] = { id:'u-tmpkai', displayName:'Kai Lindqvist', handle:'kai.l', skills:[] };
      const r = whoName('p-kai') === '@kai' && whoName('u-tmpkai') === '@kai.l' && whoName('p-jon') === 'Jon'; delete PEOPLE['u-tmpkai']; return r && whoName('p-kai') === 'Kai'; }),
       kind + ': where two first names collide, lines say @handle');
    /* answering is a public reply under the call out: Answer opens it with the reply box focused, and makes no chat */
    await c.evaluate(() => { COIDX = homeCallouts().findIndex(x => /^co-new-/.test(x.id)); render(); }); await c.waitForTimeout(200);
    if (kind === 'phone') await c.evaluate(() => { const t = document.querySelector('#listbody .cotile[data-id^="co-new-"]'); t.scrollIntoView(); });
    const chats0 = await ev(c, () => ({ n:Object.keys(CHATS).length, open:S.chatOpen }));
    await c.evaluate(() => document.querySelector('#listbody .cotile[data-id^="co-new-"] [data-act="answercallout"]').click()); await c.waitForTimeout(400);
    const ans = await ev(c, () => { const t = S.stack[S.stack.length - 1];
      return { top:t && t.type === 'callout' && calloutOf(t.id).title, focus:document.activeElement && document.activeElement.id, tag:(document.getElementById('coreply') || {}).tagName,
               chats:Object.keys(CHATS).length, open:S.chatOpen, pin:!!document.querySelector('.cpin, #chats .cpin') }; });
    ok(ans.top === 'Second cook' && ans.focus === 'coreply' && ans.tag === 'TEXTAREA' && ans.chats === chats0.n && ans.open === chats0.open && !ans.pin,
       kind + ': Answer opens the call out with its reply box focused, and makes no chat ' + JSON.stringify(ans));
    await c.keyboard.type('Happy to help.'); await c.keyboard.press('Shift+Enter'); await c.keyboard.type('I run a camp kitchen.');
    const h0 = await ev(c, () => document.getElementById('coreply').offsetHeight);
    ok(await ev(c, () => /\nI run a camp kitchen\.$/.test(document.getElementById('coreply').value)), kind + ': Shift+Enter adds a new line');
    await c.keyboard.press('Enter'); await c.waitForTimeout(300);
    const sent = await ev(c, () => { const id = S.stack[S.stack.length - 1].id, r = repliesOf(id), el = [...document.querySelectorAll('#dscroll .reply')].pop();
      return { n:r.length, mine:!!r.length && r[r.length - 1].author === myActor(), text:el && el.querySelector('.rpt').textContent, name:el && el.querySelector('.rpn').getAttribute('data-id'),
               del:!!(el && el.querySelector('[data-act="delreply"]')), box:document.getElementById('coreply').value, chats:Object.keys(CHATS).length,
               act:activityRows().some(a => a.verb === 'replied_callout' && a.objId === id && actIsMe(a)) }; });
    ok(sent.n === 1 && sent.mine && /I run a camp kitchen/.test(sent.text) && sent.name === 'self' && sent.del && !sent.box && h0 > 30 && sent.act && sent.chats === chats0.n,
       kind + ': Enter posts the reply under the call out, with Delete and an activity row, and no chat ' + JSON.stringify(sent));
    if (kind === 'desk') await shot(c, 'v1-social-answer-reply');
    /* replied: it leaves the strip, and your line says so */
    await c.goto(URL + '#/home'); await c.waitForTimeout(400);
    ok(await ev(c, () => !homeCallouts().some(x => calloutOf(x.id).title === 'Second cook') &&
       /replied to Second cook/.test((document.querySelector('#listbody .fyou .fsent') || {}).textContent || '')), kind + ': a call out you replied to leaves the strip, and your line says you replied');
    /* to someone else (following nobody), Home's tile counts the reply and shows it */
    await c.evaluate(() => doLogout()); await c.waitForTimeout(250);
    await guest(c, 'Ida Look', 'idalook');
    await c.evaluate(() => { COIDX = homeCallouts().findIndex(x => calloutOf(x.id).title === 'Second cook'); render(); }); await c.waitForTimeout(200);
    const tile = await ev(c, () => { const t = document.querySelector('#listbody .costrip .cotile'); if (!t || calloutOf(t.getAttribute('data-id')).title !== 'Second cook') return null;
      return { n:(t.querySelector('.fcof .corall') || {}).textContent, who:[...t.querySelectorAll('.corep .corwho')].map(b => b.textContent), txt:(t.querySelector('.corep .cort') || {}).textContent }; });
    ok(tile && tile.n === '1 reply' && tile.who.join() === 'Cora' && /camp kitchen/.test(tile.txt), kind + ': Home’s call-out tile shows the reply count and the latest reply ' + JSON.stringify(tile));
    /* the poster sees the reply in the thread, nothing in chat, and can take it off */
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    const coId = await ev(c, () => CALLOUTS.filter(x => x.title === 'Second cook')[0].id);
    await c.evaluate(id => openItem('callout', id), coId); await c.waitForTimeout(350);
    const poster = await ev(c, () => { const r = [...document.querySelectorAll('#dscroll .reply')]; return { n:r.length, name:r[0] && r[0].querySelector('.rpn').textContent, del:!!(r[0] && r[0].querySelector('[data-act="delreply"]')),
      chat:Object.keys(CHATS).some(k => CHATS[k].messages.some(m => /camp kitchen/.test(m.text || ''))) }; });
    ok(poster.n === 1 && /Cora Pan/.test(poster.name) && poster.del && !poster.chat, kind + ': the poster sees the reply under the call out and nothing in chat ' + JSON.stringify(poster));
    await c.click('#dscroll .reply [data-act="delreply"]'); await c.waitForTimeout(300);
    ok(await ev(c, id => !repliesOf(id).length && !document.querySelector('#dscroll .reply') && !activityRows().some(a => a.verb === 'replied_callout' && a.objId === id), coId),
       kind + ': the poster deletes the reply: off the thread and off the activity');
    ok(!c.errors.length, kind + ': no console errors (v1 social) ' + c.errors.join(' '));
    ok((await overflow(c)) <= 0, kind + ': no overflow (v1 social)');
  }
  /* 1440 with the chat dock and a window open: the call out in its band is whole, and › steps to the next */
  {
    const c = await ctx('desk');
    await open(c, '#/home', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(300);
    await c.evaluate(() => { S.rightOpen = true; render(); }); await c.waitForTimeout(300);
    await c.evaluate(() => openItem('event', upWithPeople()[0].e.id)); await c.waitForTimeout(300);
    const cut = await ev(c, () => { const s = document.querySelector('#listbody .costrip'), r = s.getBoundingClientRect(), f = s.querySelector('.fco').getBoundingClientRect();
      return { cls:document.getElementById('app').className, whole:f.left >= r.left - 1 && f.right <= r.right + 1, n:homeCallouts().length, cnt:s.querySelector('.coband .cnt').textContent }; });
    ok(/r-open/.test(cut.cls) && /win-open/.test(cut.cls) && cut.whole && cut.n >= 2 && cut.cnt === '1 of ' + cut.n, '1440 dock + window: the call out is whole in its band, which says how many ' + JSON.stringify(cut));
    /* (the band's ‹ › sit at its right, under the window here: pressed from the keyboard's side) */
    await c.evaluate(() => document.querySelector('#listbody .coband [data-act="costep"][data-id="1"]').click()); await c.waitForTimeout(300);
    ok(await ev(c, () => document.querySelector('#listbody .coband .cnt').textContent.indexOf('2 of') === 0 && document.querySelector('#listbody .costrip .fco').getAttribute('data-id') === homeCallouts()[1].id), '1440 dock + window: › steps to the next call out');
    ok(!c.errors.length && (await overflow(c)) <= 0, '1440 dock + window: no console errors, no overflow');
  }
  /* phone Home, logged in */
  {
    const c = await ctx('phone');
    await open(c, '#/home', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(600);
    await shot(c, 'v1-social-home-phone');
    ok(!c.errors.length && (await overflow(c)) <= 0, 'phone Home (demo): no console errors, no overflow');
  }

  /* ---------------- 2026-10-01: Customize is three colours and a square image (2026-10-05: one to three colours, in Edit) ---------------- */
  {
    /* a generated picture: a 900×600 PNG, landscape, so the centre crop is visible */
    const pngOf = async p => Buffer.from(await p.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 900; c.height = 600; const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 900, 600); gr.addColorStop(0, '#ff5a1f'); gr.addColorStop(1, '#2a64ff'); g.fillStyle = gr; g.fillRect(0, 0, 900, 600);
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(450, 300, 160, 0, 6.3); g.fill(); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
    for (const kind of ['desk', 'phone']){
      const c = await ctx(kind);
      await open(c, '', true);
      ok(await ev(c, () => JSON.stringify(window.HN_MIGRATE_LOOK({ mood:'x', palette:{ bg:'#06080E', ink:'#e9e7e0', accent:'#6fd6c8', accent2:'#17233a', dim:'#7d8796' }, square:{ pattern:'moon', glyph:'☾' }, surface:'grain', ornaments:['stamp'], parallax:'gentle' }))
        === JSON.stringify({ bg:'#06080e', ink:'#e9e7e0', accent:'#6fd6c8', image:null, glyph:'☾' })), kind + ': an old look migrates to { bg, ink, accent, image, glyph }');
      await c.evaluate(() => loginDialog()); await c.waitForTimeout(150);
      await c.click('.dlg [data-act="useacct"][data-id="demo"]'); await c.waitForTimeout(300);
      const own = await ev(c, () => MYEVENTS[0]);
      const showPage = () => ev(c, id => { goFolder({ kind:'hosting' }); if (L.phone) S.tab = 'you'; S.stack = [{ type:'event', id }]; render(); }, own);
      const showList = () => ev(c, () => { goFolder({ kind:'hosting' }); if (L.phone) S.tab = 'you'; S.stack = []; render(); });
      await showPage(); await c.waitForTimeout(300);
      /* 2026-10-05: the look is the Look section of the event's one Edit */
      if (kind === 'desk') await c.click('#dscroll .actbar [data-act="editevent"]'); else await c.evaluate(id => editEventDialog(id), own);
      await c.waitForTimeout(300);
      const lookCtl = () => ev(c, () => { const z = document.querySelector('.dlg [data-czlook]'); return { color:z.querySelectorAll('input[type=color]').length, file:z.querySelectorAll('input[type=file]').length,
        selects:z.querySelectorAll('select').length, boxes:z.querySelectorAll('input[type=checkbox]').length, adds:[...z.querySelectorAll('.czadd')].map(b => b.textContent.trim()) }; });
      const ctl = await lookCtl();
      ok(ctl.color === 1 && ctl.file === 1 && !ctl.selects && !ctl.boxes && ctl.adds.join() === 'Add accent', kind + ': the Look starts with one colour and one picture upload, and Add accent ' + JSON.stringify(ctl));
      ok((await overflow(c)) <= 0, kind + ': Edit open, no horizontal overflow');
      const png = await pngOf(c);
      await c.setInputFiles('#cz-file', { name:'square.png', mimeType:'image/png', buffer:png }); await c.waitForTimeout(700);
      const up = await ev(c, async () => ({ img:/^data:image\/(webp|jpeg)/.test(DRAFT.image || ''), size:(DRAFT.image || '').length * .75,
        dims:await new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth + 'x' + i.naturalHeight); i.onerror = () => r('unreadable'); i.src = DRAFT.image; }),
        shown:!!document.querySelector('.dlg .czdrop img') && !!document.querySelector('.dlg :is(.custprev, .czmini) .sqwrap img') }));
      ok(up.img && up.size < 150 * 1024 && up.dims === '512x512' && up.shown, kind + ': an upload is centre-cropped to a 512×512 image under 150 KB and previewed ' + JSON.stringify(up));
      /* one to three colours: Add accent, then Add header colour; each but the page can be taken away again */
      await c.click('.dlg .czadd'); await c.waitForTimeout(150);
      const two = await lookCtl();
      await c.click('.dlg .czadd'); await c.waitForTimeout(150);
      const three = await lookCtl();
      await c.click('.dlg .czrm[data-k="c2"]'); await c.waitForTimeout(150);
      const gone = await ev(c, () => ({ c2:DRAFT.c2, c3:!!DRAFT.c3, rows:[...document.querySelectorAll('.dlg [data-czrow]')].map(r => r.getAttribute('data-czrow')).join() }));
      ok(two.color === 2 && two.adds.join() === 'Add header colour' && three.color === 3 && !three.adds.length && gone.c2 === null && gone.c3 && gone.rows === 'c1,c3',
         kind + ': Add accent gives a second colour, Add header colour a third, and the accent can go while the header stays ' + JSON.stringify([two, three, gone]));
      /* the text is never picked: dark ink on a light page, light ink on a dark one; a mid-tone page moves off the middle and says so */
      await c.fill('#cz-c1', '#ffffff'); await c.waitForTimeout(150);
      const lightInk = await ev(c, () => relLum(draftTheme(DRAFT).ink) < .2);
      await c.fill('#cz-c1', '#808080'); await c.waitForTimeout(150);
      const mid = await ev(c, () => ({ note:$('cz-note').textContent, bg:draftTheme(DRAFT).bg, cr:contrast(draftTheme(DRAFT).ink, draftTheme(DRAFT).bg) }));
      ok(lightInk && /lighter/.test(mid.note) && mid.bg !== '#808080' && mid.cr >= 7, kind + ': text is chosen for you; a mid-grey page shows a little lighter and the editor says so ' + JSON.stringify(mid));
      await c.click('.dlg [data-act="wiz"][data-id="finish"]'); await c.waitForTimeout(500);
      const st = await ev(c, id => { const t = window.HYPERNET_THEMES.themes[id]; return { keys:Object.keys(t).sort().join(','), colors:t.colors, cr:contrast(t.ink, t.bg), img:/^data:image/.test(t.image || '') }; }, own);
      ok(st.keys === 'accent,bg,colors,glyph,image,ink' && st.colors[0] === '#808080' && st.colors[1] === null && /^#[0-9a-f]{6}$/.test(st.colors[2]) && st.cr >= 4.5 && st.img,
         kind + ': the saved look keeps its picks and the colours they give, its text AA ' + JSON.stringify(st));
      await showPage(); await c.waitForTimeout(300);
      const pageImg = () => ev(c, () => !!document.querySelector('#dscroll .pg-event .sqwrap .sq.img img') && !!document.querySelector('#dscroll .pg-event:not(.plain)'));
      ok(await pageImg(), kind + ': the image is the page square');
      await showList(); await c.waitForTimeout(300);
      const rowImg = () => ev(c, id => !!document.querySelector('#listbody .row[data-id="' + id + '"] .sq.img img'), own);
      ok(await rowImg(), kind + ': and the square in its list row');
      await c.reload(); await c.waitForTimeout(800);
      await showPage(); await c.waitForTimeout(300); const a1 = await pageImg();
      await showList(); await c.waitForTimeout(300); const a2 = await rowImg();
      ok(a1 && a2, kind + ': the image survives a reload');
      /* the wrong file is refused, with a reason */
      await c.evaluate(id => editEventDialog(id), own); await c.waitForTimeout(300);
      await c.setInputFiles('#cz-file', { name:'huge.png', mimeType:'image/png', buffer:Buffer.alloc(10 * 1024 * 1024 + 1024, 7) }); await c.waitForTimeout(200);
      const big = await c.textContent('#cz-imgerr');
      await c.setInputFiles('#cz-file', { name:'notes.txt', mimeType:'text/plain', buffer:Buffer.from('not a picture') }); await c.waitForTimeout(200);
      const txt = await c.textContent('#cz-imgerr');
      ok(/10 MB/.test(big) && /isn.t an image/.test(txt) && await ev(c, () => /^data:image/.test(DRAFT.image || '')), kind + ': a file over 10 MB and a non-image are refused, the image kept');
      /* Reset to plain removes the look */
      await c.click('.dlg [data-czact="reset"]'); await c.waitForTimeout(150);
      await c.click('.dlg [data-act="wiz"][data-id="finish"]'); await c.waitForTimeout(400);
      ok(await ev(c, id => !window.HYPERNET_THEMES.themes[id], own), kind + ': Reset to plain removes the look');
      /* the new-event wizard's look step is the same three colours and a square */
      await newEvent(c, { title:'Lantern swap', date:'2026-11-05', publish:false });
      await c.click('.dlg [data-act="wizstep"][data-id="3"]'); await c.waitForTimeout(200);
      ok(await ev(c, () => document.querySelectorAll('.dlg [data-czlook] input[type=color]').length === 1 && document.querySelectorAll('.dlg [data-czlook] input[type=file]').length === 1 && !!document.querySelector('.dlg .czadd')),
         kind + ': the New event Look step is the same look editor (one colour to start, Add accent, one picture)');
      await c.click('.dlg [data-act="closedlg"]'); await c.waitForTimeout(150);
      /* your photo: from Edit profile, it is your avatar and your profile's square */
      await c.evaluate(() => beginProfileEdit()); await c.waitForTimeout(200);
      await c.setInputFiles('#pf-photo', { name:'me.png', mimeType:'image/png', buffer:png }); await c.waitForTimeout(700);
      await c.click('#dscroll [data-act="profiledone"]'); await c.waitForTimeout(400);
      await c.evaluate(() => openItem('person', 'self')); await c.waitForTimeout(400);
      const ph = await ev(c, () => ({ look:/^data:image/.test((PTHEME.self || {}).image || ''), page:!!document.querySelector('.pg-person .sqwrap img'),
        av:document.querySelectorAll('.av.img img').length, plain:!!document.querySelector('.pg-person.plain') }));
      ok(ph.look && ph.page && ph.plain && (kind === 'phone' || ph.av > 0), kind + ': Edit profile → Photo is the profile square and avatar ' + JSON.stringify(ph));
      await c.reload(); await c.waitForTimeout(800);
      ok(await ev(c, () => /^data:image/.test((PTHEME.self || {}).image || '')), kind + ': the photo survives a reload');
      ok(!c.errors.length, kind + ': no console errors (customize) ' + c.errors.join(' '));
    }
    const tb = await ctx('tab');
    await open(tb, '', true);
    await tb.evaluate(() => loginDialog()); await tb.waitForTimeout(150);
    await tb.click('.dlg [data-act="useacct"][data-id="demo"]'); await tb.waitForTimeout(300);
    await tb.evaluate(() => editEventDialog(MYEVENTS[0])); await tb.waitForTimeout(300);
    ok((await overflow(tb)) <= 0 && !tb.errors.length, '768: Edit open, no horizontal overflow, no console errors');
  }

  /* ---------------- 2026-10-01 (trust): privacy, the network, one clock, closed call outs, clean colours, storage ---------------- */
  {
    const c = await ctx('desk');
    await open(c, '', true);
    /* one clock: the app's today is the browser's today, and the mock world moved with it */
    ok(await ev(c, () => { const d = new Date(), iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      return TODAY_ISO === iso && dayDiff(EVENTS['evt-deep-listening'].date) === 14 && EVENTS['evt-world-borderland-2026'].date === '2026-07-20'; }),
      'trust: the app runs on today\'s date; mock events keep their place relative to it, real ones keep their dates');
    await c.goto(URL + '#/explore/events?view=calendar'); await c.waitForTimeout(400);
    ok(await ev(c, () => (document.querySelector('#calcol .calcell.today') || {}).getAttribute && document.querySelector('#calcol .calcell.today').getAttribute('data-id') === TODAY_ISO), 'trust: the calendar\'s Today is today');
    ok(await ev(c, () => { const t = tsIso(Date.UTC(2026, 9, 1, 8, 30)); return t === '2026-10-01T08:30:00.000Z' && isoMs(t) === Date.UTC(2026, 9, 1, 8, 30); }), 'trust: timestamps are UTC ISO strings');
    /* the logged-out bar says what Hypernet is */
    ok(await ev(c, () => /find the events your people are going to/.test(document.getElementById('previewbar').textContent)), 'trust: logged out, the preview bar says what Hypernet is in one line');
    /* the demo account is a small link at the bottom of Join, never the main action */
    await c.evaluate(() => loginDialog()); await c.waitForTimeout(150);
    ok(await ev(c, () => { const l = document.querySelector('.dlg .demolink [data-act="useacct"][data-id="demo"]'), f = document.getElementById('pfbody');
      return !!l && !!f && !!(f.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING) && !document.querySelector('.dlg .linkrow[data-id="demo"]') && /demo account/.test(l.textContent); }),
      'trust: Join shows the demo account as a small text link under the form');
    await c.click('.dlg [data-act="closedlg"]'); await c.waitForTimeout(150);
    /* an "Only me" event: its host sees it; logged out and another account see it nowhere */
    await join(c, 'Pia Host', 'piahost');
    const when = await ev(c, () => shiftIso(TODAY_ISO, 10));
    await newEvent(c, { title:'Quiet supper zq', date:when, privacy:'only_me' });
    const sid = await ev(c, () => MYEVENTS[MYEVENTS.length - 1]);
    await c.evaluate(() => runCmd('new-horizon')); await c.waitForTimeout(200);
    ok(await ev(c, () => /list of events someone curates/.test(document.querySelector('.dlg').textContent)), 'trust: New Event Horizon says what a horizon is');
    await c.fill('#nh-n', 'Pia picks'); await c.check('#nh-p'); await c.click('#nh-go'); await c.waitForTimeout(400);
    const phz = await ev(c, () => MYHORIZONS[MYHORIZONS.length - 1]);
    await c.evaluate(([e, h]) => { toggleInHorizon(e, h); toggleInHorizon('evt-fill-3', h); setRSVP(e, 'going'); }, [sid, phz]); await c.waitForTimeout(300);
    const seen = () => ev(c, ([id, h]) => {
      const T = 'Quiet supper zq';
      return { feed:feedEvents().some(e => e.id === id), search:searchItems('supper zq').some(it => it.id === id), act:activityRows().some(a => a.objId === id || ((a.extra && a.extra.eventIds) || []).indexOf(id) >= 0),
               hz:hzEventIds(h).indexOf(id) >= 0, route:validItem({ type:'event', id }), cal:(S.folder = { kind:'explore', id:'events' }, destEvents().some(e => e.id === id)) };
    }, [sid, phz]);
    const host = await seen();
    ok(host.feed && host.search && host.hz && host.route && host.cal, 'trust: the host sees their Only me event ' + JSON.stringify(host));
    const path = await ev(c, id => '#/' + itemPath({ type:'event', id }), sid), hzPath = await ev(c, h => '#/' + itemPath({ type:'horizon', id:h }), phz);
    const pageText = async h => { await c.goto(URL + h); await c.waitForTimeout(350); return ev(c, () => document.getElementById('app').innerText); };
    await c.evaluate(() => doLogout()); await c.waitForTimeout(250);
    for (const who of ['logged out', 'another account']){
      if (who === 'another account'){ await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(300); }
      const v = await seen();
      ok(!v.feed && !v.search && !v.act && !v.hz && !v.route && !v.cal, 'trust: ' + who + ': an Only me event is in no list, search, activity, horizon, calendar or route ' + JSON.stringify(v));
      const texts = [await pageText('#/home'), await pageText('#/explore/events'), await pageText('#/explore'), await pageText(hzPath), await pageText('#/search?q=zq'), await pageText(path)];
      ok(texts.every(t => t.indexOf('Quiet supper zq') < 0) && /private or no longer/.test(texts[5]), 'trust: ' + who + ': and no screen shows it; its link says private');
      if (who === 'another account') ok(await ev(c, h => hzEventIds(h).join() === 'evt-fill-3', phz), 'trust: another account sees the horizon\'s public event only');
    }
    /* Friends = the people the host follows */
    await c.evaluate(() => doLogout()); await c.waitForTimeout(200);
    await c.evaluate(id => { useAcct('me'); EVENTS[id].privacy = 'friends'; followP('p-michal'); doLogout(); useAcct('demo'); }, sid); await c.waitForTimeout(300);
    ok(await ev(c, id => canSee(id) && feedEvents().some(e => e.id === id), sid), 'trust: Friends: someone the host follows sees it');
    await c.evaluate(id => { doLogout(); }, sid); await c.waitForTimeout(200);
    ok(await ev(c, id => !canSee(id), sid), 'trust: Friends: logged out does not');
    /* a newly joined account is a person to everyone else: People, people search, New chat */
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(300);
    await c.goto(URL + '#/explore/people'); await c.waitForTimeout(400);
    ok(await ev(c, () => !!document.querySelector('#listbody .row[data-type="person"][data-id="u-me"]') && searchItems('Pia Host').some(it => it.type === 'person' && it.id === 'u-me')), 'trust: a newly joined account is in another account\'s People and people search');
    await c.evaluate(() => runCmd('newchat')); await c.waitForTimeout(200);
    ok(await ev(c, () => !!document.querySelector('#nc-list [data-act="ncdm"][data-id="u-me"]')), 'trust: and in New chat');
    await c.click('.dlg [data-act="closedlg"]'); await c.waitForTimeout(150);
    ok(!c.errors.length, 'trust: no console errors (privacy, network) ' + c.errors.join(' '));
  }
  {
    /* two people called Kai: the handle tells them apart */
    const c = await ctx('desk');
    await open(c, '', true);
    await join(c, 'Kai Lindqvist', 'kailow');
    await c.evaluate(() => { doLogout(); useAcct('demo'); }); await c.waitForTimeout(300);
    ok(await ev(c, () => shortName('p-kai') === 'Kai @kai' && shortName('u-me') === 'Kai @kailow' && shortName('p-anna') === 'Anna' && networkPeople().indexOf('u-me') >= 0),
       'trust: two Kais are told apart by handle');
    /* an expired call out is closed: not listed as open, no Answer, answering it opens no chat */
    await c.evaluate(() => { CALLOUTS.filter(x => x.id === 'co-kitchen')[0].expiresAt = shiftIso(TODAY_ISO, -1); render(); }); await c.waitForTimeout(200);
    await c.goto(URL + '#/explore/callouts'); await c.waitForTimeout(400);
    const co = await ev(c, () => {
      const k = calloutOf('co-kitchen'), n = Object.keys(CHATS).length, open0 = S.chatOpen;
      answerCallout('co-kitchen');
      return { open:calloutOpen(k), listed:!!document.querySelector('#listbody .row[data-id="co-kitchen"]'), menu:ctxItems({ type:'callout', id:'co-kitchen' }).some(i => i && i.code === 'answer'),
               chat:Object.keys(CHATS).length !== n || S.chatOpen !== open0, act:activityRows().some(a => a.objId === 'co-kitchen'),
               other:calloutOpen(calloutOf('co-sound')) && ctxItems({ type:'callout', id:'co-sound' }).some(i => i && i.code === 'answer') };
    });
    ok(!co.open && !co.listed && !co.menu && !co.chat && !co.act && co.other, 'trust: an expired call out is closed — not listed, no Answer, no chat, gone from activity ' + JSON.stringify(co));
    /* a call out with nobody behind it cannot be answered (never someone else instead) */
    ok(await ev(c, () => { const k = calloutOf('co-sound'); const h = k.hostId; k.hostId = null; const n = Object.keys(CHATS).length; answerCallout('co-sound');
      const r = Object.keys(CHATS).length === n && !ctxItems({ type:'callout', id:'co-sound' }).some(i => i && i.code === 'answer'); k.hostId = h; return r; }), 'trust: a call out with no known author has no Answer');
    /* colours that aren't hex never reach a style attribute; images must be picture data URLs */
    const col = await ev(c, () => {
      window.HYPERNET_THEMES.themes['evt-fill-2'] = { bg:'#000;" onmouseover="window.__x=1', ink:'red', accent:'#12345', image:'javascript:alert(1)', glyph:'◆' };
      const t = TH('evt-fill-2'), v = themeVars({ bg:'url(x)', ink:'#000', accent:'expression(1)' });
      openItem('event', 'evt-fill-2'); render();
      return { bg:t.bg === HN_PLAIN.bg && t.ink === HN_PLAIN.ink && t.accent === HN_PLAIN.accent && t.image === null, vars:!/url|expression/.test(v),
               attr:!document.querySelector('[onmouseover]'), page:!!document.querySelector('.pg-event.plain'),
               img:HN_IMAGE('data:image/svg+xml;base64,PHN2Zz4=') === null && HN_IMAGE('data:image/png;base64,iVBORw0KGgo=') !== null && HN_IMAGE('https://evil.example/x.png') === null };
    });
    ok(Object.values(col).every(Boolean), 'trust: an invalid colour or image falls back to plain ' + JSON.stringify(col));
    /* storage: render alone writes nothing; a full browser says so once, for both keys */
    const st = await ev(c, async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms)), orig = Storage.prototype.setItem; let n = 0;
      await sleep(500);
      Storage.prototype.setItem = function(){ n++; return orig.apply(this, arguments); };
      for (let i = 0; i < 5; i++) render();
      await sleep(500); const idle = n;
      Storage.prototype.setItem = function(){ const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; };
      followP('p-jon'); await sleep(500);
      const t1 = (document.querySelector('#toasts') || {}).textContent || '';
      document.getElementById('toasts').innerHTML = '';
      followP('p-mira'); await sleep(500);
      const t2 = (document.querySelector('#toasts') || {}).textContent || '';
      Storage.prototype.setItem = orig;
      return { idle, full:/storage is full/.test(t1), once:!/storage is full/.test(t2) };
    });
    ok(st.idle === 0 && st.full && st.once, 'trust: renders with no change write nothing; a full store warns once ' + JSON.stringify(st));
    ok(!c.errors.length, 'trust: no console errors (callouts, colours, storage) ' + c.errors.join(' '));
  }
  /* a shared horizon link opens at its title and says what a horizon is, at every width */
  for (const kind of ['phone', 'tab', 'desk']){
    const c = await ctx(kind);
    await open(c, '#/horizon/baltic', true);
    const hz = await ev(c, () => { const h1 = document.querySelector('.pg-horizon h1.hl'), sc = h1 && h1.closest('.panel');
      const r = h1 && h1.getBoundingClientRect(), pr = sc && sc.getBoundingClientRect();
      return { title:!!h1 && r.top >= pr.top - 1 && r.bottom <= pr.bottom, note:/list of events someone curates/.test((document.querySelector('.pg-horizon .pgnote') || {}).textContent || '') }; });
    ok(hz.title && hz.note, kind + ': a shared horizon link opens at its title, with what a horizon is ' + JSON.stringify(hz));
    ok((await overflow(c)) <= 0, kind + ': horizon page, no horizontal overflow');
    await c.evaluate(() => loginDialog()); await c.waitForTimeout(200);
    ok((await overflow(c)) <= 0, kind + ': Join dialog, no horizontal overflow');
    ok(!c.errors.length, kind + ': no console errors (horizon link) ' + c.errors.join(' '));
  }

  /* ---------------- 2026-10-04: Coming up with your people keeps its left edge; its dates are centred ---------------- */
  for (const kind of ['desk', 'tab', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    await c.goto(URL + '#/home'); await c.waitForTimeout(450);
    if (kind !== 'phone'){
      /* a lit row, a hovered row and the band: the list's frame stays drawn down its left edge */
      if (kind === 'desk'){ await pick(c, '#listbody .fuprow .flink >> nth=0'); await c.waitForTimeout(300); }
      await c.evaluate(() => { const f = document.querySelector('#listbody .fup'); const lb = $('listbody'); lb.scrollTop += f.getBoundingClientRect().top - lb.getBoundingClientRect().top - 40; });
      await c.hover('#listbody .fuprow >> nth=2', { position:{ x:8, y:8 } }); await c.waitForTimeout(200);
      const box = await ev(c, () => { const l = $('listcol').getBoundingClientRect(), f = document.querySelector('#listbody .fup').getBoundingClientRect();
        return { x:Math.round(l.left), y:Math.round(Math.max(f.top, l.top + 2)), width:2, height:Math.round(Math.min(f.bottom, l.bottom - 2) - Math.max(f.top, l.top + 2)) }; });
      const png = await c.screenshot({ clip:box });
      const edge = await ev(c, async b64 => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, cv.width, cv.height).data, light = [];
        for (let y = 0; y < cv.height; y++){ const i = (y * cv.width + 1) * 4; if ((d[i] + d[i + 1] + d[i + 2]) / 3 > 110) light.push(y); }
        return { h:cv.height, light:light.length };
      }, png.toString('base64'));
      ok(edge.h > 150 && edge.light === 0, kind + ': Coming up with your people — the list frame\'s left edge is drawn the whole way down (band, lit and hovered rows) ' + JSON.stringify(edge));
    }
    /* B2: each row is a thing (a 48 square, three lines) with its date at the right: "7 Oct" over "Wed", both flush right with the row's edge */
    const dates = await ev(c, () => [...document.querySelectorAll('#listbody .fupd')].map(d => {
      const row = d.closest('.fuprow').getBoundingClientRect(), r = d.getBoundingClientRect(), rg = document.createRange(), out = [];
      [...d.childNodes].forEach(n => { rg.selectNodeContents(n); [...rg.getClientRects()].forEach(q => { if (q.width) out.push(Math.abs(q.right - r.right)); }); });
      return { off:Math.max.apply(null, out.concat([0])), edge:Math.round(row.right - r.right), sq:d.closest('.fuprow').querySelector('.sq').offsetWidth, text:d.textContent };
    }));
    ok(dates.length >= 3 && dates.every(x => x.off <= 1.5 && x.edge === 16 && x.sq === 48 && /^\d+ \w{3}\w{3}$/.test(x.text)), kind + ': Coming up with your people — a 48 square per row, the date ("7 Oct", "Wed") flush right ' + JSON.stringify(dates));
    /* 2026-10-16: every thing on Home has a 48 square — a horizon with no events too (its cover once took the empty-state
       note's padding: 48 × 80, the glyph low and right), its glyph in the middle, and the same at 96 and 150 */
    const sqs = await ev(c, () => {
      const src = Object.keys(HORIZONS)[0];
      HORIZONS['hz-none'] = Object.assign({}, HORIZONS[src], { id:'hz-none', name:'Co-residencies', eventIds:[], isPublished:true });
      const box = document.createElement('div'); box.className = 'fitem'; box.innerHTML = fHorizonCard('hz-none') + hzMosaic('hz-none', 96) + mosaicOf([], 150);
      document.querySelector('#listbody .fitem').before(box);
      const off = m => { const r = m.getBoundingClientRect(), g = m.querySelector('svg').getBoundingClientRect();
        return [Math.round(r.width), Math.round(r.height), Math.round(g.left + g.width / 2 - r.left - r.width / 2), Math.round(g.top + g.height / 2 - r.top - r.height / 2)].join(' '); };
      const out = { empty:[...box.querySelectorAll('.mosaic')].map(off),
        bad:[...document.querySelectorAll('#listbody .fcard > :first-child, #listbody .fcoe > :first-child')].filter(m => m.offsetWidth !== 48 || m.offsetHeight !== 48).map(m => m.className + ' ' + m.offsetWidth + 'x' + m.offsetHeight) };
      box.remove(); delete HORIZONS['hz-none'];
      return out;
    });
    ok(sqs.empty.join() === '48 48 0 0,96 96 0 0,150 150 0 0' && !sqs.bad.length, kind + ': Home — every thing\'s square is 48 × 48, an empty horizon\'s glyph centred (48, 96, 150) ' + JSON.stringify(sqs));
    ok((await overflow(c)) <= 0 && !c.errors.length, kind + ': Home, no horizontal overflow, no console errors ' + c.errors.join(' '));
  }

  /* 2026-10-05 (v5-pictures): every real event whose own site has a picture wears it as its square (data/real-events.json
     `picture`, a 512 JPEG in data/pictures; online the same file comes from storage). Explore, Home and the event page show
     it, the next edition inherits it, an event without one (Čarodění) keeps its glyph, a picture someone chose is never
     replaced, every picture loads (no 404s) and every file in data/pictures belongs to an event. */
  {
    const real = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data/real-events.json'), 'utf8')).events.filter(e => !e.illustrative);
    const pics = real.filter(e => e.picture).map(e => e.picture), files = fs.readdirSync(path.join(__dirname, '..', 'data/pictures')).map(f => 'data/pictures/' + f);
    ok(pics.length >= 10 && pics.every(f => /^data\/pictures\/[a-z0-9-]+\.jpg$/.test(f) && files.includes(f)) && files.every(f => pics.includes(f)) && real.some(e => !e.picture),
       'pictures: each real event names a file in data/pictures, each file belongs to one, and an event may have none ' + JSON.stringify([pics.length, files.length]));
    for (const kind of ['desk', 'phone']){
      const c = await ctx(kind);
      await open(c, '#/explore', true);
      await c.waitForFunction(() => [...document.images].every(i => i.complete));
      const st = await ev(c, () => {
        const withPic = Object.keys(REC).filter(k => REC[k] && REC[k].picture);
        return { n:withPic.length, wear:withPic.filter(k => TH(k).image !== REC[k].picture),
                 bare:REALIDS.filter(k => !REC[k].picture).map(k => [k, TH(k).image]),
                 next:REALIDS.filter(k => REC[k]._prev && REC[k].picture).length,
                 cards:[...document.querySelectorAll('#listbody .card2[data-type="event"]')].filter(x => REALIDS.indexOf(x.getAttribute('data-id')) >= 0).map(x => {
                   const r = REC[x.getAttribute('data-id')], im = x.querySelector('.cart img');
                   return { id:x.getAttribute('data-id'), pic:r.picture || null, src:im && im.getAttribute('src'), w:im ? im.naturalWidth : 0, h:im ? im.naturalHeight : 0, glyph:!!x.querySelector('.cart .g') }; }) };
      });
      const shown = st.cards.filter(x => x.pic), bad = st.cards.filter(x => x.pic ? !(x.src === x.pic && x.w === 512 && x.h === 512) : (x.src || !x.glyph));
      ok(st.n >= 10 && !st.wear.length && st.next >= 3 && st.bare.length >= 1 && st.bare.every(x => x[1] == null) && shown.length >= 5 && !bad.length,
         kind + ': real events wear the picture from their own site on Explore (512 squares, loaded), next editions too, Čarodění keeps its glyph ' + JSON.stringify({ n:st.n, wear:st.wear, next:st.next, bare:st.bare, shown:shown.length, bad }));
      const all = await ev(c, () => Promise.all([...new Set(Object.keys(REC).map(k => REC[k] && REC[k].picture).filter(Boolean))].map(src => new Promise(res => {
        const i = new Image(); i.onload = () => res([src, i.naturalWidth, i.naturalHeight]); i.onerror = () => res([src, 0, 0]); i.src = src; }))));
      ok(all.length >= 10 && all.every(x => x[1] === 512 && x[2] === 512), kind + ': every real event picture loads as a 512 square ' + JSON.stringify(all.filter(x => x[1] !== 512 || x[2] !== 512)));
      /* the event page's own square */
      await c.goto(URL + '#/event/burning-man-2027'); await c.waitForTimeout(450);
      await c.waitForFunction(() => [...document.images].every(i => i.complete));
      ok(await ev(c, () => { const im = document.querySelector('#win .banner .sq img'); return !!im && im.getAttribute('src') === 'data/pictures/burning-man.jpg' && im.naturalWidth === 512; }),
         kind + ': the event page shows the real event\'s picture in its square');
      if (kind === 'desk'){
        await shot(c, 'pictures-1440-event');
        /* Home: the things in the stream are squares too */
        await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
        await c.goto(URL + '#/home'); await c.waitForTimeout(450);
        await c.waitForFunction(() => [...document.images].every(i => i.complete));
        const hm = await ev(c, () => [...document.querySelectorAll('#listbody img')].filter(i => /^data\/pictures\//.test(i.getAttribute('src'))).map(i => i.naturalWidth));
        ok(hm.length >= 1 && hm.every(w => w === 512), 'desk: Home shows real events with their pictures ' + JSON.stringify(hm));
      }
      /* a picture someone chose stays: merging the record again does not replace it */
      ok(await ev(c, () => { const k = REALIDS.filter(x => REC[x].picture)[0], mine = 'data:image/png;base64,iVBORw0KGgo=';
        window.HYPERNET_THEMES.themes[k] = Object.assign({}, TH(k), { image:mine }); mergeReal(REC[k]); return TH(k).image === mine; }), kind + ': a picture someone chose is not replaced by the site\'s');
      ok(!c.errors.length, kind + ': no console errors or failed requests with the pictures ' + c.errors.join(' '));
    }
  }

  /* ---------------- 2026-10-04: Explore's overview is squares at every width, its kinds and old links stay ---------------- */
  for (const kind of ['desk', 'tab', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    await c.goto(URL + '#/explore'); await c.waitForTimeout(450);
    const ov = await ev(c, () => { const carts = [...document.querySelectorAll('#listbody .shelf .srow[data-shelf] .card2 .cart')];
      return { shelves:document.querySelectorAll('#listbody .shelf').length, cards:carts.length, square:carts.every(x => { const r = x.getBoundingClientRect(); return r.width >= 140 && Math.abs(r.width - r.height) < 1; }),
               rows:document.querySelectorAll('#listbody .row').length, titles:[...document.querySelectorAll('#listbody .shelf .shh h3')].map(h => h.firstChild.textContent.trim()) }; });
    ok(ov.shelves >= 4 && ov.cards >= 10 && ov.square && !ov.rows && ov.titles.indexOf('This week') === 0, kind + ': Explore\'s overview is shelves of squares, not rows ' + JSON.stringify(ov));
    if (kind === 'phone') ok(await ev(c, () => [...document.querySelectorAll('#chead .kinds .kind')].map(x => x.textContent).join('|') === 'All|Events|Horizons|Call outs|People'), 'phone: Explore keeps its kinds as tabs over the squares');
    else ok(await ev(c, () => [...document.querySelectorAll('#navbody .nsubrow .nlab')].map(x => x.textContent).join('|') === 'Events|Event Horizons|Call outs|People' && !!document.querySelector('#navbody .nrow.sel .nlab') && document.querySelector('#navbody .nrow.sel').textContent.indexOf('Explore') >= 0),
       kind + ': Explore keeps its four kinds under it in the sidebar, Explore lit');
    if (kind !== 'phone'){
      /* 2026-10-04 (layout): on a desktop or tablet each section is one row of whole squares that fills the container —
         nothing to scroll sideways, nothing cut at the edge, the same columns in every section; Show all when there is more */
      const fit = await ev(c, () => { const lb = document.getElementById('listbody'), cs = getComputedStyle(lb), r = lb.getBoundingClientRect();
        const left = r.left + lb.clientLeft + parseFloat(cs.paddingLeft) + 16, right = r.left + lb.clientLeft + lb.clientWidth - parseFloat(cs.paddingRight) - 16;
        const secs = [...document.querySelectorAll('#listbody .shelf')].map(sh => { const row = sh.querySelector('.srow'), cards = [...row.querySelectorAll('.card2')].map(x => x.getBoundingClientRect()), id = row.getAttribute('data-shelf');
          return { id, n:cards.length, total:homeSections().find(x => x.id === id).items.length, xs:cards.map(q => Math.round(q.left)), right:cards.length ? Math.round(cards[cards.length - 1].right) : 0,
                   scroll:row.scrollWidth - row.clientWidth, oneRow:cards.every(q => Math.abs(q.top - cards[0].top) < 1), all:!!sh.querySelector('.showall') }; });
        return { cols:L.fit.cols, left:Math.round(left), right:Math.round(right), secs, arrows:document.querySelectorAll('#listbody [data-act="shelfstep"]').length }; });
      const full = fit.secs.filter(x => x.n === fit.cols);
      ok(fit.cols >= 3 && !fit.arrows && fit.secs.every(x => x.scroll <= 0 && x.oneRow && x.n === Math.min(x.total, fit.cols) && x.all === (x.total > fit.cols) && x.xs[0] === fit.left)
         && full.length >= 1 && full.every(x => x.right <= fit.right && fit.right - x.right < fit.cols && x.xs.join() === full[0].xs.join()),
         kind + ': each section is one row of whole squares filling the container, the same columns in every section, Show all for the rest ' + JSON.stringify(fit));
    }
    if (kind === 'desk'){
      /* the keyboard walks the squares, shelf by shelf, and the open one is lit */
      await c.evaluate(() => document.activeElement && document.activeElement.blur());
      const first = await ev(c, () => { const x = document.querySelector('#listbody .srow .card2'); return x.getAttribute('data-type') + ':' + x.getAttribute('data-id'); });
      await c.keyboard.press('ArrowDown'); await c.waitForTimeout(300);
      ok(await ev(c, f => S.stack.length === 1 && S.stack[0].type + ':' + S.stack[0].id === f && !!document.querySelector('#listbody .card2.sel[data-id="' + f.split(':')[1] + '"]') && !document.getElementById('win').hidden, first),
         'desk: ↓ on Explore opens the first square in the window and lights it');
      await c.keyboard.press('Escape'); await c.waitForTimeout(250);
      await c.click('#listbody .srow[data-shelf="soon"] .card2 >> nth=1'); await c.waitForTimeout(300);
      ok(await ev(c, () => S.stack.length === 1 && S.stack[0].type === 'event' && document.querySelector('#listbody .srow[data-shelf="soon"] .card2.sel') === document.querySelectorAll('#listbody .srow[data-shelf="soon"] .card2')[1]), 'desk: a square opens in the window and is lit');
    }
    /* Show all and the old section links are still lists */
    for (const h of ['#/explore/soon', '#/explore/announced', '#/home/week']){
      await c.goto(URL + h); await c.waitForTimeout(400);
      ok(await ev(c, () => S.folder.kind === 'shelf' && document.querySelectorAll('#listbody .row[data-type="event"]').length >= 1 && !document.querySelector('#listbody .shelf')), kind + ': ' + h + ' is still its Show all list');
    }
    await c.goto(URL + '#/explore'); await c.waitForTimeout(400);
    await c.click('#listbody .shelf .showall >> nth=0'); await c.waitForTimeout(350);
    ok(await ev(c, () => S.folder.kind === 'shelf' && /^#\/explore\//.test(location.hash) && document.querySelectorAll('#listbody .row').length >= 1), kind + ': a shelf\'s Show all opens its list');
    await c.goto(URL + '#/explore'); await c.waitForTimeout(400);
    ok((await overflow(c)) <= 0 && !c.errors.length, kind + ': Explore squares, no horizontal overflow, no console errors ' + c.errors.join(' '));
    if (kind !== 'tab') await shot(c, 'explore-squares-' + kind);
  }

  /* ---------------- 2026-10-04: Add events to a horizon has filters ---------------- */
  for (const kind of ['desk', 'tab', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    const hz = await ev(c, () => MYHORIZONS[0]);
    await c.evaluate(h => { goFolder({ kind:'explore', id:'horizons' }); S.stack = [{ type:'horizon', id:h }]; render(); }, hz); await c.waitForTimeout(350);
    await c.click('#dscroll [data-act="addevents"]'); await c.waitForTimeout(300);
    const chips = () => ev(c, () => [...document.querySelectorAll('.dlg #pk-chips .pkchip')].map(b => ({ id:b.getAttribute('data-id'), label:b.firstChild.textContent.trim(), n:+b.querySelector('.n').textContent, on:b.getAttribute('aria-pressed') === 'true' })));
    const c0 = await chips();
    ok(c0.map(x => x.label).join('|') === 'All upcoming|Going|Interested|Hosting|From people you follow|Past' && c0[0].on && !!(await c.$('.dlg #pk-q')), kind + ': Add events has a search and six filters, All upcoming first and on ' + JSON.stringify(c0.map(x => x.label + ' ' + x.n)));
    /* each filter holds what it says, its count is what it shows, and an empty one says so */
    const seen = {};
    for (const f of c0){
      await c.click('.dlg #pk-chips .pkchip[data-id="' + f.id + '"]'); await c.waitForTimeout(150);
      seen[f.id] = await ev(c, id => {
        const ids = [...document.querySelectorAll('#pk-list input[data-act="pkpick"]')].map(i => i.getAttribute('data-id')), es = ids.map(x => EVENTS[x]);
        const fol = e => { const hp = hostPersonOf(e); return !!hp && hp.id !== 'self' && !!PFOLLOW[hp.id]; };
        const okIn = { upcoming:e => !isPast(lastDay(e)), going:e => !isPast(lastDay(e)) && RSVP[e.id] === 'going', interested:e => !isPast(lastDay(e)) && RSVP[e.id] === 'interested',
                       hosting:e => !isPast(lastDay(e)) && MYEVENTS.indexOf(e.id) >= 0, people:e => !isPast(lastDay(e)) && fol(e), past:e => isPast(lastDay(e)) }[id];
        const dates = es.map(e => e.date), sorted = dates.slice().sort(); if (id === 'past') sorted.reverse();
        return { n:ids.length, all:es.every(okIn), order:dates.join() === sorted.join(), on:document.querySelector('.pkchip[data-id="' + id + '"]').getAttribute('aria-pressed') === 'true',
                 empty:!!document.querySelector('#pk-list .pkempty'), why:id !== 'people' || [...document.querySelectorAll('#pk-list .pkwhy')].length === ids.length };
      }, f.id);
      const r = seen[f.id];
      ok(r.on && r.all && r.order && r.why && r.n === f.n && (r.n > 0 || r.empty), kind + ': filter ' + f.label + ' shows its ' + f.n + ' events and only those, in order ' + JSON.stringify(r));
    }
    ok(seen.going.n >= 1 && seen.hosting.n >= 1 && seen.people.n >= 1 && seen.past.n >= 1 && seen.upcoming.n > seen.people.n, kind + ': the demo has something under Going, Hosting, From people you follow and Past');
    /* the search narrows every count; an empty filter says so and offers where the matches are */
    await c.click('.dlg #pk-chips .pkchip[data-id="going"]'); await c.waitForTimeout(100);
    await c.fill('#pk-q', 'zurich'); await c.waitForTimeout(200);
    const q = await chips();
    const em = await ev(c, () => ({ msg:(document.querySelector('#pk-list .pkempty') || {}).textContent || '', alt:(document.querySelector('#pk-list .pkempty [data-act="pkfilter"]') || { getAttribute:() => '' }).getAttribute('data-id') }));
    ok(q.find(x => x.id === 'upcoming').n >= 1 && q.find(x => x.id === 'upcoming').n < c0[0].n && q.find(x => x.id === 'going').n === 0 && /Nothing in Going matches “zurich”/.test(em.msg) && em.alt === 'upcoming',
       kind + ': search narrows the counts; an empty filter says so and offers All upcoming ' + JSON.stringify(em));
    await c.click('#pk-list .pkempty [data-act="pkfilter"]'); await c.waitForTimeout(150);
    const pick = await ev(c, () => ({ on:document.querySelector('.pkchip.on').getAttribute('data-id'), id:(document.querySelector('#pk-list input[data-act="pkpick"]:not(:checked)') || { getAttribute:() => null }).getAttribute('data-id') }));
    ok(pick.on === 'upcoming' && !!pick.id, kind + ': … and that button switches to it');
    /* ticking under a filter and Done adds it */
    await c.fill('#pk-q', ''); await c.waitForTimeout(100);
    await c.click('.dlg #pk-chips .pkchip[data-id="people"]'); await c.waitForTimeout(150);
    const add = await ev(c, () => { const i = document.querySelector('#pk-list input[data-act="pkpick"]:not(:checked)'); i.click(); return i.getAttribute('data-id'); });
    ok((await overflow(c)) <= 0, kind + ': Add events with filters, no horizontal overflow');
    if (kind === 'phone') ok(await ev(c, () => { const r = document.getElementById('pk-chips'); return getComputedStyle(r).flexWrap === 'nowrap' && r.scrollWidth > r.clientWidth && r.getBoundingClientRect().height < 60; }), 'phone: the filters are one sideways row');
    await shot(c, 'horizon-picker-' + kind);
    await c.click('.dlg [data-act="pkdone"]'); await c.waitForTimeout(300);
    ok(await ev(c, ([h, id]) => HORIZONS[h].eventIds.indexOf(id) >= 0, [hz, add]), kind + ': an event ticked under From people you follow is added');
    ok(!c.errors.length, kind + ': no console errors (Add events filters) ' + c.errors.join(' '));
  }

  /* ---------------- 2026-10-16: Add events: New event and From a link (an event that already exists elsewhere) ---------------- */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    const hz = await ev(c, () => MYHORIZONS[0]);
    const toHz = async () => { await c.evaluate(h => { goFolder({ kind:'explore', id:'horizons' }); S.stack = [{ type:'horizon', id:h }]; render(); }, hz); await c.waitForTimeout(350); };
    await toHz();
    await c.click('#dscroll [data-act="addevents"]'); await c.waitForTimeout(300);
    ok(await ev(c, () => !!document.querySelector('.dlg .pksearch [data-act="pknewev"]') && !!document.querySelector('.dlg .pksearch [data-act="pklink"]')),
       kind + ': Add events offers New event and From a link above the search');
    await c.click('.dlg [data-act="pklink"]'); await c.waitForTimeout(200);
    ok(await ev(c, () => document.querySelector('.dlg .dtitle').textContent === 'Add an event from a link' && document.activeElement.id === 'lk-u'),
       kind + ': From a link turns the dialog into the link form, the cursor in the link');
    await c.fill('#lk-u', 'billetto.se/e/w-a-mozart-requiem-biljetter-1984010'); await c.press('#lk-u', 'Enter'); await c.waitForTimeout(200);
    const f0 = await ev(c, () => ({ url:DRAFT.url, filled:DRAFT.filled, need:document.getElementById('wiz-need').textContent, dis:document.querySelector('.dlg [data-act="lkadd"]').getAttribute('aria-disabled') }));
    ok(f0.url === 'https://billetto.se/e/w-a-mozart-requiem-biljetter-1984010' && f0.filled, kind + ': Enter is Autofill; offline it opens the fields to fill in by hand ' + JSON.stringify(f0));
    ok(/who puts it on/.test(f0.need) && f0.dis === 'true', kind + ': Add event waits for what is missing, who puts it on included');
    await c.fill('#lk-h', 'Svenska kyrkan Hägersten'); await c.fill('#w-t', 'W A Mozart: Requiem'); await c.fill('#w-d', '2026-10-17');
    await c.fill('#w-c', 'Hägersten'); await c.selectOption('#w-k', 'ticket'); await c.waitForTimeout(150);
    await c.click('.dlg [data-act="lkadd"]'); await c.waitForTimeout(300);
    const id = await ev(c, () => ADDEDBYME[ADDEDBYME.length - 1]);
    ok(await ev(c, i => { const r = document.querySelector('#pk-list .pick'); return !!r && r.querySelector('input').getAttribute('data-id') === i && r.querySelector('input').checked && /Add 1 event/.test(document.querySelector('.dlg .dfoot').textContent); }, id),
       kind + ': the added event is back in the list, ticked, at the top');
    await c.click('.dlg [data-act="pkdone"]'); await c.waitForTimeout(300);
    ok(await ev(c, ([h, i]) => HORIZONS[h].eventIds.indexOf(i) >= 0 && EVENTS[i].kind === 'link' && EVENTS[i].privacy === 'everyone' && MYEVENTS.indexOf(i) < 0, [hz, id]),
       kind + ': it is on the horizon, public, and not in your Hosting');
    await c.evaluate(i => { S.stack = [{ type:'event', id:i }]; render(); }, id); await c.waitForTimeout(350);
    const pg = await ev(c, () => { const w = L.phone ? document.body : document.getElementById('win');
      return { credit:[...w.querySelectorAll('.srcline')].map(x => x.textContent).join(' '), host:!!w.querySelector('.pill.host'), edit:!!document.querySelector('[data-act="editevent"]'),
               callout:!!document.querySelector('[data-act="newcalloutfor"]'), link:[...w.querySelectorAll('.chips a')].some(a => /billetto\.se/.test(a.href)) }; });
    ok(/Added from billetto\.se by you/.test(pg.credit) && pg.link, kind + ': its page credits who added it and links to its page ' + JSON.stringify(pg));
    ok(pg.edit && !pg.host && !pg.callout, kind + ': whoever added it may edit it, without the host\'s verbs');
    /* New event from Add events: once published it is on the horizon */
    await toHz();
    await c.click('#dscroll [data-act="addevents"]'); await c.waitForTimeout(300);
    await c.click('.dlg [data-act="pknewev"]'); await c.waitForTimeout(300);
    await answerHost(c, 'mine', 'upcoming');
    ok(await ev(c, h => document.querySelector('.dlg .dtitle').textContent === 'New event for ' + HORIZONS[h].name, hz), kind + ': New event from Add events says which horizon it is for');
    await c.fill('#w-t', 'Ridge sauna'); await c.fill('#w-d', '2030-11-02'); await c.fill('#w-c', 'Brno'); await c.waitForTimeout(100);
    await c.click('.dlg [data-id="next"]'); await c.waitForTimeout(150);
    await c.fill('#w-desc', 'Hot box on the ridge.'); await c.waitForTimeout(100);
    await c.click('.dlg [data-id="next"]'); await c.waitForTimeout(150);
    await c.click('.dlg [data-id="finish"]'); await c.waitForTimeout(350);
    ok(await ev(c, h => { const ids = HORIZONS[h].eventIds, last = EVENTS[ids[ids.length - 1]]; return last.title === 'Ridge sauna' && S.stack[0].type === 'horizon' && S.stack[0].id === h; }, hz),
       kind + ': the new event is published onto the horizon, which opens');
    ok((await overflow(c)) <= 0, kind + ': New event / From a link, no horizontal overflow');
    ok(!c.errors.length, kind + ': no console errors (From a link) ' + c.errors.join(' '));
  }

  /* New event asks who the host is before any details. I'm hosting continues the wizard.
     Someone else opens the link form: you are added_by, not the host. */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    await join(c, 'Host Ask', 'hostask' + kind);
    const ask = () => ev(c, () => {
      const opt = document.querySelector('.hostask-opt'), b = document.querySelector('.hostask-opt b'), s = document.querySelector('.hostask-opt small');
      const hex = el => '#' + getComputedStyle(el).color.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
      const ground = el => '#' + getComputedStyle(el).backgroundColor.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
      const themes = ['y2fresh', 'win2k'].map(t => {
        document.documentElement.setAttribute('data-theme', t);
        return { t:t, title:contrast(hex(b), ground(opt)), note:contrast(hex(s), ground(opt)) };
      });
      document.documentElement.setAttribute('data-theme', 'y2fresh');
      return { title:(document.querySelector('.dlg .dtitle') || {}).textContent || '', q:(document.querySelector('.hostask-q') || {}).textContent || '',
               when:(document.querySelector('#host-when-q') || {}).textContent || '',
               mine:!!document.querySelector('[data-act="hostask"][data-id="mine"]'), other:!!document.querySelector('[data-act="hostask"][data-id="other"]'),
               upcoming:!!document.querySelector('[data-act="hostwhen"][data-id="upcoming"]'), past:!!document.querySelector('[data-act="hostwhen"][data-id="past"]'),
               go:(document.querySelector('[data-act="hostask-go"]') || {}).getAttribute && document.querySelector('[data-act="hostask-go"]').getAttribute('aria-disabled'),
               fields:!!document.querySelector('#w-t, #lk-u'), themes:themes };
    });
    await c.evaluate(() => newEventDialog()); await c.waitForTimeout(250);
    const q0 = await ask();
    ok(q0.title === 'New event' && q0.q === 'Are you the host?' && q0.when === 'Is this a new event or did it already happen?' && q0.mine && q0.other && q0.upcoming && q0.past && q0.go === 'true' && !q0.fields && q0.themes.every(t => t.title >= 4.5 && t.note >= 4.5),
       kind + ': New event asks who hosts it and whether it happened, readable in both themes ' + JSON.stringify(q0));
    ok((await overflow(c)) <= 0, kind + ': host question, no horizontal overflow');
    await c.click('.dlg [data-act="hostask"][data-id="other"]'); await c.waitForTimeout(150);
    ok(await ev(c, () => !document.querySelector('#lk-u') && document.querySelector('[data-act="hostask-go"]').getAttribute('aria-disabled') === 'true'),
       kind + ': picking a host does not open the form until both answers are in');
    await answerHost(c, 'other', 'upcoming');
    ok(await ev(c, () => document.querySelector('.dlg .dtitle').textContent === 'Add an event from a link' && document.activeElement.id === 'lk-u' && !document.querySelector('.wizsteps')),
       kind + ': Someone else, upcoming, opens the link form, not the wizard');
    await c.click('.dlg [data-act="lkback"]'); await c.waitForTimeout(200);
    ok(await ev(c, () => !!document.querySelector('[data-act="hostask"][data-id="mine"]') && !!document.querySelector('#host-when-q') && !document.querySelector('#lk-u')),
       kind + ': Back from the link returns to both questions');
    await answerHost(c, 'mine', 'upcoming');
    ok(await ev(c, () => !!document.querySelector('#w-t') && !!document.querySelector('.dlg .wizsteps') && !document.querySelector('#lk-u') && document.querySelector('.dlg .dtitle').textContent === 'New event'),
       kind + ': I\'m hosting, upcoming, continues to the wizard');
    await c.click('.dlg [data-act="closedlg"]'); await c.waitForTimeout(150);
    await c.evaluate(() => newEventDialog()); await c.waitForTimeout(200);
    await answerHost(c, 'other', 'upcoming');
    await c.fill('#lk-u', 'https://tickets.example/fest'); await c.press('#lk-u', 'Enter'); await c.waitForTimeout(200);
    const off = await ev(c, () => ({ filled:!!DRAFT && DRAFT.filled, note:(DRAFT && DRAFT.note) || '' }));
    ok(off.filled && /fill in the details yourself/.test(off.note), kind + ': offline, Autofill opens the fields to fill in ' + JSON.stringify(off));
    await c.fill('#lk-h', 'City Festival'); await c.fill('#w-t', 'Night market ' + kind); await c.fill('#w-d', '2026-11-20'); await c.fill('#w-c', 'Brno'); await c.waitForTimeout(100);
    await c.click('.dlg [data-act="lkadd"]'); await c.waitForTimeout(350);
    const logged = await ev(c, () => {
      const id = ADDEDBYME[ADDEDBYME.length - 1], e = EVENTS[id];
      return { kind:e && e.kind, host:e && e.hostName, mine:MYEVENTS.indexOf(id) >= 0, privacy:e && e.privacy, added:ADDEDBYME.indexOf(id) >= 0,
               page:S.stack[0] && S.stack[0].id === id, credit:[...document.querySelectorAll('.srcline')].map(x => x.textContent).join(' ') };
    });
    ok(logged.kind === 'link' && logged.host === 'City Festival' && !logged.mine && logged.privacy === 'everyone' && logged.added && logged.page && /Added from tickets\.example by you/.test(logged.credit),
       kind + ': someone else is a link event you added, and you do not host it ' + JSON.stringify(logged));
    if (kind === 'desk'){
      const hz = await ev(c, () => {
        var hid = 'horizon-ask';
        HORIZONS[hid] = { id:hid, name:'Ask list', description:'', isPersonalDefault:false, isPublished:false, ownerName:S.me.name, ownerId:'self', ownerAcct:S.acct, eventIds:[] };
        MYHORIZONS.push(hid);
        return hid;
      });
      await c.evaluate(h => { goFolder({ kind:'explore', id:'horizons' }); S.stack = [{ type:'horizon', id:h }]; render(); }, hz); await c.waitForTimeout(350);
      await c.click('#dscroll [data-act="addevents"]'); await c.waitForTimeout(300);
      ok(await ev(c, () => !!document.querySelector('.dlg [data-act="pklink"]')), 'desk: From a link is still in Add events');
      await c.click('.dlg [data-act="pknewev"]'); await c.waitForTimeout(250);
      ok(await ev(c, h => document.querySelector('.dlg .dtitle').textContent === 'New event for ' + HORIZONS[h].name && !!document.querySelector('[data-act="hostask"][data-id="other"]'), hz),
         'desk: New event for a horizon asks the same question');
      await answerHost(c, 'other', 'upcoming');
      await c.fill('#lk-u', 'https://festival.example/ridge'); await c.press('#lk-u', 'Enter'); await c.waitForTimeout(200);
      await c.fill('#lk-h', 'Ridge Promoters'); await c.fill('#w-t', 'Ridge festival'); await c.fill('#w-d', '2026-12-01'); await c.fill('#w-c', 'Brno'); await c.waitForTimeout(100);
      await c.click('.dlg [data-act="lkadd"]'); await c.waitForTimeout(350);
      ok(await ev(c, h => { const id = ADDEDBYME[ADDEDBYME.length - 1]; return HORIZONS[h].eventIds.indexOf(id) >= 0 && EVENTS[id].kind === 'link' && MYEVENTS.indexOf(id) < 0 && EVENTS[id].hostName === 'Ridge Promoters'; }, hz),
         'desk: a horizon\'s someone-else event is on the horizon, logged by you, hosted by them');
    }
    if (kind === 'desk'){
      await c.evaluate(() => { closeDialogs(); FORMDRAFTS.event = null; newEventDialog(); }); await c.waitForTimeout(200);
      await answerHost(c, 'mine', 'past');
      const pastHost = await ev(c, () => ({ role:CHRONICLE_ADD, date:(document.getElementById('w-d') || {}).value || '', min:(document.getElementById('w-d') || {}).getAttribute && document.getElementById('w-d').getAttribute('min'), fill:!!document.getElementById('w-fill') }));
      ok(pastHost.role === 'host' && pastHost.date && pastHost.date < '2026-10-01' && !pastHost.min && pastHost.fill,
         'desk: I hosted it and it already happened opens the past wizard ' + JSON.stringify(pastHost));
      await c.evaluate(() => { closeDialogs(); CHRONICLE_ADD = null; FORMDRAFTS.event = null; newEventDialog(); }); await c.waitForTimeout(200);
      await answerHost(c, 'other', 'past');
      await c.fill('#lk-u', 'https://tickets.example/old'); await c.press('#lk-u', 'Enter'); await c.waitForTimeout(150);
      await c.fill('#lk-h', 'Old Festival'); await c.fill('#w-t', 'Old night'); await c.fill('#w-d', '2026-09-01'); await c.fill('#w-c', 'Brno');
      await c.click('.dlg [data-act="lkadd"]'); await c.waitForTimeout(300);
      const went = await ev(c, () => { const id = ADDEDBYME[ADDEDBYME.length - 1]; return { kind:EVENTS[id].kind, went:!!WENT[id], role:ROLE[id], mine:MYEVENTS.indexOf(id) >= 0 }; });
      ok(went.kind === 'link' && went.went && went.role === 'attendee' && !went.mine, 'desk: someone else and already happened is a past link you went to ' + JSON.stringify(went));
      await c.evaluate(() => { closeDialogs(); addPastEventDialog(); }); await c.waitForTimeout(200);
      ok(await ev(c, () => !document.querySelector('[data-act="hostask"]') && !!document.querySelector('input[name="ch-role"]')),
         'desk: Add past event skips the two questions');
      const pol = await ev(c, () => {
        closeDialogs();
        var id = 'evt-deep-listening';
        if (MYEVENTS.indexOf(id) < 0) MYEVENTS.push(id);
        eventControlsDialog(id);
        var keys = [...document.querySelectorAll('[data-act="evpolicy"]')].map(b => b.getAttribute('data-key') + ':' + b.getAttribute('aria-pressed'));
        return { keys:keys, old:/Only admins can add co-creators/.test(document.body.textContent) };
      });
      ok(pol.keys.join(',') === 'open:true,request:false,admins:false' && !pol.old, 'desk: Event controls has the three co-creator settings ' + JSON.stringify(pol));
    }
    ok(!c.errors.length, kind + ': no console errors (host ask) ' + c.errors.join(' '));
    await c.context().close();
  }

  /* A kept draft, even one restored from this browser, does not skip the host question.
     Toolbar New, the phone New sheet, Hosting's empty New event, and Horizon > New event ask it.
     Add past event and Horizon > From a link still skip. No key starts a new event. */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    await join(c, 'Draft Ask', 'draftask' + kind);
    const asked = () => ev(c, () => ({
      q:(document.querySelector('.hostask-q') || {}).textContent || '',
      when:(document.querySelector('#host-when-q') || {}).textContent || '',
      wiz:!!document.querySelector('#w-t'), link:!!document.querySelector('#lk-u'),
      role:!!document.querySelector('input[name="ch-role"]'),
      title:(document.querySelector('#w-t') || {}).value || ''
    }));
    const shows = s => s.q === 'Are you the host?' && s.when === 'Is this a new event or did it already happen?' && !s.wiz && !s.link;
    await c.evaluate(() => { var d = blankEventDraft(); d.title = 'Kept ridge night'; FORMDRAFTS.event = d; persist(); });
    await c.reload(); await c.waitForTimeout(900);
    const stored = await ev(c, () => { var raw = localStorage.getItem('hypernet-feed:v2') || ''; return { title:raw.indexOf('Kept ridge night') >= 0, chronicle:raw.indexOf('CHRONICLE_ADD') >= 0 }; });
    ok(stored.title && !stored.chronicle, kind + ': the kept draft is in localStorage and CHRONICLE_ADD is not ' + JSON.stringify(stored));
    if (kind === 'desk'){
      await c.click('#newbtn'); await c.waitForTimeout(150);
      await c.click('.popmenu [data-pop="new-event"]'); await c.waitForTimeout(250);
    } else {
      await c.click('[data-act="newsheet"]'); await c.waitForTimeout(200);
      await c.click('.dlg [data-act="runcmd"][data-id="new-event"]'); await c.waitForTimeout(250);
    }
    ok(shows(await asked()), kind + ': ' + (kind === 'desk' ? 'toolbar New > Event' : 'New sheet > Event') + ' asks who hosts it even with a kept draft');
    await answerHost(c, 'mine', 'upcoming');
    ok((await asked()).title === 'Kept ridge night', kind + ': I\'m hosting still resumes the kept draft');
    await c.keyboard.press('Escape'); await c.waitForTimeout(150);
    await c.evaluate(() => { CHRONICLE_ADD = 'host'; goFolder({ kind:'hosting' }); if (L.phone) S.tab = 'you'; MYEVENTS = []; S.stack = []; render(); });
    await c.waitForTimeout(250);
    await c.click('#listbody [data-act="new-event"]'); await c.waitForTimeout(250);
    ok(shows(await asked()), kind + ': Hosting\'s empty New event asks, and a leftover chronicle role does not skip it');
    await c.keyboard.press('Escape'); await c.waitForTimeout(150);
    await c.evaluate(() => {
      CHRONICLE_ADD = 'host';
      var hid = 'horizon-draftask';
      HORIZONS[hid] = { id:hid, name:'Draft list', description:'', isPersonalDefault:false, isPublished:false, ownerName:S.me.name, ownerId:'self', ownerAcct:S.acct, eventIds:[] };
      if (MYHORIZONS.indexOf(hid) < 0) MYHORIZONS.push(hid);
      closeDialogs(); goFolder({ kind:'explore', id:'horizons' }); if (L.phone) S.tab = 'explore';
      S.stack = [{ type:'horizon', id:hid }]; render();
    });
    await c.waitForTimeout(300);
    await c.click('#dscroll [data-act="addevents"]'); await c.waitForTimeout(250);
    await c.click('.dlg [data-act="pknewev"]'); await c.waitForTimeout(250);
    ok(shows(await asked()), kind + ': Horizon > New event asks, even if a chronicle add was still set');
    await c.keyboard.press('Escape'); await c.waitForTimeout(150);
    await c.click('#dscroll [data-act="addevents"]'); await c.waitForTimeout(250);
    await c.click('.dlg [data-act="pklink"]'); await c.waitForTimeout(250);
    const link = await asked();
    ok(link.link && !link.q && !link.wiz, kind + ': Horizon > From a link skips the question ' + JSON.stringify(link));
    await c.evaluate(() => { closeDialogs(); PEDIT = true; if (L.phone){ S.tab = 'you'; goFolder({ kind:'you' }); } S.stack = [{ type:'person', id:'self' }]; render(); });
    await c.waitForTimeout(300);
    await c.click('[data-act="addpastevent"]'); await c.waitForTimeout(200);
    await c.click('.dlg input[name="ch-role"]'); await c.click('.dlg [data-act="chronicle-go"]'); await c.waitForTimeout(250);
    const past = await asked();
    ok(!past.q && past.wiz && !past.role, kind + ': Add past event still skips the question ' + JSON.stringify(past));
    await c.evaluate(() => { closeDialogs(); CHRONICLE_ADD = null; });
    await c.keyboard.press('n'); await c.waitForTimeout(100);
    ok(!(await c.$('.dlg')), kind + ': no keyboard shortcut starts a new event');
    await c.evaluate(() => { closeDialogs(); CHRONICLE_ADD = null; FORMDRAFTS.event = null; });
    await newEvent(c, { title:'Ridge gathering', date:'2026-11-08', city:'Stockholm' });
    const bar = kind === 'phone' ? '#evbar ' : '#dscroll ';
    await c.evaluate(() => { EVENT_INVITES[S.stack[0].id] = [{ inviteeId:'p-anna', invitedBy:myActor() }]; });
    await c.click(bar + '[data-act="evinvite"]'); await c.waitForTimeout(300);
    const openInvite = await ev(c, () => {
      const anna = document.querySelector('.dlg [data-act="ivsend"][data-user="p-anna"]');
      const rows = [...document.querySelectorAll('.dlg .linkrow')];
      return { title:(document.querySelector('.dlg .dtitle') || {}).textContent,
        done:(document.querySelector('.dlg .dfoot .btn') || {}).textContent,
        rowAct:rows.some(r => r.getAttribute('data-act')),
        anna:anna && anna.textContent, annaOff:!!(anna && anna.disabled),
        fresh:[...document.querySelectorAll('.dlg [data-act="ivsend"]:not([disabled])')].slice(0, 2).map(b => b.getAttribute('data-user')) };
    });
    ok(openInvite.title === 'Invite' && openInvite.done === 'Done' && !openInvite.rowAct && openInvite.anna === 'Invited' && openInvite.annaOff && openInvite.fresh.length === 2,
       kind + ': the picker opens with a button per person, Done, and someone already invited ' + JSON.stringify(openInvite));
    const before = await ev(c, () => Object.keys(CHATS).reduce((n, k) => n + CHATS[k].messages.length, 0));
    await c.click('.dlg .linkrow.static .lr'); await c.waitForTimeout(150);
    const afterRow = await ev(c, () => Object.keys(CHATS).reduce((n, k) => n + CHATS[k].messages.length, 0));
    ok(afterRow === before && !!(await c.$('.dlg [data-act="ivsend"]')), kind + ': clicking the row sends nothing and leaves the window open');
    for (const id of openInvite.fresh){ await c.click('.dlg [data-act="ivsend"][data-user="' + id + '"]'); await c.waitForTimeout(200); }
    const sent = await ev(c, ids => ids.map(id => { const b = document.querySelector('.dlg [data-act="ivsend"][data-user="' + id + '"]'); return b ? b.textContent + (b.disabled ? '*' : '') : 'missing'; }), openInvite.fresh);
    const msgs = await ev(c, () => Object.keys(CHATS).reduce((n, k) => n + CHATS[k].messages.length, 0));
    ok(sent.join() === 'Invited*,Invited*' && !!(await c.$('.dlg')) && msgs === before + 2, kind + ': two invites in one sitting, the window stays open ' + JSON.stringify(sent));
    if (kind === 'desk') await shot(c, 'invite-picker-two');
    if (kind === 'phone') await shot(c, 'invite-picker-phone');
    await c.click('.dlg [data-act="closedlg"]'); await c.waitForTimeout(150);
    await c.click(bar + '[data-act="evinvite"]'); await c.waitForTimeout(250);
    ok(await ev(c, ids => ids.every(id => { const b = document.querySelector('.dlg [data-act="ivsend"][data-user="' + id + '"]'); return b && b.disabled && b.textContent === 'Invited'; }), ['p-anna'].concat(openInvite.fresh)),
       kind + ': reopening the picker still shows who was invited');
    await c.click('.dlg [data-act="closedlg"]'); await c.waitForTimeout(150);
    await c.click(bar + '[data-act="evmore"]'); await c.waitForTimeout(300);
    await c.click('.ctxmenu .helptip-btn, .ctxsheet .helptip-btn'); await c.waitForTimeout(150);
    const co = await ev(c, () => {
      const btn = document.querySelector('.ctxmenu .helptip-btn, .ctxsheet .helptip-btn'), note = document.querySelector('.ctxmenu .helptip-note, .ctxsheet .helptip-note');
      const head = btn && btn.closest('.chead');
      const hex = el => { const m = getComputedStyle(el).color.match(/\d+/g); return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join(''); };
      const ground = el => { var n = el; while (n){ var m = getComputedStyle(n).backgroundColor.match(/\d+/g); if (m && (m.length < 4 || +m[3] !== 0)) return '#' + m.slice(0, 3).map(function(x){ return (+x).toString(16).padStart(2, '0'); }).join(''); n = n.parentElement; } return '#ffffff'; };
      const themes = ['y2fresh', 'win2k'].map(t => { document.documentElement.setAttribute('data-theme', t); return { t:t, ink:contrast(hex(note), ground(note)), mark:contrast(hex(btn), ground(btn)) }; });
      document.documentElement.setAttribute('data-theme', 'win2k');
      const br = btn.getBoundingClientRect(), main = document.querySelector((L.phone ? '#evbar' : '#dscroll .actbar') + ' [data-act="editevent"]').getBoundingClientRect();
      const acts = [...document.querySelectorAll('#dscroll .actbar .btn, #evbar .btn')].map(b => b.getAttribute('data-act'));
      return { text:note.textContent, open:btn.getAttribute('aria-expanded'), beside:!!(head && head.querySelector('.helptip-btn')) && !btn.classList.contains('btn'),
        smaller:br.width < main.width && br.height < main.height, counted:acts.indexOf('helptip') >= 0, themes:themes };
    });
    ok(co.text === "A co-creator is someone who may have contributed to the event. They don't own the event page and have no admin access to it." && co.open === 'true' && co.beside && co.smaller && !co.counted && co.themes.every(t => t.ink >= 4.5 && t.mark >= 4.5),
       kind + ': co-creator policy has a small help tip, readable in both themes ' + JSON.stringify(co));
    if (kind === 'desk') await shot(c, 'cocreator-help');
    await c.keyboard.press('Escape'); await c.waitForTimeout(100);
    ok(await ev(c, () => !document.querySelector('.helptip.on') && !!document.querySelector('.ctxmenu .chead, .ctxsheet .chead')), kind + ': Escape closes the help tip and leaves the menu open');
    await c.evaluate(() => { closeCtx(); closeDialogs(); }); await c.waitForTimeout(150);
    await c.evaluate(() => { var id = S.stack[0].id; EVENTS[id].date = '2026-09-01'; if (REC[id]) REC[id].endDate = ''; render(); });
    await c.waitForTimeout(250);
    const claim = await ev(c, () => {
      const root = document.querySelector(L.phone ? '#evbar' : '#dscroll .actbar');
      const btn = root && root.querySelector('.helptip-btn');
      const main = root && root.querySelector('[data-act="v-went"]');
      if (!btn || !main) return null;
      const br = btn.getBoundingClientRect(), mr = main.getBoundingClientRect();
      const acts = [...root.querySelectorAll('.btn')].map(b => b.getAttribute('data-act'));
      return { h:Math.round(br.height), mh:Math.round(mr.height), btn:btn.classList.contains('btn'), acts:acts.indexOf('helptip') >= 0, note:!!btn.closest('.chclaim') };
    });
    ok(claim && claim.h <= 28 && claim.h < claim.mh && !claim.btn && !claim.acts && claim.note, kind + ': the chronicle ? sits beside Add to Chronicle and is not a toolbar button ' + JSON.stringify(claim));
    await c.click((kind === 'phone' ? '#evbar' : '#dscroll .actbar') + ' .helptip-btn'); await c.waitForTimeout(150);
    ok(await ev(c, () => { const n = document.querySelector((L.phone ? '#evbar' : '#dscroll') + ' .helptip-note'); return n && n.textContent === 'Your Chronicle is your list of past events, shown on your profile page. You choose who can see each event there.'; }),
       kind + ': the chronicle tip uses the same helpTip');
    if (kind === 'desk') await shot(c, 'chronicle-help');
    await c.keyboard.press('Escape'); await c.waitForTimeout(100);
    await c.click(bar + '[data-act="evinvite"]'); await c.waitForTimeout(250);
    const pastInv = await ev(c, ids => {
      const anna = document.querySelector('.dlg [data-act="ivsend"][data-user="p-anna"]');
      const nxt = document.querySelector('.dlg [data-act="ivsend"]:not([disabled])');
      return { title:(document.querySelector('.dlg .dtitle') || {}).textContent, anna:anna && anna.textContent, add:nxt && nxt.textContent, id:nxt && nxt.getAttribute('data-user') };
    });
    ok(pastInv.title === 'Add people who were there' && pastInv.anna === 'Added' && pastInv.add === 'Add', kind + ': a past picker says Add and Added ' + JSON.stringify(pastInv));
    await c.click('.dlg [data-act="ivsend"][data-user="' + pastInv.id + '"]'); await c.waitForTimeout(200);
    ok(await ev(c, id => { const b = document.querySelector('.dlg [data-act="ivsend"][data-user="' + id + '"]'); return !!document.querySelector('.dlg') && b && b.disabled && b.textContent === 'Added'; }, pastInv.id),
       kind + ': Add keeps the past picker open and switches that row to Added');
    ok(!c.errors.length, kind + ': no console errors (draft ask, invites, help) ' + c.errors.join(' '));
    await c.context().close();
  }

  /* A place can be a maps link. Fill from link on I'm hosting prefills the wizard and still publishes as yours. */
  {
    const c = await ctx('desk');
    await open(c, '', true);
    await join(c, 'Map Host', 'maphost');
    await c.evaluate(() => newEventDialog()); await c.waitForTimeout(200);
    await answerHost(c, 'mine', 'upcoming');
    const hint = await ev(c, () => {
      const el = document.getElementById('where-hint'), dlg = document.querySelector('.dlg');
      const ph = document.getElementById('w-c').getAttribute('placeholder');
      const hex = node => '#' + getComputedStyle(node).color.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
      const ground = node => '#' + getComputedStyle(node).backgroundColor.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
      const themes = ['y2fresh', 'win2k'].map(t => {
        document.documentElement.setAttribute('data-theme', t);
        return { t:t, hint:contrast(hex(el), ground(dlg)) };
      });
      document.documentElement.setAttribute('data-theme', 'win2k');
      return { text:el.textContent, ph:ph, named:/google|apple|openstreetmap/i.test(el.textContent + ' ' + ph), fill:!!document.getElementById('w-fill'), themes:themes };
    });
    ok(hint.text === 'Place or maps link' && hint.ph === 'Place or maps link' && !hint.named && hint.fill && hint.themes.every(t => t.hint >= 4.5),
       'desk: Where says Place or maps link, names no provider, and Fill from link is on Basics ' + JSON.stringify(hint));
    const gmaps = 'https://www.google.com/maps/place/Slussen/@59.3200,18.0700,17z/data=!3d59.3195!4d18.0712';
    await c.fill('#w-c', gmaps); await c.waitForTimeout(80);
    const pin = await ev(c, () => ({ city:document.getElementById('w-c').value, pin:DRAFT.placePin }));
    ok(pin.city === 'Slussen' && pin.pin && pin.pin.lat === 59.3195 && pin.pin.lng === 18.0712 && pin.pin.url === gmaps,
       'desk: a long maps link fills the place and keeps the pasted link ' + JSON.stringify(pin));
    await c.fill('#w-c', 'https://example.com/place/Foo'); await c.waitForTimeout(50);
    ok(await ev(c, () => document.getElementById('w-c').value === 'https://example.com/place/Foo' && !DRAFT.placePin),
       'desk: a non-map link stays plain text');
    await c.fill('#w-c', 'javascript:alert(1)');
    await c.fill('#w-t', 'Map night'); await c.fill('#w-d', '2026-11-12');
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]', { force:true }); await c.waitForTimeout(150);
    ok(await ev(c, () => !DRAFT.placePin && DRAFT.mapReject && /isn't allowed/.test((document.getElementById('err-city') || {}).textContent || '')),
       'desk: a javascript place is rejected');
    await c.fill('#w-c', 'https://maps.app.goo.gl/abc'); await c.waitForTimeout(80);
    ok(await ev(c, () => /Paste the full link/.test((document.getElementById('where-note') || {}).textContent || '') && !DRAFT.placePin),
       'desk: offline, a short map link asks for the full link');
    await c.fill('#w-c', gmaps); await c.waitForTimeout(80);
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]'); await c.waitForTimeout(150);
    await c.fill('#w-desc', 'By the lock.'); await c.waitForTimeout(50);
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]'); await c.waitForTimeout(100);
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="finish"]'); await c.waitForTimeout(400);
    const pub = await ev(c, () => {
      const id = MYEVENTS[MYEVENTS.length - 1], e = EVENTS[id], r = REC[id] || {};
      return { id:id, title:e.title, kind:e.kind, acct:e.hostAcct, src:e.sourceUrl || null, added:e.addedBy || null,
        mine:MYEVENTS.indexOf(id) >= 0, url:r.venue && r.venue.url, lat:r.venue && r.venue.lat, name:r.venue && r.venue.name };
    });
    ok(pub.title === 'Map night' && pub.kind === 'own' && pub.mine && pub.acct === 'me' && !pub.src && !pub.added && pub.name === 'Slussen' && pub.lat === 59.3195 && pub.url === gmaps,
       'desk: the maps place publishes as your event ' + JSON.stringify(pub));
    await c.evaluate(id => { S.stack = [{ type:'event', id:id }]; render(); }, pub.id); await c.waitForTimeout(300);
    const mapLink = await ev(c, () => { const a = document.querySelector('a.maplink'); return a ? { text:a.textContent, href:a.getAttribute('href') } : null; });
    ok(mapLink && mapLink.text === 'Open in Maps' && mapLink.href === gmaps, 'desk: Open in Maps uses the pasted link ' + JSON.stringify(mapLink));
    await c.evaluate(id => editEventDialog(id), pub.id); await c.waitForTimeout(200);
    ok(await ev(c, () => { const h = document.getElementById('where-hint'); return !!h && h.textContent === 'Place or maps link' && !document.getElementById('w-fill'); }),
       'desk: Edit shows the place hint and not Fill from link');
    await c.evaluate(() => closeDialogs()); await c.waitForTimeout(100);
    await c.evaluate(() => { FORMDRAFTS.event = null; newEventDialog(); }); await c.waitForTimeout(200);
    await answerHost(c, 'mine', 'upcoming');
    await c.fill('#w-fill', 'https://billetto.se/e/example');
    await c.click('.dlg [data-act="wizfill"]'); await c.waitForTimeout(200);
    const off = await ev(c, () => ({ note:(document.getElementById('fill-note') || {}).textContent || '', form:DRAFT.form || '', src:DRAFT.sourceUrl || null }));
    ok(/fill in the fields yourself/.test(off.note) && off.form !== 'link' && !off.src,
       'desk: Fill from link offline stays the hosted wizard ' + JSON.stringify(off));
    await c.evaluate(img => {
      wizTakeFill(DRAFT, { title:'Filled Night', startsOn:'2026-12-02', startTime:'18:00', city:'Stockholm', description:'From the page.', site:'billetto.se', venue:{ name:'Stockholm', lat:59.3, lng:18.06 }, imageUrl:img });
      paintWiz();
    }, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='); await c.waitForTimeout(150);
    const filled = await ev(c, () => ({ title:DRAFT.title, date:DRAFT.date, time:DRAFT.startTime, city:DRAFT.city, desc:DRAFT.desc, img:!!DRAFT.image, kind:DRAFT.kind, src:DRAFT.sourceUrl || null, form:DRAFT.form || '' }));
    ok(filled.title === 'Filled Night' && filled.date === '2026-12-02' && filled.time === '18:00' && filled.city === 'Stockholm' && filled.desc === 'From the page.' && filled.img && filled.kind !== 'link' && !filled.src && filled.form !== 'link',
       'desk: Fill from link prefills the wizard and does not make a link event ' + JSON.stringify(filled));
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]'); await c.waitForTimeout(150);
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]'); await c.waitForTimeout(100);
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="finish"]'); await c.waitForTimeout(400);
    const hosted = await ev(c, () => {
      const id = MYEVENTS[MYEVENTS.length - 1], e = EVENTS[id];
      goFolder({ kind:'hosting' }); render();
      return { title:e.title, kind:e.kind, mine:MYEVENTS.indexOf(id) >= 0, src:e.sourceUrl || null, added:e.addedBy || null, acct:e.hostAcct, hosting:S.folder.kind,
        listed:(document.getElementById('listbody') || document.body).textContent.indexOf('Filled Night') >= 0 };
    });
    ok(hosted.title === 'Filled Night' && hosted.kind === 'own' && hosted.mine && !hosted.src && !hosted.added && hosted.acct === 'me' && hosted.hosting === 'hosting' && hosted.listed,
       'desk: autofill on I am hosting publishes into Hosting with you as host ' + JSON.stringify(hosted));
    await c.evaluate(() => newEventDialog()); await c.waitForTimeout(200);
    await answerHost(c, 'other', 'upcoming');
    ok(await ev(c, () => !!document.getElementById('lk-u') && !document.getElementById('w-fill')), 'desk: someone else still opens the link form');
    await c.fill('#lk-u', 'https://tickets.example/e/night'); await c.press('#lk-u', 'Enter'); await c.waitForTimeout(150);
    ok(await ev(c, () => { const h = document.getElementById('where-hint'); return !!h && h.textContent === 'Place or maps link'; }),
       'desk: the link form shows the place hint');
    await c.fill('#lk-h', 'City Festival'); await c.fill('#w-t', 'Logged Night'); await c.fill('#w-d', '2026-12-03'); await c.fill('#w-c', 'Brno');
    await c.click('.dlg [data-act="lkadd"]'); await c.waitForTimeout(300);
    const logged = await ev(c, () => {
      const id = ADDEDBYME[ADDEDBYME.length - 1], e = EVENTS[id];
      return { kind:e.kind, mine:MYEVENTS.indexOf(id) >= 0, added:e.addedBy, host:e.hostName, src:e.sourceUrl };
    });
    ok(logged.kind === 'link' && !logged.mine && logged.added === 'self' && logged.host === 'City Festival' && /tickets\.example/.test(logged.src || ''),
       'desk: the link-event path is unchanged ' + JSON.stringify(logged));
    ok(!c.errors.length, 'desk: no console errors (map link) ' + c.errors.join(' '));
    await c.context().close();
  }

  /* ---------------- 2026-10-04: New event goes on only when a step has what it needs ---------------- */
  for (const kind of ['desk', 'tab', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    await join(c, 'Wiz Host', 'wizhost' + kind);
    await c.evaluate(() => newEventDialog()); await c.waitForTimeout(250);
    await answerHost(c, 'mine', 'upcoming');
    const foot = () => ev(c, () => ({ step:DRAFT.step, btns:[...document.querySelectorAll('.dlg .dfoot .btn')].map(b => b.textContent.trim() + (b.getAttribute('aria-disabled') === 'true' ? ':off' : '')),
      need:document.getElementById('wiz-need').textContent, errs:[...document.querySelectorAll('.dlg .ferr[data-err]:not([hidden])')].map(x => x.getAttribute('data-err')),
      invalid:[...document.querySelectorAll('.dlg [aria-invalid="true"]')].map(x => x.id), tabs:[...document.querySelectorAll('.dlg .wizsteps .ws')].map(t => t.getAttribute('aria-disabled') === 'true' ? 'off' : 'on'),
      focus:document.activeElement && document.activeElement.id, toast:(document.getElementById('toasts') || {}).textContent || '' }));
    const f0 = await foot();
    /* 2026-10-05: one primary at a time — Next on Basics and About, Publish event on Look; no Cancel (× keeps the draft) */
    ok(f0.step === 1 && f0.btns.join('|') === 'Next:off' && /title.*start date.*where/.test(f0.need) && !f0.errs.length && f0.tabs.join() === 'on,off,off',
       kind + ': an empty Basics step — Next is off, no Publish yet, it says what is still needed, no errors before you try ' + JSON.stringify(f0));
    /* trying anyway shows what is missing inline, at the fields, and stays */
    await c.fill('#w-t', 'Moth night'); await c.waitForTimeout(100);
    /* (aria-disabled: still clickable, which is how it shows what is missing — Playwright needs force to click it) */
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]', { force:true }); await c.waitForTimeout(250);
    const f1 = await foot();
    ok(f1.step === 1 && f1.errs.join() === 'date,city' && f1.invalid.join() === 'w-d,w-c' && f1.focus === 'w-d' && !/Add/.test(f1.toast), kind + ': Next with things missing stays on Basics and marks the start date and Where inline (no toast) ' + JSON.stringify(f1));
    /* the step tabs don't jump past it either */
    await c.click('.dlg .wizsteps .ws[data-id="3"]', { force:true }); await c.waitForTimeout(200);
    ok((await foot()).step === 1, kind + ': the Look tab can\'t be reached past an incomplete step');
    /* a start in the past, and an end before the start, are not accepted */
    await c.fill('#w-d', '2026-09-01'); await c.waitForTimeout(100);
    ok(await ev(c, () => /today or a later day/.test(document.getElementById('err-date').textContent)), kind + ': a new event can\'t start in the past');
    await c.fill('#w-d', '2026-11-12'); await c.fill('#w-e', '2026-11-10'); await c.waitForTimeout(100);
    const f2 = await foot();
    ok(f2.errs.join() === 'end,city' && f2.btns.indexOf('Next:off') >= 0, kind + ': an end before the start is flagged, the message for the start date went as it was fixed ' + JSON.stringify(f2.errs));
    await c.fill('#w-e', ''); await c.check('#w-on'); await c.waitForTimeout(150);
    const f3 = await foot();
    ok(!f3.errs.length && f3.btns.indexOf('Next') >= 0 && !f3.need && await ev(c, () => document.getElementById('w-c').disabled), kind + ': Online counts as where it is — Next is on, nothing missing ' + JSON.stringify(f3));
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]'); await c.waitForTimeout(250);
    /* About needs a description; Publish waits for it; Bring stays optional */
    const f4 = await foot();
    ok(f4.step === 2 && f4.btns.join('|') === 'Back|Next:off' && /description/.test(f4.need) && !f4.errs.length && f4.tabs.join() === 'on,on,off', kind + ': About — Next waits for a description, Back beside it ' + JSON.stringify(f4));
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]', { force:true }); await c.waitForTimeout(250);
    const f5 = await foot();
    ok(f5.step === 2 && f5.errs.join() === 'desc' && f5.focus === 'w-desc' && await ev(c, () => !MYEVENTS.some(id => EVENTS[id] && EVENTS[id].title === 'Moth night')), kind + ': Next with no description says so inline and publishes nothing');
    await c.fill('#w-desc', 'Sheets, a lamp and whatever flies in.'); await c.waitForTimeout(100);
    const f6 = await foot();
    ok(!f6.errs.length && f6.btns.join('|') === 'Back|Next' && f6.tabs.join() === 'on,on,on', kind + ': with a description Next is on, the Look tab opens; Bring is optional ' + JSON.stringify(f6));
    /* back to Basics keeps it all; Look is optional and Publish works from it too */
    await c.click('.dlg .wizsteps .ws[data-id="3"]'); await c.waitForTimeout(200);
    const f7 = await foot();
    ok(f7.step === 3 && f7.btns.join('|') === 'Back|Publish event', kind + ': Look is reachable and optional; Publish event is its one primary ' + JSON.stringify(f7.btns));
    ok((await overflow(c)) <= 0, kind + ': New event, no horizontal overflow');
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="finish"]'); await c.waitForTimeout(500);
    const pub = await ev(c, () => { const id = MYEVENTS[MYEVENTS.length - 1], e = EVENTS[id]; return { title:e && e.title, where:e && whereOf(e), desc:e && descOf(e), page:!!document.querySelector('.pg-event') }; });
    ok(pub.title === 'Moth night' && pub.where === 'Online' && /lamp/.test(pub.desc) && pub.page, kind + ': it publishes once everything is there, online ' + JSON.stringify(pub));
    /* Edit keeps the same rules: clearing the title turns Save off and says so */
    await c.evaluate(() => editEventDialog(MYEVENTS[MYEVENTS.length - 1])); await c.waitForTimeout(250);
    ok((await foot()).btns.join('|') === 'Cancel|Save changes', kind + ': Edit of a complete event can be saved');
    await c.fill('#w-t', ''); await c.waitForTimeout(100);
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="finish"]', { force:true }); await c.waitForTimeout(250);
    const f8 = await foot();
    ok(f8.btns.join('|') === 'Cancel|Save changes:off' && f8.errs.join() === 'title' && await ev(c, () => EVENTS[MYEVENTS[MYEVENTS.length - 1]].title === 'Moth night'), kind + ': Edit with the title cleared won\'t save, says why ' + JSON.stringify(f8));
    if (kind === 'phone') await shot(c, 'new-event-missing-phone');
    await c.click('.dlg [data-act="closedlg"]'); await c.waitForTimeout(150);
    ok(!c.errors.length, kind + ': no console errors (New event) ' + c.errors.join(' '));
  }

  /* a saved ticket or source link of javascript: is text, never a link that runs */
  {
    const c = await ctx('desk');
    await open(c, '', true);
    const bad = await ev(c, () => {
      const id = 'evt-js-ticket';
      EVENTS[id] = { id:id, title:'Script ticket', date:'2026-11-08', kind:'meetup', privacy:'everyone', hostName:'Host', description:'A night.' };
      REC[id] = { kind:'meetup', city:'Brno', description:'A night.', access:{ model:'ticket', url:'javascript:alert(1)' }, externalUrl:'javascript:alert(2)' };
      openItem('event', id);
      return new Promise(function(r){ setTimeout(function(){
        var root = document.getElementById('dscroll');
        r([...root.querySelectorAll('a[href]')].map(function(a){ return a.getAttribute('href'); }).filter(function(h){ return /^javascript:/i.test(h || ''); }));
      }, 400); });
    });
    ok(Array.isArray(bad) && !bad.length, 'a javascript: ticket or source link renders no clickable javascript: href ' + JSON.stringify(bad));
    const good = await ev(c, () => {
      const id = 'evt-https-ticket';
      EVENTS[id] = { id:id, title:'Real tickets', date:'2026-11-09', kind:'meetup', privacy:'everyone', hostName:'Host', description:'A night.' };
      REC[id] = { kind:'meetup', city:'Brno', description:'A night.', access:{ model:'ticket', url:'https://tickets.example/e' }, externalUrl:'https://source.example/event' };
      openItem('event', id);
      return new Promise(function(r){ setTimeout(function(){
        var root = document.getElementById('dscroll');
        r([...root.querySelectorAll('a[href]')].map(function(a){ return a.getAttribute('href'); }));
      }, 400); });
    });
    ok(good.some(function(h){ return /^https:\/\/tickets\.example\/e\/?$/.test(h); }) && good.some(function(h){ return /^https:\/\/source\.example\/event\/?$/.test(h); }),
       'an https ticket link and source link still open ' + JSON.stringify(good));
    await c.context().close();
  }

  /* ---------------- 2026-10-04: replies under call outs; the event's New call out; chats keep their place; Share copies the link ---------------- */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '#/home', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(450);
    /* the fixture's replies: on the call out on Home, the count and the latest two */
    await c.evaluate(() => { COIDX = homeCallouts().findIndex(x => x.id === 'co-sound'); render(); }); await c.waitForTimeout(200);
    const peek = await ev(c, () => { const t = document.querySelector('#listbody .costrip .cotile[data-id="co-sound"]');
      return t && { n:repliesOf('co-sound').length, corn:(t.querySelector('.fcof .corall') || {}).textContent, rows:t.querySelectorAll('.corep .corow').length,
                    who:[...t.querySelectorAll('.corep .corwho')].map(b => b.getAttribute('data-id')) }; });
    ok(peek && peek.n === 2 && peek.corn === '2 replies' && peek.rows === 2 && peek.who.join() === 'p-rio,p-jon', kind + ': a call out on Home shows its reply count and latest replies ' + JSON.stringify(peek));
    if (kind === 'phone'){ await c.evaluate(() => { document.getElementById('listbody').scrollTop = 0; closeDialogs(); document.getElementById('toasts').innerHTML = ''; }); await c.waitForTimeout(150); await shot(c, 'callout-replies-home-phone'); }
    ok(await ev(c, () => [...document.querySelectorAll('#listbody .fitem[data-verb="replied_callout"] .fsent')].some(x => x.textContent === 'Rio Moss replied to Sound engineer')),
       kind + ': a reply by someone you follow is a line on Home ("Rio Moss replied to Sound engineer")');
    /* the thread: oldest first, each author's name opens their profile */
    await c.evaluate(() => openItem('callout', 'co-sound')); await c.waitForTimeout(350);
    const th = await ev(c, () => [...document.querySelectorAll('#dscroll .reply')].map(r => r.querySelector('.rpn').getAttribute('data-id') + ':' + !!r.querySelector('[data-act="delreply"]')));
    ok(th.join() === 'p-rio:false,p-jon:false', kind + ': the call out page lists its replies oldest first; others’ replies can’t be deleted by you ' + JSON.stringify(th));
    if (kind === 'desk') await shot(c, 'callout-replies-desk');
    await c.click('#dscroll .reply .rpn[data-id="p-rio"]'); await c.waitForTimeout(300);
    ok(await ev(c, () => { const t = S.stack[S.stack.length - 1]; return t.type === 'person' && t.id === 'p-rio'; }), kind + ': a reply’s name opens its author’s profile');
    await c.evaluate(() => openItem('callout', 'co-sound')); await c.waitForTimeout(300);
    /* your own reply: posted, counted on Home, then deleted (and Undo brings it back) */
    await c.fill('#coreply', 'I can bring a second desk.'); await c.click('#dscroll [data-act="postreply"]'); await c.waitForTimeout(300);
    ok(await ev(c, () => repliesOf('co-sound').length === 3 && /second desk/.test([...document.querySelectorAll('#dscroll .reply .rpt')].pop().textContent)), kind + ': a reply appears at the end of the thread');
    await c.goto(URL + '#/home'); await c.waitForTimeout(400);
    const card = await ev(c, () => { const f = document.querySelector('#listbody .fitco .fco[data-id="co-sound"]');
      return { strip:!!document.querySelector('#listbody .costrip .cotile[data-id="co-sound"]'), all:f && (f.querySelector('.corep .corall') || {}).textContent, rows:f && f.querySelectorAll('.corep .corow').length }; });
    ok(!card.strip && card.all === 'View all 3 replies' && card.rows === 2, kind + ': once you replied, the call out’s card on Home says "View all 3 replies" over the latest two ' + JSON.stringify(card));
    await c.click('#listbody .fitco .fco[data-id="co-sound"] .corall'); await c.waitForTimeout(350);
    ok(await ev(c, () => { const t = S.stack[S.stack.length - 1]; return t.type === 'callout' && t.id === 'co-sound' && document.querySelectorAll('#dscroll .reply').length === 3; }), kind + ': "View all" opens the call out with every reply');
    const mine = await ev(c, () => { const r = [...document.querySelectorAll('#dscroll .reply')].filter(x => x.querySelector('[data-act="delreply"]')); return r.length; });
    await c.click('#dscroll .reply [data-act="delreply"]'); await c.waitForTimeout(300);
    ok(mine === 1 && await ev(c, () => repliesOf('co-sound').length === 2 && !myReplies('co-sound').length && !activityRows().some(a => a.verb === 'replied_callout' && actIsMe(a))),
       kind + ': you can delete your own reply (only yours): off the thread and off Home');
    await c.click('#toasts [data-act="toastundo"]'); await c.waitForTimeout(250);
    ok(await ev(c, () => myReplies('co-sound').length === 1), kind + ': Undo puts the reply back');
    await c.evaluate(() => { deleteReply(myReplies('co-sound')[0].id); }); await c.waitForTimeout(200);
    await c.reload(); await c.waitForTimeout(700);
    ok(await ev(c, () => repliesOf('co-sound').length === 2 && !myReplies('co-sound').length), kind + ': replies and deletions survive a reload');
    /* an event with no call outs has no Call outs heading; its host posts one from the toolbar, for that event */
    const own = await ev(c, () => MYEVENTS.filter(id => EVENTS[id] && !isPast(lastDay(EVENTS[id])) && !CALLOUTS.some(x => calloutOpen(x) && calloutEventId(x) === id))[0]);
    await c.evaluate(id => openItem('event', id), own); await c.waitForTimeout(350);
    const bar = kind === 'phone' ? '#evbar' : '#dscroll .actbar';
    const host = await ev(c, b => ({ heads:[...document.querySelectorAll('#dscroll .sect h3')].map(h => h.textContent), btn:!!document.querySelector(b + ' [data-act="newcalloutfor"]') }), bar);
    ok(host.heads.length > 1 && host.heads.indexOf('Call outs') < 0 && !host.btn, kind + ': the host’s event without call outs has no Call outs heading, and New call out is not a bar button ' + JSON.stringify(host));
    await c.click(bar + ' [data-act="evmore"]'); await c.waitForTimeout(250);
    ok(await ev(c, () => /New call out/.test((document.querySelector('.ctxmenu, .ctxsheet') || {}).innerText || '')), kind + ': New call out is in the one … menu');
    if (kind === 'desk') await shot(c, 'event-toolbar-new-callout');
    await c.click(kind === 'phone' ? '.ctxsheet .sheetrow:has-text("New call out")' : '.ctxmenu .ci:has-text("New call out")'); await c.waitForTimeout(300);
    ok(await ev(c, id => document.getElementById('co-e').value === id && /call out/i.test(document.querySelector('.dlg .dtitle').textContent), own), kind + ': New call out opens the form with this event chosen');
    await c.evaluate(() => { closeDialogs(); FORMDRAFTS.callout = null; }); await c.waitForTimeout(150);
    for (const [id, has] of [[await ev(c, () => calloutEventId(calloutOf('co-sound'))), true], ['evt-fill-3', false]]){
      await c.evaluate(i => openItem('event', i), id); await c.waitForTimeout(300);
      /* 2026-10-05 (v5-callout): an event's call out shows its latest replies, and no box to answer in */
      const g = await ev(c, () => ({ heads:[...document.querySelectorAll('#dscroll .sect h3')].map(h => h.textContent), cards:document.querySelectorAll('#dscroll .evcos .fco').length,
        reps:document.querySelectorAll('#dscroll .evcos .corep .corow').length, box:!!document.querySelector('#dscroll #coreply'), add:!!document.querySelector('#dscroll [data-act="newcalloutfor"], #evbar [data-act="newcalloutfor"]') }));
      ok(has ? g.heads.indexOf('Call outs') >= 0 && g.cards === 1 && g.reps === 2 && !g.box && !g.add : g.heads.indexOf('Call outs') < 0 && !g.cards && !g.add,
         kind + ': a guest sees ' + (has ? 'the event’s call out with its latest replies and no box to answer in' : 'no Call outs heading when there are none') + ' ' + JSON.stringify(g));
      if (has){
        ok(await ev(c, () => !/privately|message anna|in a chat|direct message/i.test(document.getElementById('dscroll').innerText)), kind + ': no chat wording around the call out');
        /* Answer on the event's call out opens the call out (stacked, ‹ back to the event) with its box ready — no chat */
        const n0 = await ev(c, () => ({ stack:S.stack.length, chats:Object.keys(CHATS).length }));
        await c.evaluate(() => document.querySelector('#dscroll .evcos [data-act="answercallout"]').click()); await c.waitForTimeout(350);
        ok(await ev(c, n => S.stack.length === n.stack + 1 && S.stack[S.stack.length - 1].type === 'callout' && Object.keys(CHATS).length === n.chats && document.activeElement && document.activeElement.id === 'coreply', n0),
           kind + ': Answer on an event’s call out opens the call out with its box focused');
      }
    }
    ok(!c.errors.length, kind + ': no console errors (replies, New call out) ' + c.errors.join(' '));
    ok((await overflow(c)) <= 0, kind + ': no overflow (replies, New call out)');
  }
  /* 2026-10-05 (v5-callout): a call out's own page is the call out, full screen — its band is the inverted call out (the
     ask, its line, the event it is for, who asked and until when), then the toolbar, then the replies and the box; no
     card inside the page and one short line at most. The icon is a megaphone; Add to horizon's icon stays in its box.
     On an event a call out shows its latest replies or "No replies yet" (no box there; Reply / Answer open the call out).
     On a phone, tapping the reply box opens the keyboard and it stays: the keyboard's resize no longer redraws the page */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '#/home', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    /* your own call out on your next event, no replies yet: the owner's screenshot */
    const evId = await ev(c, () => { const id = MYEVENTS.filter(x => EVENTS[x] && !isPast(lastDay(EVENTS[x])))[0];
      CALLOUTS.unshift({ id:'co-new-sauna', title:'Sauna master', body:'Someone who can bring the sauna to life', eventId:id, skill:null, expiresAt:isoOf(new Date(Date.now() + 30 * 864e5)),
        hostName:S.me.name, hostId:acctPid(S.acct), hostAcct:S.acct }); logAct('posted_callout', 'callout', 'co-new-sauna'); render(); return id; });
    await c.evaluate(() => openItem('callout', 'co-new-sauna')); await c.waitForTimeout(350);
    /* 2026-10-05 (v5-retro): the window's page has its 2px sunken frame as a border — what fits is inside it */
    const pg = () => ev(c, () => { const sc = document.getElementById('dscroll'), band = sc.querySelector('.pg-callout > .coband'), w = sc.getBoundingClientRect();
      const out = [...sc.querySelectorAll('.pg-callout *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.left < w.left + sc.clientLeft - 0.5 || r.right > w.left + sc.clientLeft + sc.clientWidth + 0.5); }).map(e => e.className || e.tagName);
      const ta = sc.querySelector('#coreply'), bt = sc.querySelector('[data-act="postreply"]'), box = sc.querySelector('.sect[data-sect="replies"]'), bs = box && getComputedStyle(box);
      return { band:!!band && getComputedStyle(band).backgroundColor === 'rgb(20, 20, 20)', title:band && band.querySelector('h1').textContent, ev:band && (band.querySelector('.fcoe[data-type="event"]') || {}).getAttribute && band.querySelector('.fcoe').getAttribute('data-id'),
               by:band && (band.querySelector('.coby .rpn, .coby b') || {}).textContent, meta:band && (band.querySelector('.coby small') || {}).textContent, card:sc.querySelectorAll('.fco').length,
               bandFirst:!!band && sc.querySelector('.pg-callout').firstElementChild === band, lines:sc.querySelectorAll('.pg-callout .whonote, .pg-callout .replynote').length,
               note:[...sc.querySelectorAll('.pg-callout .whonote')].map(x => x.textContent).join('|'), bar:[...sc.querySelectorAll('.actbar [data-act]')].map(b => b.getAttribute('data-act')).join(','),
               fits:!!ta && !!bt && ta.getBoundingClientRect().right <= bt.getBoundingClientRect().left && bt.getBoundingClientRect().right <= box.getBoundingClientRect().right - 8,
               even:!!bs && bs.paddingLeft === bs.paddingRight, overflow:sc.scrollWidth - sc.clientWidth, out }; });
    const own = await pg();
    ok(own.band && own.title === 'Sauna master' && own.ev === evId && own.by === 'You' && /posted .* · open until /.test(own.meta) && own.bandFirst && !own.card,
       kind + ': your call out’s page is the call out — its band holds the ask, the event it is for, you and until when; no card inside the page ' + JSON.stringify(own));
    ok(own.lines === 1 && own.note === 'No replies yet.' && own.bar === 'editcallout,closecallout,share' && own.fits && own.even && own.overflow <= 0 && !own.out.length,
       kind + ': one short line ("No replies yet."), Edit · Close call out · Share, the box and Post fit, even padding, nothing spills ' + JSON.stringify(own));
    await shot(c, 'callout-' + kind + '-own-page');
    /* someone else's, with replies: Answer in the toolbar puts you in the box; no line at all around the thread */
    await c.evaluate(() => openItem('callout', 'co-sound')); await c.waitForTimeout(350);
    const g = await pg();
    ok(g.by === 'Anna Vale' && g.bar === 'answercallout,share' && g.lines === 0 && g.fits && g.overflow <= 0 && !g.out.length && !g.card,
       kind + ': someone’s call out: who asked in the band, Answer · Share, the thread with no explanations around it ' + JSON.stringify(g));
    await c.click('#dscroll .actbar [data-act="answercallout"]'); await c.waitForTimeout(250);
    ok(await ev(c, () => document.activeElement && document.activeElement.id === 'coreply' && S.stack.length === 1), kind + ': Answer in the call out’s toolbar puts you in its box');
    await shot(c, 'callout-' + kind + '-page-replies');
    /* the megaphone: the call out's icon everywhere (title bar, nav, buttons), and Add to horizon's icon inside its 20 box */
    const icn = await ev(c, async () => {
      /* painted, not measured: each icon drawn ten times over in a box with room around it; no ink may fall outside its 20 */
      const spill = async n => { const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 28 28" width="280" height="280" fill="none" stroke="#000" stroke-width="1.7" stroke-linecap="square" stroke-linejoin="miter">' + IC[n] + '</svg>';
        const img = new Image(); img.src = 'data:image/svg+xml,' + encodeURIComponent(svg); await img.decode();
        const cv = document.createElement('canvas'); cv.width = cv.height = 280; const x = cv.getContext('2d'); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, 280, 280).data; let out = 0;
        for (let y = 0; y < 280; y++) for (let k = 0; k < 280; k++) if (d[(y * 280 + k) * 4 + 3] > 40 && (k < 39 || k > 240 || y < 39 || y > 240)) out++;
        return out; };
      const ref = (() => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.innerHTML = IC.callout; return s.innerHTML; })();
      const nav = [...document.querySelectorAll('#navbody .nsubrow')].filter(r => /Call outs/.test(r.textContent)).map(r => r.querySelector('svg'));
      const used = [...document.querySelectorAll('#dbar .wicon svg, #dscroll .coband .eyebrow svg')].concat(nav).map(s => s && s.innerHTML);
      return { mega:/<ellipse/.test(IC.callout) && !/v4h3/.test(IC.callout), used:used.length === (L.phone ? 2 : 3) && used.every(h => h === ref),
               add:await spill('addhorizon'), co:await spill('callout'), oldAdd:await (async () => { const k = IC.addhorizon; IC.addhorizon = '<path d="M1.5 13.5h11M4 13.5a4.5 4.5 0 0 1 8.3-2.4M8.3 4.2v1.8M16 9v8M12 13h8"/>'; const r = await spill('addhorizon'); IC.addhorizon = k; return r; })() }; });
    ok(icn.mega && icn.used && !icn.add && !icn.co && icn.oldAdd > 0, kind + ': the call out icon is a megaphone wherever a call out is named, and both new icons stay inside their box ' + JSON.stringify(icn));
    /* on its event: "No replies yet", no box; the tag never wraps; Reply on your own once someone answered */
    await c.evaluate(id => { S.stack = []; openItem('event', id); }, evId); await c.waitForTimeout(350);
    const e1 = await ev(c, () => { const f = document.querySelector('#dscroll .evcos .fco[data-id="co-new-sauna"]'), tag = f && f.querySelector('.fcotag'), sect = document.querySelector('#dscroll .sect[data-sect="callouts"]'), ss = sect && getComputedStyle(sect);
      return { none:f && (f.querySelector('.corep .cornone') || {}).textContent, box:!!document.querySelector('#dscroll #coreply'), tag:tag && Math.round(tag.getBoundingClientRect().height), reply:!!(f && f.querySelector('[data-act="answercallout"]')),
               even:!!ss && ss.paddingLeft === ss.paddingRight }; });
    ok(e1.none === 'No replies yet' && !e1.box && e1.tag === 20 && !e1.reply && e1.even, kind + ': on its event your call out says "No replies yet" — no box, the tag on one line, even padding ' + JSON.stringify(e1));
    if (kind === 'phone'){ await c.evaluate(() => { const s = document.querySelector('#dscroll .sect[data-sect="callouts"]'); s.scrollIntoView(); document.getElementById('dscroll').scrollTop -= 24; document.getElementById('toasts').innerHTML = ''; }); await c.waitForTimeout(150); }
    await shot(c, 'callout-' + kind + '-event-no-replies');
    await c.evaluate(() => { REPLIES.push({ id:'r-v5-kai', calloutId:'co-new-sauna', author:'p-kai', text:'I build saunas. Wood-fired, 12 people.', ts:tsIso(appNow()) }); render(); }); await c.waitForTimeout(200);
    const e2 = await ev(c, () => { const f = document.querySelector('#dscroll .evcos .fco[data-id="co-new-sauna"]'); return { rows:f.querySelectorAll('.corep .corow').length, none:!!f.querySelector('.cornone'), reply:(f.querySelector('[data-act="answercallout"]') || {}).textContent }; });
    ok(e2.rows === 1 && !e2.none && e2.reply === 'Reply', kind + ': answered, your call out on its event shows the reply and offers Reply ' + JSON.stringify(e2));
    await c.click('#dscroll .evcos .fco[data-id="co-new-sauna"] [data-act="answercallout"]'); await c.waitForTimeout(350);
    ok(await ev(c, () => { const t = S.stack[S.stack.length - 1]; return S.stack.length === 2 && t.type === 'callout' && t.id === 'co-new-sauna' && document.activeElement && document.activeElement.id === 'coreply'; }),
       kind + ': Reply opens your call out (‹ back to the event) with its box focused');
    if (kind === 'phone'){
      /* the keyboard: a tap focuses the box, the viewport shrinks by the keyboard's height — the same box keeps focus and
         stays in the page (before, the resize redrew the window and replaced it: the keyboard closed again) */
      await c.evaluate(() => { document.activeElement.blur(); document.getElementById('dscroll').scrollTop = 0; }); await c.waitForTimeout(100);
      await c.tap('#coreply'); await c.waitForTimeout(150);
      await c.evaluate(() => { document.getElementById('coreply').__probe = 1; });
      const kb = () => ev(c, () => { const a = document.activeElement, b = document.getElementById('coreply'); return { id:a && a.id, same:!!(a && a.__probe), inDom:!!(b && b.__probe), value:b && b.value, vv:Math.round(visualViewport.height) }; });
      await c.setViewportSize({ width:375, height:476 }); await c.waitForTimeout(400);
      const up = await kb();
      ok(up.id === 'coreply' && up.same && up.inDom && up.vv === 476, 'phone: the keyboard comes up — the reply box you tapped keeps focus and stays in the page ' + JSON.stringify(up));
      await c.keyboard.type('Wood-fired works.'); await c.waitForTimeout(100);
      await c.evaluate(() => visualViewport.dispatchEvent(new Event('resize'))); await c.waitForTimeout(150);
      await c.setViewportSize({ width:375, height:812 }); await c.waitForTimeout(400);
      const down = await kb();
      ok(down.id === 'coreply' && down.same && down.value === 'Wood-fired works.', 'phone: and as it goes, still the same box, with what you typed ' + JSON.stringify(down));
      /* a redraw while you type (a poll, a toast's undo): nothing changed, nothing replaced; something changed, the box comes back with your words and caret */
      await c.evaluate(() => render()); await c.waitForTimeout(100);
      ok((await kb()).same, 'phone: a redraw that changes nothing leaves the box you are in alone');
      await c.evaluate(() => { REPLIES.push({ id:'r-v5-rio', calloutId:'co-new-sauna', author:'p-rio', text:'Count me in for the stove.', ts:tsIso(appNow()) }); render(); }); await c.waitForTimeout(100);
      const re = await ev(c, () => { const a = document.activeElement; return { id:a && a.id, value:a && a.value, caret:a && a.selectionStart, n:document.querySelectorAll('#dscroll .reply').length }; });
      ok(re.id === 'coreply' && re.value === 'Wood-fired works.' && re.caret === re.value.length && re.n === 2, 'phone: a redraw that changes the thread gives the box back, focused, with your words and caret ' + JSON.stringify(re));
      await c.keyboard.press('Enter'); await c.waitForTimeout(300);
      ok(await ev(c, () => repliesOf('co-new-sauna').length === 3 && document.activeElement.id !== 'coreply' && !document.getElementById('coreply').value), 'phone: Enter posts it and the keyboard goes, so you see your reply');
      await shot(c, 'callout-phone-thread-after-post');
    }
    ok(!c.errors.length, kind + ': no console errors (v5 call out) ' + c.errors.join(' '));
    ok((await overflow(c)) <= 0, kind + ': no overflow (v5 call out)');
  }
  /* a profile opened from a chat is a window with a close; closing leaves the chat exactly as it was. A conversation keeps its place */
  for (const kind of ['desk', 'tab', 'phone']){
    const c = await ctx(kind);
    await open(c, '#/home', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(450);
    await c.evaluate(() => document.getElementById('toasts').innerHTML = '');
    if (kind === 'phone'){ await c.tap('#tabbar [data-id="chats"]'); await c.waitForTimeout(300); await c.tap('.chrow[data-id="c-anna"]'); }
    else { if (!(await ev(c, () => S.rightOpen))) await c.click('#tg-right'); await c.waitForTimeout(200); await c.click('.chrow[data-id="c-anna"]'); }
    await c.waitForTimeout(300);
    await c.evaluate(() => { for (let i = 0; i < 24; i++) CHATS['c-anna'].messages.push({ from:i % 3 ? 'p-anna' : 'self', t:'09:' + String(10 + i), text:'Line ' + i + ' about the basement and the long tones' }); render(); });
    await c.waitForTimeout(200);
    await c.fill('#chatbox', 'see you there'); await c.waitForTimeout(100);
    await c.evaluate(() => { document.getElementById('msgs').scrollTop = 120; }); await c.waitForTimeout(250);
    const place = () => ev(c, () => ({ hash:location.hash, stack:JSON.stringify(S.stack), tab:S.tab, chat:S.chatOpen, conv:!!document.querySelector('#chats .conv') && document.getElementById('chats').offsetParent !== null,
      box:(document.getElementById('chatbox') || {}).value, scroll:(document.getElementById('msgs') || {}).scrollTop }));
    const p0 = await place();
    ok(p0.chat === 'c-anna' && p0.conv && p0.scroll === 120, kind + ': the conversation with Anna is open ' + JSON.stringify(p0));
    if (kind !== 'phone') ok(await ev(c, () => { const ch = document.getElementById('chats').getBoundingClientRect(); return ch.width <= 360 && document.getElementById('center').getBoundingClientRect().width > 300; }),
      kind + ': the conversation sits in the chat dock, never the whole centre');
    else ok(await ev(c, () => document.getElementById('tabbar').offsetParent !== null && document.querySelector('#tabbar .tab.on').getAttribute('data-id') === 'chats'), 'phone: in a conversation the tabs stay, Chats lit');
    const opener = kind === 'phone' ? ['#appbar .ab-btn[data-act="chatprofile"]', '#appbar .ab-title[data-act="chatprofile"]'] : ['#chats .phead .ib[data-act="chatprofile"]', '#chats .phead .ptbtn', '#chats .msg:not(.me) .mwho'];
    for (const [i, sel] of opener.entries()){
      /* a name in the conversation is clicked where it is, without scrolling the conversation to it */
      if (/mwho/.test(sel)) await c.evaluate(() => { const box = document.getElementById('msgs').getBoundingClientRect();
        [...document.querySelectorAll('#chats .msg:not(.me) .mwho')].find(x => { const r = x.getBoundingClientRect(); return r.top >= box.top && r.bottom <= box.bottom; }).click(); });
      else await c.click(sel);
      await c.waitForTimeout(350);
      /* the profile is the one window, like anything else you open */
      const w = await ev(c, () => { const d = document.getElementById('win'); if (d.hidden) return null; const r = d.getBoundingClientRect(), x = d.querySelector('#dbar [data-act="closewin"]');
        return { name:(d.querySelector('h1') || {}).textContent, top:S.stack.map(t => t.type + ':' + t.id).join('>'), x:!!x && x.offsetParent !== null && x.getBoundingClientRect().top >= 0,
                 full:r.width >= innerWidth - 1 && r.height >= innerHeight - 1, follow:!!d.querySelector('[data-act="followp"]'), dlg:!!document.querySelector('.dlg') }; });
      ok(w && w.name === 'Anna Vale' && w.top === 'person:p-anna' && w.x && w.follow && !w.dlg && (kind === 'phone' ? w.full : !w.full), kind + ': ' + sel + ' opens Anna’s profile in the window, with a visible close ' + JSON.stringify(w));
      if (i === 0) await shot(c, 'profile-from-chat-' + kind);
      /* × closes it — and on a phone, the back gesture too */
      if (kind === 'phone' && i === 1){ await c.goBack(); } else await c.click('#dbar [data-act="closewin"]');
      await c.waitForTimeout(400);
      const p1 = await place();
      ok(await ev(c, () => document.getElementById('win').hidden) && JSON.stringify(Object.assign({}, p1, { hash:'' })) === JSON.stringify(Object.assign({}, p0, { hash:'' })) && p1.hash === p0.hash,
         kind + ': closing it (' + (kind === 'phone' && i === 1 ? 'back' : '×') + ') leaves the chat exactly as it was ' + JSON.stringify(p1));
    }
    /* following from the window updates it in place; an event opened from it stacks in the same window, the chat stays */
    await c.click(opener[0]); await c.waitForTimeout(300);
    await c.click('#dscroll [data-act="followp"]'); await c.waitForTimeout(250);
    ok(await ev(c, () => !document.getElementById('win').hidden && !PFOLLOW['p-anna'] && /Follow/.test(document.querySelector('#dscroll [data-act="followp"]').textContent)), kind + ': Follow in the window works in place');
    await c.evaluate(() => { followP('p-anna'); document.querySelector('#dscroll .crow .cm[data-type="event"]').click(); }); await c.waitForTimeout(350);
    ok(await ev(c, () => S.stack.length === 2 && S.stack[1].type === 'event' && S.stack[0].type === 'person' && S.chatOpen === 'c-anna' && !!document.querySelector('#dbar [data-act="back"]')), kind + ': an event opened from the profile stacks in the window (‹ back to it); the chat stays open');
    await c.click('#dbar [data-act="closewin"]'); await c.waitForTimeout(350);
    /* go elsewhere and come back: the same conversation, draft and place */
    if (kind === 'phone'){
      await c.tap('#tabbar [data-id="home"]'); await c.waitForTimeout(300);
      ok(await ev(c, () => S.tab === 'home' && !document.querySelector('#chats').offsetParent), 'phone: Home tab from a chat');
      await c.tap('#tabbar [data-id="chats"]'); await c.waitForTimeout(350);
    } else {
      await c.click('#navbody .nrow[data-kind="explore"]'); await c.waitForTimeout(300);
      await c.click('#navbody .nrow[data-kind="home"]'); await c.waitForTimeout(300);
    }
    const p2 = await place();
    ok(p2.chat === 'c-anna' && p2.conv && p2.box === 'see you there' && p2.scroll === 120, kind + ': after Home' + (kind === 'phone' ? ' and back to Chats' : ' and Explore') + ', the same conversation, draft and scroll ' + JSON.stringify(p2));
    await c.reload(); await c.waitForTimeout(800);
    if (kind === 'phone'){ await c.tap('#tabbar [data-id="home"]'); await c.waitForTimeout(250); await c.reload(); await c.waitForTimeout(800); await c.tap('#tabbar [data-id="chats"]'); await c.waitForTimeout(350); }
    const p3 = await place();
    ok(p3.chat === 'c-anna' && p3.conv && p3.box === 'see you there', kind + ': and after a reload' + (kind === 'phone' ? ' (on Home, then Chats)' : '') + ' ' + JSON.stringify(p3));
    if (kind === 'phone'){
      /* in a conversation, ‹ is all chats; Message on a profile opens the chat in the Chats tab, back returns to the profile */
      await c.tap('#appbar [data-act="chatback"]'); await c.waitForTimeout(300);
      ok(await ev(c, () => !S.chatOpen && !!document.querySelector('#chats .chrow')), 'phone: ‹ in a conversation goes to all chats');
      await c.goto(URL + '#/person/rio'); await c.waitForTimeout(450);
      await c.tap('#dscroll .actbar [data-act="dm"]'); await c.waitForTimeout(350);
      ok(await ev(c, () => S.tab === 'chats' && CHATS[S.chatOpen].memberIds[0] === 'p-rio' && /^#\/chats\//.test(location.hash)), 'phone: Message opens the conversation in the Chats tab');
      await c.goBack(); await c.waitForTimeout(350);
      ok(await ev(c, () => location.hash === '#/person/rio' && CHATS[S.chatOpen].memberIds[0] === 'p-rio'), 'phone: back returns to the profile; the conversation stays the open one');
    }
    ok(!c.errors.length, kind + ': no console errors (chat place, profile window) ' + c.errors.join(' '));
    ok((await overflow(c)) <= 0, kind + ': no overflow (chat place, profile window)');
  }
  /* Share copies the item's link: event, Event Horizon, call out, from the toolbar and the menu */
  {
    const c = await ctx('desk');
    await open(c, '', true);
    const stub = () => c.evaluate(() => { window.__copied = []; Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{ writeText:t => { window.__copied.push(t); return Promise.resolve(); } } }); });
    const got = [];
    for (const [h, sel, type, id] of [['#/event/led-forest-walk', '#dscroll .actbar [data-act="share"]', 'event', 'evt-fill-3'], ['#/horizon/baltic', '#dscroll [data-act="share"][data-type="horizon"]', 'horizon', 'horizon-baltic'],
                                      ['#/callout/sound', '#dscroll [data-act="share"][data-type="callout"]', 'callout', 'co-sound']]){
      await c.goto(URL + h); await c.waitForTimeout(450); await stub();
      await c.click(sel + ' >> nth=0'); await c.waitForTimeout(250);
      got.push(await ev(c, ([t, i]) => ({ ok:window.__copied.length === 1 && window.__copied[0] === linkOf(t, i) && window.__copied[0].indexOf('#/' + t) > 0, toast:/Link copied/.test(document.getElementById('toasts').textContent), dlg:DLGS.length }), [type, id]));
    }
    ok(got.every(g => g.ok && g.toast && !g.dlg), 'share: the toolbar Share copies the right link (event, Event Horizon, call out) and says so ' + JSON.stringify(got));
    await c.goto(URL + '#/explore/events'); await c.waitForTimeout(450); await stub();
    const rid = await ev(c, () => document.querySelector('#listbody .row[data-type="event"]').getAttribute('data-id'));
    await c.click('#listbody .row[data-type="event"] >> nth=0', { button:'right' }); await c.waitForTimeout(200);
    await c.click('.ctxmenu .ci:has-text("Share")'); await c.waitForTimeout(250);
    ok(await ev(c, i => window.__copied[0] === linkOf('event', i) && !DLGS.length, rid), 'share: right-click → Share copies the link');
    await c.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable:true, value:undefined }); document.execCommand = () => false; });
    await pick(c, '#listbody .row[data-type="event"] >> nth=0'); await c.waitForTimeout(300);
    await c.click('#dscroll .actbar [data-act="share"] >> nth=0'); await c.waitForTimeout(250);
    ok(await ev(c, i => DLGS.length === 1 && document.getElementById('sh-url').value === linkOf('event', i) && document.activeElement.id === 'sh-url', rid), 'share: with no clipboard at all, the link is shown selected to copy');
    ok(await ev(c, () => typeof shareDialog === 'undefined' && typeof shareToChat === 'undefined' && typeof recordAnswer === 'undefined' && typeof ANSWERED === 'undefined'), 'removed: the share-to-chat dialog and answering in chat');
    ok(!c.errors.length, 'share: no console errors ' + c.errors.join(' '));
  }

  /* ---------------- 2026-10-04: logged out, the account's place holds Log in ---------------- */
  {
    const c = await ctx('desk');
    await open(c, '', true);
    ok(await ev(c, () => { const b = document.querySelector('#acct button'); return !!b && /Log in/.test(b.textContent) && /^(login|loginpick)$/.test(b.dataset.act); }), 'desk: logged out, Log in sits where your account would be');
    await c.click('#acct button'); await c.waitForTimeout(250);
    ok(await ev(c, () => DLGS.length === 1), 'desk: the toolbar Log in opens the way in');
    ok(!c.errors.length, 'desk: no console errors (toolbar Log in) ' + c.errors.join(' '));
  }

  /* ---------------- 2026-10-04 (layout): logged out there is no Home ---------------- */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    /* anything that ever showed Home while logged out — the heading, the title, a sidebar row, a tab — even for a frame */
    await c.addInitScript(() => {
      window.__home = [];
      new MutationObserver(recs => { for (const r of recs){
        const host = r.target.nodeType === 1 ? r.target : r.target.parentNode;
        if (!host || !host.closest || !host.closest('title, #chead, #wintitle, #appbar, #tabbar, #navbody')) continue;
        for (const n of r.addedNodes){
          const el = n.nodeType === 1 ? n : null, txt = (n.textContent || '').trim();
          if ((el && (el.matches('[data-kind="home"], [data-id="home"]') || el.querySelector('[data-kind="home"], [data-id="home"]'))) ||
              (host.closest('title, #wintitle') && /^(— )?Home\b/.test(txt)) ||
              (el && [el].concat([...el.querySelectorAll('h2, .ab-title')]).some(h => h.matches('h2, .ab-title') && h.textContent.trim() === 'Home')))
            window.__home.push(host.id || host.tagName);
        }
      } }).observe(document, { subtree:true, childList:true, characterData:true });
    });
    await open(c, '#/home', true);
    const st = () => ev(c, () => ({ hash:location.hash, folder:S.folder.kind, tab:S.tab, logged:S.loggedIn, nav:!!document.querySelector('#navbody [data-kind="home"]'),
      tabs:[...document.querySelectorAll('#tabbar .tab')].map(t => t.getAttribute('data-id') || 'new'), on:(document.querySelector('#tabbar .tab.on') || { getAttribute:() => '' }).getAttribute('data-id'), flash:window.__home.slice() }));
    const lo = await st();
    /* 2026-10-05 (v5-shell): logged out a phone has no tabs at all (was: four, Explore lit) */
    ok(!lo.logged && lo.hash === '#/explore' && lo.folder === 'explore' && !lo.nav && lo.tabs.indexOf('home') < 0 && !lo.flash.length &&
       (kind === 'desk' || (lo.tab === 'explore' && !lo.tabs.length && !lo.on)),
       kind + ': logged out, #/home lands on Explore — no Home in the sidebar, no tabs on a phone, never drawn even for a moment ' + JSON.stringify(lo));
    await c.goto(URL); await c.waitForTimeout(450);
    const l2 = await st();
    ok(l2.hash === '#/explore' && !l2.flash.length, kind + ': logged out, the bare link lands on Explore ' + JSON.stringify(l2));
    if (kind === 'desk') await shot(c, 'layout-logged-out-landing');
    /* Log in from where a visitor lands: Home appears and is where you are; it stays the landing */
    if (kind === 'desk') await c.click('#acct button'); else await c.tap('#previewbar [data-act="loginpick"]');
    await c.waitForTimeout(250);
    await c.click('.dlg [data-act="useacct"][data-id="demo"]'); await c.waitForTimeout(450);
    const li = await st();
    ok(li.logged && li.hash === '#/home' && li.folder === 'home' && (kind === 'desk' ? li.nav : li.tabs.join('|') === 'home|explore|new|chats|you' && li.on === 'home'),
       kind + ': logging in from the landing goes Home, and Home is in the ' + (kind === 'desk' ? 'sidebar' : 'tabs') + ' ' + JSON.stringify(li));
    await c.goto(URL); await c.waitForTimeout(500);
    ok((await st()).hash === '#/home', kind + ': logged in, the bare link lands on Home');
    /* joining on the way to something keeps you there */
    await c.evaluate(() => doLogout()); await c.waitForTimeout(250);
    const lg = await st();
    ok(!lg.logged && lg.hash === '#/explore' && !lg.nav && lg.tabs.indexOf('home') < 0, kind + ': logging out lands on Explore, Home gone ' + JSON.stringify(lg));
    await c.goto(URL + '#/explore/events'); await c.waitForTimeout(400);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    ok((await st()).hash === '#/explore/events', kind + ': logging in anywhere else keeps you where you are');
    ok(!c.errors.length, kind + ': no console errors (no Home logged out) ' + c.errors.join(' '));
  }

  /* ---------------- 2026-10-04 (layout): the white spans the centre; each view sits in its container ----------------
     2026-10-05 (v5-shell): every container starts at the white's left, the heading on the white's own edge; the window lies
     over the list, which never moves for it (was: the containers centred, the heading 16 in, the list stepping aside).
     2026-10-20: the default height is the main area under the toolbar — 8 below it, 8 above #main's bottom — beside the
     list and in cover. Width, the kept 320 and the right inset are unchanged. */
  const listGeo = p => p.evaluate(() => { const lb = document.getElementById('listbody'), cs = getComputedStyle(lb);
    return { pad:cs.padding, fit:JSON.stringify(L.fit), st:lb.scrollTop, rects:[...lb.querySelectorAll('.card2, .cart, .row, .fitem, .fuprow, .band, .shh')].slice(0, 80).map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round).join(','); }).join(';') }; });
  const winOver = p => p.evaluate(() => { const w = document.getElementById('win'), wr = w.getBoundingClientRect(), lb = document.getElementById('listbody'), r = lb.getBoundingClientRect(),
      ce = document.getElementById('center').getBoundingClientRect(), fr = lb.clientLeft, sb = lb.offsetWidth - lb.clientWidth - 2 * fr,
      main = document.getElementById('main').getBoundingClientRect(), bar = document.getElementById('toolbar').getBoundingClientRect();
    /* under the first 320 of every entry in view is the list, never the window */
    const hits = [...lb.querySelectorAll('.fitem, .fuprow, .band, .card2, .row')].filter(x => { const q = x.getBoundingClientRect(); return q.top > r.top + 8 && q.bottom < r.bottom - 8 && q.left < r.left + 300; })
      .map(x => { const q = x.getBoundingClientRect(), el = document.elementFromPoint(Math.min(q.right - 4, r.left + 310), (q.top + q.bottom) / 2); return !!el && !!el.closest('#listbody'); });
    return { open:!w.hidden, mode:L.win, ww:Math.round(wr.width), keep:Math.round(wr.left - r.left), rgap:Math.round(ce.right - wr.right), sb, fr,
             belowBar:Math.round(wr.top - bar.bottom), aboveMain:Math.round(main.bottom - wr.bottom),
             hits:hits.length, under:hits.filter(x => !x).length, cover:Math.round(wr.left) === Math.round(ce.left) && Math.round(wr.right) === Math.round(ce.right) }; });
  for (const [w, h] of [[1440, 900], [1920, 1080], [1280, 800]]){
    const c = await ctx('desk', { viewport:{ width:w, height:h } });
    await open(c, '', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    await c.evaluate(() => { S.rightOpen = false; render(); }); await c.waitForTimeout(200);
    const want = { '#/home':640, '#/explore/events':720, '#/explore/people':720, '#/explore/callouts':720, '#/search?q=burn':720, '#/explore/soon':720, '#/going':720,
                   '#/explore':1120, '#/explore/events?view=calendar':1120 };
    const got = {};
    for (const hh of Object.keys(want)){ await c.goto(URL + hh); await c.waitForTimeout(350); got[hh] = await geoOf(c); }
    /* 2026-10-05 (v5-calendar): a list that also has a calendar keeps the calendar's slot — its 720 sits at the slot's left,
       where the calendar's 1120 starts — so the heading (and the List / Calendar switch at its right) stays put */
    const slotted = ['#/explore/events', '#/explore/soon', '#/going'], calCl = got['#/explore/events?view=calendar'].cl;
    const bad = Object.keys(want).filter(k => { const g = got[k];
      /* 2026-10-05 (v5-shell): every container (and a list's calendar slot) at the white's left, the heading on its edge */
      const placed = g.cl === 0 && (slotted.indexOf(k) < 0 || g.cl === calCl);
      return !(g.panelL === 8 && g.panelR === 8 && g.cw === Math.min(want[k], g.panelW - g.sb) && placed && g.head === 0); });
    ok(!bad.length, w + ': the white spans the centre; Home sits in 640, lists in 720, Explore\'s overview and the calendar in 1120 — at the white\'s left (a list with a calendar where the calendar starts), the heading on the white\'s left edge ' + JSON.stringify(bad.map(k => [k, got[k]])));
    if (w === 1440){ await c.goto(URL + '#/explore'); await c.waitForTimeout(350); await shot(c, 'layout-1440-explore'); }
    if (w === 1920){ await c.goto(URL + '#/home'); await c.waitForTimeout(350); await shot(c, 'layout-1920-home'); await overflowEverywhere(c, 'desktop 1920'); }
    /* the window lies over the right of the white; opening, replacing and closing it never moves the list */
    for (const dock of [false, true]) for (const [hh, sel] of [['#/home', '#listbody .fuprow .flink'], ['#/explore', '#listbody .srow .card2'], ['#/explore/events', '#listbody .row[data-type="event"]']]){
      await c.goto(URL + hh); await c.waitForTimeout(350);
      await c.evaluate(d => { S.rightOpen = d; S.stack = []; render(); document.getElementById('listbody').scrollTop = 0; }, dock); await c.waitForTimeout(250);
      const g0 = await listGeo(c);
      await pick(c, sel + ' >> nth=0'); await c.waitForTimeout(400);
      const g1 = await listGeo(c), wg = await winOver(c);
      await c.evaluate(() => openItem(S.rows[1].type, S.rows[1].id)); await c.waitForTimeout(350);
      const g2 = await listGeo(c), wg2 = await winOver(c);
      await c.click('#dbar [data-act="closewin"]'); await c.waitForTimeout(300);
      const g3 = await listGeo(c);
      const tag = w + (dock ? ' + dock' : '') + ' ' + hh;
      const still = [g1, g2, g3].every(g => g.rects === g0.rects && g.pad === g0.pad && g.fit === g0.fit && g.st === g0.st);
      ok(still && g0.rects.length > 20, tag + ': opening, replacing and closing the window moves nothing in the list (place, padding, squares)');
      if (wg.mode === 'over'){
        ok(wg.open && wg.ww >= 440 && wg.ww <= 720 && wg.keep >= 320 && wg.rgap === wg.sb + wg.fr + 8 && wg.belowBar === 8 && wg.aboveMain === 8 && wg.hits >= 2 && !wg.under && wg2.keep === wg.keep && wg2.ww === wg.ww,
           tag + ': the window lies over the right of the white (scrollbar and frame clear), 8 below the toolbar and 8 above the main area, the list\'s first 320 in view and clickable ' + JSON.stringify(wg));
      } else ok(w === 1280 && dock && wg.open && wg.cover && wg.belowBar === 8 && wg.aboveMain === 8, tag + ': with no room for both, the window takes the centre at the main area\'s height ' + JSON.stringify(wg));
      if (w === 1440 && dock && hh === '#/home'){ await pick(c, sel + ' >> nth=0'); await c.waitForTimeout(350); await shot(c, 'layout-1440-home-window-dock'); await c.click('#dbar [data-act="closewin"]'); await c.waitForTimeout(250); }
    }
    ok(!c.errors.length && (await overflow(c)) <= 0, w + ': no console errors, no overflow (layout) ' + c.errors.join(' '));
  }
  {
    /* tablet: the container is the white; the overview three squares wide; the window is the centre */
    const c = await ctx('tab');
    await open(c, '', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    const hm = await geoOf(c);
    await c.goto(URL + '#/explore'); await c.waitForTimeout(400);
    const ex = await geoOf(c), cols = await ev(c, () => L.fit && L.fit.cols);
    await shot(c, 'layout-768-explore');
    await c.click('#listbody .srow .card2 >> nth=0'); await c.waitForTimeout(350);
    const wv = await ev(c, () => { const wr = document.getElementById('win').getBoundingClientRect(), ce = document.getElementById('center').getBoundingClientRect(),
      main = document.getElementById('main').getBoundingClientRect(), bar = document.getElementById('toolbar').getBoundingClientRect();
      return Math.round(wr.left) === Math.round(ce.left) && Math.round(wr.width) === Math.round(ce.width) && Math.round(wr.top - bar.bottom) === 8 && Math.round(main.bottom - wr.bottom) === 8; });
    ok(hm.cl === 0 && hm.cw === hm.panelW - hm.sb && hm.head === 0 && ex.cw === ex.panelW - ex.sb && cols === 3 && wv,
       '768: Home and Explore fill the white, the overview is three squares wide, an opened event takes the centre ' + JSON.stringify([hm, ex, cols, wv]));
    ok(!c.errors.length && (await overflow(c)) <= 0, '768: no console errors, no overflow (layout)');
  }

  /* ---------------- 2026-10-05 (v5-shell): no tabs logged out on a phone; the login code step; one light look ---------------- */
  {
    /* logged out a phone has no tab bar: the preview bar is its foot, and every way into an account's place lands on Explore */
    const c = await ctx('phone');
    await open(c, '', true);
    const st = () => ev(c, () => ({ hash:location.hash, folder:S.folder.kind, tab:S.tab, stack:S.stack.length, tabbar:document.getElementById('tabbar').offsetParent !== null,
      foot:Math.round(innerHeight - document.getElementById('previewbar').getBoundingClientRect().bottom), you:document.getElementById('app').classList.contains('scr-you'),
      search:!!document.querySelector('#appbar [data-act="psearch"]') }));
    const lands = {};
    for (const h of ['', '#/you', '#/chats', '#/chats/anna', '#/going', '#/interested', '#/hosting', '#/promoted', '#/home']){
      await c.goto(URL + h); await c.waitForTimeout(400); lands[h || '(bare)'] = await st();
    }
    const off = Object.keys(lands).filter(k => { const x = lands[k]; return !(x.hash === '#/explore' && x.folder === 'explore' && x.tab === 'explore' && !x.stack && !x.tabbar && x.foot === 0 && !x.you && x.search); });
    ok(!off.length, 'v5 phone: logged out there is no tab bar; #/you, #/chats, a chat, your lists and #/home all land on Explore, search in reach ' + JSON.stringify(off.map(k => [k, lands[k]])));
    await c.goto(URL + '#/event/borderland-2027'); await c.waitForTimeout(450);
    const evp = await ev(c, () => { const w = document.getElementById('win').getBoundingClientRect(), pb = document.getElementById('previewbar').getBoundingClientRect(), vb = document.getElementById('evbar').getBoundingClientRect();
      return { open:!document.getElementById('win').hidden, above:w.bottom <= pb.top + 1 && vb.bottom <= pb.top + 1, tabbar:document.getElementById('tabbar').offsetParent !== null }; });
    ok(evp.open && evp.above && !evp.tabbar, 'v5 phone: logged out, an event is a sheet over Explore that ends above the preview bar, no tab bar ' + JSON.stringify(evp));
    /* logged in the tabs are back; logging out from You and Chats leaves history a visitor can walk back through to Explore only */
    await c.goto(URL + '#/explore'); await c.waitForTimeout(350);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    const tabs = await ev(c, () => [...document.querySelectorAll('#tabbar .tab')].map(t => t.getAttribute('data-id') || 'new').join('|'));
    ok(tabs === 'home|explore|new|chats|you', 'v5 phone: logged in, the five tabs are there ' + tabs);
    await c.tap('#tabbar [data-id="you"]'); await c.waitForTimeout(300);
    await c.tap('#tabbar [data-id="chats"]'); await c.waitForTimeout(300);
    await c.evaluate(() => doLogout()); await c.waitForTimeout(400);
    const walk = [await st()];
    for (let i = 0; i < 2; i++){ await c.goBack(); await c.waitForTimeout(400); walk.push(await st()); }
    ok(walk.every(x => x.hash === '#/explore' && x.folder === 'explore' && !x.tabbar && !x.you), 'v5 phone: after logging out, back through You and Chats shows Explore and says so in the URL ' + JSON.stringify(walk.map(x => x.hash)));
    ok(!c.errors.length && (await overflow(c)) <= 0, 'v5 phone: no console errors, no overflow (logged out) ' + c.errors.join(' '));
  }
  {
    /* a desktop visitor's #/you, #/chats and lists land on Explore too, never on Home */
    const c = await ctx('desk');
    await open(c, '', true);
    const got = [];
    for (const h of ['#/you', '#/chats', '#/chats/anna', '#/going', '#/hosting']){
      await c.goto(URL + h); await c.waitForTimeout(400);
      got.push(await ev(c, () => location.hash + ' ' + S.folder.kind + ' ' + S.stack.length + ' ' + document.querySelector('#chead h2').textContent));
    }
    ok(got.every(x => x === '#/explore explore 0 Explore'), 'v5 desk: logged out, an account\'s places land on Explore ' + JSON.stringify(got));
    /* the app has one look, light: the browser's automatic darkening (Android Chrome's Auto Dark) is opted out of */
    ok(await ev(c, () => (document.querySelector('meta[name="color-scheme"]') || {}).content === 'only light' && /^(only light|light only)$/.test(getComputedStyle(document.documentElement).colorScheme)),
       'v5: color-scheme is "only light" (meta and :root), so Chrome\'s auto dark leaves the app as designed');
    ok(!c.errors.length, 'v5 desk: no console errors (logged out places) ' + c.errors.join(' '));
  }
  /* the login dialog online (the API answered here): ⚠ only with an error; no "Use another email"; Send a new code waits 30 s,
     counting down, at the footer's left in line with Back and Log in; Back keeps the email to correct it */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await c.addInitScript(() => { window.HN_BACKEND = { branch:'test' }; });
    await c.route('**/api/**', route => {
      const u = new (require('url').URL)(route.request().url()), j = (code, b) => route.fulfill({ status:code, contentType:'application/json', body:JSON.stringify(b) });
      if (u.pathname === '/api/bootstrap') return j(200, { me:null, login:null, people:[], follows:[], events:[], rsvps:[], promotions:[], horizons:[], hzFollows:[], callouts:[], replies:[], chats:[], activity:[] });
      if (/sign-in\/email-otp$/.test(u.pathname)) return j(401, { message:'Invalid OTP', code:'INVALID_OTP' });
      return j(200, {});
    });
    await open(c, '', true);
    const lg = () => ev(c, () => { const d = document.querySelector('.dlg'); if (!d) return null;
      const e = d.querySelector('.ferr'), f = d.querySelector('.dfoot'), btn = s => d.querySelector('.dfoot [data-hnact="' + s + '"]'), mid = b => b ? Math.round(b.getBoundingClientRect().top + b.offsetHeight / 2) : null;
      const rs = btn('resend'), bk = btn('other'), li = btn('verify');
      return { online:HNAPI.online, warn:!!e && getComputedStyle(e).display !== 'none', err:e ? e.textContent : '', other:/another email/i.test(d.textContent), help:(d.querySelector('.fhelp') || {}).textContent || '',
               resend:rs && { label:rs.textContent, off:rs.disabled, first:f.firstElementChild === rs, left:Math.round(rs.getBoundingClientRect().left - f.getBoundingClientRect().left), mid:mid(rs) },
               back:bk && bk.textContent, login:li && { mid:mid(li), last:f.lastElementChild === li }, email:(document.getElementById('hn-email') || {}).value, otp:(document.getElementById('hn-otp') || {}).value }; });
    await c.evaluate(() => loginPicker()); await c.waitForTimeout(250);
    const e0 = await lg();
    await c.fill('#hn-email', 'nope'); await c.click('.dlg [data-hnact="send"]'); await c.waitForTimeout(250);
    const e1 = await lg();
    ok(e0 && e0.online && !e0.warn && e1.warn && /email address/.test(e1.err), kind + ': login — no ⚠ until there is an error to say, then ⚠ with it ' + JSON.stringify([e0, e1]));
    await c.fill('#hn-email', 'someone@example.com'); await c.click('.dlg [data-hnact="send"]'); await c.waitForTimeout(450);
    const c0 = await lg();
    if (kind === 'desk') await shot(c, 'v5-login-code');
    ok(c0.resend && !c0.other && !c0.warn && c0.resend.off && /^Send a new code \(0:30\)$/.test(c0.resend.label) && c0.resend.first && c0.resend.left === (kind === 'phone' ? 12 : 20) &&
       c0.login.last && Math.abs(c0.resend.mid - c0.login.mid) <= 1 && c0.back === 'Back',
       kind + ': login code — no "Use another email", no ⚠; Send a new code (0:30) waits, at the footer\'s left, in line with Back and Log in ' + JSON.stringify(c0));
    await c.clock.fastForward(12000); await c.waitForTimeout(1100);
    const c1 = await lg();
    await c.clock.fastForward(20000); await c.waitForTimeout(1100);
    const c2 = await lg();
    ok(c1.resend.off && /\(0:1\d\)$/.test(c1.resend.label) && !c2.resend.off && c2.resend.label === 'Send a new code', kind + ': login code — it counts down and unlocks after 30 s ' + JSON.stringify([c1.resend.label, c2.resend.label]));
    await c.fill('#hn-otp', '123456'); await c.click('.dlg [data-hnact="verify"]'); await c.waitForTimeout(450);
    const c3 = await lg();
    ok(c3.warn && /isn’t right/.test(c3.err) && c3.otp === '123456', kind + ': login code — a wrong code says so with ⚠ and stays in its field ' + JSON.stringify(c3));
    await c.click('.dlg [data-hnact="resend"]'); await c.waitForTimeout(450);
    const c4 = await lg();
    ok(/new code/.test(c4.help) && c4.resend.off && /\(0:30\)$/.test(c4.resend.label) && !c4.warn, kind + ': login code — Send a new code sends one and waits again ' + JSON.stringify(c4));
    await c.click('.dlg [data-hnact="other"]'); await c.waitForTimeout(300);
    const c5 = await lg();
    ok(c5 && c5.email === 'someone@example.com' && !c5.resend, kind + ': login code — Back returns to the email, kept, to correct it ' + JSON.stringify(c5));
    ok(!c.errors.filter(x => !/401/.test(x)).length && (await overflow(c)) <= 0, kind + ': login (online): no console errors, no overflow ' + c.errors.join(' '));
  }

  /* 2026-10-05 (v5-homechats): Home never says "nothing happened" over something that did; it starts straight away with
     what happened, and what Home is (and how to see more there) is said once at its end — the whole page when there is
     nothing at all. An empty chat list says "No chats yet" and how a chat starts. Offline states run on the fixtures,
     online ones on a mocked /api/bootstrap (window.HN_BACKEND set before the page loads, every /api/ call answered here) */
  {
    const NOWMS = NOWPIN ? NOWPIN.getTime() : Date.now();
    const ME = '11111111-1111-4111-8111-111111111111', ANNA = '22222222-2222-4222-8222-222222222222', E1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const P = (id, handle, name) => ({ id, handle, displayName:name, bio:'', skills:[], cities:['Brno'], look:null, lastSeenAt:null, createdAt:'2026-09-01T10:00:00Z' });
    /* o.mine: you are going to the one event (a row 30 minutes old) · o.follow: who you follow · o.alone: nobody else here */
    const boot = o => ({ hypernet:1, me:P(ME, 'hana', 'Hana Cerna'), login:null,
      people:[P(ME, 'hana', 'Hana Cerna')].concat(o.alone ? [] : [P(ANNA, 'annav', 'Anna Vale')]), follows:(o.follow || []).map(x => [ME, x]),
      events:[{ id:E1, slug:'brno-burn', title:'Brno Burn', startsOn:new Date(NOWMS + 16 * 86400000).toISOString().slice(0, 10), endsOn:null, startTime:null, endTime:null,
        timezone:'Europe/Prague', hostId:null, hostName:'Brno Burn', description:'A small burn.', kind:'burn', privacy:'everyone', city:'Brno', region:null, country:'CZ',
        venue:null, access:null, whatToBring:[], details:{}, look:null, source:'import', previousEditionId:null }],
      rsvps:o.mine ? [{ personId:ME, eventId:E1, status:'going', went:false, shiftIndex:null, updatedAt:new Date(NOWMS - 1800000).toISOString() }] : [],
      promotions:[], horizons:[], hzFollows:[], callouts:[], replies:[], chats:[],
      activity:o.mine ? [{ actor:ME, verb:'going', objType:'event', objId:E1, ts:new Date(NOWMS - 1800000).toISOString(), extra:null }] : [] });
    const online = async (kind, o) => {
      const c = await ctx(kind);
      await c.addInitScript(() => { window.HN_BACKEND = { branch:'test' }; });
      await c.context().route('**/api/**', r => { const u = r.request().url();
        return r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(/\/api\/bootstrap/.test(u) ? boot(o) : /\/api\/chats/.test(u) ? { chats:[] } : {}) }); });
      await c.goto(URL + '#/home'); await c.waitForTimeout(700);
      return c;
    };
    /* what Home says: is anything on it, does anything say "nothing", is the end last, what it says */
    const homeSays = c => ev(c, () => { const lb = document.getElementById('listbody'), end = lb.querySelector('.fend'), kids = [...lb.children];
      return { online:ONLINE, kids:kids.map(x => x.className.split(' ')[0] || x.tagName), stuff:!!lb.querySelector('.fitem, .costrip, .fup'),
               nothing:/Nothing here yet|haven’t done anything|Nothing has happened/.test(lb.textContent), last:!!end && kids[kids.length - 1] === end,
               head:end ? end.querySelector('h3').textContent : '', say:end ? end.querySelector('p').textContent : '',
               people:!!(end && end.querySelector('[data-act="explorekind"][data-id="people"]')), primary:!!(end && end.querySelector('.btn.primary[data-id="people"]')),
               old:!!lb.querySelector('.empty, .fnetnote') || /Make Home yours/.test(lb.textContent) }; });
    const chatSays = async (c, kind) => {
      if (kind === 'phone') await c.tap('#tabbar [data-id="chats"]'); else if (!(await ev(c, () => S.rightOpen))) await c.click('#tg-right');
      await c.waitForTimeout(350);
      return ev(c, () => { const el = document.getElementById('chats'), e = el.querySelector('.chempty');
        return { shown:el.offsetParent !== null, head:e ? e.querySelector('h3').textContent : '', how:e ? e.querySelector('p').textContent : '', band:!!el.querySelector('.band'),
                 rows:el.querySelectorAll('.chrow[data-act="dm"]').length, chats:el.querySelectorAll('.chrow[data-act="chatsel"]').length }; });
    };
    for (const kind of ['phone', 'desk']){
      /* offline, following nobody: the stream first, the nudge at its end; Find people goes to Explore's people */
      let c = await ctx(kind);
      await open(c, '#/home', true);
      await guest(c, 'Hugo Home', 'hugohome');
      let s = await homeSays(c);
      ok(s.stuff && !s.nothing && !s.old && s.last && /^(costrip|band|fitem)$/.test(s.kids[0]) && s.head === 'That’s the last three weeks' &&
         /You don’t follow anyone yet, so here is everyone on Hypernet/.test(s.say) && s.people && s.primary,
         kind + ': following nobody, Home starts with what happened and ends saying what Home is and how to see more ' + JSON.stringify(Object.assign({}, s, { kids:s.kids.slice(0, 3) })));
      ok(await ev(c, () => !!document.querySelector('#listbody .ffof .ffh') && document.querySelector('#listbody .ffof .ffh').textContent === 'People to follow'), kind + ': people to follow are in the stream, not over it');
      const chOff = await chatSays(c, kind);
      ok(chOff.shown && chOff.head === 'No chats yet' && /Message on someone’s profile/.test(chOff.how) && chOff.band && chOff.rows >= 5 && !chOff.chats,
         kind + ': a new account’s Chats says "No chats yet", how a chat starts, then people to message ' + JSON.stringify(chOff));
      if (kind === 'phone'){ await c.tap('#tabbar [data-id="home"]'); await c.waitForTimeout(300); }
      await c.evaluate(() => { const l = document.getElementById('listbody'); l.scrollTop = l.scrollHeight; }); await c.waitForTimeout(150);
      await c.click('#listbody .fend [data-act="explorekind"][data-id="people"]'); await c.waitForTimeout(400);
      ok(await ev(c, () => S.folder.kind === 'explore' && S.folder.id === 'people' && location.hash === '#/explore/people'), kind + ': Find people at the end of Home goes to Explore → People');
      /* following one person: theirs, then Around the network — no note in between, no "nothing", the end says why */
      await c.goto(URL + '#/home'); await c.waitForTimeout(350);
      await c.evaluate(() => followP('p-mira')); await c.waitForTimeout(300);
      s = await homeSays(c);
      ok(s.kids.indexOf('band') >= 0 && await ev(c, () => !!document.querySelector('#listbody .netband')) && !s.nothing && !s.old && s.last && /the rest of Hypernet fills in/.test(s.say),
         kind + ': following one person, Around the network carries no note; the end says the rest of Hypernet fills in ' + JSON.stringify(s.say));
      ok(!c.errors.length && (await overflow(c)) <= 0, kind + ': no console errors, no overflow (Home end, offline) ' + c.errors.join(' '));
      await c.context().close();
      /* online, only your own row: "You: going to …", then the end — never "nothing happened" under it */
      c = await online(kind, { mine:true });
      s = await homeSays(c);
      /* 2026-10-05 (v5-feed): your line sits in its day band like everything else, and is an entry of the stream: following
         nobody, People to follow comes after it (after the last entry when there are fewer than three) */
      ok(s.online && JSON.stringify(s.kids) === '["band","fitem","fitem","fend"]' && await ev(c, () => !!document.querySelector('#listbody > .fyou + .ffof')) && !s.nothing && s.head === 'That’s the last three weeks' && !/here is everyone/.test(s.say) && /Follow a few people/.test(s.say),
         kind + ': online with only your own row, Home is your line (in Today), people to follow and its end, with no "nothing happened" ' + JSON.stringify(s));
      if (kind === 'phone') await shot(c, 'homechats-only-mine-phone');
      const chOn = await chatSays(c, kind);
      ok(chOn.shown && chOn.head === 'No chats yet' && chOn.rows === 1 && !chOn.chats, kind + ': online with no chats, Chats says "No chats yet" over the one person to message ' + JSON.stringify(chOn));
      await c.context().close();
      /* online, following someone who did nothing, and your own row: still no "haven't done anything" */
      c = await online(kind, { mine:true, follow:[ANNA] });
      s = await homeSays(c);
      ok(s.online && s.stuff && !s.nothing && s.last && /Follow more people to see more here/.test(s.say), kind + ': online, following a quiet person, your line is not followed by "haven’t done anything" ' + JSON.stringify(s));
      await c.context().close();
      /* online, nothing at all and nobody else here: the end is the whole page; Chats has no people band */
      c = await online(kind, { alone:true });
      s = await homeSays(c);
      ok(s.online && JSON.stringify(s.kids) === '["fend"]' && s.head === 'Nothing here yet' && s.people && s.primary, kind + ': online with nothing at all, the end is the whole page ' + JSON.stringify(s));
      if (kind === 'desk') await shot(c, 'homechats-nothing-desk');
      const chAlone = await chatSays(c, kind);
      ok(chAlone.head === 'No chats yet' && !chAlone.band && !chAlone.rows, kind + ': with nobody to message, Chats is just "No chats yet" ' + JSON.stringify(chAlone));
      ok(!c.errors.length && (await overflow(c)) <= 0, kind + ': no console errors, no overflow (Home end, Chats, online) ' + c.errors.join(' '));
      await c.context().close();
    }
  }

  /* 2026-10-05 (v5-feed): your own actions keep their time — a "You: …" line is one sitting (rows within 30 minutes of
     each other, nothing else said between), in its band where its newest row's time puts it, never pinned above the
     bands or stamped "now" unless it is. The network's own news: "N people joined Hypernet" (one per band, the ones near
     you first with Follow, the rest as faces, "See who's new" → Explore → People newest first) and an event picking up
     ("4 people decided to go to … this week", one per band, from three people). Online on a mocked /api/bootstrap that
     replays the owner's morning: five things of his, Sebastian's call out between them */
  {
    const NOWMS = NOWPIN ? NOWPIN.getTime() : Date.now();
    const iso = m => new Date(NOWMS - m * 60000).toISOString(), day = n => new Date(NOWMS + n * 86400000).toISOString().slice(0, 10);
    const U = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0'), ME = U(1), SEB = U(2);
    const P = (id, handle, name, joinedMin, cities) => ({ id, handle, displayName:name, bio:'', skills:[], cities, look:null, lastSeenAt:null, createdAt:iso(joinedMin) });
    /* you joined yesterday (and are never in "joined"); five people today, two this week, Sebastian long ago */
    const people = [P(ME, 'mike', 'Michal Kucera', 60 * 24, ['Brno']), P(SEB, 'seb', 'Sebastian Östlind', 60 * 24 * 40, ['Stockholm']),
      P(U(3), 'lena', 'Lena Brandt', 50, ['Brno']), P(U(4), 'tom', 'Tom Hruby', 130, ['Prague']), P(U(5), 'ana', 'Ana Ruiz', 200, ['Berlin']),
      P(U(6), 'ola', 'Ola Nord', 300, ['Oslo']), P(U(7), 'kim', 'Kim Berg', 360, ['Malmö']), P(U(8), 'ivo', 'Ivo Kral', 60 * 24 * 3, ['Brno']), P(U(9), 'eva', 'Eva Lind', 60 * 24 * 4, ['Oslo'])];
    const EV = (n, title, d) => ({ id:U(100 + n), slug:'e' + n, title, startsOn:day(d), endsOn:null, startTime:null, endTime:null, timezone:'Europe/Prague', hostId:null, hostName:title,
      description:'x', kind:'burn', privacy:'everyone', city:'Zurich', region:null, country:'CH', venue:null, access:null, whatToBring:[], details:{}, look:null, source:'import', previousEditionId:null });
    const CO = (n, author, title, m) => ({ id:U(200 + n), authorId:author, eventId:null, title, body:'', skill:null, expiresOn:day(20), closedAt:null, createdAt:iso(m) });
    const A = (actor, verb, objType, objId, m, extra) => ({ actor, verb, objType, objId, ts:iso(m), extra:extra || null });
    const R = (pid, ev, status, m) => ({ personId:pid, eventId:ev, status, went:false, shiftIndex:null, updatedAt:iso(m) });
    const rsvps = [R(ME, U(101), 'interested', 140), R(ME, U(102), 'interested', 138)];
    const activity = [A(ME, 'posted_callout', 'callout', U(203), 3), A(ME, 'posted_callout', 'callout', U(202), 6), A(ME, 'replied_callout', 'callout', U(201), 12, { replyId:U(300) }),
      A(ME, 'followed_person', 'person', SEB, 16), A(SEB, 'posted_callout', 'callout', U(201), 22), A(ME, 'interested', 'event', U(102), 138), A(ME, 'interested', 'event', U(101), 140)];
    [[U(5), 2], [U(6), 3], [U(9), 4], [U(8), 5]].forEach(([pp, d]) => { activity.push(A(pp, 'going', 'event', U(102), 60 * 24 * d)); rsvps.push(R(pp, U(102), 'going', 60 * 24 * d)); });
    const boot = { hypernet:1, me:people[0], login:null, people, follows:[[ME, SEB]], events:[EV(1, 'Zurich Decompression 2026', 30), EV(2, 'The Borderland 2027', 280)], rsvps,
      promotions:[], horizons:[], hzFollows:[], callouts:[CO(1, SEB, 'Webdesigner to create themes for hypernet', 22), CO(2, ME, 'Sauna master', 6), CO(3, ME, 'Fire safety lead', 3)],
      replies:[{ id:U(300), calloutId:U(201), authorId:ME, text:'I can help.', createdAt:iso(12) }], activity, chats:[] };
    const feed = c => ev(c, () => [...document.querySelectorAll('#listbody > .band, #listbody > .fitem')].map(x => x.classList.contains('band') ? { band:x.textContent }
      : { verb:x.dataset.verb, ts:x.dataset.ts, s:(x.querySelector('.fsent') || {}).textContent || '', t:(x.querySelector('.ftime') || {}).textContent || '' }));
    for (const kind of ['phone', 'desk']){
      const c = await ctx(kind);
      await c.addInitScript(() => { window.HN_BACKEND = { branch:'test' }; });
      await c.context().route('**/api/**', r => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(/\/api\/bootstrap/.test(r.request().url()) ? boot : /\/api\/chats/.test(r.request().url()) ? { chats:[] } : {}) }));
      await c.goto(URL + '#/home'); await c.waitForTimeout(800);
      const f = await feed(c), items = f.filter(x => !x.band), yous = items.filter(x => x.verb === 'you'), seb = items.findIndex(x => x.verb === 'posted_callout');
      const ts = items.map(x => Date.parse(x.ts)), main = f.slice(0, f.findIndex(x => x.band === 'Around the network') < 0 ? f.length : f.findIndex(x => x.band === 'Around the network'));
      ok(f[0] && f[0].band === 'Today' && yous.length === 2 && items.indexOf(yous[0]) < seb && items.indexOf(yous[1]) > seb &&
         /followed Sebastian/.test(yous[0].s) && /replied to Webdesigner/.test(yous[0].s) && !/interested/.test(yous[0].s) && /interested in/.test(yous[1].s) && !/followed/.test(yous[1].s) &&
         yous[0].t === '3m ago' && yous[1].t === '2h ago',
         kind + ': the owner\'s morning — your actions before Sebastian\'s call out are their own line under it (2h ago), the ones after it above it (3m ago); nothing pinned above Today, nothing says "now" ' + JSON.stringify(items.map(x => x.verb + ':' + x.t)));
      const mainTs = main.filter(x => !x.band).map(x => Date.parse(x.ts));
      ok(mainTs.every((t, i) => !i || mainTs[i - 1] >= t) && !items.some((x, i) => i && x.verb === 'you' && items[i - 1].verb === 'you'), kind + ': the stream is newest first, your lines among everyone\'s, never two of yours in a row');
      /* people joined: one entry per band, never you, the one in your city first (with Follow), faces for the rest */
      const jn = await ev(c, () => [...document.querySelectorAll('#listbody .fitem[data-verb="joined"]')].map(x => ({ s:x.querySelector('.fsent').textContent, t:x.querySelector('.ftime').textContent,
        cards:[...x.querySelectorAll('.fcard[data-type="person"]')].map(k => k.getAttribute('data-id')), follow:!!x.querySelector('.fcard [data-act="followp"]'),
        faces:x.querySelectorAll('.fface').length, more:!!x.querySelector('[data-act="explorekind"][data-id="people"]'), sq:[...x.querySelectorAll('.fface .av')].every(a => a.offsetWidth === 32) })));
      ok(jn.length === 2 && jn[0].s === 'Lena, Tom and 3 others joined Hypernet' && jn[0].t === '50m ago' && jn[0].cards[0] === U(3) && jn[0].follow && jn[0].faces === 4 && jn[0].sq && jn[0].more &&
         jn[1].s === 'Ivo and Eva joined Hypernet' && jn.every(x => !/Michal/.test(x.s)),
         kind + ': "N people joined Hypernet" — one per band, never you, the one in your city first with Follow, the others as faces, See who\'s new ' + JSON.stringify(jn));
      /* an event picking up: one entry, the count, Who's going */
      const tr = await ev(c, () => [...document.querySelectorAll('#listbody .fitem[data-verb="trending"]')].map(x => ({ s:x.querySelector('.fsent').textContent, faces:x.querySelectorAll('.fface').length,
        card:!!x.querySelector('.fcard[data-type="event"] [data-act="v-going"]'), who:!!x.querySelector('[data-act="whoall"]') })));
      ok(tr.length === 1 && tr[0].s === '4 people decided to go to The Borderland 2027 this week' && tr[0].faces === 4 && tr[0].card && tr[0].who,
         kind + ': an event picking up is one entry with its count, the event with Going, faces and Who’s going ' + JSON.stringify(tr));
      if (kind === 'desk'){
        await c.click('#listbody .fitem[data-verb="trending"] [data-act="whoall"]'); await c.waitForTimeout(300);
        ok(await ev(c, () => document.querySelectorAll('.dlg .whorow').length === 4), kind + ': Who’s going opens the four');
        await c.evaluate(() => closeDialogs()); await c.waitForTimeout(150);
      }
      /* 2026-10-05 (v5-retro): a long title in your line flows as words — ", followed Sebastian" carries on right after it
         instead of breaking onto a line of its own (a <button> is one box: the title wrapped as a block). The names and
         titles are links to the thing's own address that open it in the window, by click or by Enter */
      const wrap = await ev(c, () => { const y = [...document.querySelectorAll('#listbody .fyou')].find(x => /followed Sebastian/.test(x.textContent));
        const links = [...y.querySelectorAll('.fsent .fwho')], t = links.find(a => /Webdesigner/.test(a.textContent)), rs = t.getClientRects(), last = rs[rs.length - 1];
        const rg = document.createRange(); rg.setStart(t.nextSibling, 0); rg.setEnd(t.nextSibling, 1); const ar = rg.getBoundingClientRect();
        y.scrollIntoView({ block:'center' });
        return { kinds:[...new Set(links.map(a => a.tagName + ':' + getComputedStyle(a).display))].join(), lines:rs.length, after:JSON.stringify(t.nextSibling.textContent),
                 same:Math.abs(ar.top - last.top) < 2 && ar.left >= last.right - 1, href:t.getAttribute('href'), seb:links[links.length - 1].getAttribute('href') }; });
      ok(wrap.kinds === 'A:inline' && wrap.after === '", followed "' && wrap.same && /^#\/callout\//.test(wrap.href) && /^#\/person\//.test(wrap.seb) && (kind !== 'phone' || wrap.lines >= 2),
         kind + ': a long title in "You: …" flows as words, ", followed Sebastian" right after it (v5-retro) ' + JSON.stringify(wrap));
      if (kind === 'phone') await shot(c, 'retro-you-phone');
      if (kind === 'desk'){
        await c.evaluate(() => [...document.querySelectorAll('#listbody .fyou .fwho')].find(a => /Webdesigner/.test(a.textContent)).focus());
        await c.keyboard.press('Enter'); await c.waitForTimeout(350);
        const kb = await ev(c, () => ({ top:S.stack.length ? S.stack[S.stack.length - 1].type : '', hash:location.hash }));
        ok(kb.top === 'callout' && /^#\/callout\//.test(kb.hash), kind + ': Enter on a title in a sentence opens it in the window (v5-retro) ' + JSON.stringify(kb));
        await c.keyboard.press('Escape'); await c.waitForTimeout(250);
      }
      /* See who's new: Explore → People, you first, then the newest, each new one saying when they joined */
      await c.evaluate(() => { const b = document.querySelector('#listbody .fitem[data-verb="joined"] [data-act="explorekind"]'); b.scrollIntoView({ block:'center' }); }); await c.waitForTimeout(150);
      await c.click('#listbody .fitem[data-verb="joined"] [data-act="explorekind"] >> nth=0'); await c.waitForTimeout(400);
      const ppl = await ev(c, () => ({ hash:location.hash, ids:[...document.querySelectorAll('#listbody .row[data-type="person"]')].map(r => r.getAttribute('data-id')) }));
      ok(ppl.hash === '#/explore/people' && ppl.ids[0] === 'self' && ppl.ids.slice(1, 6).join() === [U(3), U(4), U(5), U(6), U(7)].join() && ppl.ids[ppl.ids.length - 1] === SEB,
         kind + ': See who’s new opens Explore → People, newest first ' + JSON.stringify(ppl));
      ok(!c.errors.length && (await overflow(c)) <= 0, kind + ': no console errors, no overflow (v5-feed, online) ' + c.errors.join(' '));
      await c.context().close();
    }
    /* offline: the rule itself, the fixture's newcomers, a sitting split by someone else */
    for (const kind of ['desk', 'phone']){
      const c = await ctx(kind);
      await open(c, '#/home', true);
      await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
      const g = await ev(c, () => { const me = myActor(), now = appNow(), m = n => now - n * 60000;
        const row = (actor, verb, id, mins) => ({ a:{ id:'t' + verb + mins, actor, verb, objType:verb === 'going' ? 'event' : 'person', objId:id, ts:tsIso(m(mins)), extra:null }, ms:m(mins) });
        const ev0 = Object.keys(EVENTS)[0];
        return groupRows([row(me, 'followed_person', 'p-jon', 10), row(me, 'followed_person', 'p-mira', 20), row('p-anna', 'going', ev0, 25), row(me, 'followed_person', 'p-kai', 30),
                          row(me, 'followed_person', 'p-rio', 40), row(me, 'followed_person', 'p-sasha', 80)]).map(e => e.verb + ':' + (e.rows ? e.rows.length : e.actors.length)).join(' '); });
      ok(g === 'you:2 going:1 you:2 you:1', kind + ': a sitting is your rows within 30 minutes of each other with nothing else between: someone in between or a long pause starts a new line ' + g);
      const off = await ev(c, () => { const j = document.querySelector('#listbody .fitem[data-verb="joined"]');
        return { n:document.querySelectorAll('#listbody .fitem[data-verb="joined"]').length, s:j && j.querySelector('.fsent').textContent, why:j && (j.querySelector('.fcard .fcs3') || {}).textContent,
                 bands:homeParts().stream.filter(e => e.verb === 'joined').map(e => e.band), first:homeParts().stream.filter(e => e.verb === 'joined')[0].objs[0] }; });
      ok(off.n >= 2 && off.s === 'Lena and Tomas joined Hypernet' && off.first === 'p-lena' && off.why === 'Anna follows Lena' && new Set(off.bands).size === off.bands.length,
         kind + ': offline the fixture\'s newcomers join — Lena first, as Anna (whom you follow) follows her; at most one per band ' + JSON.stringify(off));
      await c.goto(URL + '#/explore/people'); await c.waitForTimeout(350);
      ok(await ev(c, () => { const ids = [...document.querySelectorAll('#listbody .row[data-type="person"]')].map(r => r.getAttribute('data-id'));
        return ids[0] === 'self' && ids[1] === 'p-lena' && ids[2] === 'p-tomas' && /joined 2h ago/.test(document.querySelector('#listbody .row[data-id="p-lena"]').textContent); }),
         kind + ': Explore → People is newest first, a newcomer says when they joined');
      ok(!c.errors.length && (await overflow(c)) <= 0, kind + ': no console errors, no overflow (v5-feed, offline) ' + c.errors.join(' '));
      await c.context().close();
    }
  }

  /* 2026-10-05 (v5-calendar): the List / Calendar switch stays at the top right in both views; ‹ Today › lead the calendar's
     bar so a month's name never moves them; a narrow screen's day is a page of its own (one event opens straight away,
     none is just a date), with back / forward / reload; a narrow month's events are readable lines, not faint bars */
  {
    const box = (c, sel) => c.evaluate(s => { const e = document.querySelector(s); if (!e || !e.offsetParent) return null; const r = e.getBoundingClientRect();
      return { x:Math.round(r.left), y:Math.round(r.top), r:Math.round(r.right), w:Math.round(r.width), h:Math.round(r.height) }; }, sel);
    const same = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w;
    for (const [kind, w] of [['desk', 1440], ['desk', 1920], ['desk', 1280], ['tab', 768], ['phone', 375]]){
      const c = await ctx(kind, kind === 'desk' ? { viewport:{ width:w, height:w === 1920 ? 1080 : w === 1280 ? 800 : 900 } } : undefined);
      await open(c, '', true);
      await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
      if (kind === 'desk') await c.evaluate(() => { S.rightOpen = false; render(); });
      /* the switch: one place in List and Calendar; a desktop's and tablet's at the heading's right end, a phone's in the app bar */
      const sw = {};
      for (const hh of ['#/going', '#/going?view=calendar', '#/explore/events', '#/explore/events?view=calendar', '#/explore/events?view=calendar&at=2026-05-01']){
        await c.goto(URL + hh); await c.waitForTimeout(350);
        sw[hh] = Object.assign(await box(c, '.vsw') || {}, await c.evaluate(ph => {
          const v = document.querySelector('.vsw'), hd = document.getElementById('chead'), hr = hd.getBoundingClientRect();
          return { inBar:!!(v && v.closest(ph ? '#appbar' : '#chead')), last:!!v && !v.nextElementSibling || (ph && !!v && v.nextElementSibling.getAttribute('data-act') === 'psearch'),
                   end:ph ? null : Math.round(hr.right - parseFloat(getComputedStyle(hd).paddingRight)) };
        }, kind === 'phone'));
      }
      const g = sw['#/going'], gc = sw['#/going?view=calendar'], e = sw['#/explore/events'], ec = sw['#/explore/events?view=calendar'], em = sw['#/explore/events?view=calendar&at=2026-05-01'];
      ok(same(g, gc) && same(e, ec) && same(ec, em) && [g, gc, e, ec].every(x => x.inBar && x.last) && (kind === 'phone' || [g, gc, e, ec].every(x => Math.abs(x.r - x.end) <= 1)) &&
         (kind !== 'phone' || (g.r >= 375 - 12 && g.h <= 44 && g.w <= 160)),
         w + ': the List / Calendar switch is at the top right ' + (kind === 'phone' ? '(the app bar, compact)' : '(the heading\'s right end)') + ' and keeps its place in List and Calendar ' + JSON.stringify([g, gc, e, ec]));
      /* ‹ Today ›: before the title, in the same place for a long and a short month, and (wide) in week and day too */
      const bars = [];
      for (const hh of ['#/going?view=calendar&at=2026-09-01', '#/going?view=calendar&at=2026-05-01', '#/going?view=calendar&at=2026-10-01'].concat(kind === 'desk' ? ['#/going?view=calendar&at=2026-09-30&cal=week', '#/going?view=calendar&at=2026-09-30&cal=day'] : [])){
        await c.goto(URL + hh); await c.waitForTimeout(300);
        bars.push(Object.assign({ prev:await box(c, '[data-act="calnav"][data-id="-1"]'), today:await box(c, '[data-act="caltoday"]'), next:await box(c, '[data-act="calnav"][data-id="1"]'), ttl:await box(c, '#calcol .calbar .ttl') }));
      }
      ok(bars.every(b => same(b.prev, bars[0].prev) && same(b.today, bars[0].today) && same(b.next, bars[0].next) && b.next.r < b.ttl.x),
         w + ': ‹ Today › lead the calendar bar and never move (September, May, October' + (kind === 'desk' ? ', week, day' : '') + ') ' + JSON.stringify(bars.map(b => [b.today, b.ttl])));
      if (kind === 'desk'){ ok(!c.errors.length, w + ': no console errors (calendar)' + c.errors.join(' ')); continue; }
      /* narrow: the month's events are lines in their own look, each readable, its title in it; today is marked */
      await c.goto(URL + '#/explore/events?view=calendar'); await c.waitForTimeout(400);
      const marks = await ev(c, () => {
        const rgb = s => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number), hex = a => '#' + a.map(v => ('0' + Math.round(v).toString(16)).slice(-2)).join('');
        const out = [...document.querySelectorAll('#calcol .calcell[data-act="calday"]')].map(cell => {
          const evs = eventsOn(cell.getAttribute('data-id')), mk = [...cell.querySelectorAll('.mk')];
          return { n:evs.length, mk:mk.length, ok:mk.every(m => { const cs = getComputedStyle(m), r = m.getBoundingClientRect();
            return contrast(hex(rgb(cs.color)), hex(rgb(cs.backgroundColor))) >= 4.5 && r.height >= 16 && m.textContent.trim().length > 0; }),
            titled:mk.filter(m => !m.classList.contains('more')).every((m, i) => m.textContent === evs[i].title) };
        });
        const t = document.querySelector('#calcol .calcell.today .dn'), tc = t && getComputedStyle(t);
        return { cells:out.length, bad:out.filter(x => !x.ok || !x.titled || x.mk !== Math.min(x.n, 2)), empties:[...document.querySelectorAll('#calcol .calcell:not([data-act])')].filter(x => eventsOn(x.getAttribute('data-id')).length).length,
                 today:!!t && contrast(hex(rgb(tc.color)), hex(rgb(tc.backgroundColor))) >= 7, dots:document.querySelectorAll('#calcol .dots').length };
      });
      ok(marks.cells >= 5 && !marks.bad.length && !marks.empties && marks.today && !marks.dots,
         w + ': a narrow month shows each day\'s events as readable lines with their titles (two at most, "+N"), today is marked ' + JSON.stringify(marks));
      if (kind === 'phone') await shot(c, 'v5-calendar-375-month');
      /* a day with several events opens its own page; back is the month, forward and reload bring the day back */
      const days = await ev(c, () => { const ids = [...document.querySelectorAll('#calcol .calcell[data-act="calday"]:not(.oth)')].map(x => x.getAttribute('data-id'));
        return { two:ids.find(d => eventsOn(d).length >= 2), one:ids.find(d => eventsOn(d).length === 1), none:[...document.querySelectorAll('#calcol .calcell:not(.oth):not([data-act])')].map(x => x.getAttribute('data-id'))[0] }; });
      const tapDay = d => c.tap('#calcol .calcell[data-id="' + d + '"]').then(() => c.waitForTimeout(350));
      const dst = () => ev(c, () => ({ hash:location.hash, page:!!document.querySelector('#calcol .dayhead'), rows:document.querySelectorAll('#calcol .daypanel .row').length, grid:!!document.querySelector('#calcol .calgrid'),
        win:!document.getElementById('win').hidden, top:S.stack.length ? S.stack[S.stack.length - 1].id : '', back:(document.querySelector('#calcol [data-act="calback"]') || {}).textContent || '',
        full:(() => { const p = document.querySelector('#calcol .daypanel'); if (!p) return false; const r = p.getBoundingClientRect(); return r.top < 300 && r.width >= innerWidth - 260; })() }));
      await tapDay(days.two);
      const d1 = await dst(), nTwo = await ev(c, d => eventsOn(d).length, days.two);
      ok(d1.page && !d1.grid && d1.rows === nTwo && d1.full && /[?&]day=/.test(d1.hash) && d1.back === 'October' && !d1.win,
         w + ': tapping a day with ' + nTwo + ' events opens that day as a page of its own, its events as rows, ‹ October to go back ' + JSON.stringify(d1));
      if (kind === 'phone') await shot(c, 'v5-calendar-375-day');
      await c.goBack(); await c.waitForTimeout(350);
      const d2 = await dst();
      await c.goForward(); await c.waitForTimeout(350);
      const d3 = await dst();
      await c.reload(); await c.waitForTimeout(500);
      const d4 = await dst();
      ok(!d2.page && d2.grid && !/day=/.test(d2.hash) && d3.page && d3.rows === nTwo && d4.page && d4.rows === nTwo,
         w + ': back returns to the month, forward and reload bring the day back ' + JSON.stringify([d2.hash, d3.hash, d4.hash]));
      /* an event opened from the day comes back to the day; ‹ October goes to the month and the day is outlined there */
      await c.tap('#calcol .daypanel .row >> nth=0'); await c.waitForTimeout(350);
      const d5 = await dst();
      await c.goBack(); await c.waitForTimeout(350);
      const d6 = await dst();
      await c.tap('#calcol [data-act="calback"]'); await c.waitForTimeout(350);
      const d7 = await dst(), outl = await ev(c, d => { const x = document.querySelector('#calcol .calcell[data-id="' + d + '"]'); return !!x && x.classList.contains('picked') && getComputedStyle(x).outlineStyle === 'solid'; }, days.two);
      ok(d5.win && d6.page && !d6.win && !d7.page && d7.grid && outl, w + ': an event opened from the day returns to the day; ‹ October returns to the month, the day outlined ' + JSON.stringify([d5.win, d6.page, d7.hash, outl]));
      /* one event opens straight away; back is the month. A day with nothing on is just a date */
      await tapDay(days.one);
      const o1 = await dst(), oneId = await ev(c, d => eventsOn(d)[0].id, days.one);
      await c.goBack(); await c.waitForTimeout(350);
      const o2 = await dst();
      ok(o1.win && o1.top === oneId && !o1.page && /^#\/event\//.test(o1.hash) && !o2.win && o2.grid && !o2.page, w + ': a day with one event opens the event straight away; back is the month ' + JSON.stringify([o1.hash, o2.hash]));
      const h0 = await ev(c, () => location.hash);
      await c.tap('#calcol .calcell[data-id="' + days.none + '"]'); await c.waitForTimeout(300);
      const n1 = await dst();
      ok(!!days.none && !n1.page && !n1.win && n1.hash === h0 && await ev(c, d => { const x = document.querySelector('#calcol .calcell[data-id="' + d + '"]'); return !x.getAttribute('role') && getComputedStyle(x).cursor !== 'pointer'; }, days.none),
         w + ': a day with nothing on is just a date: no page, no window, not a button');
      /* a day's link opened cold: the month is underneath it, so ‹ October and back go to the month (not the tab's front page) */
      const cold = await c.context().newPage(); cold.errors = []; cold.on('pageerror', x => cold.errors.push(x.message));
      await cold.goto(URL + '#/going?view=calendar&day=' + (await ev(c, () => { const ids = Object.keys(RSVP).filter(k => RSVP[k] === 'going' && EVENTS[k]); return EVENTS[ids[0]].date; })));
      await cold.waitForTimeout(500);
      const c1 = await cold.evaluate(() => ({ page:!!document.querySelector('#calcol .dayhead'), idx:history.state.idx }));
      await cold.tap('#calcol [data-act="calback"]'); await cold.waitForTimeout(400);
      const c2 = await cold.evaluate(() => ({ hash:location.hash, grid:!!document.querySelector('#calcol .calgrid') }));
      ok(c1.page && c2.hash === '#/going?view=calendar' && c2.grid && !cold.errors.length, w + ': a day\'s link opened cold has its month underneath ' + JSON.stringify([c1, c2]));
      await cold.close();
      ok(!c.errors.length && (await overflow(c)) <= 0, w + ': no console errors, no overflow (narrow calendar) ' + c.errors.join(' '));
    }
  }

  /* 2026-10-05 (v5-editlook): One Edit — an Event Horizon, an event you host and your profile each have one Edit
     (facts, who can see it, picture, colours); Share is always Share; the whole page wears its look (one to three
     colours, text chosen for contrast, controls stay chrome); your face wears your look everywhere; Edit profile's
     look controls save with Done; the New event wizard shows one primary at a time */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    await join(c, 'Edda Lund', 'edda' + kind);
    /* an Event Horizon of yours: Add events, Edit, Share, ⋯ — nothing that turns into something else */
    await c.evaluate(() => runCmd('new-horizon')); await c.waitForTimeout(200);
    await c.fill('#nh-n', 'Zurich events'); await c.click('#nh-go'); await c.waitForTimeout(400);
    const hz = await ev(c, () => S.stack[0].id);
    const bar = await ev(c, () => { const vs = [...document.querySelectorAll('#dscroll .pg-horizon .actbar .btn')];
      return { acts:vs.map(b => b.getAttribute('data-act')).join(), tops:new Set(vs.map(b => Math.round(b.getBoundingClientRect().top))).size,
               fit:vs.every(b => b.scrollWidth <= b.clientWidth + 1), more:(document.querySelector('#dscroll [data-act="hzmore"]') || {}).getAttribute('data-more') }; });
    ok(bar.acts === 'addevents,edithz,share,hzmore' && bar.tops === 1 && bar.fit && bar.more === 'delete',
       kind + ': your horizon\'s toolbar is Add events · Edit · Share · ⋯ in one row, ⋯ holds Delete only ' + JSON.stringify(bar));
    await c.click('#dscroll [data-act="hzmore"]'); await c.waitForTimeout(250);
    ok(await ev(c, () => { const t = [...document.querySelectorAll('.ctxmenu .ci, .ctxsheet .sheetrow')].map(x => x.textContent.trim()); return t.length === 1 && /Delete/.test(t[0]); }), kind + ': ⋯ has no Published ✓, only Delete');
    await c.keyboard.press('Escape'); await ev(c, () => { closeCtx(); closeDialogs(); }); await c.waitForTimeout(150);
    /* Share on a private horizon says it is private and offers to make it public, then copies the link */
    await c.evaluate(() => { window.__exec = []; Object.defineProperty(navigator, 'clipboard', { value:undefined, configurable:true }); document.execCommand = function(cmd){ window.__exec.push(cmd); return true; }; });
    await c.click('#dscroll .actbar [data-act="share"]'); await c.waitForTimeout(250);
    const sh = await ev(c, h => ({ dlg:/private/.test((document.querySelector('.dlg .cmsg') || {}).textContent || ''), copied:window.__exec.length, pub:HORIZONS[h].isPublished }), hz);
    await c.click('.dlg [data-act="confirmok"]'); await c.waitForTimeout(300);
    const sh2 = await ev(c, h => ({ pub:HORIZONS[h].isPublished, copied:window.__exec.length, toast:document.getElementById('toasts').textContent, eyebrow:document.querySelector('#dscroll .pg-horizon .eyebrow').textContent }), hz);
    ok(sh.dlg && !sh.copied && !sh.pub && sh2.pub && sh2.copied === 1 && /Link copied/.test(sh2.toast) && !/Private/.test(sh2.eyebrow),
       kind + ': Share on a private horizon explains, then makes it public and copies its link ' + JSON.stringify([sh, sh2]));
    /* Edit holds the name, the description, who can see it, the picture and the colours — one save */
    await c.click('#dscroll [data-act="edithz"]'); await c.waitForTimeout(300);
    const ed = await ev(c, () => ({ secs:[...document.querySelectorAll('.dlg .edsec > h3')].map(h => h.textContent).join(), name:!!document.getElementById('ed-n'), desc:!!document.getElementById('ed-d'),
      vis:[...document.querySelectorAll('.dlg input[name="ed-vis"]')].map(r => r.value + (r.checked ? '*' : '')).join(), file:!!document.getElementById('cz-file'), colors:document.querySelectorAll('.dlg [data-czlook] input[type=color]').length }));
    ok(ed.secs === 'Details,Who can see it,Look' && ed.name && ed.desc && ed.vis === 'private,public*' && ed.file && ed.colors === 1, kind + ': Edit Event Horizon has its details, who can see it and its look ' + JSON.stringify(ed));
    await c.fill('#ed-n', 'Zurich, autumn'); await c.check('.dlg input[name="ed-vis"][value="private"]');
    await c.fill('#cz-c1', '#0d1b2e'); await c.waitForTimeout(150);
    await c.click('.dlg .czadd'); await c.waitForTimeout(150); await c.fill('#cz-c2', '#ffd400'); await c.waitForTimeout(150);
    if (kind === 'desk') await shot(c, 'editlook-edit-horizon-desk');
    await c.click('.dlg [data-act="wiz"][data-id="finish"]'); await c.waitForTimeout(400);
    const sv = await ev(c, h => ({ name:HORIZONS[h].name, pub:HORIZONS[h].isPublished, colors:(HZTHEME[h] || {}).colors, eyebrow:document.querySelector('#dscroll .pg-horizon .eyebrow').textContent }), hz);
    ok(sv.name === 'Zurich, autumn' && sv.pub === false && sv.colors && sv.colors.join() === '#0d1b2e,#ffd400' && /Private/.test(sv.eyebrow), kind + ': one Save keeps the name, Private and the two colours ' + JSON.stringify(sv));
    /* the whole page wears the look; its controls stay the app's */
    const pg = await ev(c, () => { const cv = document.querySelector('#dscroll .pg-horizon'), cs = x => getComputedStyle(x);
      const btn = cv.querySelector('.actbar .btn'), box = cv.querySelector('.facts'), fk = cv.querySelector('.fk'), band = cv.querySelector('.banner');
      const rgb = s => '#' + s.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
      const p = lookPal(HZTHEME[S.stack[0].id]);
      return { bg:rgb(cs(cv).backgroundColor) === p.bg, band:rgb(cs(band).backgroundColor) === p.band, rule:rgb(cs(box).borderTopColor) === p.rule, fk:contrast(rgb(cs(fk).color), p.bg) >= 4.5,
               eyebrow:contrast(rgb(cs(cv.querySelector('.eyebrow')).color), p.band) >= 4.5, accent:rgb(cs(cv.querySelector('.eyebrow')).color) !== rgb(cs(cv.querySelector('.hl')).color),
               chrome:cs(btn).backgroundColor === 'rgb(212, 208, 200)' && cs(btn).color === 'rgb(20, 20, 20)' }; });
    ok(Object.values(pg).every(Boolean), kind + ': the whole page wears the look (ground, band, hairlines, labels AA, the accent), the toolbar stays chrome ' + JSON.stringify(pg));
    if (kind === 'phone') await shot(c, 'editlook-horizon-themed-phone');
    /* an event you host: one Edit (Customize is part of it); the phone's bar is Edit · Call out · Invite · Event controls · ⋯ */
    await newEvent(c, { title:'Sauna on the ridge', date:'2026-11-08', city:'Brno' }); await c.waitForTimeout(200);
    const host = await ev(c, () => ({ acts:[...document.querySelectorAll(L.phone ? '#evbar .btn' : '#dscroll .pg-event .actbar .btn')].map(b => b.getAttribute('data-act')),
      menu:ctxItems({ type:'event', id:S.stack[0].id }).filter(i => i !== '-').map(i => i.code) }));
    ok(host.acts.indexOf('editevent') >= 0 && host.acts.indexOf('customize') < 0 && host.acts.indexOf('evadmins') < 0 && host.acts.filter(a => a === 'evmore').length === 1 &&
       host.menu.indexOf('customize') < 0 && host.menu.indexOf('edit') >= 0 && host.acts.join() === 'editevent,evinvite,share,evmore',
       kind + ': an event you host has Edit, Invite, Share and one … ' + JSON.stringify(host));
    await c.evaluate(() => editEventDialog(S.stack[0].id)); await c.waitForTimeout(300);
    const ee = await ev(c, () => ({ secs:[...document.querySelectorAll('.dlg .edsec > h3')].map(h => h.textContent).join(), priv:!!document.querySelector('.dlg .edsec #w-p'), look:!!document.querySelector('.dlg [data-czlook] #cz-c1'), tabs:!!document.querySelector('.dlg .wizsteps') }));
    ok(ee.secs === 'Details,About,Who can see it,Look' && ee.priv && ee.look && !ee.tabs, kind + ': Edit event is one form of sections — details, about, who can see it, look ' + JSON.stringify(ee));
    if (kind === 'phone') await shot(c, 'editlook-edit-event-phone');
    await c.click('.dlg [data-act="closedlg"]'); await c.waitForTimeout(150);
    const barSel = kind === 'phone' ? '#evbar ' : '#dscroll ';
    await c.click(barSel + '[data-act="evmore"]'); await c.waitForTimeout(250);
    const controls = await ev(c, () => (document.querySelector('.ctxmenu, .ctxsheet') || {}).innerText || '');
    ok(/New call out/.test(controls) && /Promote/.test(controls) && /Add to horizon/.test(controls) && /Event controls/.test(controls) && /Who can see it/.test(controls) && /Invite admin/.test(controls) && /Who can add themselves as co-creator/.test(controls) && /Guests can invite friends/.test(controls) && /Delete/.test(controls),
       kind + ': the one … holds New call out, Promote, and Event controls ' + controls);
    await c.keyboard.press('Escape'); await c.waitForTimeout(150);
    await c.evaluate(() => openItem('event', 'evt-deep-listening')); await c.waitForTimeout(350);
    const guest0 = await ev(c, () => ({ admins:document.querySelectorAll('[data-act="evadmins"]').length, invite:document.querySelectorAll('[data-act="evinvite"]').length }));
    ok(guest0.admins === 0 && guest0.invite === 0, kind + ': a non-admin who has not RSVP’d does not see Event controls or Invite ' + JSON.stringify(guest0));
    await c.click(barSel + '[data-act="v-going"]'); await c.waitForTimeout(300);
    const guest1 = await ev(c, (sel) => ({ admins:document.querySelectorAll(sel + '[data-act="evadmins"]').length, invite:document.querySelectorAll(sel + '[data-act="evinvite"]').length }), barSel);
    ok(guest1.admins === 0 && guest1.invite === 1, kind + ': Going, with guests can invite, shows Invite and hides Event controls ' + JSON.stringify(guest1));
    await c.evaluate(() => { EVENTS['evt-deep-listening'].guestsCanInvite = false; render(); }); await c.waitForTimeout(200);
    ok(await ev(c, () => document.querySelectorAll('[data-act="evinvite"]').length === 0 && document.querySelectorAll('[data-act="evadmins"]').length === 0),
       kind + ': Guests can invite friends off hides Invite for a non-admin');
    const hidden = await ev(c, () => {
      var e = EVENTS['evt-dj-closed'];
      EVENT_INVITES[e.id] = [{ inviteeId: myActor(), invitedBy: 'p-anna' }];
      return e.privacy === 'only_me' && !canSeeEvent(e);
    });
    ok(hidden, kind + ': an invite does not open a private event yet in this build');
    await c.evaluate(() => { EVENT_ADMINS['evt-deep-listening'] = [{ userId: myActor(), invitedBy: 'p-anna', status: 'pending' }]; render(); });
    await c.waitForTimeout(200);
    ok(await ev(c, () => !!document.querySelector('[data-act="evadmin-accept"]') && !!document.querySelector('[data-act="evadmin-decline"]')),
       kind + ': a pending admin invite shows Accept and Decline');
    /* your profile: one Edit profile; its look controls save with Done, and the picks survive a reload */
    await c.evaluate(() => openItem('person', 'self')); await c.waitForTimeout(350);
    ok(await ev(c, () => [...document.querySelectorAll('#dscroll .pg-person .actbar .btn')].map(b => b.getAttribute('data-act')).join() === 'editprofile'), kind + ': your page has one Edit profile');
    await c.click('#dscroll [data-act="editprofile"]'); await c.waitForTimeout(300);
    await c.fill('#pedit-name', 'Edda Preview'); await c.click('#dscroll [data-czact="start"][data-i="5"]'); await c.waitForTimeout(250);
    const editing = await ev(c, () => ({ preview:!!document.querySelector('#dscroll [data-act="pfpreview"], #dscroll .pvpage'),
      look:!!document.querySelector('#dscroll [data-czlook]'), name:document.getElementById('pedit-name').value, c1:DRAFT.c1 }));
    ok(!editing.preview && editing.look && editing.name === 'Edda Preview' && editing.c1 === '#000000',
       kind + ': Edit profile keeps the look controls and what you typed, with no preview ' + JSON.stringify(editing));
    if (kind === 'desk') await shot(c, 'editlook-edit-profile-desk');
    await c.click('#dscroll [data-act="profiledone"]'); await c.waitForTimeout(400);
    /* the profile look shows wherever you are: your page, your avatar (toolbar or You tab), and under your account's id */
    if (kind === 'phone'){ await c.evaluate(() => { S.stack = []; setTab('you'); }); await c.waitForTimeout(300); }
    const face = await ev(c, () => { const av = document.querySelector(L.phone ? '.acctcard .av' : '#acct .av'); return { lk:av.classList.contains('lk'), bg:getComputedStyle(av).backgroundColor,
      mine:personLook(myActor()) === PTHEME.self, cust:[...document.querySelectorAll('[data-act="customizeme"]')].length }; });
    ok(face.lk && face.bg === 'rgb(0, 0, 0)' && face.mine && !face.cust, kind + ': after Neon your own avatar wears it (not the grey initials), and your account id reads the same look ' + JSON.stringify(face));
    await c.evaluate(() => openItem('person', 'self')); await c.waitForTimeout(350);
    ok(await ev(c, () => { const pg = document.querySelector('#dscroll .pg-person'); return !pg.classList.contains('plain') && getComputedStyle(pg).backgroundColor === 'rgb(0, 0, 0)' && !!pg.querySelector('.banner .av.lk'); }),
       kind + ': your page shows your look, its face your initials in it');
    if (kind === 'desk') await shot(c, 'editlook-profile-themed-desk');
    await c.reload(); await c.waitForTimeout(800);
    ok(await ev(c, () => !!PTHEME.self && PTHEME.self.colors && PTHEME.self.colors[0] === '#000000' && PEOPLE.self.displayName === 'Edda Preview'), kind + ': the profile, its look and its picks survive a reload');
    ok(!c.errors.length, kind + ': no console errors (One Edit) ' + c.errors.join(' '));
  }
  /* the palette: one, two and three colours on a real page — light, dark, neon, a mid-grey — every text AA on its ground */
  {
    const c = await ctx('desk');
    await open(c, '#/event/deep-listening-lab', true);
    const sets = [['#ffffff'], ['#f6e7b0'], ['#000000', '#ff2fd0'], ['#808080'], ['#1e5eff', '#ffd400'], ['#e8f4ff', '#ff3366', '#0b2a4a'], ['#39ff88', null, '#111111']];
    const res = [];
    for (const cols of sets){
      res.push(await ev(c, cols => {
        window.HYPERNET_THEMES.themes['evt-deep-listening'] = asLook({ colors:cols, glyph:'☾' }); render();
        const cv = document.querySelector('#dscroll .pg-event'), rgb = s => '#' + s.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
        const bg = rgb(getComputedStyle(cv).backgroundColor), band = rgb(getComputedStyle(cv.querySelector('.banner')).backgroundColor);
        const on = (sel, g) => [...cv.querySelectorAll(sel)].map(n => contrast(rgb(getComputedStyle(n).color), g));
        const body = [].concat(on('.fk', bg), on('.fv', bg), on('.fs', bg), on('.evdesc', bg), on('.sect > h3', bg), on('.fvlink', bg)), head = [].concat(on('.eyebrow', band), on('.psub2', band));
        return { cols:cols.join(' '), body:Math.min.apply(null, body).toFixed(2), head:Math.min.apply(null, head).toFixed(2), hl:on('.hl', band)[0].toFixed(2) };
      }, cols));
    }
    ok(res.every(r => r.body >= 4.5 && r.head >= 4.5 && r.hl >= 3), 'palette: every text on 1–3 colour pages is AA on its ground ' + JSON.stringify(res));
    /* old looks (bg / ink / accent, no picks) still render: the page wears their ground */
    await c.evaluate(() => { window.HYPERNET_THEMES.themes['evt-deep-listening'] = { bg:'#06080e', ink:'#e9e7e0', accent:'#6fd6c8', image:null, glyph:'☾' }; render(); });
    ok(await ev(c, () => getComputedStyle(document.querySelector('#dscroll .pg-event')).backgroundColor === 'rgb(6, 8, 14)'), 'palette: a look saved before picks wears its own ground');
    ok(!c.errors.length, 'palette: no console errors ' + c.errors.join(' '));
  }
  /* the New event wizard on a phone: short tabs, one primary at a time, nothing overflowing; × keeps the draft, the toast discards */
  {
    const c = await ctx('phone');
    await open(c, '', true);
    await join(c, 'Wiz Phone', 'wizphone');
    await c.evaluate(() => newEventDialog()); await c.waitForTimeout(300);
    await answerHost(c, 'mine', 'upcoming');
    const fit = () => ev(c, () => { const b = [...document.querySelectorAll('.dlg .dfoot .btn')], t = [...document.querySelectorAll('.dlg .wizsteps .ws')];
      return { prim:b.filter(x => x.classList.contains('primary')).map(x => x.textContent.trim()).join(), rows:new Set(b.map(x => Math.round(x.getBoundingClientRect().top))).size,
               fit:b.concat(t).every(x => x.scrollWidth <= x.clientWidth + 1), inside:b.every(x => x.getBoundingClientRect().right <= innerWidth), tabs:t.map(x => x.textContent.trim()).join(), dis:b.filter(x => x.getAttribute('aria-disabled') === 'true').map(x => getComputedStyle(x).textShadow).join() }; });
    const w1 = await fit();
    await c.fill('#w-t', 'Lake swim'); await c.fill('#w-d', '2026-11-03'); await c.fill('#w-c', 'Brno'); await c.click('.dlg [data-act="wiz"][data-id="next"]'); await c.waitForTimeout(250);
    await c.fill('#w-desc', 'Cold water, warm tea.'); await c.waitForTimeout(100);
    const w2 = await fit();
    await c.click('.dlg [data-act="wiz"][data-id="next"]'); await c.waitForTimeout(250);
    const w3 = await fit();
    await shot(c, 'editlook-wizard-footer-phone');
    ok(w1.prim === 'Next' && w2.prim === 'Next' && w3.prim === 'Publish event' && [w1, w2, w3].every(w => w.rows === 1 && w.fit && w.inside) && w1.tabs === '1Basics,2About,3Look' && w1.dis === 'none',
       'phone: the wizard has one primary at a time (Next, Next, Publish event) on one row, tabs and buttons never overflow, waiting buttons not embossed ' + JSON.stringify([w1, w2, w3]));
    await c.click('.dlg .dbar [data-act="closedlg"]'); await c.waitForTimeout(250);
    const kept = await ev(c, () => ({ draft:!!FORMDRAFTS.event, toast:document.getElementById('toasts').textContent, discard:!!document.querySelector('#toasts [data-act="toastundo"]'), dbtn:document.querySelectorAll('.dbar .dbtn').length }));
    await c.click('#toasts [data-act="toastundo"]'); await c.waitForTimeout(250);
    ok(kept.draft && /Draft kept/.test(kept.toast) && kept.discard && await ev(c, () => !FORMDRAFTS.event), 'phone: × keeps the draft; the toast\'s Discard throws it away ' + JSON.stringify(kept));
    ok(!c.errors.length, 'phone: no console errors (wizard) ' + c.errors.join(' '));
  }

  /* 2026-10-05 (v5-whosgoing) — an event page's Who's going is never a bare "and N more": when only a count is known it
     says so in words and shows who is interested instead; with names, the ones you follow first, "and N more" after them.
     Offline on the fixtures (the demo account; Baltic Circuit build weekend has 18 going and none of them named), online
     on a mocked /api/bootstrap (nobody, a few none followed, many with two followed, and a count with no names) */
  {
    const whoSays = (c, id) => ev(c, id => { openItem('event', id); return new Promise(r => setTimeout(() => {
      const s = [...document.querySelectorAll('#dscroll section.sect')].find(x => /^Who/.test(x.querySelector('h3').textContent));
      if (!s) return r(null);
      const box = s.querySelector('.whochips'), first = box && box.firstElementChild;
      r({ chips:[...s.querySelectorAll('.chip.who')].map(x => ({ fol:x.classList.contains('fol'), sub:x.querySelector('small').textContent })),
          count:(s.querySelector('.whocount') || {}).textContent || '', more:(s.querySelector('[data-act="whoall"]') || {}).textContent || '',
          bare:!!first && first.getAttribute('data-act') === 'whoall' });
    }, 450)); }, id);
    for (const kind of ['phone', 'desk']){
      const c = await ctx(kind);
      await open(c, '', true);
      await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
      const bal = await whoSays(c, 'ill-baltic-build-weekend');
      ok(bal && bal.count === '18 people are going' && !bal.bare && !bal.more && bal.chips.length === 1 && bal.chips[0].fol && /^you follow · interested/.test(bal.chips[0].sub),
         kind + ': only a count going — "18 people are going" in words and the person you follow who is interested, no bare "and N more" ' + JSON.stringify(bal));
      ok(await ev(c, () => !!document.querySelector('#dscroll .whocount') && document.documentElement.scrollWidth <= innerWidth), kind + ': the sentence fits (no overflow)');
      await shot(c, 'whosgoing-count-only-' + kind);
      await c.evaluate(() => whoAllDialog('ill-baltic-build-weekend')); await c.waitForTimeout(250);
      ok(await ev(c, () => { const n = document.querySelector('.dlg .whonote'); return !!n && n.textContent === '18 people are going, keeping their names to themselves' && document.querySelectorAll('.dlg .whorow').length === 1; }),
         kind + ': its dialog says the count in words (no "and" before no one) and lists who is interested');
      await c.evaluate(() => closeDialogs()); await c.waitForTimeout(150);
      const few = await whoSays(c, 'evt-fill-0'), fol = await whoSays(c, 'evt-world-borderland-2026');
      ok(few && few.chips.length >= 2 && !few.count && !few.bare && fol && fol.chips[0].fol && fol.chips.some(x => !x.fol) && !fol.count && /^and \d+ more$/.test(fol.more) &&
         fol.chips.every((x, i) => !i || fol.chips[i - 1].fol >= x.fol),
         kind + ': a few going (none followed) and some followed still show people, the ones you follow first, "and N more" after them ' + JSON.stringify([few, fol]));
      /* every event, every account state: someone or a sentence before any "and N more" */
      ok(await ev(c, () => Object.keys(EVENTS).every(id => { const h = whoGoingHTML(id, isPast(lastDay(EVENTS[id])));
           return !h || /class="chip who|class="whocount/.test(h.split('data-act="whoall"')[0]); })), kind + ': no event\'s Who\'s going starts with "and N more"');
      ok(await ev(c, () => whoCountText(1, false) === '1 person is going' && whoCountText(3, true) === '3 people went' && whoCountText(18, false) === '18 people are going'), kind + ': the count reads as a sentence (one person, past)');
      ok(!c.errors.length, kind + ': no console errors (v5-whosgoing, offline) ' + c.errors.join(' '));
      await c.context().close();
    }
    const NOWMS = NOWPIN ? NOWPIN.getTime() : Date.now();
    const U = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0'), ME = U(1);
    const P = (id, name) => ({ id, handle:'h' + id.slice(-4), displayName:name, bio:'', skills:[], cities:['Brno'], look:null, lastSeenAt:null, createdAt:'2026-09-01T10:00:00Z' });
    const EV = (n, title) => ({ id:U(100 + n), slug:'e' + n, title, startsOn:new Date(NOWMS + 19 * 86400000).toISOString().slice(0, 10), endsOn:null, startTime:null, endTime:null,
      timezone:'Europe/Prague', hostId:null, hostName:title, description:'x', kind:'burn', privacy:'everyone', city:'Brno', region:null, country:'CZ', venue:null, access:null,
      whatToBring:[], details:{}, look:null, source:'import', previousEditionId:null });
    const names = ['Anna Vale', 'Rio Sand', 'Kai Moss', 'Mira Lux', 'Jon Fell', 'Sasha Kern', 'Ivo Kral', 'Eva Lind', 'Ola Nord', 'Kim Berg'];
    const people = [P(ME, 'Hana Cerna')].concat(names.map((n, i) => P(U(10 + i), n)));
    const R = (pid, e, status, m) => ({ personId:pid, eventId:e, status, went:false, shiftIndex:null, updatedAt:new Date(NOWMS - m * 60000).toISOString() });
    const boot = { hypernet:1, me:people[0], login:null, people, follows:[[ME, U(17)], [ME, U(19)]],
      events:[EV(1, 'Nobody yet'), EV(2, 'A few going'), EV(3, 'Many going')], promotions:[], horizons:[], hzFollows:[], callouts:[], replies:[], activity:[], chats:[],
      rsvps:[R(U(10), U(102), 'going', 30), R(U(11), U(102), 'going', 90), R(U(12), U(102), 'interested', 20)].concat(names.map((_, i) => R(U(10 + i), U(103), 'going', 10 + i * 37))) };
    for (const kind of ['phone', 'desk']){
      const c = await ctx(kind);
      await c.addInitScript(() => { window.HN_BACKEND = { branch:'test' }; });
      await c.context().route('**/api/**', r => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(/\/api\/bootstrap/.test(r.request().url()) ? boot : /\/api\/chats/.test(r.request().url()) ? { chats:[] } : {}) }));
      await c.goto(URL + '#/home'); await c.waitForTimeout(800);
      const none = await whoSays(c, U(101)), few = await whoSays(c, U(102)), many = await whoSays(c, U(103));
      ok(await ev(c, () => ONLINE) && none === null && few && few.chips.length === 2 && few.chips.every(x => !x.fol) && !few.more && !few.count &&
         many && many.chips.length === 6 && many.chips[0].fol && many.chips[1].fol && !many.chips[2].fol && many.more === 'and 4 more' && !many.bare,
         kind + ': online — nobody going has no Who\'s going; a few (none followed) are shown; many: the two you follow first, six people, "and 4 more" ' + JSON.stringify([none, few, many]));
      /* a count the server knows without names (none sent today, but never a bare "and N more" if it does) */
      await c.evaluate(id => { const g = HNAPI.goingCount; HNAPI.goingCount = x => x === id ? 5 : g(x); }, U(101));
      const cnt = await whoSays(c, U(101));
      ok(cnt && cnt.count === '5 people are going' && !cnt.chips.length && !cnt.bare, kind + ': online, a count with no names reads "5 people are going" ' + JSON.stringify(cnt));
      ok(!c.errors.length && (await overflow(c)) <= 0, kind + ': no console errors, no overflow (v5-whosgoing, online) ' + c.errors.join(' '));
      await c.context().close();
    }
  }

  /* ---------------- 2026-10-05 (v5-retro): Windows' scrollbar, flush in the white's frame; nothing above the first band;
     bands are a grey line, not a grey block; your own rows are entries like the others ---------------- */
  {
    /* the colours of a few pixels of the screen, read back through a canvas */
    const pixels = async (c, clip, pts) => { const b64 = (await c.screenshot({ clip })).toString('base64');
      return c.evaluate(async ([b, ps]) => { const img = new Image(); img.src = 'data:image/png;base64,' + b; await img.decode();
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
        return ps.map(([x, y]) => [...g.getImageData(x, y, 1, 1).data].slice(0, 3).join(',')); }, [b64, pts]); };
    const firstTop = c => ev(c, () => { const lb = document.getElementById('listbody'), r = lb.getBoundingClientRect(), f = lb.firstElementChild;
      const fb = f && (f.classList.contains('band') ? f : f.querySelector(':scope > .band:first-child'));
      return { gap:f ? Math.round(f.getBoundingClientRect().top - r.top - lb.clientTop) : null, band:fb ? fb.textContent.trim().slice(0, 24) : '',
               bandGap:fb ? Math.round(fb.getBoundingClientRect().top - r.top - lb.clientTop) : null }; });
    const bandLook = c => ev(c, () => [...document.querySelectorAll('#listbody .band')].map(b => { const cs = getComputedStyle(b), a = getComputedStyle(b, '::after');
      return { bg:cs.backgroundColor, pos:cs.position, bb:cs.borderBottomWidth, line:a.height === '1px' && a.backgroundColor !== 'rgba(0, 0, 0, 0)' && parseFloat(a.width) >= 16 }; })
      .filter(x => !(x.bg === 'rgb(255, 255, 255)' && x.pos === 'sticky' && x.bb === '0px' && x.line)).length);
    for (const [w, h] of [[1440, 900], [1280, 800]]){
      const c = await ctx('desk', { viewport:{ width:w, height:h } });
      await open(c, '', true);
      await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
      await c.evaluate(() => { S.rightOpen = false; render(); }); await c.waitForTimeout(200);
      /* no space above the first band, or the first entry where there is no band, in every list */
      const tops = {}, looks = {};
      for (const hh of ['#/home', '#/going', '#/interested', '#/hosting', '#/explore/events', '#/explore/callouts', '#/explore/people', '#/search?q=burn', '#/search?q=']){
        await c.goto(URL + hh); await c.waitForTimeout(400); tops[hh] = await firstTop(c); looks[hh] = await bandLook(c);
      }
      const gaps = Object.keys(tops).filter(k => tops[k].gap !== 0 || (tops[k].bandGap != null && tops[k].bandGap !== 0));
      ok(!gaps.length && tops['#/home'].band, w + ': the first band (or entry) starts at the white\'s top edge in every list ' + JSON.stringify(tops));
      ok(Object.keys(looks).every(k => !looks[k]), w + ': every band is a line on the white (white, sticky, no rule under it, a 1px grey line after its name) ' + JSON.stringify(looks));
      /* the scrollbar: inside the white's 2px frame and flush against it; Windows' own (raised arrow buttons with a black
         triangle, the button's dark edge in view, the frame's two lines right of it — nothing painted over the bar) */
      await c.goto(URL + '#/home'); await c.waitForTimeout(400);
      const g = await ev(c, () => { const lb = document.getElementById('listbody'), r = lb.getBoundingClientRect(), col = document.getElementById('listcol').getBoundingClientRect();
        return { fr:lb.clientLeft, sb:lb.offsetWidth - lb.clientWidth - 2 * lb.clientLeft, x:Math.round(r.right), y:Math.round(r.top), b:Math.round(r.bottom), edge:Math.round(col.right - r.right),
                 over:getComputedStyle(document.getElementById('listcol'), '::after').content, scrolls:lb.scrollHeight > lb.clientHeight }; });
      const L0 = g.x - g.fr - g.sb;
      const up = await pixels(c, { x:L0 - 2, y:g.y, width:g.sb + g.fr + 4, height:g.fr + 16 }, [[2 + 8, g.fr + 8], [2 + 15, g.fr + 8], [2 + g.sb, g.fr + 8], [2 + g.sb + 1, g.fr + 8], [2 + g.sb + 2, g.fr + 8]]);
      const dn = await pixels(c, { x:L0 - 2, y:g.b - g.fr - 16, width:g.sb + 4, height:16 }, [[2 + 8, 7]]);
      ok(g.fr === 2 && g.sb === 16 && !g.edge && (g.over === 'none' || g.over === 'normal') && g.scrolls &&
         up[0] === '0,0,0' && up[1] === '64,64,64' && up[2] === '212,208,200' && up[3] === '255,255,255' && up[4] === '212,208,200' && dn[0] === '0,0,0',
         w + ': the list\'s scrollbar is Windows\' (16, arrow buttons with black triangles) and sits flush inside the white\'s frame — nothing painted over it ' + JSON.stringify({ g, up, dn }));
      /* Home is one calm document: your rows are entries like the others (no grey fill, the same hairline under them),
         a band lies over the hairline before it (one line, never two), and stays at the top while its group scrolls */
      const co = await ev(c, () => { const lb = document.getElementById('listbody'), bands = [...lb.querySelectorAll('.band')], you = lb.querySelector('.fitem.fyou');
        const other = lb.querySelector('.fitem[data-verb]:not(.fyou):not(.fnet):not(.fitco)'), cs = x => getComputedStyle(x);
        const two = bands.filter(b => { const p = b.previousElementSibling; return p && cs(p).borderBottomWidth !== '0px' && Math.round(p.getBoundingClientRect().bottom - b.getBoundingClientRect().top) !== 1; }).length;
        return { you:!!you && !!other, bg:you && cs(you).backgroundColor, otherBg:other && cs(other).backgroundColor,
                 rule:you && cs(you).borderBottom === cs(other).borderBottom, two }; });
      ok(co.you && co.bg === co.otherBg && co.bg === 'rgba(0, 0, 0, 0)' && co.rule && !co.two,
         w + ': your "You: …" rows are on the white like every entry, the same hairline under them; a band never doubles a line ' + JSON.stringify(co));
      const stuck = await ev(c, async () => { const lb = document.getElementById('listbody'); lb.scrollTop = 1400; await new Promise(r => setTimeout(r, 150));
        const top = lb.getBoundingClientRect().top + lb.clientTop, b = [...lb.querySelectorAll('.band')].find(x => Math.abs(x.getBoundingClientRect().top - top) < 1);
        const hit = b && document.elementFromPoint(b.getBoundingClientRect().left + 200, top + 16);
        return { band:b ? b.textContent.trim() : '', onTop:!!hit && !!hit.closest('.band') }; });
      ok(stuck.band && stuck.onTop, w + ': scrolled, the group\'s band stays at the top of the white, over its rows ' + JSON.stringify(stuck));
      if (w === 1440){
        await c.evaluate(() => { document.getElementById('listbody').scrollTop = 0; }); await c.waitForTimeout(150); await shot(c, 'retro-home-1440');
        await c.screenshot({ path:path.join(SHOTS, 'retro-scrollbar-1x.png'), clip:{ x:L0 - 40, y:g.y - 4, width:g.sb + g.fr + 48, height:120 } });
      }
      ok(!c.errors.length && (await overflow(c)) <= 0, w + ': no console errors, no overflow (v5-retro) ' + c.errors.join(' '));
      await c.context().close();
    }
    /* a touch phone keeps its own overlay scrollbars and no frame; Home starts with its first band at the top; your rows unfilled */
    const c = await ctx('phone');
    await open(c, '', true);
    await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
    await c.goto(URL + '#/home'); await c.waitForTimeout(400);
    const ph = await firstTop(c), pl = await bandLook(c);
    const pg = await ev(c, () => { const lb = document.getElementById('listbody'), you = lb.querySelector('.fitem.fyou');
      return { sb:lb.offsetWidth - lb.clientWidth, fr:lb.clientLeft, you:!!you, bg:you ? getComputedStyle(you).backgroundColor : '' }; });
    ok(ph.gap === 0 && ph.bandGap === 0 && !pl && pg.sb === 0 && pg.fr === 0 && pg.you && pg.bg === 'rgba(0, 0, 0, 0)',
       'phone: native overlay scrollbars, no frame; the first band at the top; bands are lines; your rows unfilled (v5-retro) ' + JSON.stringify([ph, pl, pg]));
    ok(!c.errors.length && (await overflow(c)) <= 0, 'phone: no console errors, no overflow (v5-retro) ' + c.errors.join(' '));
    await c.context().close();
  }

  /* RSVP role: Going, Interested, Went and a shift must not send role, or a stored role is cleared.
     Add past event still sends Host, Co-creator and Attendee. The new event is yours, so the host check allows it. */
  {
    const ME = '00000000-0000-4000-8000-000000000001', EV = '00000000-0000-4000-8000-000000000101';
    const person = { id:ME, handle:'hana', displayName:'Hana Cerna', bio:'', skills:[], cities:['Brno'], look:null, lastSeenAt:null, createdAt:'2026-09-01T10:00:00Z' };
    const boot = { hypernet:1, me:person, login:null, people:[person], follows:[], promotions:[], horizons:[], hzFollows:[], callouts:[], replies:[], activity:[], chats:[],
      events:[{ id:EV, slug:'shift-night', title:'Shift night', startsOn:'2026-10-20', endsOn:null, startTime:null, endTime:null,
        timezone:'Europe/Prague', hostId:ME, hostName:'Hana Cerna', description:'x', kind:'meetup', privacy:'everyone', city:'Brno', region:null, country:'CZ', venue:null, access:null,
        whatToBring:[], details:{ blocks:[{ label:'Door', date:'2026-10-20', time:'18:00' }] }, look:null, source:'user', previousEditionId:null }],
      rsvps:[{ personId:ME, eventId:EV, status:'going', went:false, shiftIndex:null, role:'host', updatedAt:'2026-09-30T10:00:00Z' }] };
    const filePast = async (c, role, title) => {
      await c.evaluate(() => { openItem('person', 'self'); beginProfileEdit(); });
      await c.waitForTimeout(300);
      await c.evaluate(() => document.querySelector('[data-act="addpastevent"]').click());
      await c.waitForTimeout(250);
      await c.check('.dlg input[name="ch-role"][value="' + role + '"]');
      await c.click('.dlg [data-act="chronicle-go"]');
      await c.waitForTimeout(300);
      await c.fill('#w-t', title);
      await c.fill('#w-c', 'Brno');
      await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]');
      await c.waitForTimeout(200);
      await c.fill('#w-desc', 'A night that already happened.');
      await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]');
      await c.waitForTimeout(200);
      await c.click('.dlg .dfoot [data-act="wiz"][data-id="finish"]');
      await c.waitForTimeout(700);
    };
    for (const kind of ['desk', 'phone']){
      const c = await ctx(kind);
      const puts = [], posts = [];
      await c.addInitScript(() => { window.HN_BACKEND = { branch:'test' }; });
      await c.route('**/api/**', route => {
        const u = new (require('url').URL)(route.request().url()), req = route.request();
        const j = (code, b) => route.fulfill({ status:code, contentType:'application/json', body:JSON.stringify(b) });
        if (req.method() === 'PUT' && /\/rsvp$/.test(u.pathname)){
          const body = req.postDataJSON(); puts.push(body);
          const role = Object.prototype.hasOwnProperty.call(body, 'role') ? body.role : 'host';
          return j(200, { rsvp:{ status:body.status, went:!!body.went, shiftIndex:body.shiftIndex == null ? null : body.shiftIndex, role:role } });
        }
        if (req.method() === 'POST' && u.pathname === '/api/events'){
          const body = req.postDataJSON(); posts.push(body);
          return j(201, { event:{ id:body.id, slug:'past', hostId:ME, title:body.title, startsOn:body.startsOn } });
        }
        if (u.pathname === '/api/bootstrap') return j(200, boot);
        if (/\/api\/chats/.test(u.pathname)) return j(200, { chats:[] });
        return j(200, {});
      });
      await c.goto(URL + '#/home'); await c.waitForTimeout(800);
      const before = await ev(c, id => ROLE[id], EV);
      await c.evaluate(id => setRSVP(id, 'going'), EV);
      await c.evaluate(id => setRSVP(id, 'interested'), EV);
      await c.evaluate(id => setWent(id), EV);
      await c.evaluate(id => takeShift(id, 0), EV);
      await c.waitForTimeout(400);
      const after = await ev(c, id => ({ role:ROLE[id], status:RSVP[id] || null, went:!!WENT[id], shift:SHIFT[id] }), EV);
      const toggles = puts.slice();
      ok(before === 'host' && after.role === 'host' && toggles.length === 4 && toggles.every(b => !Object.prototype.hasOwnProperty.call(b, 'role')) &&
         after.status === 'going' && after.went && after.shift === 0,
         kind + ': Going, Interested, Went and a shift keep a stored host role and do not send role ' + JSON.stringify({ before, after, toggles }));
      const filed = {};
      for (const [role, title] of [['host', 'Old host night'], ['cocreator', 'Old crew night'], ['attendee', 'Old guest night']]){
        const n = puts.length, pn = posts.length;
        await filePast(c, role, title);
        const got = await ev(c, title => {
          const id = Object.keys(EVENTS).find(k => EVENTS[k] && EVENTS[k].title === title);
          const sec = id && [...document.querySelectorAll('#dscroll [data-sect="chronicle"] [data-role]')].find(s => s.getAttribute('data-role') === ROLE[id] && s.textContent.indexOf(title) >= 0);
          return { id:id || null, role:id ? ROLE[id] : null, went:!!(id && WENT[id]), mine:!!(id && MYEVENTS.indexOf(id) >= 0), host:!!(id && EVENTS[id].hostAcct === S.acct), shown:!!sec };
        }, title);
        filed[role] = { got, put:puts.slice(n), post:posts[pn] || null };
      }
      ok(['host', 'cocreator', 'attendee'].every(role => {
        const f = filed[role];
        return f.got.role === role && f.got.went && f.got.mine && f.got.host && f.got.shown && f.put.length === 1 && f.put[0].role === role && f.post && !('hostId' in f.post);
      }), kind + ': Add past event files Host, Co-creator and Attendee on an event you host ' + JSON.stringify(filed));
      ok(!c.errors.length, kind + ': no console errors (rsvp role) ' + c.errors.join(' '));
      await c.context().close();
    }
  }

  /* A past Going with no stored role is Attended. A stored cocreator role on that same event is only Co-created. */
  {
    const places = c => ev(c, () => {
      const title = 'Late quay supper';
      const hit = [...document.querySelectorAll('#dscroll [data-sect="chronicle"] [data-role]')].filter(s => s.textContent.indexOf(title) >= 0).map(s => s.getAttribute('data-role'));
      return { hit, status: RSVP['evt-chronicle-going'] || null, role: ROLE['evt-chronicle-going'] || null, went: !!WENT['evt-chronicle-going'] };
    });
    for (const kind of ['desk', 'phone']){
      const c = await ctx(kind);
      await open(c, '', true);
      await c.evaluate(() => useAcct('demo')); await c.waitForTimeout(400);
      await c.evaluate(() => { openItem('person', 'self'); }); await c.waitForTimeout(400);
      const going = await places(c);
      ok(going.status === 'going' && !going.role && !going.went && going.hit.length === 1 && going.hit[0] === 'attendee',
         kind + ': a past Going event with no role is under Attended, once ' + JSON.stringify(going));
      await c.evaluate(() => { ROLE['evt-chronicle-going'] = 'cocreator'; render(); }); await c.waitForTimeout(200);
      const crew = await places(c);
      ok(crew.role === 'cocreator' && crew.hit.length === 1 && crew.hit[0] === 'cocreator',
         kind + ': the same event with a stored cocreator role is only under Co-created ' + JSON.stringify(crew));
      await c.evaluate(() => { delete ROLE['evt-chronicle-going']; RSVP['evt-chronicle-going'] = 'interested'; render(); }); await c.waitForTimeout(200);
      const keen = await places(c);
      ok(!keen.role && keen.status === 'interested' && keen.hit.length === 0,
         kind + ': Interested alone leaves that event out of Chronicle ' + JSON.stringify(keen));
      ok(!c.errors.length, kind + ': no console errors (chronicle going) ' + c.errors.join(' '));
      await c.context().close();
    }
  }

  /* ---------------- tablet ---------------- */
  const t = await ctx('tab');
  await open(t, '', true);
  await overflowEverywhere(t, 'tablet 768');
  console.log('tab errors', t.errors); ok(!t.errors.length, 'tablet: no console errors');
  await done();
})();
