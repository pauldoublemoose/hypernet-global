/* Hypernet feed — end-to-end regression (usability rounds 1 and 2).
   Serve:  python3 -m http.server 8936 --bind 127.0.0.1 --directory <repo>
   Run:    npx -y -p playwright node tests/regression.js
   Browser: Playwright's own Chromium when it is installed; otherwise PW_CHROME=<chromium binary>; otherwise
            the newest Chromium found in the Playwright cache (~/Library/Caches/ms-playwright, ~/.cache/ms-playwright).
            If none is found it says how to get one (npx playwright install chromium-headless-shell).
   HN_URL=<url> points it at another server.
   Covers: open event → Going; create horizon → add events → customize → reload; new group chat;
   right-click → Add to horizon; long-press sheet; back/forward/reload restore; console errors, failed
   requests (404s) and horizontal overflow at 375 (touch), 768 and 1440; plus the round-2 majors: toasts vs the
   phone verb bar, private horizons, horizon as a desktop destination, volunteer shifts, safe Cancel/Discard. */
let chromium;
try { ({ chromium } = require('playwright')); } catch(e){
  try { ({ chromium } = require('playwright-core')); } catch(e2){
    console.error('Needs Playwright: run it as  npx -y -p playwright node tests/regression.js'); process.exit(2);
  }
}
const path = require('path'), fs = require('fs'), os = require('os');
const URL = process.env.HN_URL || 'http://127.0.0.1:8936/';
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
  for (const h of ['#/home', '#/home?view=list', '#/home?view=calendar', '#/horizons', '#/event/borderland-2027', '#/event/burning-man-2027', '#/horizon/season', '#/person/anna', '#/callout/sound', '#/search?q=sound', '#/home/soon', '#/chats']){
    await p.goto(URL + h); await p.waitForTimeout(350);
    const o = await overflow(p); if (o > 0) worst.push(h + ':' + o);
  }
  ok(!worst.length, label + ': no horizontal overflow on 12 screens ' + worst.join(' '));
}
(async () => {
  /* ---------------- phone ---------------- */
  const p = await ctx('phone');
  await open(p, '', true);
  // open event → Going (logged out → join → Going on)
  await p.tap('.srow[data-shelf="week"] .card2'); await p.waitForTimeout(250);
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
  await p.selectOption('select[data-cz="pal"]', '2'); await p.waitForTimeout(150);
  await p.tap('.dlg [data-act="wiz"][data-id="finish"]'); await p.waitForTimeout(250);
  await p.reload(); await p.waitForTimeout(700);
  ok(await ev(p, h => HORIZONS[h] && HORIZONS[h].eventIds.length === 3 && HZTHEME[h] && HZTHEME[h].palette.bg === '#000000' && S.stack[0].id === h && !!document.querySelector('#dscroll .plist.themed'), hz), 'phone: horizon, its events and its look survive reload, page restored');
  // new group chat
  await p.tap('[data-act="newsheet"]'); await p.waitForTimeout(150);
  await p.tap('.sheetrow[data-id="newchat"]'); await p.waitForTimeout(200);
  for (const w of ['p-anna', 'p-kai', 'p-rio']){ await p.tap('.pick:has(input[data-id="' + w + '"])'); await p.waitForTimeout(60); }
  await p.fill('#nc-name', 'Strike crew 2026'); await p.tap('.dlg [data-act="donewchat"]'); await p.waitForTimeout(300);
  await p.fill('#chatbox', 'who has the van'); await p.tap('[data-act="sendchat"]'); await p.waitForTimeout(200);
  ok(await ev(p, () => /Strike crew 2026/.test(document.getElementById('appbar').textContent)), 'phone: new group chat open');
  // long-press sheet
  await p.goto(URL + '#/home'); await p.waitForTimeout(500);
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
  await d.click('#listbody .row[data-type="event"] >> nth=1'); await d.waitForTimeout(200);
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
  await d.click('.dlg [data-cz="preset"][data-i="3"]'); await d.waitForTimeout(150);
  await d.click('.dlg [data-act="wiz"][data-id="finish"]'); await d.waitForTimeout(250);
  await d.reload(); await d.waitForTimeout(700);
  ok(await ev(d, h => HORIZONS[h].eventIds.length === 2 && !!HZTHEME[h] && !!document.querySelector('#listbody .plist.themed') && S.folder.kind === 'horizon', dh), 'desktop: horizon + events + look survive reload');
  // right-click → Add to horizon
  await d.goto(URL + '#/home'); await d.waitForTimeout(500);
  const target = await ev(d, () => document.querySelectorAll('#listbody .row[data-type="event"]')[3].getAttribute('data-id'));
  await d.click('#listbody .row[data-type="event"] >> nth=3', { button:'right' }); await d.waitForTimeout(150);
  await d.hover('.ctxmenu .ci:has-text("Add to horizon")'); await d.waitForTimeout(350);
  await d.click('.ctxmenu >> nth=1 >> .ci:has-text("Driftwood")'); await d.waitForTimeout(250);
  ok(await ev(d, ([h, t]) => HORIZONS[h].eventIds.indexOf(t) >= 0, [dh, target]), 'desktop: right-click → Add to horizon');
  // new group chat in the dock, list still beside the reading pane
  await d.evaluate(() => runCmd('newchat')); await d.waitForTimeout(150);
  for (const w of ['p-anna', 'p-rio']){ await d.click('.pick:has(input[data-id="' + w + '"])'); await d.waitForTimeout(60); }
  await d.click('.dlg [data-act="donewchat"]'); await d.waitForTimeout(300);
  ok(await ev(d, () => S.rightOpen && CHATS[S.chatOpen] && CHATS[S.chatOpen].name === 'Anna, Rio' && document.getElementById('app').classList.contains('split')), 'desktop: new group chat in the dock, split view kept');
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
  await r.tap('#sh-list .linkrow[data-chat="c-baltic"]'); await r.waitForTimeout(250);
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

  /* ---------------- tablet ---------------- */
  const t = await ctx('tab');
  await open(t, '', true);
  await overflowEverywhere(t, 'tablet 768');
  console.log('tab errors', t.errors); ok(!t.errors.length, 'tablet: no console errors');
  await done();
})();
