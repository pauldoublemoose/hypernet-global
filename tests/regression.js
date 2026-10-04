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
   moves, nothing covers a control, text AA on every look), Customize shows exactly 3 colour inputs and 1 image upload,
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
   out carries its whole thread with the box to answer in (Answer goes there, no chat). Older checks that spoke of the
   reading pane, the empty pane, ?pane=closed and the call-out strip now say the same things of the window. */
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
const TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon' };
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
    try { browser = await chromium.launch({ executablePath: tries[i], args: ['--no-sandbox'] }); if (tries[i]) console.log('browser: ' + tries[i]); return browser; }
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
async function shot(p, name){ await p.screenshot({ path: path.join(SHOTS, name + '.png') }); }
let fails = 0;
function ok(cond, msg){ console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; }
async function done(){ if (browser) await browser.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exitCode = fails ? 1 : 0; }

const ev = (p, f, a) => p.evaluate(f, a);
async function join(p, name, handle){
  await p.evaluate(() => loginDialog()); await p.waitForTimeout(150);
  await p.fill('#pf-name', name); await p.fill('#pf-handle', handle); await p.click('#pfsave'); await p.waitForTimeout(300);
}
/* the New event wizard filled the way a host has to (2026-10-04): Basics, Next, Words; then Publish unless told not to */
async function newEvent(c, o){
  await c.evaluate(() => newEventDialog()); await c.waitForTimeout(200);
  await c.fill('#w-t', o.title); await c.fill('#w-d', o.date);
  if (o.online) await c.check('#w-on'); else await c.fill('#w-c', o.city || 'Brno');
  if (o.privacy) await c.selectOption('#w-p', o.privacy);
  await c.click('.dlg .dfoot [data-act="wiz"][data-id="next"]'); await c.waitForTimeout(200);
  await c.fill('#w-desc', o.desc || 'A slow evening with friends.');
  if (o.publish !== false){ await c.click('.dlg .dfoot [data-act="wiz"][data-id="finish"]'); await c.waitForTimeout(500); }
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
  // open event → Going (logged out → join → Going on), from an event in Home's activity
  await p.tap('#listbody .fev .fct >> nth=0'); await p.waitForTimeout(250);
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
  await p.tap('#dscroll [data-act="customizehz"]'); await p.waitForTimeout(250);
  await p.fill('#cz-bg', '#000000'); await p.waitForTimeout(150);
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
  await pick(d, '#listbody .fev .fct >> nth=1'); await d.waitForTimeout(200);
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
  await d.click('#dscroll [data-act="customizehz"]'); await d.waitForTimeout(250);
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
  await r.tap('#evbar [data-act="evmore"]'); await r.waitForTimeout(200);
  await r.tap('.ctxsheet .sheetrow:has-text("Share")'); await r.waitForTimeout(250);
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
  ok(await ev(o, () => !!document.querySelector('#dscroll [data-act="publishhz"]') && !document.querySelector('#dscroll [data-act="share"]')), 'R2: an empty private horizon offers Publish, no Share');
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
    ok(!!pb && Math.abs(pb.w - w) < 2 && await ev(f, () => !!document.querySelector('#previewbar [data-act="join"]')), w + ': logged out, the preview bar spans the bottom with Join free');
    ok(await ev(f, () => !document.querySelector('#chead .seg')), w + ': Home has no view switch');
    await f.goto(URL + '#/home?view=calendar'); await f.waitForTimeout(400);
    ok(await ev(f, () => location.hash === '#/home' && !document.getElementById('app').classList.contains('v-cal')), w + ': an old #/home?view=calendar link lands on Home');
    await f.evaluate(() => { const l = document.getElementById('listbody'); l.scrollTop = l.scrollHeight; }); await f.waitForTimeout(150);
    const last = await ev(f, () => { const els = document.querySelectorAll('#listbody .row, #listbody .card2, #listbody .fitem, #listbody .fend'); return els.length ? els[els.length - 1].getBoundingClientRect().bottom : 0; });
    ok(last <= (await rb(f, '#previewbar')).top + 1, w + ': the last row/card is above the preview bar');
    if (kind === 'phone'){
      ok(Math.abs((await rb(f, '#previewbar')).bottom - (await rb(f, '#tabbar')).top) < 1, 'phone: preview bar directly above the tab bar');
      await f.goto(URL + '#/event/led-forest-walk'); await f.waitForTimeout(400);
      ok((await rb(f, '#evbar')).bottom <= (await rb(f, '#previewbar')).top + 1, 'phone: the event verb bar is not covered by the preview bar');
      await f.evaluate(() => toast('Test', 'toast')); await f.waitForTimeout(100);
      ok((await rb(f, '#toasts .toast')).bottom <= (await rb(f, '#evbar')).top + 1, 'phone: toasts stack above both bars');
    } else {
      ok(await ev(f, () => !document.getElementById('tg-left') && document.getElementById('nav').getBoundingClientRect().width >= 190), w + ': sidebar always visible, no toggle');
      await join(f, 'Mia Lind', 'mialind');
      ok(!(await rb(f, '#previewbar')), w + ': the preview bar goes once logged in');
      await f.evaluate(() => doLogout()); await f.waitForTimeout(200);
      await f.evaluate(() => loginDialog()); await f.waitForTimeout(150);
      await f.click('.dlg [data-act="useacct"][data-id="demo"]'); await f.waitForTimeout(300);
      await f.click('#tg-right'); await f.waitForTimeout(200);
      await f.click('.chrow[data-id="c-kai"]'); await f.waitForTimeout(200);
      ok(await ev(f, () => document.getElementById('nav').getBoundingClientRect().width >= 190 && !!document.querySelector('#chats .conv')), w + ': sidebar stays with the chat dock open');
      /* open an event: its window sits between the sidebar and the dock, over the list, covering neither */
      if (w >= 1280){ await pick(f, '#listbody .fev .fct >> nth=0'); await f.waitForTimeout(250); }
      if (w >= 1280) ok(await ev(f, () => { const wr = document.getElementById('win').getBoundingClientRect(), dk = document.getElementById('chats').getBoundingClientRect(), nv = document.getElementById('nav').getBoundingClientRect();
        return !document.getElementById('win').hidden && S.stack.length === 1 && wr.width >= 480 && wr.left >= nv.right && wr.right <= dk.left; }), w + ': the window opens between the sidebar and the chat dock');
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
      for (const act of ['v-interested', 'v-going', 'v-promote']){
        const sig = await ev(c, ([a, K, ph]) => { const b = document.querySelector((ph ? '#evbar' : '#dscroll .actbar') + ' [data-act="'+a+'"]'); if (!b) return 'missing'; const st = getComputedStyle(b); return K.map(k => st[k]).join('|'); }, [act, KEYS, kind === 'phone']);
        (sigs[act] = sigs[act] || new Set()).add(sig);
      }
    }
    ok(Object.keys(sigs).every(a => sigs[a].size === 1 && !sigs[a].has('missing')), kind + ': Interested / Going / Promote have identical computed styles on 5 event pages');
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
    /* the list is one column, centred between the sidebar and the right edge (no dock) */
    await c.goto(URL + '#/home'); await c.waitForTimeout(450);
    const col = await ev(c, () => { const l = document.getElementById('cbody').getBoundingClientRect(), n = document.getElementById('nav').getBoundingClientRect(), m = document.getElementById('main').getBoundingClientRect();
      return { w:Math.round(l.width), left:Math.round(l.left - n.right), right:Math.round(m.right - l.right) }; });
    ok(col.w === 680 && Math.abs(col.left - col.right) <= 10, 'window: at 1440 the list is one 680 column, centred between the sidebar and the edge ' + JSON.stringify(col));
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
    ok(g.open && g.w >= 480 && g.clearNav && g.inside && (kind === 'tab' || g.clearDock), kind + ' + dock: the window opens clear of the sidebar' + (kind === 'tab' ? '' : ' and the dock') + ', inside the main area ' + JSON.stringify(g));
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
    await c.evaluate(() => { const l = document.getElementById('listbody'); l.scrollTop = 900; }); await c.waitForTimeout(300);
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
        return top + '|' + ['header.banner > .bin > .sqwrap', 'header.banner > .bin > .btxt > h1.hl', '.actbar > .verbs', '.layer > .lin > .facts', '.layer > .lin > .sect'].map(q).join(',');
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
    /* your profile: Customize from your page, keep it across reload; nobody else's page offers it */
    await c.evaluate(() => { openItem('person', 'self'); }); await c.waitForTimeout(400);
    await c.click('.pg-person .actbar [data-act="customizeme"]'); await c.waitForTimeout(250);
    await c.click('.dlg [data-czact="start"][data-i="1"]'); await c.waitForTimeout(150);
    await c.click('.dlg [data-act="wiz"][data-id="finish"]'); await c.waitForTimeout(500);
    await c.reload(); await c.waitForTimeout(800);
    const pp = await ev(c, () => ({ look:!!PTHEME.self, page:!!document.querySelector('.pg-person:not(.plain)') }));
    ok(pp.look && pp.page, kind + ': a customised profile persists across reload');
    await c.goto(URL + '#/person/kai'); await c.waitForTimeout(400);
    ok(await ev(c, () => !!document.querySelector('.pg-person.plain') && !document.querySelector('[data-act="customizeme"]:not(.acctcard *)')), kind + ': someone else\'s profile has no Customize, and an uncustomised one is plain');
    ok(!c.errors.length, kind + ': no console errors (optional customize) ' + c.errors.join(' '));
  }

  /* ---------------- 2026-10-01 (v1): Home is the network's activity; Explore holds the rest; chat is person to person ---------------- */
  const lum = c => { const m = c.match(/\d+(\.\d+)?/g).map(Number); return (.2126 * m[0] + .7152 * m[1] + .0722 * m[2]) / 255; };
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '#/home', true);
    /* logged out: the public activity, newest first, with the call outs popping */
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
    ok(pub.n >= 20 && pub.sorted, kind + ': logged out, Home is the network\'s activity, newest first (' + pub.n + ' entries)');
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
    const youl = await ev(c, () => ({ s:(document.querySelector('#listbody .fyou .fsent') || {}).textContent || '',
      yous:[...document.querySelectorAll('#listbody .fitem .fsent')].filter(x => /^You\b/.test(x.textContent)).length }));
    ok(/followed Jon/.test(youl.s) && youl.yous === 1, kind + ': what you did is one line at the top ("You: …, followed Jon"), never a run of "You …" items ' + JSON.stringify(youl));
    await c.click('#listbody .fitem .fev [data-act="v-going"][data-id="' + target + '"] >> nth=0'); await c.waitForTimeout(400);
    ok(await ev(c, id => !RSVP[id] && ((document.querySelector('#listbody .fyou .fsent') || {}).textContent || '').indexOf(EVENTS[id].title) < 0, target), kind + ': un-going takes it off your line');
    await c.reload(); await c.waitForTimeout(700);
    ok(await ev(c, () => /^You: .*followed/.test((document.querySelector('#listbody .fyou .fsent') || {}).textContent || '')), kind + ': your activity survives a reload');
    /* a new account follows nobody: the whole network, and a nudge to follow people */
    await c.evaluate(() => doLogout()); await c.waitForTimeout(200);
    await join(c, 'Nora Field', 'nora' + kind);
    ok(await ev(c, () => /Make Home yours/.test(document.querySelector('#listbody').textContent) && document.querySelectorAll('#listbody .fitem[data-ts]').length >= 20), kind + ': following nobody, Home is the whole network with a nudge to follow people');
    ok(!c.errors.length, kind + ': no console errors (v1 Home / Explore) ' + c.errors.join(' '));
    ok((await overflow(c)) <= 0, kind + ': no overflow (v1 Home)');
  }

  /* ---------------- 2026-10-01 (v1 social): call outs reach the right people once; Home blends; your people's next weeks ---------------- */
  for (const kind of ['desk', 'phone']){
    const c = await ctx(kind);
    await open(c, '#/home', true);
    const a11y = () => ev(c, () => [...document.querySelectorAll('#listbody [role="button"]')].filter(x => x.querySelector('button, a, [role="button"]')).length +
                                   document.querySelectorAll('#listbody button button').length);
    const noDup = () => ev(c, () => { const strip = homeCallouts().map(x => x.id);
      const stream = [...document.querySelectorAll('#listbody > .fitco .fco')].map(x => x.getAttribute('data-id'));
      return { strip, shown:[...document.querySelectorAll('#listbody .costrip .fco')].map(x => x.getAttribute('data-id')), count:(document.querySelector('#listbody .coband .cnt') || {}).textContent, dup: stream.filter(x => strip.indexOf(x) >= 0) }; });
    let nd = await noDup();
    ok(nd.strip.length >= 2 && nd.shown.length === 1 && nd.shown[0] === nd.strip[0] && nd.count === '1 of ' + nd.strip.length && !nd.dup.length,
       kind + ': logged out, the open call outs are one at a time in their band ("1 of N"), none repeated in the stream ' + JSON.stringify(nd));
    await c.click('#listbody .coband [data-act="costep"][data-id="1"]'); await c.waitForTimeout(300);
    const nd2 = await noDup();
    ok(nd2.shown[0] === nd.strip[1] && nd2.count === '2 of ' + nd.strip.length, kind + ': › steps to the next call out ' + JSON.stringify(nd2));
    await c.click('#listbody .coband [data-act="costep"][data-id="-1"]'); await c.waitForTimeout(300);
    ok((await a11y()) === 0, kind + ': no role=button wrapper around real buttons on Home (logged out)');
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
      /* width: the list is one 680 column; nothing else beside it */
      await c.evaluate(() => { closeDialogs(); goFolder({ kind:'home' }); S.stack = []; render(); }); await c.waitForTimeout(300);
      ok(await ev(c, () => S.folder.kind === 'home' && document.getElementById('listcol').offsetWidth === 680 && document.getElementById('win').hidden), kind + ': at 1440 the list is one 680 column, nothing open');
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
    await c.evaluate(() => document.querySelector('.pchip[data-id="CAMP OPERATIONS/KITCHEN & COOKING"]').click()); await c.waitForTimeout(100);
    await c.click('#pfsave'); await c.waitForTimeout(300);
    /* following one person: Home still shows the network around them */
    await c.evaluate(() => followP('p-mira')); await c.waitForTimeout(300);
    const blend = await ev(c, () => ({ net:document.querySelectorAll('#listbody .fitem.fnet').length, band:[...document.querySelectorAll('#listbody .band')].some(b => /Around the network/.test(b.textContent)),
      mine:homeParts().stream.every(e => e.actors.every(a => a === 'p-mira')), strip:homeCallouts().length }));
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
    /* logged out, Home's tile counts the reply and shows it */
    await c.evaluate(() => doLogout()); await c.waitForTimeout(250);
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

  /* ---------------- 2026-10-01: Customize is three colours and a square image ---------------- */
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
      if (kind === 'desk') await c.click('#dscroll .actbar [data-act="customize"]'); else await c.evaluate(id => customizeDialog(id), own);
      await c.waitForTimeout(300);
      const ctl = await ev(c, () => ({ color:document.querySelectorAll('.dlg input[type=color]').length, file:document.querySelectorAll('.dlg input[type=file]').length,
        selects:document.querySelectorAll('.dlg select').length, boxes:document.querySelectorAll('.dlg input[type=checkbox]').length }));
      ok(ctl.color === 3 && ctl.file === 1 && !ctl.selects && !ctl.boxes, kind + ': Customize shows exactly 3 colour inputs and 1 image upload, no dropdowns ' + JSON.stringify(ctl));
      ok((await overflow(c)) <= 0, kind + ': Customize open, no horizontal overflow');
      const png = await pngOf(c);
      await c.setInputFiles('#cz-file', { name:'square.png', mimeType:'image/png', buffer:png }); await c.waitForTimeout(700);
      const up = await ev(c, async () => ({ img:/^data:image\/(webp|jpeg)/.test(DRAFT.image || ''), size:(DRAFT.image || '').length * .75,
        dims:await new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth + 'x' + i.naturalHeight); i.onerror = () => r('unreadable'); i.src = DRAFT.image; }),
        shown:!!document.querySelector('.dlg .czdrop img') && !!document.querySelector('.dlg .custprev .sqwrap img') }));
      ok(up.img && up.size < 150 * 1024 && up.dims === '512x512' && up.shown, kind + ': an upload is centre-cropped to a 512×512 image under 150 KB and previewed ' + JSON.stringify(up));
      /* a text colour too faint for its background is corrected, and the editor says so */
      await c.fill('#cz-bg', '#ffffff'); await c.fill('#cz-ink', '#f0f0f0'); await c.waitForTimeout(200);
      ok(await ev(c, () => !$('cz-note').hidden && /readability/i.test($('cz-note').textContent)), kind + ': a low-contrast text colour is flagged "adjusted for readability"');
      await c.click('.dlg [data-act="wiz"][data-id="finish"]'); await c.waitForTimeout(500);
      const st = await ev(c, id => { const t = window.HYPERNET_THEMES.themes[id]; return { keys:Object.keys(t).sort().join(','), cr:contrast(t.ink, t.bg), img:/^data:image/.test(t.image || '') }; }, own);
      ok(st.keys === 'accent,bg,glyph,image,ink' && st.cr >= 4.5 && st.img, kind + ': the saved look is { bg, ink, accent, image, glyph }, its text corrected to AA ' + JSON.stringify(st));
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
      await c.evaluate(id => customizeDialog(id), own); await c.waitForTimeout(300);
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
      ok(await ev(c, () => document.querySelectorAll('.dlg input[type=color]').length === 3 && document.querySelectorAll('.dlg input[type=file]').length === 1), kind + ': the New event look step is the same Customize');
      await c.click('.dlg [data-act="closedlg"]'); await c.waitForTimeout(150);
      /* your photo: from Edit profile, it is your avatar and your profile's square */
      await c.evaluate(() => profileDialog('edit')); await c.waitForTimeout(200);
      await c.setInputFiles('#pf-photo', { name:'me.png', mimeType:'image/png', buffer:png }); await c.waitForTimeout(700);
      await c.click('#pfsave'); await c.waitForTimeout(400);
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
    await tb.evaluate(() => customizeDialog(MYEVENTS[0])); await tb.waitForTimeout(300);
    ok((await overflow(tb)) <= 0 && !tb.errors.length, '768: Customize open, no horizontal overflow, no console errors');
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
    ok((await overflow(c)) <= 0 && !c.errors.length, kind + ': Home, no horizontal overflow, no console errors ' + c.errors.join(' '));
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
      /* a shelf that holds more than fits has ‹ ›, and › moves it along by whole squares */
      const sh = await ev(c, () => { const s = [...document.querySelectorAll('#listbody .shelf.more')][0]; return s ? s.querySelector('.srow').getAttribute('data-shelf') : null; });
      ok(!!sh, kind + ': a shelf with more squares than fit offers ‹ ›');
      if (sh){
        await c.click('#listbody .shelf .shstep [data-act="shelfstep"][data-shelf="' + sh + '"][data-id="1"]'); await c.waitForTimeout(700);
        ok(await ev(c, id => document.querySelector('#listbody .srow[data-shelf="' + id + '"]').scrollLeft > 100, sh), kind + ': › steps along the shelf');
      }
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

  /* ---------------- 2026-10-04: New event goes on only when a step has what it needs ---------------- */
  for (const kind of ['desk', 'tab', 'phone']){
    const c = await ctx(kind);
    await open(c, '', true);
    await join(c, 'Wiz Host', 'wizhost' + kind);
    await c.evaluate(() => newEventDialog()); await c.waitForTimeout(250);
    const foot = () => ev(c, () => ({ step:DRAFT.step, btns:[...document.querySelectorAll('.dlg .dfoot .btn')].map(b => b.textContent.trim() + (b.getAttribute('aria-disabled') === 'true' ? ':off' : '')),
      need:document.getElementById('wiz-need').textContent, errs:[...document.querySelectorAll('.dlg .ferr[data-err]:not([hidden])')].map(x => x.getAttribute('data-err')),
      invalid:[...document.querySelectorAll('.dlg [aria-invalid="true"]')].map(x => x.id), tabs:[...document.querySelectorAll('.dlg .wizsteps .ws')].map(t => t.getAttribute('aria-disabled') === 'true' ? 'off' : 'on'),
      focus:document.activeElement && document.activeElement.id, toast:(document.getElementById('toasts') || {}).textContent || '' }));
    const f0 = await foot();
    ok(f0.step === 1 && f0.btns.join('|') === 'Cancel|Next:off' && /title.*start date.*where/.test(f0.need) && !f0.errs.length && f0.tabs.join() === 'on,off,off',
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
    /* Words needs a description; Publish waits for it; Bring stays optional */
    const f4 = await foot();
    ok(f4.step === 2 && f4.btns.join('|') === 'Cancel|Back|Next:off|Publish event:off' && /description/.test(f4.need) && !f4.errs.length && f4.tabs.join() === 'on,on,off', kind + ': Words — Next and Publish wait for a description ' + JSON.stringify(f4));
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="finish"]', { force:true }); await c.waitForTimeout(250);
    const f5 = await foot();
    ok(f5.step === 2 && f5.errs.join() === 'desc' && f5.focus === 'w-desc' && await ev(c, () => !MYEVENTS.some(id => EVENTS[id] && EVENTS[id].title === 'Moth night')), kind + ': Publish with no description says so inline and publishes nothing');
    await c.fill('#w-desc', 'Sheets, a lamp and whatever flies in.'); await c.waitForTimeout(100);
    const f6 = await foot();
    ok(!f6.errs.length && f6.btns.join('|') === 'Cancel|Back|Next|Publish event' && f6.tabs.join() === 'on,on,on', kind + ': with a description both are on, the Look tab opens; Bring is optional ' + JSON.stringify(f6));
    /* back to Basics keeps it all; Look is optional and Publish works from it too */
    await c.click('.dlg .wizsteps .ws[data-id="3"]'); await c.waitForTimeout(200);
    const f7 = await foot();
    ok(f7.step === 3 && f7.btns.join('|') === 'Cancel|Back|Publish event', kind + ': Look is reachable and optional ' + JSON.stringify(f7.btns));
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
    ok(host.heads.length > 1 && host.heads.indexOf('Call outs') < 0 && host.btn, kind + ': the host’s event without call outs has no Call outs heading, and New call out in its toolbar ' + JSON.stringify(host));
    if (kind === 'desk') await shot(c, 'event-toolbar-new-callout');
    await c.click(bar + ' [data-act="newcalloutfor"]'); await c.waitForTimeout(300);
    ok(await ev(c, id => document.getElementById('co-e').value === id && /call out/i.test(document.querySelector('.dlg .dtitle').textContent), own), kind + ': New call out opens the form with this event chosen');
    await c.evaluate(() => { closeDialogs(); FORMDRAFTS.callout = null; }); await c.waitForTimeout(150);
    for (const [id, has] of [[await ev(c, () => calloutEventId(calloutOf('co-sound'))), true], ['evt-fill-3', false]]){
      await c.evaluate(i => openItem('event', i), id); await c.waitForTimeout(300);
      const g = await ev(c, () => ({ heads:[...document.querySelectorAll('#dscroll .sect h3')].map(h => h.textContent), cards:document.querySelectorAll('#dscroll .evcos .fco').length,
        reps:document.querySelectorAll('#dscroll .evcos .reply').length, box:!!document.querySelector('#dscroll .evcos #coreply'), add:!!document.querySelector('#dscroll [data-act="newcalloutfor"], #evbar [data-act="newcalloutfor"]') }));
      ok(has ? g.heads.indexOf('Call outs') >= 0 && g.cards === 1 && g.reps === 2 && g.box && !g.add : g.heads.indexOf('Call outs') < 0 && !g.cards && !g.add,
         kind + ': a guest sees ' + (has ? 'the event’s call out with its whole thread and the box to answer in' : 'no Call outs heading when there are none') + ' ' + JSON.stringify(g));
      if (has){
        /* Answer on the event's call out goes to the box under it, in the same window — no chat, nothing new opens */
        const n0 = await ev(c, () => ({ stack:S.stack.length, chats:Object.keys(CHATS).length }));
        await c.evaluate(() => document.querySelector('#dscroll .evcos [data-act="answercallout"]').click()); await c.waitForTimeout(300);
        ok(await ev(c, n => S.stack.length === n.stack && Object.keys(CHATS).length === n.chats && document.activeElement && document.activeElement.id === 'coreply', n0), kind + ': Answer on an event’s call out puts you in the box under it');
        ok(await ev(c, () => !/privately|message anna|in a chat|direct message/i.test(document.getElementById('dscroll').innerText)), kind + ': no chat wording around the call out');
      }
    }
    ok(!c.errors.length, kind + ': no console errors (replies, New call out) ' + c.errors.join(' '));
    ok((await overflow(c)) <= 0, kind + ': no overflow (replies, New call out)');
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

  /* ---------------- tablet ---------------- */
  const t = await ctx('tab');
  await open(t, '', true);
  await overflowEverywhere(t, 'tablet 768');
  console.log('tab errors', t.errors); ok(!t.errors.length, 'tablet: no console errors');
  await done();
})();
