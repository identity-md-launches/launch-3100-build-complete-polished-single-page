import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createECDH,randomBytes} from 'node:crypto';

// Browser verification only. Runtime has zero dependencies. No test hooks ship in dist/.
const playwright=await import(pathToFileURL(process.argv[2] || process.env.IMD_PLAYWRIGHT || '/opt/imd-tools/playwright-mcp/node_modules/playwright/index.mjs').href);
const out='test/scratch/interaction';await mkdir(out,{recursive:true});
const html=await readFile('dist/index.html');
const social=await readFile('dist/social-card.svg');
const server=createServer((req,res)=>{
  if(req.url==='/preview/'||req.url==='/preview/index.html'){res.setHeader('Content-Type','text/html');res.end(html);}
  else if(req.url==='/preview/social-card.svg'){res.setHeader('Content-Type','image/svg+xml');res.end(social);}
  else {res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/preview/`;
const browser=await playwright.chromium.launch({headless:true});
const N=0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const mod=(x,m=N)=>(x%m+m)%m;
function inverse(x){let a=mod(x),b=N,u=1n,v=0n;while(b){const q=a/b;[a,b]=[b,a-q*b];[u,v]=[v,u-q*v];}return mod(u);}
function keyPair(){const e=createECDH('secp256k1');e.generateKeys();return {secret:BigInt('0x'+e.getPrivateKey().toString('hex')),public:e.getPublicKey(null,'uncompressed').subarray(1).toString('hex')};}
const keys=[keyPair(),keyPair()];
let checks=0;const findings=[],contexts=[];
function ok(value,label){assert.ok(value,label);checks++;}
function equal(actual,expected,label){assert.equal(actual,expected,label);checks++;}
const ev=(page,code)=>page.evaluate(code=>eval(code),code);
const idle=page=>page.waitForFunction(()=>eval('!wallet.pending && !wallet.connecting'));
async function createApp({provider=false,blocked=false,audioBlocked=false,throwProvider=false,discovery=false,width=1440}={}){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,acceptDownloads:true});contexts.push(context);
  const page=await context.newPage();page.setDefaultTimeout(8000);
  page.on('pageerror',e=>findings.push(e.message));
  page.on('console',m=>{if(m.type()==='error')findings.push(m.text());});
  page.on('requestfailed',r=>findings.push(r.url()+': '+r.failure()?.errorText));
  await page.exposeFunction('__testSign',async(hex,address)=>{
    const index=keys.findIndex(k=>k.address===address),key=keys[index];if(!key)throw Error('Unknown test account');
    const message=Buffer.from(hex.slice(2),'hex').toString('utf8');
    const digest=await ev(page,`bytesHex(personalHash(${JSON.stringify(message)}))`),e=BigInt('0x'+digest);
    const nonce=mod(BigInt('0x'+randomBytes(32).toString('hex')),N-1n)+1n;
    const curve=createECDH('secp256k1');curve.setPrivateKey(Buffer.from(nonce.toString(16).padStart(64,'0'),'hex'));
    const point=curve.getPublicKey(null,'uncompressed'),x=BigInt('0x'+point.subarray(1,33).toString('hex')),r=mod(x),s=mod(inverse(nonce)*(e+r*key.secret)),v=27+(point[64]&1)+(x>=N?2:0);
    return '0x'+r.toString(16).padStart(64,'0')+s.toString(16).padStart(64,'0')+v.toString(16).padStart(2,'0');
  });
  await page.addInitScript(({provider,blocked,audioBlocked,throwProvider,discovery,addresses})=>{
    const listeners=new Map();
    const m={accounts:[addresses[0]],authorized:false,chain:'0x1',reject:false,locked:false,signMode:'ok',switchMissing:false,readFail:false,calls:[],active:0,maxActive:0,release:null,
      async request(request){
        m.calls.push(request);m.active++;m.maxActive=Math.max(m.maxActive,m.active);
        try{
          if(request.method==='eth_accounts'){try{m.authorized=localStorage.getItem('test:authorized')==='true';}catch{}return m.authorized?m.accounts:[];}
          if(request.method==='eth_requestAccounts'){
            if(m.reject)throw Object.assign(Error('Rejected'),{code:typeof m.reject==='number'?m.reject:4001});if(m.locked)return[];
            m.authorized=true;try{localStorage.setItem('test:authorized','true');}catch{}return m.accounts;
          }
          if(request.method==='eth_chainId'){if(m.readFail)throw Error('Read unavailable');return m.chain;}
          if(request.method==='eth_getBalance'){if(m.readFail)throw Error('Read unavailable');const value=m.balanceString||'0xde0b6b3a7640000';if(m.balancePending)await new Promise(resolve=>m.releaseBalance=resolve);return value;}
          if(request.method==='personal_sign'){
            if(m.signMode==='reject')throw Object.assign(Error('Declined'),{code:4001});
            if(m.signMode==='pending')await new Promise(resolve=>m.release=resolve);
            if(m.signMode==='invalid')return '0x'+'00'.repeat(65);
            return await window.__testSign(request.params[0],request.params[1]);
          }
          if(request.method==='wallet_switchEthereumChain'){if(m.switchMissing)throw Object.assign(Error('Unknown chain'),{code:4902});m.chain=request.params[0].chainId;m.emit('chainChanged',m.chain);return null;}
          if(request.method==='wallet_addEthereumChain'){m.chain=request.params[0].chainId;m.emit('chainChanged',m.chain);return null;}
          throw Error('Unexpected method '+request.method);
        } finally{m.active--;}
      },on(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},removeListener(name,fn){listeners.get(name)?.delete(fn);},emit(name,value){for(const fn of [...(listeners.get(name)||[])])fn(value);},isMetaMask:true,
    };
    window.__mock=m;
    if(blocked)Object.defineProperty(window,'localStorage',{get(){throw Error('Storage blocked for test');}});
    if(audioBlocked){Object.defineProperty(window,'AudioContext',{get(){throw Error('Audio unavailable for test');}});Object.defineProperty(window,'webkitAudioContext',{get(){throw Error('Audio unavailable for test');}});}
    if(throwProvider)Object.defineProperty(window,'ethereum',{get(){throw Error('Injection blocked for test');}});
    else if(provider)window.ethereum=m;
    if(discovery){addEventListener('eip6963:requestProvider',()=>{for(const name of ['MetaMask','Rabby','Coinbase Wallet','OKX Wallet','Trust Wallet'])dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{name,uuid:name,rdns:name.toLowerCase()},provider:{request:m.request.bind(m),on:m.on,removeListener:m.removeListener}}}));});}
  },{provider,blocked,audioBlocked,throwProvider,discovery,addresses:keys.map(k=>k.address||'0x'+'1'.repeat(40))});
  await page.goto(url);await page.waitForFunction(()=>typeof eval('isPlaying')==='function');
  return page;
}
async function connect(page){await page.locator('#wallet-button').click();await page.locator('[data-wallet-index="0"]').click();await page.waitForFunction(()=>eval('isPlaying()'));await idle(page);}
try{
  // Hash vectors plus independent Node secp256k1 public keys and ephemeral signers.
  const browse=await createApp({width:390});
  equal(await ev(browse,"bytesHex(keccak256(new Uint8Array()))"),'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470','Keccak empty vector');
  equal(await ev(browse,"bytesHex(keccak256(new TextEncoder().encode('abc')))"),'4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45','Keccak abc vector');
  for(const key of keys)key.address=await ev(browse,`'0x'+bytesHex(keccak256(Uint8Array.from('${key.public}'.match(/.{2}/g),b=>parseInt(b,16)))).slice(-40)`);
  ok(await browse.locator('#start-overlay').isVisible(),'No wallet: overlay visible');
  equal(await ev(browse,'state.totalSqueeks'),0,'No wallet: no passive earnings');
  await browse.keyboard.press('Space');ok(await browse.locator('#dialog').isVisible(),'Space opens connect modal');
  await browse.waitForFunction(()=>eval('discoveryFinished'));
  equal(await browse.locator('#wallet-list a').count(),8,'Five install and three supported phone links');
  await browse.keyboard.press('Escape');
  for(const tab of ['shop','quests','badges','claims','leaderboard','collection','cosmetics','spin','stats','profile']){
    await browse.locator(`#tab-${tab}`).click();ok((await browse.locator('#panel-content').innerText()).length>80,`Browse ${tab} has real content`);
  }
  await ev(browse,"openTab('shop')");await browse.locator('[data-buy="bearings"]').click({force:true});ok(await browse.locator('#dialog').isVisible(),'Locked buy opens connect modal');await browse.keyboard.press('Escape');
  equal(await ev(browse,'state.totalSqueeks'),0,'Browse interactions never earn');
  ok(await browse.locator('#checkin').getAttribute('title')==='Connect your wallet to play','Locked actions explain sign-in');
  for(const action of ['help','faq','settings']){await ev(browse,action+'()');ok(await browse.locator('#dialog').isVisible(),`Browse ${action} available`);await browse.keyboard.press('Escape');}
  await browse.evaluate(()=>scrollTo(0,0));await browse.screenshot({path:out+'/browse-390.png'});
  console.log('Browse and read-only checks passed');
  const app=await createApp({provider:true});await idle(app);
  await app.locator('#wallet-button').click();await app.evaluate(()=>window.__mock.reject=true);
  await app.locator('[data-wallet-index="0"]').click();await idle(app);ok((await app.locator('#wallet-status').innerText()).includes('declined'),'Connect rejection is calm');
  await app.evaluate(()=>{window.__mock.reject=false;window.__mock.locked=true;});await app.locator('[data-wallet-index="0"]').click();await idle(app);ok((await app.locator('#wallet-status').innerText()).includes('locked'),'Locked wallet message');
  await app.evaluate(()=>{window.__mock.locked=false;window.__mock.signMode='reject';});await app.locator('[data-wallet-index="0"]').click();await idle(app);equal(await ev(app,'isPlaying()'),false,'Rejected signature keeps play locked');
  await app.evaluate(()=>window.__mock.signMode='invalid');await app.locator('#sign-in-button').click();await idle(app);equal(await ev(app,'isPlaying()'),false,'Invalid signature rejected');
  await app.evaluate(()=>window.__mock.signMode='ok');await app.locator('#sign-in-button').click();await app.waitForFunction(()=>eval('isPlaying()'));await idle(app);
  equal(await ev(app,'wallet.address'),keys[0].address,'Connected profile keyed by address');ok(await app.locator('#start-overlay').isHidden(),'Sign-in starts mining');
  const signRequest=await app.evaluate(()=>window.__mock.calls.find(r=>r.method==='personal_sign'));
  const message=Buffer.from(signRequest.params[0].slice(2),'hex').toString();ok(message.startsWith('Sign in to SqueekWheel\n')&&message.includes('Nonce: ')&&message.includes('Time: '),'Readable sign-in contains nonce and timestamp');
  console.log('Connect, rejection, locked wallet and signature checks passed');
  await ev(app,"startEvent('cat')");ok(await ev(app,'sps()<baseSps()'),'Cat event slows mining');await app.locator('#laser').click();equal(await ev(app,'state.catScares'),1,'Laser removes the cat');await ev(app,"startEvent('surge')");equal(await ev(app,'sps()'),await ev(app,'baseSps()*2'),'Power Surge retains double speed');await ev(app,"activeEvent=null;startEvent('golden')");ok(await ev(app,'state.totalSqueeks>=60'),'Golden seed event rewards squeeks');await ev(app,"startEvent('lucky')");equal(await ev(app,'state.chain[state.chain.length-1].rarity'),'Epic','Lucky Block event awards Epic block');
  await app.locator('#tap-wheel').click();ok(await ev(app,'state.taps')===1,'Wheel tap works');
  await app.locator('#main').focus();await app.keyboard.press('Space');equal(await ev(app,'state.boosts'),1,'Space triggers Turbo');
  await ev(app,'turboUntil=0;state.heat=90');await app.locator('#turbo').click();ok(await ev(app,'state.jamUntil>Date.now()'),'Turbo overheats at 100%');
  await app.locator('#fan').click();ok(await ev(app,'state.heat<70&&state.jamUntil>Date.now()'),'Fan cools but does not bypass five-second jam');
  await ev(app,'state.jamUntil=Date.now()-1;updateHeat(0)');equal(await ev(app,'state.jamUntil'),0,'Jam ends cleanly');
  await ev(app,"state.squeeks=10000;openTab('shop');renderAll()");const cost=await ev(app,'price(UPGRADES[0])');equal(cost,45,'Early upgrade price is three times harder');
  await app.locator('[data-buy="bearings"]').click();equal(await ev(app,'state.owned.bearings'),1,'Upgrade purchase works');
  ok(await ev(app,'price(UPGRADES[0])')>cost,'Upgrade cost scales upward');
  await ev(app,"buyMode='10';renderPanel()");await app.locator('[data-buy="bearings"]').click();equal(await ev(app,'state.owned.bearings'),11,'Buy ten works');
  await ev(app,'earn(difficulty());evaluateProgress();renderAll()');ok(await ev(app,'state.blocks>0&&difficulty()>240'),'Blocks raise difficulty');
  await ev(app,"openTab('badges')");await app.evaluate(()=>window.__mock.signMode='reject');await app.locator('[data-badge-claim="first"]').click();await idle(app);equal(await ev(app,'!!state.badgeReceipts.first'),false,'Rejected badge claim stores no receipt');await app.evaluate(()=>window.__mock.signMode='ok');await app.locator('[data-badge-claim="first"]').click();await idle(app);ok(await ev(app,'!!state.badgeReceipts.first'),'Badge claim stores receipt');
  equal(await ev(app,'recoverPersonalSigner(state.badgeReceipts.first.message,state.badgeReceipts.first.signature)'),keys[0].address,'Receipt recovers to active address');
  await ev(app,"openTab('claims')");ok((await app.locator('#panel-content').innerText()).includes('Claimed'),'Claimed date displayed');
  await app.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,get(){throw Error('Clipboard blocked for test');}}));await app.locator('[data-receipt-copy="first"]').click();await app.waitForSelector('#copy-fallback');ok((await app.locator('#copy-fallback').inputValue()).includes('SqueekWheel badge claim'),'Receipt copy has a usable clipboard fallback');await app.keyboard.press('Escape');
  const beforeAll=await app.evaluate(()=>window.__mock.calls.filter(r=>r.method==='personal_sign').length);await app.locator('[data-action="claim-all"]').click();await idle(app);equal(await app.evaluate(()=>window.__mock.calls.filter(r=>r.method==='personal_sign').length),beforeAll+1,'Claim all uses one signature');
  const claimed=await ev(app,'Object.keys(state.badgeReceipts).length');await ev(app,'claimBadges(BADGES.map(b=>b.id))');equal(await ev(app,'Object.keys(state.badgeReceipts).length'),claimed,'Duplicate claims do nothing');
  await ev(app,"addSP(1000);openTab('cosmetics')");const earnedBefore=await ev(app,'state.earnedSP');await app.locator('[data-cosmetic="top"]').click();equal(await ev(app,'state.hat'),'top','SP cosmetic bought and equipped');equal(await ev(app,'state.earnedSP'),earnedBefore,'Cosmetics preserve lifetime SP');ok(await app.locator('#hamster-hat').getAttribute('hidden')===null,'Hat visible');
  await ev(app,"mineBlock('Epic',true);openTab('collection')");await app.locator('[data-breed="silver"]').click();equal(await ev(app,'activeBreed().id'),'silver','Lucky breed unlock and activation');
  await ev(app,"openTab('spin')");await app.locator('[data-action="spin"]').click();equal(await ev(app,'state.spinDay'),new Date().toISOString().slice(0,10),'Daily spin recorded');const spinSP=await ev(app,'state.sp');await ev(app,'dailySpin()');equal(await ev(app,'state.sp'),spinSP,'Daily spin cannot repeat');
  await ev(app,"openTab('quests');startChallenge('sprint');state.blocks+=5;evaluateProgress();renderAll()");ok(await ev(app,'!!state.challengeWins.sprint'),'Block skill challenge completes');
  await ev(app,"startChallenge('control');state.jams++;evaluateProgress()");equal(await ev(app,'activeChallenge'),null,'Jam fails controlled challenge');
  await ev(app,"startChallenge('tapper');activeChallenge.start-=31000;evaluateProgress()");equal(await ev(app,'activeChallenge'),null,'Challenge timeout works');
  await ev(app,"state.daily.boosts=48;renderAll()");await app.locator('[data-claim="boost"]').click();ok(await ev(app,"!!state.claims[questKey(QUESTS[0])]"),'Harder quest claim works');const questSP=await ev(app,'state.sp');await ev(app,"claimQuest('boost')");equal(await ev(app,'state.sp'),questSP,'Quest duplicate claim blocked');
  await app.locator('#checkin').click();const checkSP=await ev(app,'state.sp');await ev(app,'checkin()');equal(await ev(app,'state.sp'),checkSP,'Daily check-in once only');
  await ev(app,"state.samples=[{time:Date.now()-20000,sps:1,blocks:1},{time:Date.now()-10000,sps:2,blocks:2},{time:Date.now(),sps:3,blocks:2}];openTab('stats')");equal(await app.locator('.stat-chart polyline').count(),2,'Two inline SVG line charts');await app.screenshot({path:out+'/signed-in-1440.png'});
  await ev(app,"openTab('profile')");await app.locator('#nickname').fill('Captain Paws');await app.locator('#nickname-form button').click();equal(await ev(app,'state.name'),'Captain Paws','Nickname saves');
  await app.evaluate(()=>{window.__mock.chain='0x2105';window.__mock.emit('chainChanged','0x2105');});await idle(app);ok(await app.locator('#network-hint').isVisible(),'Wrong network hint visible');ok(await ev(app,'isPlaying()'),'Wrong network does not block mining');await app.locator('#network-hint [data-action="dismiss-network"]').click();ok(await app.locator('#network-hint').isHidden(),'Network hint dismissible');
  await app.evaluate(()=>window.__mock.switchMissing=true);await app.locator('[data-action="switch-network"]').click();await idle(app);ok(await app.evaluate(()=>window.__mock.calls.some(r=>r.method==='wallet_addEthereumChain')),'Switch falls back to Add Network');
  await ev(app,'save()');const firstSave=await ev(app,'state.totalSqueeks');await app.reload();await app.waitForFunction(()=>eval('isPlaying()'));await idle(app);equal(await ev(app,'state.name'),'Captain Paws','Silent reconnect restores profile');ok(await ev(app,'state.totalSqueeks')>=firstSave,'Reload retains progress');equal(await app.evaluate(()=>window.__mock.calls.filter(r=>r.method==='personal_sign').length),0,'Valid cached sign-in reconnects without prompting');
  console.log('Gameplay, claims, cosmetics, breeds, quests, stats, reload and network checks passed');
  // A signature in flight may never claim into another account.
  await ev(app,"state.totalSqueeks=Math.max(state.totalSqueeks,4000);evaluateProgress();openTab('badges')");await app.evaluate(()=>window.__mock.signMode='pending');await app.locator('[data-badge-claim="wealth1"]').click();await app.waitForFunction(()=>!!window.__mock.release);
  const countPending=await app.evaluate(()=>window.__mock.calls.filter(r=>r.method==='personal_sign').length);await ev(app,"claimBadges(['wealth1'])");equal(await app.evaluate(()=>window.__mock.calls.filter(r=>r.method==='personal_sign').length),countPending,'Only one pending signature request');
  await app.evaluate(address=>{window.__mock.accounts=[address];window.__mock.emit('accountsChanged',[address]);},keys[1].address);await app.waitForFunction(address=>eval('wallet.address')===address,keys[1].address);equal(await ev(app,'isPlaying()'),false,'New account requires its own sign-in');equal(await ev(app,'state.totalSqueeks'),0,'New account starts its own profile');await app.evaluate(()=>{window.__mock.signMode='ok';window.__mock.release();});await idle(app);equal(await ev(app,'Object.keys(state.badgeReceipts).length'),0,'Old pending claim cannot leak to new account');
  await ev(app,'connectModal()');await app.locator('#sign-in-button').click();await app.waitForFunction(()=>eval('isPlaying()'));await idle(app);await ev(app,"state.name='Second Hamster';save()");
  await app.evaluate(address=>{window.__mock.accounts=[address];window.__mock.emit('accountsChanged',[address]);},keys[0].address);await app.waitForFunction(()=>eval("isPlaying()&&state.name==='Captain Paws'"));await idle(app);ok(await ev(app,'!!state.badgeReceipts.first'),'Switching back restores receipts');
  await ev(app,'disconnectWallet()');equal(await ev(app,'wallet.address'),null,'Disconnect returns to browse');equal(await ev(app,'state.totalSqueeks'),0,'Browse has no active address progress');await app.reload();await app.waitForFunction(()=>typeof eval('isPlaying')==='function');equal(await ev(app,'wallet.address'),null,'Explicit disconnect survives reload');
  await connect(app);equal(await ev(app,'state.name'),'Captain Paws','Manual reconnect restores correct saved profile');
  await ev(app,`(()=>{const key='squeekwheel:auth:'+wallet.address,a=JSON.parse(storage.get(key));a.time-=8*86400000;storage.set(key,JSON.stringify(a));})()`);await app.reload();await app.waitForFunction(()=>!!eval('wallet.address'));await idle(app);equal(await ev(app,'isPlaying()'),false,'Expired signature does not auto-start');equal(await app.evaluate(()=>window.__mock.calls.filter(r=>r.method==='personal_sign').length),0,'Expired silent reconnect never prompts');await ev(app,'connectModal()');await app.locator('#sign-in-button').click();await app.waitForFunction(()=>eval('isPlaying()'));await idle(app);
  await ev(app,'settings()');await app.locator('#import-string').fill('invalid');await app.locator('#import-save').click();equal(await app.locator('#import-string').getAttribute('aria-invalid'),'true','Invalid save has accessible error');const exported=await app.locator('#save-string').inputValue();await app.locator('#import-string').fill(exported);await app.locator('#import-save').click();await app.locator('#confirm-action').click();equal(await ev(app,'state.name'),'Captain Paws','Own save export/import works');ok(await ev(app,'isPlaying()'),'Import cannot replace wallet authentication');
  await app.evaluate(()=>{window.__mock.readFail=true;window.__mock.emit('chainChanged','0x2105');});await idle(app);ok(await ev(app,'isPlaying()'),'Failed network reads never block play');await app.evaluate(()=>window.__mock.emit('disconnect'));equal(await ev(app,'wallet.address'),null,'Provider disconnect pauses play');
  const blocked=await createApp({provider:true,blocked:true,audioBlocked:true});await connect(blocked);await blocked.locator('#tap-wheel').click();await ev(blocked,'save();settings()');ok((await blocked.locator('#save-status').innerText()).includes('Session only'),'Blocked storage disclosed');ok((await blocked.locator('#save-string').inputValue()).startsWith('SQW3.'),'Blocked storage can export');await blocked.locator('#sound-volume').fill('70');await blocked.locator('#music-volume').fill('50');await blocked.keyboard.press('Escape');ok(await ev(blocked,'isPlaying()'),'Unavailable audio never breaks game');
  const injection=await createApp({throwProvider:true});ok(await injection.locator('#start-overlay').isVisible(),'Throwing ethereum getter safe');
  const discovered=await createApp({discovery:true});await idle(discovered);await ev(discovered,'connectModal()');equal(await discovered.locator('[data-wallet-index]').count(),5,'EIP-6963 picker lists all five named wallets');
  const edge=await createApp({provider:true,width:390});await idle(edge);
  await edge.evaluate(()=>window.__mock.reject=-32002);await edge.locator('#wallet-button').click();await edge.locator('[data-wallet-index="0"]').click();await idle(edge);ok((await edge.locator('#wallet-status').innerText()).includes('already open'),'Provider pending error has a recovery message');await edge.keyboard.press('Escape');await edge.evaluate(()=>window.__mock.reject=false);await connect(edge);
  for(const width of [320,390,820,1440]){await edge.setViewportSize({width,height:900});equal(await edge.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Connected header fits at ${width}`);}
  await edge.setViewportSize({width:390,height:900});await edge.evaluate(()=>scrollTo(0,0));await edge.screenshot({path:out+'/signed-in-390.png'});
  await edge.evaluate(()=>window.__mock.balancePending=true);await ev(edge,'void refreshWallet()');await edge.waitForFunction(()=>!!window.__mock.releaseBalance);await edge.evaluate(()=>{window.__mock.balancePending=false;window.__mock.balanceString='0x1bc16d674ec80000';window.__mock.chain='0x2105';window.__mock.emit('chainChanged','0x2105');window.__mock.releaseBalance();});await edge.waitForFunction(()=>eval("wallet.balance==='2.0000' && wallet.chainId==='0x2105'"));equal(await ev(edge,'wallet.balance'),'2.0000','Stale balance from previous chain is discarded');ok(await ev(edge,'isPlaying()'),'Chain changes during reads keep game running');
  await ev(edge,"state=freshState(wallet.address);state.lastSaved=Date.now()-10*3600000;welcomeBack()");
  equal(Math.round(await ev(edge,'state.totalSqueeks')),11520,'Offline income uses slower base rate and eight-hour cap');ok((await edge.locator('#dialog-content').innerText()).includes('8-hour offline cap'),'Offline cap disclosed');await edge.locator('#welcome-continue').click();
  await ev(edge,"state.blocks=25;state.runBlocks=25;state.sp=500;state.earnedSP=500;state.owned={bearings:3};state.squeeks=500;rebirth()");equal(await ev(edge,'state.squeeks'),500,'Rebirth waits for confirmation');await edge.locator('#confirm-action').click();equal(await ev(edge,'state.squeeks'),0,'Rebirth clears spendable squeeks');equal(await ev(edge,'state.sp'),500,'Rebirth preserves SP');equal(await ev(edge,'state.earnedSP'),500,'Rebirth preserves lifetime SP');equal(await ev(edge,'state.blocks'),25,'Rebirth preserves lifetime blocks');equal(await ev(edge,'state.runBlocks'),0,'Rebirth resets run difficulty');equal(await ev(edge,'difficulty()'),240,'New run starts at harder baseline');ok(await ev(edge,"breedUnlocked(BREEDS.find(b=>b.id==='golden'))"),'Rebirth unlocks Golden Syrian');
  await ev(edge,"openTab('cosmetics')");await edge.locator('[data-cosmetic="mint"]').click();equal(await edge.locator('#wheel-grad stop').first().getAttribute('stop-color'),'#99c9a4','Wheel color cosmetic changes the art');await edge.locator('[data-cosmetic="cheese"]').click();equal(await ev(edge,'state.blockSkin'),'cheese','Block skin purchase equips');await ev(edge,"mineBlock('Common');renderAll()");equal(await edge.locator('[data-block]').first().getAttribute('data-skin'),'cheese','Block skin appears on chain');
  await ev(edge,"state.daily.key='2000-01-01';state.daily.boosts=48;resetPeriods()");equal(await ev(edge,'state.daily.boosts'),0,'UTC daily counters reset');
  equal(await ev(edge,'marketEvent(0).multiplier'),1.5,'Bull Run multiplier');equal(await ev(edge,'marketEvent(200000).multiplier'),0.65,'Cheese Crash multiplier');equal(await ev(edge,'marketEvent(400000).multiplier'),1,'Normal market multiplier');
  await ev(edge,"startChallenge('control');state.boosts+=12;evaluateProgress()");ok(await ev(edge,'!!state.challengeWins.control'),'Cool Paws challenge success');await ev(edge,"startChallenge('tapper');state.taps+=100;evaluateProgress()");ok(await ev(edge,'!!state.challengeWins.tapper'),'Quick Paws challenge success');
  await ev(edge,"state.name='Before quota';save()");await edge.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError');};});await ev(edge,"state.name='After quota';save()");equal(await ev(edge,'loadState(activeKey).name'),'After quota','Quota failure prefers fresh in-memory save over stale storage');
  await ev(edge,"state.totalSqueeks=1e9;state.sp=1e8;state.earnedSP=1e8;state.boosts=10000;state.upgrades=10000;state.checkin.total=2000;state.checkin.streak=1000;state.rebirths=50;state.playtime=1e6;state.bestSps=10000;state.xp=1e10;state.nightBlocks=1000;state.earlyBlocks=1000;state.catScares=1000;state.cosmeticInventory=Object.fromEntries(COSMETICS.map(c=>[c.id,true]));evaluateProgress();openTab('claims')");
  equal(await ev(edge,"BADGES.find(b=>b.id==='dressed_gold').goal"),6,'Gold wardrobe badge is attainable with six cosmetics');
  ok(await ev(edge,"BADGES.filter(b=>badgeReady(b)).length")>60,'Higher tiers and secret badges remain attainable');await edge.locator('[data-action="claim-all"]').click();await idle(edge);ok(await ev(edge,'Object.keys(state.badgeReceipts).length')>60,'Large batch badge claim succeeds with one signature');const longSave=await ev(edge,'exportString()');ok(longSave.length>100000,'Large receipt-rich export avoids argument stack overflow');await ev(edge,'settings()');await edge.locator('#import-string').fill(longSave);await edge.locator('#import-save').click();await edge.locator('#confirm-action').click();ok(await ev(edge,'Object.keys(state.badgeReceipts).length')>60,'Large save can be imported');
  // A confirmation opened for one account cannot mutate another.
  await ev(edge,'settings()');await edge.locator('#reset-save').click();await edge.evaluate(address=>{window.__mock.accounts=[address];window.__mock.emit('accountsChanged',[address]);},keys[1].address);await edge.waitForFunction(address=>eval('wallet.address')===address,keys[1].address);await edge.locator('#confirm-action').click();equal(await ev(edge,'state.name'),await ev(edge,'freshState(wallet.address).name'),'Stale reset confirmation cannot change another profile');
  // Legacy v3 progress is imported explicitly once into an empty signed wallet.
  const legacy=await createApp({provider:true});await ev(legacy,"(()=>{const old=freshState(identity.guestId);old.name='Earlier Cheddar';old.totalSqueeks=500;old.squeeks=500;old.sp=100;storage.set(SAVE_KEY+identity.guestId,JSON.stringify({version:3,state:old}));})()");await connect(legacy);await ev(legacy,"openTab('profile')");await legacy.locator('#migrate-legacy').click();await legacy.locator('#confirm-action').click();equal(await ev(legacy,'state.name'),'Earlier Cheddar','Earlier save preserved by explicit migration');equal(await ev(legacy,'state.id'),keys[0].address,'Migrated save binds to signed address');ok(await ev(legacy,'!!storage.get(SAVE_KEY+identity.guestId)'),'Original legacy backup retained');
  for(const width of [320,390,820,1440]){
    await app.setViewportSize({width,height:844});await app.evaluate(()=>scrollTo(0,0));
    equal(await app.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`No overflow at ${width}`);
    const bounds=await app.locator('#start-mining').boundingBox();ok(bounds&&bounds.y+bounds.height<844,`Primary action on first screen at ${width}`);
    await app.screenshot({path:out+`/browse-${width}.png`});
    for(const tab of ['badges','claims','collection','cosmetics','stats','profile']){
      await ev(app,`openTab('${tab}')`);equal(await app.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${tab} reflows at ${width}`);
    }
  }
  await browse.emulateMedia({reducedMotion:'reduce'});equal(await browse.evaluate(()=>[...document.getAnimations()].filter(a=>a.playState==='running'&&a.effect.getTiming().iterations===Infinity).length),0,'Reduced motion stops endless animations');
  const methods=await app.evaluate(()=>window.__mock.calls.map(r=>r.method));ok(methods.every(m=>['eth_accounts','eth_requestAccounts','eth_chainId','eth_getBalance','personal_sign','wallet_switchEthereumChain','wallet_addEthereumChain'].includes(m)),'No transaction or approval methods');
  // Aggregate request concurrency is checked on every test wallet, not just one path.
  for(const page of [app,blocked,discovered,edge,legacy])equal(await page.evaluate(()=>window.__mock.maxActive),1,'At most one wallet request at once');
  equal(findings.length,0,'Zero page, console or failed-resource errors');
  await writeFile(out+'/results.json',JSON.stringify({checks,errors:findings,viewports:[320,390,820,1440],note:'Chromium with simulated EIP-1193 wallets and ephemeral test signers; no real funds or installed extension.'},null,2));
  console.log(`PASS: ${checks} browser interaction assertions; zero console/page/resource errors.`);
} finally {await Promise.all(contexts.map(c=>c.close()));await browser.close();await new Promise(resolve=>server.close(resolve));}
