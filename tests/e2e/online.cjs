/* End-to-end, as people use it: two real logins by emailed code, against a running deployment.
     HN_URL=https://… HN_EMAIL_A=michal.kucera04+hn1@gmail.com HN_EMAIL_B=michal.kucera04+hn2@gmail.com \
     HN_OTP_DIR=/tmp/otp [HN_BYPASS=<vercel automation bypass secret>] node tests/e2e/online.cjs
   When it needs a code it prints "WAITING_FOR_CODE <email>" and waits for the file $HN_OTP_DIR/<email>.txt
   (tests/e2e/otp.sh reads it from Gmail). Covers: join by code, profile, a Friends event with a picture, a public
   event with a call out, the second person can't see the Friends event until the host follows them, follows and
   replies, a message, reload keeps it all, log out. Playwright: NODE_PATH=<dir with playwright-core>, PW_CHROME=<chromium>. */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const BASE = (process.env.HN_URL || 'http://localhost:3210').replace(/\/$/, '');
const OTPDIR = process.env.HN_OTP_DIR || '/tmp/hn-otp';
const RUN = Date.now().toString(36).slice(-5);
const SHOTS = process.env.HN_SHOTS || path.join(OTPDIR, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAHElEQVR42mP8z8AARMQDxlEN1AAMowaMGjA8DQAA2B8f8cOm2MAAAAAASUVORK5CYII=', 'base64');
let failed = 0;
const ok = (c, m, extra) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (extra ? ' ' + JSON.stringify(extra) : '')); if (!c) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitCode(email){
  const f = path.join(OTPDIR, email + '.txt');
  try { fs.unlinkSync(f); } catch (e) {}
  console.log('WAITING_FOR_CODE ' + email);
  for (let i = 0; i < 240; i++){
    if (fs.existsSync(f)){ const c = fs.readFileSync(f, 'utf8').replace(/\D/g, ''); if (c.length === 6) return c; }
    await sleep(1000);
  }
  throw new Error('no code for ' + email);
}

async function person(browser, email, handle, name){
  const headers = process.env.HN_BYPASS ? { 'x-vercel-protection-bypass': process.env.HN_BYPASS, 'x-vercel-set-bypass-cookie': 'true' } : {};
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: headers });
  const p = await ctx.newPage();
  p.errs = []; p.writes = [];
  p.on('pageerror', (e) => p.errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') p.errs.push(m.text()); });
  p.on('response', (r) => { const u = r.url(); if (u.startsWith(BASE + '/api/') && r.request().method() !== 'GET') p.writes.push(r.request().method() + ' ' + u.slice(BASE.length) + ' ' + r.status()); if (r.status() >= 400 && !/sign-in|get-session/.test(u)) p.errs.push('HTTP ' + r.status() + ' ' + u); });
  await p.goto(BASE + '/');
  await p.waitForFunction(() => window.ROUTE && ROUTE.ready, null, { timeout: 60000 });
  ok(await p.evaluate(() => HNAPI.online && !S.loggedIn), name + ': the app is online, logged out');
  await p.click('#previewbar [data-act="join"]');
  await p.waitForSelector('#hn-email');
  await p.fill('#hn-email', email);
  await p.click('[data-hnact="send"]');
  await p.waitForSelector('#hn-otp', { timeout: 30000 });
  ok(true, name + ': a code was asked for');
  const code = await waitCode(email);
  await p.fill('#hn-otp', code);
  await p.click('[data-hnact="verify"]');
  // first time: the profile form; a returning login goes straight in
  await p.waitForFunction(() => document.getElementById('pf-name') || (S.loggedIn && HNAPI.me), null, { timeout: 30000 });
  if (await p.$('#pf-name')){
    await p.fill('#pf-name', name); await p.fill('#pf-handle', handle);
    await p.click('[data-act="pfcity"][data-id="Brno"]');
    await p.click('#pfsave');
  }
  await p.waitForFunction(() => S.loggedIn && HNAPI.me, null, { timeout: 30000 });
  ok(true, name + ': logged in by emailed code', await p.evaluate(() => ({ handle: HNAPI.me.handle })));
  return p;
}

async function newEvent(p, title, privacy, withPicture){
  await p.evaluate(() => newEventDialog());
  await p.fill('#w-t', title);
  const day = await p.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 10); return isoOf(d); });
  await p.fill('#w-d', day); await p.fill('#w-c', 'Brno');
  await p.selectOption('#w-p', privacy);
  await p.click('[data-act="wiz"][data-id="next"]');
  await p.fill('#w-desc', 'End-to-end test event (' + RUN + ').');
  await p.click('[data-act="wiz"][data-id="next"]');
  if (withPicture){
    await p.setInputFiles('#cz-file', { name: 'sq.png', mimeType: 'image/png', buffer: PNG });
    await p.waitForFunction(() => DRAFT && /neon\.tech\/images\//.test(DRAFT.image || ''), null, { timeout: 30000 });
  }
  await p.click('[data-act="wiz"][data-id="finish"]');
  await p.waitForFunction((t) => Object.keys(EVENTS).some((k) => EVENTS[k].title === t), title, { timeout: 15000 });
  await sleep(2500);
  return p.evaluate((t) => Object.keys(EVENTS).filter((k) => EVENTS[k].title === t)[0], title);
}
const reload = async (p) => { await p.reload(); await p.waitForFunction(() => window.ROUTE && ROUTE.ready && HNAPI.me, null, { timeout: 60000 }); };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROME });
  const A = await person(browser, process.env.HN_EMAIL_A, 'hna' + RUN, 'Hana Test');
  const fri = await newEvent(A, 'E2E friends sauna ' + RUN, 'friends', true);
  const pub = await newEvent(A, 'E2E public build ' + RUN, 'everyone', false);
  ok(A.writes.filter((w) => /POST \/api\/events 201/.test(w)).length === 2 && A.writes.some((w) => /POST \/api\/images 201/.test(w)), 'A: two events published, one with a picture');
  await A.evaluate((id) => newCalloutDialog({ eventId: id }), pub);
  await A.fill('#co-t', 'Need a carpenter'); await A.fill('#co-b', 'Saturday, two hours.');
  await A.click('#co-go'); await sleep(2500);
  ok(A.writes.some((w) => /POST \/api\/callouts 201/.test(w)), 'A: call out posted');
  const aId = await A.evaluate(() => HNAPI.me.id);
  await A.goto(BASE + '/#/event/' + await A.evaluate((id) => evSlug(id), fri)); await sleep(1500);
  await A.screenshot({ path: path.join(SHOTS, 'a-friends-event.png') });

  const B = await person(browser, process.env.HN_EMAIL_B, 'hnb' + RUN, 'Bo Test');
  const bId = await B.evaluate(() => HNAPI.me.id);
  ok(await B.evaluate((ids) => !EVENTS[ids.fri] && !!EVENTS[ids.pub], { fri, pub }), 'B: sees the public event, not the Friends one');
  const before = B.errs.length;
  ok((await B.evaluate(async (id) => (await fetch('/api/events/' + id)).status, fri)) === 404, 'B: the Friends event answers 404 directly');
  await sleep(300); B.errs.splice(before); // that 404 was the point
  await B.evaluate((pid) => followP(pid), aId); await sleep(1500);
  const co = await B.evaluate((id) => CALLOUTS.filter((c) => c.eventId === id)[0].id, pub);
  await B.evaluate((id) => answerCallout(id), co); await sleep(800);
  await B.waitForSelector('#coreply'); await B.fill('#coreply', 'I can bring tools.'); await B.click('[data-act="postreply"]'); await sleep(2000);
  ok(B.writes.some((w) => /follow 200/.test(w)) && B.writes.some((w) => /replies 201/.test(w)), 'B: followed A and replied to the call out');
  await B.evaluate((pid) => messagePerson(pid), aId); await sleep(500);
  await B.fill('#chatbox', 'See you Saturday (' + RUN + ')'); await B.click('[data-act="sendchat"]'); await sleep(2000);
  ok(B.writes.some((w) => /messages 201/.test(w)), 'B: sent A a message');

  // A follows B back: Friends means the people the host follows, so B now sees the Friends event
  await reload(A);
  ok(await A.evaluate((r) => ACTSEED.replies.some((x) => /bring tools/.test(x.text)) && Object.keys(CHATS).some((k) => CHATS[k].messages.some((m) => m.text === r)), 'See you Saturday (' + RUN + ')'), 'A: sees B’s reply and message after reload');
  await A.evaluate((pid) => followP(pid), bId); await sleep(2000);
  await reload(B);
  ok(await B.evaluate((id) => !!EVENTS[id], fri), 'B: sees the Friends event once A follows B');
  await B.goto(BASE + '/#/event/' + await B.evaluate((id) => evSlug(id), fri)); await sleep(1500);
  ok(await B.evaluate((id) => /neon\.tech\/images\//.test((window.HYPERNET_THEMES.themes[id] || {}).image || ''), fri), 'B: the event shows A’s picture');
  await B.screenshot({ path: path.join(SHOTS, 'b-sees-friends-event.png') });
  await B.evaluate(() => doLogout()); await sleep(2500);
  ok(await B.evaluate((id) => !S.loggedIn && !EVENTS[id], fri), 'B: logged out, the Friends event is gone again');
  await A.screenshot({ path: path.join(SHOTS, 'a-home.png') });

  for (const [n, p] of [['A', A], ['B', B]]) ok(!p.errs.length, n + ': no console errors or failed requests', p.errs.slice(0, 6));
  console.log(JSON.stringify({ run: RUN, fri, pub, aId, bId }));
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
