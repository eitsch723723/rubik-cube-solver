import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('playwright');

const BASE = process.env.PRODUCTION_BASE || 'https://eitsch723723.github.io/rubik-cube-solver/';
const BROWSERS = (process.env.SMOKE_BROWSERS || 'chromium,webkit').split(',').map(name => name.trim()).filter(Boolean);
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

async function resetRootState(page, suffix) {
  await page.goto(`${BASE}?reset=${suffix}-${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    const api = window.__PYRA_TEST__;
    api?.clearProgress?.();
    if (api?.state) {
      api.state.solution = [];
      api.state.states = [];
      api.state.step = 0;
      api.state.testMode = null;
    }
    const pyraApp = document.getElementById('pyraApp');
    const solveView = document.getElementById('solveView');
    const chooser = document.getElementById('chooser');
    if (pyraApp) pyraApp.hidden = true;
    if (solveView) solveView.hidden = true;
    if (chooser) chooser.hidden = false;
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert(await page.locator('#chooser').isVisible(), 'Chooser is not visible after state reset');
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

async function expectTetraInputFits(page) {
  const result = await page.evaluate(() => {
    const input = document.querySelector('#inputView');
    const panel = document.querySelector('.input-panel');
    const nav = document.querySelector('.nav-row');
    const triangle = document.querySelector('#triangleEditor');
    const bounds = [input, panel, nav, triangle].map(element => element.getBoundingClientRect());
    return {
      noPageScroll: document.documentElement.scrollWidth <= innerWidth + 2 && document.body.scrollWidth <= innerWidth + 2 && document.documentElement.scrollHeight <= innerHeight + 2 && document.body.scrollHeight <= innerHeight + 2,
      allVisible: bounds.every(rect => rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1),
      panelFits: panel.scrollHeight <= panel.clientHeight + 2,
      orientation: document.querySelector('#orientationText')?.textContent || '',
      topLabel: document.querySelector('#triangleTopLabel')?.textContent || '',
      bottomLabel: document.querySelector('#triangleBottomLabel')?.textContent || ''
    };
  });
  assert(result.noPageScroll, 'Tetraeder input page requires scrolling');
  assert(result.allVisible, 'A central Tetraeder input control is outside the viewport');
  assert(result.panelFits, 'Tetraeder input panel clips its content');
  assert(result.orientation.includes('hintere Ecke bleibt oben'), 'Unten orientation does not keep the rear corner at the top');
  assert(result.orientation.includes('Unten links liegt die frühere rechte V-Ecke'), 'Unten left endpoint is not identified');
  assert(result.orientation.includes('unten rechts die frühere linke V-Ecke'), 'Unten right endpoint is not identified');
  assert(result.topLabel === 'Hintere Ecke', 'Unten top orientation label is missing');
  assert(result.bottomLabel.includes('links: frühere V-Ecke rechts'), 'Unten front-edge handedness label is missing');
}

async function testCube(page) {
  await page.setViewportSize({ width: 402, height: 740 });
  await resetRootState(page, 'cube');
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
  await page.setViewportSize({ width: 1180, height: 820 });
  await resetRootState(page, 'tetra-input-ipad-landscape');
  await page.locator('#choosePyra').click();
  await page.locator('#pyraApp').waitFor({ state: 'visible' });
  await page.locator('.face-tab').nth(3).click();
  await expectTetraInputFits(page);

  const physicalInput = await page.evaluate(() => {
    const api = window.__PYRA_TEST__;
    // Literal observations from a real puzzle in visible TRIANGLES order.
    const visibleFaces = ['ggbggrggr','yyyyybyyb','rrbyrbryb','ggrbbrgbr'];
    const expectedState = 'gggbgggrryyyyyyybbrrrbyyrbbgggrbbbrr';
    const paletteIndex = { g: 0, r: 1, b: 2, y: 3 };
    for (let face = 0; face < 4; face++) {
      document.querySelectorAll('.face-tab')[face].click();
      const displayCodes = visibleFaces[face];
      for (const code of Object.keys(paletteIndex)) {
        document.querySelectorAll('.palette-btn')[paletteIndex[code]].click();
        for (let inputIndex = 0; inputIndex < 9; inputIndex++) {
          if (displayCodes[inputIndex] === code) document.querySelectorAll('.tri-cell')[inputIndex].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      }
    }
    return { expectedState, enteredState: api.toStringState() };
  });
  assert(physicalInput.enteredState === physicalInput.expectedState, 'Real visible Tetraeder input is mapped to the wrong solver positions');
  await page.locator('#solveBtn').click();
  await page.locator('#solveView').waitFor({ state: 'visible', timeout: 30000 });
  assert((await page.locator('#statusText').innerText()).includes('Lösung verifiziert'), 'Physically reachable visible input was rejected');
  const physicalVerified = await page.evaluate(() => { const api = window.__PYRA_TEST__; return api.Core.verifySolution(api.state.states[0], api.state.solution); });
  assert(physicalVerified, 'Real physical fixture solution did not verify');

  await page.setViewportSize({ width: 402, height: 740 });
  await resetRootState(page, 'tetra-full');
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

  await resetRootState(page, 'tetra-invalid');
  await page.locator('#choosePyra').click();
  await page.locator('#testsBtn').click();
  await page.locator('#invalidTestBtn').click();
  await page.locator('#solveBtn').click();
  await page.waitForFunction(() => {
    const status = document.querySelector('#statusText')?.textContent || '';
    const testResult = document.querySelector('#testResult')?.textContent || '';
    return status.includes('physikalisch nicht erreichbar') && testResult.includes('Fehlertest bestanden');
  }, null, { timeout: 30000 });
  const invalidStatus = await page.locator('#statusText').innerText();
  const invalidResult = await page.locator('#testResult').innerText();
  assert(invalidStatus.includes('physikalisch nicht erreichbar'), `Impossible Tetraeder state was not rejected: ${invalidStatus}`);
  assert(invalidResult.includes('Fehlertest bestanden'), `Impossible-state regression did not pass: ${invalidResult}`);
  assert(await page.locator('#solveView').isHidden(), 'Impossible Tetraeder state opened solve view');

  await page.setViewportSize({ width: 844, height: 390 });
  await resetRootState(page, 'tetra-landscape');
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
  assert(swText.includes('rubik-puzzle-pwa-v9'), 'Combined-app service worker is not deployed');
  const worker = await context.request.get(`${BASE}cube/solver-worker.js?smoke=${Date.now()}`);
  assert(worker.ok(), `Cube worker request failed: ${worker.status()}`);
  const workerText = await worker.text();
  assert(workerText.includes('0ba83a6177d816f72af1a45c9015349da597456a'), 'Cube min2phase dependency is not pinned');
  assert(!workerText.includes('@master/min2phase.js'), 'Cube worker still references mutable min2phase @master');
}

const browserTypes = { chromium: ['Chromium', chromium], webkit: ['WebKit', webkit] };
const passedBrowsers = [];
for (const browserName of BROWSERS) {
  const selected = browserTypes[browserName];
  if (!selected) throw new Error(`Unknown smoke-test browser: ${browserName}`);
  const [name, browserType] = selected;
  const launchOptions = browserName === 'chromium' && process.env.CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : {};
  const browser = await browserType.launch(launchOptions);
  const context = await browser.newContext({ viewport: { width: 402, height: 740 } });
  const page = await context.newPage();
  await waitForCombinedProduction(page);
  await testStaticAssets(context);
  await testCube(page);
  await testTetra(page);
  await browser.close();
  passedBrowsers.push(name);
  console.log(`${name} production smoke passed.`);
}

console.log(`Post-deployment production smoke passed in ${passedBrowsers.join(' and ')}.`);
