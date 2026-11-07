import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createECDH, randomBytes } from "node:crypto";

// Resolve validation-only packages without making a node_modules directory.
const root = resolve("test/scratch/tools");
function conditional(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    for (const key of ["import", "node", "default", "require"])
      if (value[key]) return conditional(value[key]);
  }
  return null;
}
registerHooks({
  resolve(specifier, context, next) {
    const packages = [
      "happy-dom",
      "ws",
      "entities",
      "whatwg-mimetype",
      "buffer-image-size",
    ];
    if (
      !specifier.startsWith(".") &&
      !specifier.startsWith("/") &&
      !specifier.includes(":")
    ) {
      const name = specifier.split("/")[0];
      if (packages.includes(name)) {
        const base = resolve(root, name);
        const pkg = JSON.parse(readFileSync(base + "/package.json", "utf8"));
        const sub = "." + specifier.slice(name.length);
        const entry =
          conditional(
            pkg.exports?.[sub] ?? (sub === "." ? pkg.exports : null),
          ) ??
          (sub === "."
            ? (pkg.module ?? pkg.main)
            : "./" + specifier.slice(name.length + 1));
        return next(pathToFileURL(resolve(base, entry)).href, context);
      }
    }
    return next(specifier, context);
  },
});
let Window;
try {
  ({ Window } = await import(
    pathToFileURL(resolve(root, "happy-dom/lib/index.js")).href
  ));
} catch {
  console.error("Run python3 scripts/setup-checks.py before DOM validation.");
  process.exit(1);
}
const html = readFileSync("dist/index.html", "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
let checks = 0;
const windows = [];
const errors = [];
const ok = (condition, label) => {
  assert.ok(condition, label);
  checks++;
};
const equal = (a, b, label) => {
  assert.equal(a, b, label);
  checks++;
};
function createApp({ provider, blockedStorage = false, saved } = {}) {
  const w = new Window({
    url: "https://squeekwheel.test/preview/",
    settings: {
      enableJavaScriptEvaluation: true,
      suppressInsecureJavaScriptEnvironmentWarning: true,
    },
  });
  windows.push(w);
  w.TextEncoder = TextEncoder;
  w.TextDecoder = TextDecoder;
  w.console.error = (...args) => errors.push(args.join(" "));
  w.addEventListener("error", (event) => errors.push(event.message));
  if (provider) w.ethereum = provider;
  if (saved)
    for (const [key, value] of Object.entries(saved))
      w.localStorage.setItem(key, value);
  if (blockedStorage)
    Object.defineProperty(w, "localStorage", {
      get() {
        throw new Error("Storage blocked for test");
      },
    });
  w.document.write(html.replace(/<script>[\s\S]*?<\/script>/, ""));
  if (!w.HTMLDialogElement.prototype.showModal)
    w.HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
  if (!w.HTMLDialogElement.prototype.close)
    w.HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new w.Event("close"));
    };
  // This hook exists in the test VM only; it is never written to the application.
  w.eval(script + "\n;globalThis.testEval = code => eval(code);");
  return {
    w,
    d: w.document,
    ev: (code) => w.testEval(code),
    click: (id) => w.document.getElementById(id).click(),
  };
}
function mockProvider(address) {
  const listeners = new Map(),
    calls = [];
  const p = {
    accounts: [address],
    chain: "0x1",
    reject: false,
    locked: false,
    calls,
    signer: null,
    async request(request) {
      calls.push(request.method);
      if (request.method === "eth_accounts") return p.accounts;
      if (request.method === "eth_requestAccounts") {
        if (p.reject)
          throw Object.assign(new Error("Rejected"), { code: 4001 });
        return p.locked ? [] : p.accounts;
      }
      if (request.method === "eth_chainId") return p.chain;
      if (request.method === "eth_getBalance") return "0xde0b6b3a7640000";
      if (request.method === "personal_sign")
        return p.signer(request.params[0]);
      throw new Error("Unexpected RPC method: " + request.method);
    },
    on(name, callback) {
      listeners.set(name, callback);
    },
    removeListener(name) {
      listeners.delete(name);
    },
    emit(name, value) {
      listeners.get(name)?.(value);
    },
  };
  return p;
}
const settle = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

try {
  const a = createApp();
  equal(a.ev("wallet.address"), null, "Guest has no wallet");
  equal(a.d.querySelector("dialog").open, false, "No blocking modal on load");
  equal(a.ev("UPGRADES.length"), 12, "Twelve functional upgrades");
  equal(a.ev("BADGES.length"), 25, "Twenty-five badges");
  equal(
    a.ev("BADGES.filter(b=>b.category==='Wallet').length"),
    3,
    "Exactly three optional wallet badges",
  );
  ok(
    a.d.getElementById("turbo").textContent.includes("Turbo"),
    "Primary action rendered",
  );
  a.click("turbo");
  ok(a.ev("state.squeeks>=15"), "Turbo earns squeeks");
  equal(a.ev("state.boosts"), 1, "Turbo counted");
  a.click("turbo");
  equal(a.ev("state.boosts"), 1, "Cooldown prevents repeated turbo");
  a.ev("turboUntil=0");
  a.d.body.dispatchEvent(
    new a.w.KeyboardEvent("keydown", { code: "Space", bubbles: true }),
  );
  equal(a.ev("state.boosts"), 2, "Space boosts from the game");
  a.ev("state.squeeks=100000;renderAll()");
  a.d.querySelector('[data-buy="bearings"]').click();
  equal(a.ev("state.owned.bearings"), 1, "Shop purchase owns an upgrade");
  equal(a.ev("baseSps()"), 1.5, "Upgrade increases production");
  a.d.querySelector('[data-quantity="10"]').click();
  a.d.querySelector('[data-buy="bearings"]').click();
  equal(a.ev("state.owned.bearings"), 11, "Buy ten purchases exactly ten");
  a.d.querySelector('[data-category="Fuel"]').click();
  ok(
    a.d.getElementById("upgrade-list").textContent.includes("Sunflower Seeds"),
    "Fuel category works",
  );
  a.d.querySelector('[data-quantity="Max"]').click();
  const before = a.ev("state.squeeks");
  a.d.querySelector('[data-buy="seeds"]').click();
  ok(
    a.ev("state.owned.seeds>1&&state.squeeks>=0"),
    "Max purchases only affordable units",
  );
  ok(a.ev("state.squeeks") < before, "Purchase deducts squeeks");
  a.ev("buyMode='1';category='Crew';state.squeeks=0;renderPanel()");
  ok(
    a.d.querySelector('[data-buy="robo"]').disabled,
    "Unaffordable upgrade is disabled",
  );
  a.ev("state=freshState();lastLevel=1;earn(60);renderAll()");
  equal(a.ev("state.blocks"), 1, "Mining threshold produces a block");
  ok(
    a.ev("state.sp>0&&state.chain.length===1"),
    "Block grants permanent SP and chain data",
  );
  ok(a.ev("difficulty()>60"), "Mining difficulty rises");
  ok(
    a.ev("/^0x[\\da-f]{16}$/.test(state.chain[0].hash)"),
    "Illustrative hash format",
  );
  a.d.querySelector("[data-block]").click();
  ok(
    a.d
      .getElementById("dialog-content")
      .textContent.includes("Illustrative hash"),
    "Block details include full metadata",
  );
  a.click("dialog-close");
  a.ev("state=freshState();activeEvent=null;startEvent('cat')");
  equal(a.ev("sps()"), 0.35, "Cat event slows mining");
  a.click("laser");
  equal(a.ev("state.catScares"), 1, "Laser scares cat");
  equal(a.ev("sps()"), 1, "Cat removal restores speed");
  a.ev("startEvent('surge')");
  equal(a.ev("sps()"), 2, "Surge doubles rate");
  a.ev("activeEvent=null;startEvent('lucky')");
  equal(a.ev("state.chain.at(-1).rarity"), "Epic", "Lucky Block always Epic");
  const goldenBefore = a.ev("state.squeeks");
  a.ev("startEvent('golden')");
  ok(a.ev("state.squeeks") > goldenBefore, "Golden Seed grants squeeks");
  a.ev("state=freshState();state.daily.boosts=12;openTab('quests')");
  a.d.querySelector('[data-claim="boost"]').click();
  equal(a.ev("state.sp"), 40, "Quest claim grants reward");
  a.ev("claimQuest('boost')");
  equal(a.ev("state.sp"), 40, "Quest reward cannot be claimed twice");
  a.ev("state.daily.key='2000-01-01';resetPeriods()");
  equal(a.ev("state.daily.boosts"), 0, "Daily counters reset");
  equal(
    a.ev("Object.keys(state.claims).length"),
    0,
    "Old claim keys are pruned",
  );
  a.ev("state=freshState();checkin()");
  equal(a.ev("state.sp"), 25, "Daily check-in grants SP");
  a.ev("checkin()");
  equal(a.ev("state.sp"), 25, "Check-in cannot repeat same day");
  a.ev(
    "state.checkin.last=dayKey(Date.now()-86400000);state.checkin.streak=6;checkin()",
  );
  equal(a.ev("state.checkin.streak"), 7, "Seven-day check-in streak");
  ok(a.ev("!!state.badges.streak7"), "Streak badge unlocks with date");
  a.ev("state.checkin.last=dayKey(Date.now()-3*86400000);checkin()");
  equal(a.ev("state.checkin.streak"), 1, "Broken streak resets");
  a.ev(
    "state=freshState();state.lastSaved=Date.now()-10*3600000;welcomeBack()",
  );
  equal(
    a.ev("Math.round(state.totalSqueeks)"),
    28800,
    "Offline earnings capped at eight hours",
  );
  ok(
    a.d
      .getElementById("dialog-content")
      .textContent.includes("8-hour offline cap"),
    "Offline cap explained",
  );
  a.click("welcome-continue");
  a.ev(
    "state=freshState();state.blocks=25;state.runBlocks=25;state.sp=100;state.squeeks=500;state.owned.bearings=3;rebirth()",
  );
  equal(a.ev("state.squeeks"), 500, "Rebirth waits for confirmation");
  a.click("confirm-action");
  equal(a.ev("state.squeeks"), 0, "Rebirth clears squeeks");
  equal(a.ev("state.sp"), 100, "Rebirth preserves SP");
  equal(a.ev("state.blocks"), 25, "Rebirth preserves lifetime blocks");
  ok(
    a.ev("state.prestige>1&&Object.keys(state.owned).length===0"),
    "Rebirth multiplier and upgrades reset",
  );
  ok(a.ev("!!state.badges.rebirth"), "Rebirth badge unlocked");
  a.ev("openTab('profile')");
  const nickname = a.d.getElementById("nickname");
  nickname.value = "Captain Paws";
  a.d
    .getElementById("nickname-form")
    .dispatchEvent(
      new a.w.Event("submit", { bubbles: true, cancelable: true }),
    );
  equal(a.ev("state.name"), "Captain Paws", "Editable nickname saves");
  a.ev("openTab('leaderboard')");
  ok(
    a.d.querySelector(".rank-row.you").textContent.includes("Captain Paws"),
    "Guest appears in pinned leaderboard row",
  );
  equal(
    a.d.querySelectorAll(".demo-tag").length,
    9,
    "Every seed player labeled Demo, guest labeled You",
  );
  a.d.querySelector('[data-rank-period="Daily"]').click();
  equal(a.ev("rankPeriod"), "Daily", "Daily ranking filter works");
  a.ev("openTab('badges');badgeFilter='Wallet';renderPanel()");
  equal(
    a.d.querySelectorAll(".badge-item").length,
    3,
    "Wallet badge filter works",
  );
  ok(
    [...a.d.querySelectorAll(".badge-item")].every((el) =>
      el.textContent.includes("Optional"),
    ),
    "Wallet badges explicitly optional",
  );
  a.ev("connectModal()");
  ok(
    a.d
      .getElementById("wallet-list")
      .textContent.includes("No browser wallet found"),
    "No-extension connection modal is friendly",
  );
  equal(
    a.d.querySelectorAll("#wallet-list a").length,
    6,
    "Install and open-in wallet links exist",
  );
  a.click("dialog-close");
  a.ev("settings()");
  const exported = a.d.getElementById("save-string").value;
  ok(exported.startsWith("SQW3."), "Save export has version prefix");
  a.d.getElementById("import-string").value = "broken";
  a.click("import-save");
  equal(
    a.d.getElementById("import-string").getAttribute("aria-invalid"),
    "true",
    "Invalid save has accessible error",
  );
  a.d.getElementById("import-string").value = exported;
  a.click("import-save");
  a.ev("state.sp=0");
  a.click("confirm-action");
  equal(a.ev("state.sp"), 100, "Confirmed import restores permanent score");
  a.ev("save()");
  const saved = Object.fromEntries(
    Array.from({ length: a.w.localStorage.length }, (_, i) => {
      const key = a.w.localStorage.key(i);
      return [key, a.w.localStorage.getItem(key)];
    }),
  );
  const reloaded = createApp({ saved });
  equal(
    reloaded.ev("state.name"),
    "Captain Paws",
    "Reload restores profile nickname",
  );
  equal(reloaded.ev("state.sp"), 100, "Reload restores SP");
  const blocked = createApp({ blockedStorage: true });
  blocked.click("turbo");
  blocked.ev("save()");
  equal(
    blocked.ev("state.boosts"),
    1,
    "Storage-blocked guest can play and save in memory",
  );
  ok(
    blocked.d
      .getElementById("save-status")
      .textContent.includes("Session only"),
    "Storage fallback is disclosed",
  );
  blocked.ev("settings()");
  ok(
    blocked.d.getElementById("save-string").value.startsWith("SQW3."),
    "Storage-blocked game can export",
  );
  // Known Keccak vectors and the canonical public generator address.
  equal(
    a.ev("bytesHex(keccak256(new Uint8Array()))"),
    "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "Keccak-256 empty input vector",
  );
  equal(
    a.ev("bytesHex(keccak256(new TextEncoder().encode('abc')))"),
    "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45",
    "Keccak-256 abc vector",
  );
  const generatorKey = a.ev(
    "CURVE_G.x.toString(16).padStart(64,'0')+CURVE_G.y.toString(16).padStart(64,'0')",
  );
  const generatorAddress = a.ev(
    `'0x'+bytesHex(keccak256(Uint8Array.from('${generatorKey}'.match(/.{2}/g), b=>parseInt(b,16)))).slice(-40)`,
  );
  equal(
    generatorAddress,
    "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
    "Canonical secp256k1 public key address",
  );
  // An ephemeral test signer, never included in runtime or stored by the application.
  const ecdh = createECDH("secp256k1");
  ecdh.generateKeys();
  const secret = BigInt("0x" + ecdh.getPrivateKey().toString("hex"));
  const publicHex = ecdh
    .getPublicKey(null, "uncompressed")
    .subarray(1)
    .toString("hex");
  const address = a.ev(
    `'0x'+bytesHex(keccak256(Uint8Array.from('${publicHex}'.match(/.{2}/g), b=>parseInt(b,16)))).slice(-40)`,
  );
  const p = mockProvider(address),
    app = createApp({ provider: p });
  equal(
    p.calls.length,
    0,
    "Installed but unused wallet is never prompted or read",
  );
  app.ev(
    "state.squeeks=1234;state.sp=100;state.owned.bearings=2;connectModal()",
  );
  p.reject = true;
  await app.ev("connectWallet(discovered()[0])");
  ok(
    app.d.getElementById("wallet-status").textContent.includes("No problem"),
    "Rejection message is calm",
  );
  equal(app.ev("state.squeeks"), 1234, "Rejection preserves game state");
  p.reject = false;
  p.locked = true;
  await app.ev("connectWallet(discovered()[0])");
  ok(
    app.d.getElementById("wallet-status").textContent.includes("locked"),
    "Locked wallet offers recovery",
  );
  p.locked = false;
  await app.ev("connectWallet(discovered()[0])");
  equal(
    app.ev("wallet.address"),
    null,
    "Link waits for explicit progress confirmation",
  );
  app.click("confirm-action");
  await settle();
  equal(
    app.ev("wallet.address"),
    address,
    "Wallet connects after confirmation",
  );
  equal(app.ev("state.squeeks"), 1234, "Mid-game linking keeps squeeks");
  equal(app.ev("state.owned.bearings"), 2, "Mid-game linking keeps upgrades");
  equal(app.ev("state.sp"), 105, "One-time five-percent SP bonus applied");
  app.ev("addSP(100)");
  equal(
    app.ev("state.sp"),
    205,
    "SP bonus is one-time, with no ongoing wallet advantage",
  );
  equal(
    app.ev("getLeaderboard('Daily').find(r=>r.id===activeKey).sp"),
    105,
    "Daily leaderboard counts earned SP and carries it through linking",
  );
  p.signer = (hex) => {
    const message = Buffer.from(hex.slice(2), "hex").toString("utf8");
    const nonce = BigInt("0x" + randomBytes(32).toString("hex"));
    return app.ev(
      `(()=>{const e=BigInt('0x'+bytesHex(personalHash(${JSON.stringify(message)}))),k=mod(${nonce}n,CURVE_N-1n)+1n,R=pointMultiply(CURVE_G,k),r=mod(R.x,CURVE_N),s=mod(inverse(k,CURVE_N)*(e+r*${secret}n),CURVE_N),v=27+Number(R.y&1n)+(R.x>=CURVE_N?2:0);return '0x'+r.toString(16).padStart(64,'0')+s.toString(16).padStart(64,'0')+v.toString(16).padStart(2,'0')})()`,
    );
  };
  await app.ev("verifyWallet()");
  equal(
    app.ev("state.verified"),
    true,
    "Personal signature recovers the connected address",
  );
  ok(app.ev("!!state.badges.signed"), "Signature badge unlocked");
  app.ev("save()");
  const walletSave = Object.fromEntries(
    Array.from({ length: app.w.localStorage.length }, (_, i) => {
      const key = app.w.localStorage.key(i);
      return [key, app.w.localStorage.getItem(key)];
    }),
  );
  const returningProvider = mockProvider(address);
  const returning = createApp({
    provider: returningProvider,
    saved: walletSave,
  });
  await returning.ev("silentReconnect()");
  await settle();
  equal(
    returning.ev("wallet.address"),
    address,
    "Reload silently reconnects an authorized wallet",
  );
  ok(
    !returningProvider.calls.includes("eth_requestAccounts"),
    "Silent reconnect never requests permissions",
  );
  equal(
    returning.ev("state.verified"),
    true,
    "Reload restores address-bound verification",
  );
  const discovery = createApp();
  const discoveredProvider = mockProvider(address);
  discovery.w.dispatchEvent(
    new discovery.w.CustomEvent("eip6963:announceProvider", {
      detail: {
        info: {
          uuid: "test-wallet",
          name: "Friendly Wallet",
          icon: "",
          rdns: "test.wallet",
        },
        provider: discoveredProvider,
      },
    }),
  );
  discovery.ev("connectModal()");
  ok(
    discovery.d
      .getElementById("wallet-list")
      .textContent.includes("Friendly Wallet"),
    "EIP-6963 named wallet appears in picker",
  );
  equal(
    discoveredProvider.calls.length,
    0,
    "Wallet discovery does not request accounts",
  );
  app.ev("state.verified=false");
  const signer = p.signer;
  p.signer = () => "malformed-signature";
  await app.ev("verifyWallet()");
  equal(
    app.ev("state.verified"),
    false,
    "Malformed signature never receives a checkmark",
  );
  p.signer = signer;
  await app.ev("verifyWallet()");
  equal(
    app.ev("state.verified"),
    true,
    "Signature can be retried successfully",
  );
  app.ev("openTab('profile')");
  app.d.getElementById("hat-select").value = "crown";
  app.d.getElementById("hat-select").dispatchEvent(new app.w.Event("change"));
  equal(
    app.d.getElementById("hamster-hat").hasAttribute("hidden"),
    false,
    "Connected hat appears in SVG",
  );
  ok(app.ev("!!state.badges.dressed"), "Cosmetic badge unlocks");
  p.chain = "0x2105";
  p.emit("chainChanged", "0x2105");
  await settle();
  equal(app.ev("wallet.chainId"), "0x2105", "Chain change updates network");
  equal(
    app.ev("state.squeeks"),
    1234,
    "Network change never blocks or resets game",
  );
  app.ev("disconnectWallet()");
  equal(app.ev("wallet.address"), null, "Disconnect returns to guest");
  equal(app.ev("state.squeeks"), 1234, "Disconnect keeps progress");
  equal(
    app.d.getElementById("hamster-hat").hasAttribute("hidden"),
    true,
    "Guest mode hides wallet cosmetics",
  );
  const spBeforeRelink = app.ev("state.sp");
  await app.ev("linkWallet(discovered()[0]," + JSON.stringify(address) + ")");
  equal(app.ev("state.sp"), spBeforeRelink, "Relinking does not repeat bonus");
  const secondEcdh = createECDH("secp256k1");
  secondEcdh.generateKeys();
  const secondPublic = secondEcdh
    .getPublicKey(null, "uncompressed")
    .subarray(1)
    .toString("hex");
  const second = app.ev(
    `'0x'+bytesHex(keccak256(Uint8Array.from('${secondPublic}'.match(/.{2}/g), b=>parseInt(b,16)))).slice(-40)`,
  );
  p.accounts = [second];
  p.emit("accountsChanged", [second]);
  await settle();
  equal(
    app.ev("wallet.address"),
    second,
    "Account switch changes active profile key",
  );
  equal(
    app.ev("state.verified"),
    false,
    "New wallet does not inherit verification",
  );
  equal(
    app.ev("state.squeeks"),
    1234,
    "New account keeps current guest progress",
  );
  p.accounts = [address];
  p.emit("accountsChanged", [address]);
  await settle();
  equal(
    app.ev("state.verified"),
    true,
    "Switching back restores that wallet's saved verification",
  );
  p.emit("accountsChanged", []);
  equal(
    app.ev("wallet.address"),
    null,
    "Locked account returns safely to guest",
  );
  ok(
    !p.calls.some((method) =>
      /send|Transaction|approve|signTransaction/.test(method),
    ),
    "No transaction, approval or sending RPC requested",
  );
  // Migrations, imports, midnight boundaries and untrusted display data.
  const migrated = a.ev("validateState({squeeks:42,name:'Old Miner',sp:9})");
  equal(
    migrated.squeeks,
    42,
    "Older state fields migrate without losing balances",
  );
  equal(migrated.prestige, 1, "Missing migration fields receive safe defaults");
  const sanitized = a.ev(
    "validateState({name:'<img src=x onerror=alert(1)>',squeeks:-10,sp:Infinity,owned:{bearings:3.7}})",
  );
  equal(sanitized.squeeks, 0, "Negative imported squeeks rejected");
  equal(sanitized.sp, 0, "Infinite imported score rejected");
  equal(sanitized.owned.bearings, 3, "Imported owned counts are integral");
  ok(!sanitized.name.includes("<"), "Display nickname is sanitized");
  a.ev("state=freshState();state.lastSaved=12345");
  Object.defineProperty(a.d, "hidden", { configurable: true, get: () => true });
  a.ev("save()");
  equal(
    a.ev("state.lastSaved"),
    12345,
    "Background autosave preserves offline timestamp",
  );
  Object.defineProperty(a.d, "hidden", {
    configurable: true,
    get: () => false,
  });
  a.ev(
    "state=freshState();state.weekly.key='2000-01-03';state.weekly.blocks=99;resetPeriods()",
  );
  equal(
    a.ev("state.weekly.blocks"),
    0,
    "Weekly counters reset at UTC period boundary",
  );
  a.ev("state.daily.key='2000-01-01';state.daily.sp=99;addSP(7)");
  equal(
    a.ev("state.daily.sp"),
    7,
    "First SP award after midnight counts in the new day",
  );
  a.ev("state=freshState();state.squeeks=1e100;buyMode='Max'");
  ok(
    a.ev("quote(UPGRADES[0]).count>1000"),
    "Max buys every affordable upgrade even at late-game balances",
  );
  a.ev(
    "state=freshState();state.squeeks=100;category='Wheel';buyMode='1';openTab('shop')",
  );
  const focusedBuy = a.d.querySelector('[data-buy="bearings"]');
  focusedBuy.focus();
  focusedBuy.click();
  a.ev("renderPanel()");
  equal(
    a.d.activeElement.getAttribute("data-buy"),
    "bearings",
    "Keyboard focus survives an affordable purchase update",
  );
  a.d.querySelector('[data-mobile-tab="shop"]').click();
  equal(
    a.d.querySelector('[data-mobile-tab="shop"]').getAttribute("aria-current"),
    "page",
    "Mobile Shop highlights the selected destination",
  );
  for (const id of ["shop", "quests", "badges", "leaderboard", "profile"]) {
    a.ev(`openTab('${id}')`);
    ok(
      [...a.d.querySelectorAll("#panel button")].every(
        (button) =>
          button.textContent.trim() || button.getAttribute("aria-label"),
      ),
      `All ${id} panel buttons have accessible names`,
    );
  }
  // Keyboard tab behavior and motion/theme/sound preferences.
  a.ev("openTab('shop')");
  a.d
    .getElementById("tabs")
    .dispatchEvent(
      new a.w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
  equal(a.ev("tab"), "quests", "Arrow keys navigate management tabs");
  equal(
    a.d.getElementById("tab-quests").getAttribute("tabindex"),
    "0",
    "Active tab participates in tab order",
  );
  a.click("theme-toggle");
  equal(a.d.documentElement.dataset.theme, "dark", "Dark theme toggle works");
  a.click("motion-toggle");
  equal(
    a.d.documentElement.dataset.motion,
    "paused",
    "Animation pause preference works",
  );
  a.ev("tutorial(0)");
  a.click("tutorial-next");
  a.click("tutorial-next");
  a.click("tutorial-next");
  equal(a.ev("state.tutorial"), true, "Three-step tutorial completes");
  a.ev("tutorial(0)");
  a.click("tutorial-skip");
  equal(a.d.getElementById("dialog").open, false, "Tutorial can be skipped");
  equal(
    errors.length,
    0,
    "No application console errors in exercised DOM flows",
  );
  console.log(
    `PASS: ${checks} assertions across guest, shop, mining, events, quests, badges, saves, offline, rebirth, wallet, signature, profiles and accessibility behaviors.`,
  );
  console.log(
    "LIMITATION: DOM simulation does not measure rendered layout, browser downloads/clipboard/audio, real extensions, or native device behavior.",
  );
} finally {
  for (const w of windows) {
    await w.happyDOM.abort();
    w.close();
  }
}
