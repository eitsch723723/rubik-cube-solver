const {test,expect}=require('@playwright/test');

async function openPyra(page){
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#chooser')).toBeVisible();
  await expect(page.locator('#choosePyra')).toBeVisible();
  await page.locator('#choosePyra').click();
  await expect(page.locator('#chooser')).toBeHidden();
  await expect(page.locator('#pyraApp')).toBeVisible();
  await expect(page.locator('#testsBtn')).toBeVisible();
}
async function loadPyraTest(page,button){
  await openPyra(page);
  await page.locator('#testsBtn').click();
  await expect(page.locator('#testDrawer')).toBeVisible();
  await page.locator(button).click();
  await expect(page.locator('#solveBtn')).toBeVisible();
}
const INPUT_TO_SOLVER=[
  [0,1,3,4,6,7,2,5,8],
  [0,1,3,4,6,8,2,5,7],
  [0,1,3,5,6,8,2,4,7],
  [0,3,1,8,6,5,2,7,4]
];
const PALETTE_INDEX={g:0,r:1,b:2,y:3};
async function enterPhysicalTetraState(page,solverState){
  for(let face=0;face<4;face++){
    await page.locator('.face-tab').nth(face).click();
    const displayCodes=INPUT_TO_SOLVER[face].map(solverIndex=>solverState[face*9+solverIndex]);
    for(const code of Object.keys(PALETTE_INDEX)){
      await page.locator('.palette-btn').nth(PALETTE_INDEX[code]).click();
      for(let inputIndex=0;inputIndex<9;inputIndex++)if(displayCodes[inputIndex]===code){
        await page.locator('.tri-cell').nth(inputIndex).click({force:true});
      }
    }
  }
}
async function expectSolveFitsViewport(page){
  await expect(page.locator('#solveView')).toBeVisible();
  const fit=await page.evaluate(()=>{
    const r=document.querySelector('#solveView').getBoundingClientRect();
    return document.documentElement.scrollWidth<=window.innerWidth+2&&document.body.scrollWidth<=window.innerWidth+2&&document.documentElement.scrollHeight<=window.innerHeight+2&&document.body.scrollHeight<=window.innerHeight+2&&r.right<=window.innerWidth+2&&r.bottom<=window.innerHeight+2;
  });
  expect(fit).toBe(true);
}
async function expectInputFitsViewport(page){
  await expect(page.locator('#inputView')).toBeVisible();
  const fit=await page.evaluate(()=>{
    const selectors=['header','.status','.face-tabs','.input-panel','.help-panel','.palette','.counts','.nav-row'];
    const elements=selectors.map(s=>document.querySelector(s)).filter(e=>e&&getComputedStyle(e).display!=='none');
    const bounds=elements.map(e=>e.getBoundingClientRect());
    const panel=document.querySelector('.input-panel');
    const tri=document.querySelector('#triangleEditor')?.getBoundingClientRect();
    const noPageOverflow=document.documentElement.scrollWidth<=window.innerWidth+2&&document.body.scrollWidth<=window.innerWidth+2&&document.documentElement.scrollHeight<=window.innerHeight+2&&document.body.scrollHeight<=window.innerHeight+2;
    const allVisible=bounds.every(r=>r.left>=-1&&r.right<=window.innerWidth+1&&r.top>=-1&&r.bottom<=window.innerHeight+1);
    return noPageOverflow&&allVisible&&panel.scrollHeight<=panel.clientHeight+2&&tri&&tri.height>=170&&tri.bottom<=window.innerHeight+1;
  });
  expect(fit).toBe(true);
}
async function expectAllSolutionMovesVisibleAndAnimationContained(page){
  const result=await page.evaluate(()=>{
    const list=document.querySelector('#solutionList');
    const chips=[...list.querySelectorAll('.move-chip')];
    const instruction=document.querySelector('.instruction-panel');
    const visual=document.querySelector('.visual-panel');
    const direction=document.querySelector('#directionCard');
    const frame=document.querySelector('.solve-preview-frame');
    const preview=document.querySelector('#solvePreview');
    const replay=document.querySelector('#replayBtn');
    const lr=list.getBoundingClientRect(),ir=instruction.getBoundingClientRect(),dr=direction.getBoundingClientRect(),fr=frame.getBoundingClientRect(),rr=replay.getBoundingClientRect();
    const allChipsVisible=chips.every(chip=>{const r=chip.getBoundingClientRect();return r.left>=lr.left-1&&r.right<=lr.right+1&&r.top>=lr.top-1&&r.bottom<=lr.bottom+1&&r.bottom<=ir.bottom+1;});
    const allChipTextVisible=chips.every(chip=>chip.scrollWidth<=chip.clientWidth+1&&chip.scrollHeight<=chip.clientHeight+1);
    const previewStyle=getComputedStyle(preview),frameStyle=getComputedStyle(frame),visualStyle=getComputedStyle(visual);
    return {
      count:chips.length,
      solutionLength:window.__PYRA_TEST__.state.solution.length,
      allChipsVisible,
      allChipTextVisible,
      listFits:list.scrollWidth<=list.clientWidth+1&&list.scrollHeight<=list.clientHeight+1,
      instructionFits:instruction.scrollHeight<=instruction.clientHeight+2,
      previewOverflow:previewStyle.overflow,
      frameOverflow:frameStyle.overflow,
      visualOverflow:visualStyle.overflow,
      previewPaintContained:previewStyle.contain.includes('paint'),
      framePaintContained:frameStyle.contain.includes('paint'),
      animationClearOfDirection:fr.top>=dr.bottom-2,
      animationClearOfReplay:fr.bottom<=rr.top+2,
      frameHasUsableHeight:fr.height>=60
    };
  });
  expect(result.count).toBe(result.solutionLength);
  expect(result.allChipsVisible).toBe(true);
  expect(result.allChipTextVisible).toBe(true);
  expect(result.listFits).toBe(true);
  expect(result.instructionFits).toBe(true);
  expect(result.previewOverflow).toBe('hidden');
  expect(result.frameOverflow).toBe('hidden');
  expect(result.visualOverflow).toBe('hidden');
  expect(result.previewPaintContained).toBe(true);
  expect(result.framePaintContained).toBe(true);
  expect(result.animationClearOfDirection).toBe(true);
  expect(result.animationClearOfReplay).toBe(true);
  expect(result.frameHasUsableHeight).toBe(true);
  return result;
}

test('Puzzle selection opens deterministic local Cube and returns to chooser',async({page})=>{
  await page.goto('/');
  await expect(page).toHaveTitle('Zauberpuzzle-Löser');
  await expect(page.locator('.test-banner')).toHaveCount(0);
  expect(await page.locator('body').innerText()).not.toContain('TESTVERSION');
  await expect(page.locator('#chooser')).toBeVisible();
  await expect(page.locator('#pyraApp')).toBeHidden();
  await page.click('#chooseCube');
  await expect(page).toHaveURL(/\/cube\/$/);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('#choosePuzzleBtn')).toBeVisible();
  await page.click('#testsBtn');await page.click('#quickTestBtn');await page.click('#solveBtn');
  await expect(page.locator('#solveView')).toBeVisible();
  await expect(page.locator('#moveTitle')).toContainText('R');
  await page.click('#choosePuzzleBtn');await expect(page).toHaveURL(/\/$/);await expect(page.locator('#chooser')).toBeVisible();
});

test('Tetraeder quick test solves completely, maps animation exactly and keeps permanent orientation markers',async({page})=>{
  await loadPyraTest(page,'#quickTestBtn');await page.locator('#solveBtn').click();
  await expect(page.locator('#solveView')).toBeVisible();await expect(page.locator('#statusText')).toContainText('Lösung verifiziert');
  const mapping=await page.evaluate(()=>window.__PYRA_VISUAL_TEST__?.verifyVisualMapping());expect(mapping).toBe(true);
  await expect(page.locator('.mini-face-label strong')).toHaveText(['V','L','R','U']);
  await expect(page.locator('.orientation-marker text')).toHaveText(['V','L','R','U']);
  const points=()=>page.locator('#solvePreview').evaluate(svg=>[...svg.querySelectorAll('polygon')].map(p=>p.getAttribute('points')).join('|'));
  const before=await points(),statsBefore=await page.evaluate(()=>window.__PYRA_VISUAL_TEST__.stats());await page.waitForTimeout(350);const after=await points(),statsAfter=await page.evaluate(()=>window.__PYRA_VISUAL_TEST__.stats());
  expect(after).not.toBe(before);expect(statsAfter.sceneBuilds).toBe(statsBefore.sceneBuilds);expect(statsAfter.movingPointUpdates).toBeGreaterThan(statsBefore.movingPointUpdates);expect(statsAfter.polygonCount).toBe(36);
  await expectSolveFitsViewport(page);
});

test('Tetraeder full test includes independent tip moves and verifies final state',async({page})=>{
  await loadPyraTest(page,'#fullTestBtn');await page.locator('#solveBtn').click();
  await expect(page.locator('#solveView')).toBeVisible();await expect(page.locator('#testResult')).toContainText('Großer Test bestanden');
  const hasTip=await page.evaluate(()=>window.__PYRA_TEST__.state.solution.some(m=>m[0]===m[0].toLowerCase()));expect(hasTip).toBe(true);
  const verified=await page.evaluate(()=>{const a=window.__PYRA_TEST__;const s=a.state.states[0];return a.Core.verifySolution(s,a.state.solution);});expect(verified).toBe(true);
});

test('Tetraeder impossible state is rejected',async({page})=>{
  await loadPyraTest(page,'#invalidTestBtn');await page.locator('#solveBtn').click();
  await expect(page.locator('#statusText')).toContainText('physikalisch nicht erreichbar');await expect(page.locator('#solveView')).toBeHidden();
  await expect(page.locator('#testResult')).toContainText('Fehlertest bestanden');
});

test('Reachable Tetraeder entered through all visible triangles is mapped and solved correctly',async({page})=>{
  await openPyra(page);
  const solverState=await page.evaluate(()=>{
    const moves=['U','R',"L'",'B',"U'",'L',"R'",'B','u',"r'",'l','b'];
    return moves.reduce((value,move)=>window.__PYRA_TEST__.Core.applyMove(value,move),window.__PYRA_TEST__.Core.SOLVED);
  });
  await enterPhysicalTetraState(page,solverState);
  expect(await page.evaluate(()=>window.__PYRA_TEST__.toStringState())).toBe(solverState);
  await page.locator('#solveBtn').click();
  await expect(page.locator('#solveView')).toBeVisible();
  await expect(page.locator('#statusText')).toContainText('Lösung verifiziert');
  expect(await page.evaluate(()=>{
    const api=window.__PYRA_TEST__;
    return api.state.states[0]===api.toStringState()&&api.Core.verifySolution(api.state.states[0],api.state.solution);
  })).toBe(true);
});

test('Reduced motion disables continuous Tetraeder turn animation',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await loadPyraTest(page,'#quickTestBtn');await page.locator('#solveBtn').click();await expect(page.locator('#solveView')).toBeVisible();
  const before=await page.locator('#solvePreview').evaluate(svg=>[...svg.querySelectorAll('polygon')].map(p=>p.getAttribute('points')).join('|'));await page.waitForTimeout(450);const after=await page.locator('#solvePreview').evaluate(svg=>[...svg.querySelectorAll('polygon')].map(p=>p.getAttribute('points')).join('|'));
  expect(after).toBe(before);expect(await page.evaluate(()=>window.__PYRA_VISUAL_TEST__.isReducedMotion())).toBe(true);expect(await page.evaluate(()=>window.__PYRA_VISUAL_TEST__.isAnimating())).toBe(false);
});

test('Tetraeder animation pauses while hidden and resumes when visible',async({page})=>{
  await loadPyraTest(page,'#quickTestBtn');await page.locator('#solveBtn').click();await expect(page.locator('#solveView')).toBeVisible();await page.waitForTimeout(100);
  expect(await page.evaluate(()=>window.__PYRA_VISUAL_TEST__.isAnimating())).toBe(true);await page.evaluate(()=>window.__PYRA_VISUAL_TEST__.syncVisibility(true));expect(await page.evaluate(()=>window.__PYRA_VISUAL_TEST__.isAnimating())).toBe(false);await page.evaluate(()=>window.__PYRA_VISUAL_TEST__.syncVisibility(false));await page.waitForTimeout(50);expect(await page.evaluate(()=>window.__PYRA_VISUAL_TEST__.isAnimating())).toBe(true);
});

test('Tetraeder solution progress survives reload',async({page})=>{
  await loadPyraTest(page,'#quickTestBtn');await page.locator('#solveBtn').click();await expect(page.locator('#solveView')).toBeVisible();await page.locator('#nextStep').click();await expect(page.locator('#stepCount')).toContainText('Zug 2 von 4');
  await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#pyraApp')).toBeVisible();await expect(page.locator('#solveView')).toBeVisible();await expect(page.locator('#stepCount')).toContainText('Zug 2 von 4');expect(await page.evaluate(()=>window.__PYRA_TEST__.state.step)).toBe(1);
});

test('Cube min2phase dependency is immutable in generated Pages site',async({request})=>{
  const pin='0ba83a6177d816f72af1a45c9015349da597456a';const app=await request.get('/cube/app.js');expect(app.ok()).toBe(true);const appText=await app.text();expect(appText).toContain(pin);expect(appText).not.toContain('@master/min2phase.js');
  const worker=await request.get('/cube/solver-worker.js');expect(worker.ok()).toBe(true);const workerText=await worker.text();expect(workerText).toContain(pin);expect(workerText).not.toContain('@master/min2phase.js');
  const nestedSw=await request.get('/cube/sw.js');expect(nestedSw.ok()).toBe(true);const nestedText=await nestedSw.text();expect(nestedText).toContain(pin);expect(nestedText).not.toContain('@master/min2phase.js');
  const rootSw=await request.get('/sw.js');expect(rootSw.ok()).toBe(true);const rootText=await rootSw.text();expect(rootText).toContain(pin);expect(rootText).not.toContain('@master/min2phase.js');
});

test('Tetraeder input fits phone, iPad landscape and laptop without scrolling',async({page})=>{
  for(const viewport of [{width:402,height:740},{width:1180,height:820},{width:1280,height:720},{width:1440,height:900}]){
    await page.setViewportSize(viewport);
    await page.addInitScript(()=>localStorage.clear());
    await loadPyraTest(page,'#quickTestBtn');
    await expect(page.locator('body')).toHaveClass(/editing-pyra/);
    await page.locator('.face-tab').nth(3).click();
    await expect(page.locator('#faceTitle')).toContainText('Unten');
    await expectInputFitsViewport(page);
    await page.locator('#backHome').click();
  }
});

test('Unten orientation keeps the triangle upright and explains the former front edge',async({page})=>{
  await page.setViewportSize({width:1180,height:820});
  await openPyra(page);
  await page.locator('.face-tab').nth(3).click();
  await expect(page.locator('#orientationText')).toContainText('Dreieck bleibt mit der Spitze nach oben');
  await expect(page.locator('#triangleTopLabel')).toHaveText('Hintere Ecke');
  await expect(page.locator('#triangleBottomLabel')).toContainText('Frühere Vorderkante');
  await expect(page.locator('#holdHelp')).toContainText('steht nicht auf der Spitze');
  await expect(page.locator('#holdPreview text')).toContainText(['U','Hintere Ecke','Frühere Vorderkante · bei dir']);
  const orientation=await page.evaluate(()=>({
    face:document.querySelector('#triangleEditorWrap').dataset.face,
    transform:getComputedStyle(document.querySelector('#triangleEditor')).transform,
    apexY:Number(document.querySelector('#triangleEditor .tri-cell').getAttribute('points').split(/[ ,]/)[1])
  }));
  expect(orientation).toEqual({face:'U',transform:'none',apexY:0});
});

test('Tetraeder solve animation stays inside its panel and all solution moves remain visible on iPhone portrait',async({page})=>{
  await page.setViewportSize({width:402,height:740});
  await loadPyraTest(page,'#fullTestBtn');await page.locator('#solveBtn').click();
  await expect(page.locator('#solveView')).toBeVisible();await expect(page.locator('#statusText')).toContainText('Lösung verifiziert');
  await expectSolveFitsViewport(page);
  const full=await expectAllSolutionMovesVisibleAndAnimationContained(page);expect(full.count).toBeGreaterThanOrEqual(10);
  await page.evaluate(()=>{
    const a=window.__PYRA_TEST__,moves=['U','R','L','B','u','r','l','b',"U'","R'","L'","B'","u'","r'","l'"];
    a.state.solution=moves;a.state.states=a.Core.buildStates(a.Core.SOLVED,moves);a.state.step=0;window.renderSolution();
  });
  const maximum=await expectAllSolutionMovesVisibleAndAnimationContained(page);expect(maximum.count).toBe(15);
});

test('Tetraeder solve view fits iPhone landscape without page scrolling',async({page})=>{
  await page.setViewportSize({width:844,height:390});await loadPyraTest(page,'#quickTestBtn');await page.locator('#solveBtn').click();await expectSolveFitsViewport(page);
});

test('Tetraeder solve view fits iPad portrait and landscape',async({page})=>{
  await page.addInitScript(()=>localStorage.removeItem('rubik-pyra-progress-v1'));
  for(const viewport of [{width:820,height:1180},{width:1180,height:820}]){
    await page.setViewportSize(viewport);await loadPyraTest(page,'#quickTestBtn');await page.locator('#solveBtn').click();await expectSolveFitsViewport(page);
  }
});
