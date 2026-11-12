// Regression check with isolated API fixtures; no database writes or extra dependencies.
// Run from FE after npm run check: node tests/employer-navigation-browser.mjs
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const output = path.resolve("../.artifacts/employer-navigation-checks");
await mkdir(output, { recursive: true });
const profile = path.join(output, `chrome-${Date.now()}`);
const browser = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
  ],
  { windowsHide: true, stdio: "ignore" },
);
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "5182",
    "--strictPort",
  ],
  { windowsHide: true, stdio: "ignore" },
);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const checks = [];
const errors = [];
let socket;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try {
      port = (await readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0];
      break;
    } catch {
      await sleep(100);
    }
  }
  assert.ok(port, "Chrome started");
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch("http://127.0.0.1:5182")).ok) break;
    } catch {}
    await sleep(100);
  }
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })
  ).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let nextId = 0;
  const pending = new Map();
  const events = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const waiter = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
      else waiter.resolve(message.result);
    } else events.get(message.method)?.(message.params);
  };
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => reject(new Error(`CDP timed out: ${method}`)), 30000);
      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function until(expression) {
    for (let i = 0; i < 160; i++) {
      if (await evaluate(expression)) return;
      await sleep(50);
    }
    throw new Error(
      `Timed out: ${expression}\n${JSON.stringify(await evaluate("({url:location.href,body:document.body.innerText.slice(0,2000)})"))}\n${JSON.stringify(errors)}`,
    );
  }
  async function check(expression, name) {
    assert.ok(
      await evaluate(expression),
      `${name}\n${JSON.stringify(await evaluate("({url:location.href,tabs:[...document.querySelectorAll('main .section-tab-label')].map(e=>e.textContent),body:document.body.innerText.slice(0,800)})"))}`,
    );
    checks.push(name);
    console.log(`PASS ${name}`);
  }
  async function click(selector) {
    const point = await evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw Error('Missing click target');
      el.scrollIntoView({block:'center', inline:'center'});
      const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};
    })()`);
    await send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      ...point,
      button: "left",
      clickCount: 1,
    });
    await send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      ...point,
      button: "left",
      clickCount: 1,
    });
  }
  events.set("Runtime.exceptionThrown", (event) => errors.push(event.exceptionDetails));
  events.set("Fetch.requestPaused", ({ requestId, request }) => {
    const url = new URL(request.url);
    let body;
    if (url.pathname.endsWith("/auth/me"))
      body = {
        id: "test-recruiter",
        companyId: "test-company",
        fullName: "Nhà tuyển dụng thử nghiệm",
      };
    else if (url.pathname.endsWith("/header"))
      body = { companyLogoUrl: null, notifications: [], messages: [] };
    else if (url.pathname.endsWith("/talent-discovery/metadata"))
      body = {
        company: { name: "Công ty thử nghiệm" },
        campaigns: [],
        provinces: [],
        skills: [],
        stats: { discoverable: 0, interested: 0, saved: 0 },
      };
    else if (url.pathname.endsWith("/candidates/metadata"))
      body = { campaigns: [], stages: [], recruiters: [], pendingImports: 0 };
    else if (url.pathname.endsWith("/candidates/interviews")) body = [];
    else
      body = {
        items: [],
        totalCount: 0,
        totalPages: 1,
        page: 1,
        pageSize: 12,
        poolCount: 0,
        readyCount: 0,
      };
    void send("Fetch.fulfillRequest", {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: "application/json" }],
      body: Buffer.from(JSON.stringify(body)).toString("base64"),
    }).catch((error) => errors.push(error.message));
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }] });
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `sessionStorage.setItem('jobtot.employer.tokens', JSON.stringify({accessToken:'fixture',refreshToken:'fixture'}));`,
  });
  const discoveryLabels = ["Khám phá hồ sơ", "Đang quan tâm", "Đã lưu tài năng"];
  const cvLabels = ["Hồ sơ ứng tuyển", "Lịch phỏng vấn & đánh giá"];
  const routes = [
    ["/employer/discover", "Tìm nhân tài", "all"],
    ["/employer/discover?collection=interested", "Tìm nhân tài", "interested"],
    ["/employer/discover?collection=saved", "Tìm nhân tài", "saved"],
    ["/employer/talents", "Tìm nhân tài", "saved"],
    ["/employer/candidates", "Quản lý CV", "applications"],
    ["/employer/interviews", "Quản lý CV", "interviews"],
  ];
  for (const [mode, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: mode === "mobile",
    });
    const nav =
      mode === "desktop"
        ? 'nav[aria-label="Điều hướng chính"]'
        : 'nav[aria-label="Điều hướng mobile"]';
    async function state(area, active, name) {
      await until(
        "!!document.querySelector('.td-filter-panel, .er-filters, .er-calendar-toolbar') && !document.querySelector('.td-skeletons, main .er-loading')",
      );
      await until(
        `document.querySelector('main h1')?.textContent.trim() === ${JSON.stringify(area)}`,
      );
      await until(
        `document.querySelector('main .section-tab[aria-current="page"]')?.getAttribute('href')?.includes(${JSON.stringify(active === "all" ? "/employer/discover" : active === "applications" ? "/employer/candidates" : active === "interviews" ? "/employer/interviews" : `collection=${active}`)})`,
      );
      const expected = area === "Tìm nhân tài" ? discoveryLabels : cvLabels;
      await check(
        `JSON.stringify([...document.querySelectorAll('main .section-tab-label')].map(e=>e.textContent)) === ${JSON.stringify(JSON.stringify(expected))}`,
        `${mode} ${name}: isolated tabs`,
      );
      if (mode === "mobile") {
        await click('[aria-label="Mở menu"]');
        await until("!!document.querySelector('.mobile-menu-panel')");
      }
      await check(
        `(() => {const items=document.querySelector(${JSON.stringify(nav)}).querySelectorAll('a[aria-current="page"]');return items.length===1 && items[0].textContent.trim()===${JSON.stringify(area)} && getComputedStyle(items[0]).textDecorationLine.includes('underline');})()`,
        `${mode} ${name}: one active main item with underline`,
      );
      if (
        mode === "mobile" &&
        ["direct /employer/discover", "direct /employer/candidates"].includes(name)
      ) {
        const screenshot = await send("Page.captureScreenshot", { format: "png" });
        await writeFile(
          path.join(
            output,
            `mobile-menu-${area === "Tìm nhân tài" ? "discover" : "candidates"}.png`,
          ),
          Buffer.from(screenshot.data, "base64"),
        );
      }
      if (mode === "mobile") await click('[aria-label="Đóng menu"]');
      await check(
        "document.documentElement.scrollWidth <= innerWidth",
        `${mode} ${name}: no page overflow`,
      );
      await until(
        `(() => { const nav=document.querySelector('main .section-tabs'); const tab=nav.querySelector('[aria-current="page"]'); const a=nav.getBoundingClientRect(), b=tab.getBoundingClientRect(); return b.left>=a.left-1 && b.right<=a.right+1; })()`,
      );
      await check(
        "document.querySelectorAll('main .section-tab[aria-current=page]').length===1",
        `${mode} ${name}: one selected subtab visible`,
      );
    }
    for (const [route, area, active] of routes) {
      await send("Page.navigate", { url: `http://127.0.0.1:5182${route}` });
      await state(area, active, `direct ${route}`);
      await send("Page.reload");
      await state(area, active, `reload ${route}`);
      await until(
        "!!document.querySelector('.td-filter-panel, .er-filters, .er-calendar-toolbar')",
      );
      await until("!document.querySelector('.td-skeletons, main .er-loading')");
      if (!route.includes("?")) {
        await evaluate("document.fonts.ready.then(()=>true)");
        const screenshot = await send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: false,
        });
        await writeFile(
          path.join(output, `${mode}-${route.split("/").pop()}.png`),
          Buffer.from(screenshot.data, "base64"),
        );
      }
    }
    async function mainLink(href) {
      await evaluate("window.scrollTo(0,0)");
      if (mode === "mobile") {
        await click('[aria-label="Mở menu"]');
        await until("!!document.querySelector('.mobile-menu-panel')");
      }
      await click(`${nav} a[href="${href}"]`);
      if (mode === "mobile") await until("!document.querySelector('.mobile-menu-panel')");
    }
    await mainLink("/employer/discover");
    await state("Tìm nhân tài", "all", "main menu click");
    await click('main .section-tab[href*="collection=interested"]');
    await state("Tìm nhân tài", "interested", "interested tab click");
    await click('main .section-tab[href*="collection=saved"]');
    await state("Tìm nhân tài", "saved", "saved tab click");
    await evaluate("history.back()");
    await state("Tìm nhân tài", "interested", "Back collection");
    await evaluate("history.forward()");
    await state("Tìm nhân tài", "saved", "Forward collection");
    await until("!!document.querySelector('.td-pool-note a')");
    await click(".td-pool-note a");
    await state("Tìm nhân tài", "saved", "saved management link");
    await mainLink("/employer/candidates");
    await state("Quản lý CV", "applications", "main CV menu click");
    await click('main .section-tab[href="/employer/interviews"]');
    await state("Quản lý CV", "interviews", "interview tab click");
    await evaluate("history.back()");
    await state("Quản lý CV", "applications", "Back applications");
    await evaluate("history.forward()");
    await state("Quản lý CV", "interviews", "Forward interviews");
    await evaluate("history.back();");
    await state("Quản lý CV", "applications", "Back CV area");
    await evaluate("history.back();");
    await state("Tìm nhân tài", "saved", "Back across areas");
  }
  assert.deepEqual(errors, [], "no browser runtime exceptions");
  await writeFile(
    path.join(output, "browser-result.json"),
    JSON.stringify(
      { passed: true, checks, errors, api: "isolated fixtures; no database writes" },
      null,
      2,
    ),
  );
  console.log(`PASS ${checks.length} browser assertions, no runtime exceptions`);
  await send("Browser.close");
} finally {
  socket?.close();
  browser.kill();
  server.kill();
}
