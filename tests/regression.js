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
   one button style on every event page; 2026-09-28: the reading pane closes to an empty pane (URL, back, Esc) in six
   contexts, event / horizon / person share one page template, uncustomised things are plain, a customised profile
   persists; and 2026-10-01: a look is three colours and a square image on the calm plain layout (no canvas art, nothing
   moves, nothing covers a control, text AA on every look), Customize shows exactly 3 colour inputs and 1 image upload,
   an uploaded image shows in the page square and in list rows and survives reload, a too-faint text colour is
   corrected, bad files are refused, the profile photo comes from Edit profile, old looks migrate; and 2026-10-01 (v1): Home is the network's
   activity (newest first, an inverted call-out card, friends of friends, your own actions live at the top, the whole
   network when logged out or following nobody), Explore holds events / Event Horizons / call outs / people (old
   #/horizons and #/people land there), chat is person to person only. */
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
async function shot(p, name){ await p.screenshot({ path: path.join(SHOTS, name + '.png') }); }
let fails = 0;
function ok(cond, msg){ console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; }
async function done(){ if (browser) await browser.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exitCode = fails ? 1 : 0; }

const ev = (p, f, a) => p.evaluate(f, a);
async function join(p, name, handle){
  await p.evaluate(() => loginDialog()); await p.waitForTimeout(150);
  await p.fill('#pf-name', name); await p.fill('#pf-handle', handle); await p.click('#pfsave'); await p.waitForTimeout(300);
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
  await d.click('#listbody .fev .fct >> nth=1'); await d.waitForTimeout(200);
  const e2 = await ev(d, () => S.stack[0].id);
  await join(d, 'Jonas Berg', 'jonas');
  await d.click('#dscroll .actbar [data-act="v-going"]'); await d.waitForTimeout(200);
  ok(await ev(d, id => RSVP[id] === 'going', e2), 'desktop: open event → Going');
  await d.evaluate(() => runCmd('new-horizon')); await d.waitForTimeout(150);
  await d.fill('#nh-n', 'Driftwood'); await d.click('#nh-go'); await d.waitForTimeout(300);
  const dh = await ev(d, () => S.folder.kind === 'horizon' ? S.folder.id : S.stack[0].id);
  await d.click('#listbody [data-act="addevents"]'); await d.waitForTimeout(250);
  await d.fill('#pk-q', 'decompression'); await d.waitForTimeout(150);
  await d.evaluate(() => { [...document.querySelectorAll('#pk-list input[data-act="pkpick"]')].slice(0, 2).forEach(i => i.click()); });
  await d.click('.dlg [data-act="pkdone"]'); await d.waitForTimeout(250);
  await d.click('#listbody [data-act="customizehz"]'); await d.waitForTimeout(250);
  await d.click('.dlg [data-czact="start"][data-i="3"]'); await d.waitForTimeout(150);
  await d.click('.dlg [data-act="wiz"][data-id="finish"]'); await d.waitForTimeout(250);
  await d.reload(); await d.waitForTimeout(700);
  ok(await ev(d, h => HORIZONS[h].eventIds.length === 2 && !!HZTHEME[h] && !!document.querySelector('#listbody .pg-horizon:not(.plain)') && S.folder.kind === 'horizon', dh), 'desktop: horizon + events + look survive reload');
  // right-click → Add to horizon
  await d.goto(URL + '#/explore/events'); await d.waitForTimeout(500);
  const target = await ev(d, () => document.querySelectorAll('#listbody .row[data-type="event"]')[3].getAttribute('data-id'));
  await d.click('#listbody .row[data-type="event"] >> nth=3', { button:'right' }); await d.waitForTimeout(150);
  await d.hover('.ctxmenu .ci:has-text("Add to horizon")'); await d.waitForTimeout(350);
  await d.click('.ctxmenu >> nth=1 >> .ci:has-text("Driftwood")'); await d.waitForTimeout(250);
  ok(await ev(d, ([h, t]) => HORIZONS[h].eventIds.indexOf(t) >= 0, [dh, target]), 'desktop: right-click → Add to horizon');
  // new chat in the dock: one person; the list stays beside the reading pane
  await d.evaluate(() => runCmd('newchat')); await d.waitForTimeout(150);
  ok(await ev(d, () => !document.querySelector('.dlg input[type="checkbox"], #nc-name') && !/create group/i.test(document.querySelector('.dlg').textContent)), 'desktop: New chat cannot make a group');
  await d.click('#nc-list [data-act="ncdm"][data-id="p-rio"]'); await d.waitForTimeout(300);
  ok(await ev(d, () => S.rightOpen && CHATS[S.chatOpen] && CHATS[S.chatOpen].kind === 'dm' && CHATS[S.chatOpen].memberIds[0] === 'p-rio' && document.getElementById('app').classList.contains('split')), 'desktop: new chat with Rio in the dock, split view kept');
  // back / forward / reload
  await d.click('#listbody .row[data-type="event"] >> nth=5'); await d.waitForTimeout(200);
  const h3 = await ev(d, () => location.hash);
  await d.click('#listbody .row[data-type="event"] >> nth=6'); await d.waitForTimeout(200);
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
  await r.tap('#evbar [data-act="evmore"]'); await r.waitForTimeout(200);
  await r.tap('.ctxsheet .sheetrow:has-text("Share")'); await r.waitForTimeout(250);
  await r.tap('#sh-list .linkrow[data-chat="c-kai"]'); await r.waitForTimeout(250);
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
  // ORGANISER-R2-1 / -2: a private horizon offers Publish, not Share; on desktop a horizon is its own destination
  const o = await ctx('desk');
  await open(o, '', true);
  await join(o, 'Jonas Berg', 'jonas');
  await o.evaluate(() => runCmd('new-horizon')); await o.waitForTimeout(150);
  await o.fill('#nh-n', 'Driftwood crew season'); await o.click('#nh-go'); await o.waitForTimeout(300);
  ok(await ev(o, () => S.folder.kind === 'horizon' && getComputedStyle(document.getElementById('chead')).display === 'none' && document.querySelectorAll('#navbody .nrow.sel').length === 1),
     'R2: a horizon is the desktop destination, one sidebar row lit');
  ok(await ev(o, () => !!document.querySelector('#listbody [data-act="publishhz"]') && !document.querySelector('#listbody [data-act="share"]')), 'R2: an empty private horizon offers Publish, no Share');
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
      if (w >= 1280) ok(await ev(f, () => document.getElementById('app').classList.contains('split') && document.getElementById('dscroll').getBoundingClientRect().width >= 380), w + ': list + reading pane + dock fit');
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

  /* ---------------- 2026-09-28: the reading pane closes, in every context, and the URL keeps it closed ---------------- */
  {
    const c = await ctx('desk');
    await open(c, '', true);
    await join(c, 'Pane Tester', 'panetest');
    /* closed = the pane keeps its place and width, and is empty */
    const st = () => ev(c, () => ({ hash:location.hash, split:$('app').classList.contains('split'), closed:$('app').classList.contains('pane-closed'), stack:S.stack.length,
      kept:$('detailcol').getBoundingClientRect().width > 300 && $('listcol').getBoundingClientRect().width < $('cbody').getBoundingClientRect().width - 300,
      empty:!!$('dscroll').querySelector('.panempty') && !$('dscroll').querySelector('.canvas') }));
    for (const [name, h, sel] of [['horizon → event', '#/horizon/season', '#listbody .track'], ['home', '#/home', '#listbody .fev .fct'],
        ['explore section', '#/explore/soon', '#listbody .row[data-type="event"]'], ['show all', '#/explore/announced', '#listbody .row[data-type="event"]'],
        ['search', '#/search?q=burn', '#listbody .row[data-type="event"]'], ['people → person', '#/explore/people', '#listbody .row']]){
      await c.goto(URL + h); await c.waitForTimeout(450);
      await c.click(sel + ' >> nth=1'); await c.waitForTimeout(350);
      const a = await st();
      await c.click('#dbar [data-act="closepane"]'); await c.waitForTimeout(300);
      const b = await st();
      await c.reload(); await c.waitForTimeout(650);
      const r = await st();
      await c.goBack(); await c.waitForTimeout(450);
      const k = await st();
      await c.keyboard.press('Escape'); await c.waitForTimeout(300);
      const e = await st();
      await c.click(sel + ' >> nth=0'); await c.waitForTimeout(350);
      const p = await st();
      ok(a.split && a.stack && b.split && b.closed && b.kept && b.empty && !b.stack && /pane=closed/.test(b.hash) && r.closed && r.empty && !r.stack && k.split && k.stack &&
         e.closed && e.empty && p.split && p.stack && !p.empty && !/pane=closed/.test(p.hash), 'pane: ' + name + ' closes (× and Esc) to an empty pane that keeps its place, survives reload, back reopens, a pick fills it');
    }
    ok(!c.errors.length, 'pane: no console errors ' + c.errors.join(' '));
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
    /* an event published from the first step, and a new horizon, are plain */
    await c.evaluate(() => newEventDialog()); await c.waitForTimeout(200);
    await c.fill('#w-t', 'Plain supper'); await c.fill('#w-d', '2026-11-02'); await c.fill('#w-c', 'Brno');
    await c.click('.dlg .dfoot [data-act="wiz"][data-id="finish"]'); await c.waitForTimeout(600);
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
      const co = document.querySelector('#listbody .fitco .fco'), st = co && getComputedStyle(co), lb = getComputedStyle(document.getElementById('listbody'));
      const cards = [...document.querySelectorAll('#listbody .fcard')].map(x => getComputedStyle(x).backgroundColor);
      return { n:its.length, sorted:ts.every((t, i) => !i || ts[i - 1] >= t), bands:[...document.querySelectorAll('#listbody > .band')].map(b => b.textContent.trim()),
               co:!!co, coBg:st && st.backgroundColor, coFg:st && st.color, coSize:co && parseFloat(getComputedStyle(co.querySelector('.fcoa')).fontSize),
               bodySize:parseFloat(getComputedStyle(document.querySelector('#listbody .fsent')).fontSize), listBg:lb.backgroundColor, cards,
               strip:document.querySelectorAll('#listbody .costrip .cotile').length, fof:!!document.querySelector('#listbody .ffof .fcard.fp [data-act="followp"]'),
               verbs:!!document.querySelector('#listbody .fev [data-act="v-going"]') && !!document.querySelector('#listbody .fev [data-act="v-interested"]'),
               times:[...document.querySelectorAll('#listbody .fitem .ftime')].slice(0, 6).map(t => t.textContent) };
    });
    ok(pub.n >= 20 && pub.sorted, kind + ': logged out, Home is the network\'s activity, newest first (' + pub.n + ' entries)');
    ok(pub.bands[0] && /call outs/i.test(pub.bands[0]) && pub.bands.indexOf('Today') > 0 && pub.bands.indexOf('Yesterday') > pub.bands.indexOf('Today'), kind + ': open call outs on top, then day bands ' + JSON.stringify(pub.bands));
    ok(pub.times.every(t => /^(now|\d+m|\d+h|yesterday|Mon|Tue|Wed|Thu|Fri|Sat|Sun|\d+ \w{3})$/.test(t)), kind + ': relative times ' + JSON.stringify(pub.times));
    ok(pub.co && lum(pub.coBg) < .12 && lum(pub.coFg) > .9 && lum(pub.listBg) > .9 && pub.coSize >= 1.8 * pub.bodySize, kind + ': a call out is an inverted card with the ask in big type');
    ok(pub.cards.every(b => lum(b) > .8), kind + ': and nothing else on Home is inverted');
    ok(pub.strip >= 1 && pub.fof && pub.verbs, kind + ': call out strip, people to follow, and Interested / Going on event cards');
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
    const live = await ev(c, id => { const f = document.querySelector('#listbody .fitem[data-ts]'), fe = f.querySelector('.fev');
      return { s:f.querySelector('.fsent').textContent, t:f.querySelector('.ftime').textContent, id:fe && fe.getAttribute('data-id'), on:RSVP[id] === 'going' }; }, target);
    ok(live.on && /^You( and|,| are going)/.test(live.s) && live.id === target && live.t === 'now', kind + ': Going from a card puts "You … going" at the top, now ' + JSON.stringify(live));
    await c.evaluate(() => followP('p-jon')); await c.waitForTimeout(300);
    ok(await ev(c, () => [...document.querySelectorAll('#listbody .fitem[data-verb="followed_person"]')].some(x => /^You followed Jon/.test(x.querySelector('.fsent').textContent))), kind + ': following someone shows up as "You followed …"');
    await c.click('#listbody .fitem .fev [data-act="v-going"][data-id="' + target + '"] >> nth=0'); await c.waitForTimeout(400);
    ok(await ev(c, id => !RSVP[id] && ![...document.querySelectorAll('#listbody .fitem[data-verb="going"] .fsent')].some(x => /^You/.test(x.textContent)), target), kind + ': un-going takes your row off Home');
    await c.reload(); await c.waitForTimeout(700);
    ok(await ev(c, () => [...document.querySelectorAll('#listbody .fitem')].some(x => /^You followed/.test((x.querySelector('.fsent') || {}).textContent || ''))), kind + ': your activity survives a reload');
    /* a new account follows nobody: the whole network, and a nudge to follow people */
    await c.evaluate(() => doLogout()); await c.waitForTimeout(200);
    await join(c, 'Nora Field', 'nora' + kind);
    ok(await ev(c, () => /Make Home yours/.test(document.querySelector('#listbody').textContent) && document.querySelectorAll('#listbody .fitem[data-ts]').length >= 20), kind + ': following nobody, Home is the whole network with a nudge to follow people');
    ok(!c.errors.length, kind + ': no console errors (v1 Home / Explore) ' + c.errors.join(' '));
    ok((await overflow(c)) <= 0, kind + ': no overflow (v1 Home)');
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
      const showPage = () => ev(c, id => { goFolder({ kind:'hosting' }); if (L.phone) S.tab = 'you'; S.stack = [{ type:'event', id }]; S.autoSel = false; render(); }, own);
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
      await c.evaluate(() => newEventDialog()); await c.waitForTimeout(200);
      await c.fill('#w-t', 'Lantern swap'); await c.fill('#w-d', '2026-11-05');
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

  /* ---------------- tablet ---------------- */
  const t = await ctx('tab');
  await open(t, '', true);
  await overflowEverywhere(t, 'tablet 768');
  console.log('tab errors', t.errors); ok(!t.errors.length, 'tablet: no console errors');
  await done();
})();
