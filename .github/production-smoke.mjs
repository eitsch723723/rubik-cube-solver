import { chromium, webkit } from 'playwright';

const BASE = 'https://eitsch723723.github.io/rubik-cube-solver/';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function waitForCombinedProduction(page) {
  let last = '';
  for (let attempt = 1; attempt <= 24; attempt++) {
    try {
      const response = await page.goto(`${BASE}?deploy=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      last = `${response?.status() ?? 'no-status'} ${await page.title()}`;
      if (response?.ok() && (await page.title()) === 'Zauberpuzzle-Löser' && await page.locator('#choosePyra').isVisible()) return;
    } catch (error) {
      last = String(error);
    }
    await sleep(5000);
  }
  throw new Error(`Combined production did not become available: ${last}`);
}

async function expectMoveListVisible(page, listSelector, expectedCount = null) {
  const result = await page.evaluate(({ listSelector, expectedCount }) => {
    const list = document.querySelector(listSelector);
    if (!list) return { exists: false };
    const chips = [...list.querySelectorAll('.move-chip')];
    const lr = list.getBoundingClientRect();
    return {
      exists: true,
      count: chips.length,
      expectedCount,
      overflow: getComputedStyle(list).overflow,
      allVisible: chips.every(chip => {
        const r = chip.getBoundingClientRect();
        return r.left >= lr.left - 1 && r.right <= lr.right + 1 && r.top >= lr.top - 1 && r.bottom <= lr.bottom + 1 && r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1;
      }),
      allTextVisible: chips.every(chip => chip.scrollWidth <= chip.clientWidth + 1 && chip.scrollHeight <= chip.clientHeight + 1),
      listFits: list.scrollWidth <= list.clientWidth + 1 && list.scrollHeight <= list.clientHeight + 1
    };
  }, { listSelector, expectedCount });
  assert(result.exists, `Move list ${listSelector} missing`);
  assert(result.count > 0, `Move list ${listSelector} is empty`);
  if (expectedCount !== null) assert(result.count === expectedCount, `Move count ${result.count} != ${expectedCount}`);
  assert(result.overflow === 'visible', `Move list overflow is ${result.overflow}`);
  assert(result.allVisible, 'Not all moves are visible in the viewport');
  assert(result.allTextVisible, 'Some move text is clipped');
  assert(result.listFits, 'Move list requires scrolling');
}

async function testCube(page) {
  await page.setViewportSize({ width: 402, height: 740 });
  await page.goto(`${BASE}?cube=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#chooseCube').click();
  await page.waitForURL(`${BASE}cube/`, { timeout: 15000 });
  assert((await page.title()) === 'Zauberwürfel-Löser', 'Cube title is wrong');
  assert(await page.locator('#choosePuzzleBtn').isVisible(), 'Cube return-to-chooser button missing');
  assert(await page.locator('iframe').count() === 0, 'Cube must not run in an iframe');

  await page.locator('#testsBtn').click();
  await page.locator('#fullTestBtn').click();
  await page.locator('#solveBtn').click();
  await page.locator('#solveView').waitFor({ state: 'visible', timeout: 30000 });
  const status = await page.locator('#statusText').innerText();
  assert(status.includes('Kurze Lösung gefunden'), `Cube solver failed: ${status}`);
  const total = await page.locator('#stepCount').evaluate(el => Number((el.textContent.match(/von\s+(\d+)/) || [])[1] || 0));
  assert(total > 5, `Unexpected Cube solution length ${total}`);
  await expectMoveListVisible(page, '#solutionList', total);

  await page.locator('#choosePuzzleBtn').click();
  await page.waitForURL(BASE, { timeout: 15000 });
  assert(await page.locator('#chooser').isVisible(), 'Chooser did not reopen from Cube');
}

async function testTetra(page) {
  await page.setViewportSize({ width: 402, height: 740 });
  await page.goto(`${BASE}?tetra=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#choosePyra').click();
  await page.locator('#pyraApp').waitFor({ state: 'visible' });
  await page.locator('#testsBtn').click();
  await page.locator('#fullTestBtn').click();
  await page.locator('#solveBtn').click();
  await page.locator('#solveView').waitFor({ state: 'visible', timeout: 30000 });
  const status = await page.locator('#statusText').innerText();
  assert(status.includes('Lösung verifiziert'), `Tetraeder solver failed: ${status}`);
  const testResult = await page.locator('#testResult').innerText();
  assert(testResult.includes('Großer Test bestanden'), `Tetraeder regression failed: ${testResult}`);
  const state = await page.evaluate(() => ({
    length: window.__PYRA_TEST__.state.solution.length,
    hasTip: window.__PYRA_TEST__.state.solution.some(m => m[0] === m[0].toLowerCase()),
    mapping: window.__PYRA_VISUAL_TEST__?.verifyVisualMapping()
  }));
  assert(state.length >= 10, `Tetraeder solution unexpectedly short: ${state.length}`);
  assert(state.hasTip, 'Tetraeder full test did not include an independent tip move');
  assert(state.mapping === true, 'Tetraeder solver/state/text/visual mapping verification failed');
  await expectMoveListVisible(page, '#solutionList', state.length);

  await page.goto(`${BASE}?invalid=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#choosePyra').click();
  await page.locator('#testsBtn').click();
  await page.locator('#invalidTestBtn').click();
  await page.locator('#solveBtn').click();
  const invalidStatus = await page.locator('#statusText').innerText();
  assert(invalidStatus.includes('physikalisch nicht erreichbar'), `Impossible Tetraeder state was not rejected: ${invalidStatus}`);
  assert(await page.locator('#solveView').isHidden(), 'Impossible Tetraeder state opened solve view');

  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto(`${BASE}?landscape=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#choosePyra').click();
  await page.locator('#testsBtn').click();
  await page.locator('#quickTestBtn').click();
  await page.locator('#solveBtn').click();
  await page.locator('#solveView').waitFor({ state: 'visible', timeout: 30000 });
  const fits = await page.evaluate(() => {
    const r = document.querySelector('#solveView').getBoundingClientRect();
    return document.documentElement.scrollWidth <= innerWidth + 2 && document.body.scrollWidth <= innerWidth + 2 && r.right <= innerWidth + 2 && r.bottom <= innerHeight + 2;
  });
  assert(fits, 'Tetraeder solve view does not fit iPhone landscape viewport');
}

async function testStaticAssets(context) {
  const manifest = await context.request.get(`${BASE}manifest.webmanifest?smoke=${Date.now()}`);
  assert(manifest.ok(), `Manifest request failed: ${manifest.status()}`);
  const sw = await context.request.get(`${BASE}sw.js?smoke=${Date.now()}`);
  assert(sw.ok(), `Service worker request failed: ${sw.status()}`);
  const swText = await sw.text();
  assert(swText.includes('rubik-puzzle-pwa-v6'), 'Combined-app service worker is not deployed');
  const worker = await context.request.get(`${BASE}cube/solver-worker.js?smoke=${Date.now()}`);
  assert(worker.ok(), `Cube worker request failed: ${worker.status()}`);
  const workerText = await worker.text();
  assert(workerText.includes('0ba83a6177d816f72af1a45c9015349da597456a'), 'Cube min2phase dependency is not pinned');
  assert(!workerText.includes('@master/min2phase.js'), 'Cube worker still references mutable min2phase @master');
}

for (const [name, browserType] of [['Chromium', chromium], ['WebKit', webkit]]) {
  const browser = await browserType.launch();
  const context = await browser.newContext({ viewport: { width: 402, height: 740 } });
  const page = await context.newPage();
  await waitForCombinedProduction(page);
  await testStaticAssets(context);
  await testCube(page);
  await testTetra(page);
  await browser.close();
  console.log(`${name} production smoke passed.`);
}

console.log('Post-deployment production smoke passed in Chromium and WebKit.');
