// Browser smoke test using Chrome DevTools Protocol; no test dependency is added.
// Run from FE: node tests/cv-decoration-browser.mjs
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const output = path.resolve("../.artifacts/cv-decoration-checks");
await mkdir(output, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = path.join(output, `chrome-${Date.now()}`);
const browser = spawn(
  process.env.CV_CHECK_CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe",
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
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5181", "--strictPort"],
  { windowsHide: true, stdio: "ignore" },
);
let socket;
const check = (value, name) => {
  assert.ok(value, name);
  console.log(`PASS ${name}`);
};
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
      if ((await fetch("http://127.0.0.1:5181/tests/cv-decorations.html")).ok) break;
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
  const errors = [];
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
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP timed out: ${method}`));
      }, 30000);
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
    for (let i = 0; i < 150; i++) {
      if (await evaluate(expression)) return;
      await sleep(50);
    }
    throw new Error(`Timed out: ${expression}`);
  }
  async function reload() {
    const loaded = new Promise((resolve) => events.set("Page.loadEventFired", resolve));
    await send("Page.reload");
    await loaded;
  }
  events.set("Runtime.exceptionThrown", (event) => errors.push(event.exceptionDetails));
  await send("Page.enable");
  await send("Runtime.enable");
  await send("DOM.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1300,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  // Generate real alpha PNG/JPEG/WebP fixtures with the browser's encoders.
  for (const [extension, mime] of [
    ["png", "image/png"],
    ["jpg", "image/jpeg"],
    ["webp", "image/webp"],
  ]) {
    const data = await evaluate(
      `(() => { const c = document.createElement('canvas'); c.width = 80; c.height = 40; const ctx=c.getContext('2d'); ctx.fillStyle='#ff5722';ctx.beginPath();ctx.arc(20,20,15,0,Math.PI*2);ctx.fill();return c.toDataURL('${mime}').split(',')[1]; })()`,
    );
    await writeFile(
      path.join(output, extension === "png" ? "transparent.png" : `image.${extension}`),
      Buffer.from(data, "base64"),
    );
  }
  const png = (await readFile(path.join(output, "transparent.png"))).toString("base64");
  await writeFile(path.join(output, "invalid.txt"), "not an image");
  await writeFile(path.join(output, "oversize.png"), Buffer.alloc(2 * 1024 * 1024 + 1));
  events.set("Fetch.requestPaused", ({ requestId }) => {
    void send("Fetch.fulfillRequest", {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: "image/png" }],
      body: png,
    });
  });
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/uploads/cv-decorations/*" }] });
  await send("Page.navigate", { url: "http://127.0.0.1:5181/tests/cv-decorations.html" });
  await until(
    "!!window.cvCheck && document.querySelectorAll('.cv-editor .cv-page-slot').length > 0",
  );
  await evaluate("document.fonts.ready.then(()=>true)");
  await evaluate("localStorage.removeItem('cv-decoration-check')");
  await evaluate(
    "[...document.querySelectorAll('.cv-editor-tabs button')].find(b=>b.textContent.includes('Ảnh trang trí')).click()",
  );
  check(
    await evaluate(
      "document.querySelector('.cv-decoration-panel').textContent.includes('Thêm họa tiết')",
    ),
    "empty image guidance",
  );
  async function upload(name) {
    const { root } = await send("DOM.getDocument");
    const { nodeId } = await send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: ".cv-decoration-panel input[type=file]",
    });
    await send("DOM.setFileInputFiles", { nodeId, files: [path.join(output, name)] });
  }
  await upload("invalid.txt");
  await until(
    "document.querySelector('.cv-decoration-panel [role=alert]')?.textContent.includes('Chọn ảnh')",
  );
  check(true, "FE rejects unsupported format");
  await upload("oversize.png");
  await until(
    "document.querySelector('.cv-decoration-panel [role=alert]')?.textContent.includes('2 MB')",
  );
  check(true, "FE rejects oversized file");
  await upload("transparent.png");
  await until("window.cvCheck.doc.decorationImages.length === 1 && !window.cvCheck.busy");
  await until("document.querySelector('.cv-editor .cv-decoration-image')?.naturalWidth === 80");
  check(true, "upload appears immediately and decodes");
  async function drag(selector, dx, dy) {
    const rect = await evaluate(
      `(() => { const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`,
    );
    await send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: rect.x,
      y: rect.y,
      button: "left",
      clickCount: 1,
    });
    for (let i = 1; i <= 5; i++)
      await send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: rect.x + (dx * i) / 5,
        y: rect.y + (dy * i) / 5,
        button: "left",
        buttons: 1,
      });
    await send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: rect.x + dx,
      y: rect.y + dy,
      button: "left",
      clickCount: 1,
    });
  }
  const before = await evaluate("window.cvCheck.doc.decorationImages[0]");
  await drag(".cv-editor .cv-decoration-hit", -65, -40);
  const moved = await evaluate("window.cvCheck.doc.decorationImages[0]");
  check(moved.x < before.x && moved.y < before.y, "pointer drag changes page coordinates");
  await drag(".cv-editor .cv-decoration-resize", 30, 15);
  const resized = await evaluate("window.cvCheck.doc.decorationImages[0]");
  check(
    resized.width > moved.width && Math.abs(resized.width / resized.height - 2) < 0.001,
    "resize handle preserves aspect ratio",
  );
  await drag(".cv-editor .cv-decoration-hit", -5000, -5000);
  check(
    await evaluate(
      "window.cvCheck.doc.decorationImages[0].x === 0 && window.cvCheck.doc.decorationImages[0].y === 0",
    ),
    "drag clamps at page edge",
  );
  await evaluate(
    "window.cvCheck.setDoc(d=>({...d,decorationImages:d.decorationImages.map(i=>({...i,x:120,y:240,opacity:0.4,zIndex:2,page:2}))}))",
  );
  await until("document.querySelectorAll('.cv-editor .cv-page-slot').length===2");
  const snapshot = await evaluate("JSON.stringify(window.cvCheck.doc)");
  await evaluate("document.querySelector('#save').click()");
  await reload();
  await until(
    "!!window.cvCheck && document.querySelectorAll('.cv-editor .cv-page-slot').length===2",
  );
  check(
    (await evaluate("JSON.stringify(window.cvCheck.doc)")) === snapshot,
    "save/reload preserves all image metadata",
  );
  const ratio = await evaluate(
    "(() => {const i=document.querySelector('.cv-editor .cv-decoration-image').getBoundingClientRect();const p=document.querySelector('.cv-editor .cv-sheet[data-page=\"2\"]').getBoundingClientRect();return {x:(i.x-p.x)/p.width,y:(i.y-p.y)/p.height};})()",
  );
  await send("Emulation.setDeviceMetricsOverride", {
    width: 620,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(150);
  const mobile = await evaluate(
    "(() => {const i=document.querySelector('.cv-editor .cv-decoration-image').getBoundingClientRect();const p=document.querySelector('.cv-editor .cv-sheet[data-page=\"2\"]').getBoundingClientRect();return {x:(i.x-p.x)/p.width,y:(i.y-p.y)/p.height};})()",
  );
  check(
    Math.abs(ratio.x - mobile.x) < 0.001 && Math.abs(ratio.y - mobile.y) < 0.001,
    "resize viewport preserves normalized position",
  );
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1300,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  // Long sections and each layout exercise text pagination, including split sections.
  for (const layout of ["one-column", "two-column", "sidebar", "bento"]) {
    await evaluate(
      `window.cvCheck.setDoc(d=>({...d,layout:${JSON.stringify(layout)},sections:d.sections.map((s,i)=>({...s,body:(i===1?'Kinh nghiệm phát triển phần mềm và phối hợp nhóm.\\n'.repeat(150):s.body)}))}))`,
    );
    await sleep(250);
    await until(
      "[...document.querySelectorAll('.cv-editor .cv-pages,.cv-print-document .cv-pages')].every(p=>p.getAttribute('aria-busy')==='false')",
    );
    const result = await evaluate(
      "(() => {const pages=[...document.querySelectorAll('.cv-print-document .cv-page-slot')]; return {pages:pages.length,overflow:pages.some(p=>{const c=p.querySelector('.cv-page-content');return c.getBoundingClientRect().bottom > p.querySelector('.cv-sheet').getBoundingClientRect().bottom+1;}),text:pages.map(p=>p.textContent).join('')};})()",
    );
    console.log(`${layout}: ${result.pages} pages, overflow=${result.overflow}`);
    check(
      result.pages > 1 && !result.overflow,
      `${layout} paginates long sections within A4 bounds`,
    );
    const editOverflow = await evaluate(
      "[...document.querySelectorAll('.cv-editor .cv-page-slot')].some(p=>p.querySelector('.cv-page-content').getBoundingClientRect().bottom > p.querySelector('.cv-sheet').getBoundingClientRect().bottom+1)",
    );
    if (editOverflow)
      console.log(
        await evaluate(
          "JSON.stringify(['.cv-editor','.cv-print-document'].map(sel=>({sel,pages:[...document.querySelectorAll(sel+' .cv-page-slot')].map(p=>({height:p.querySelector('.cv-sheet').clientHeight,content:p.querySelector('.cv-page-content').clientHeight,header:p.querySelector('.cv-paper-header')?.clientHeight,sections:[...p.querySelectorAll('.cv-paper-section')].map(s=>({height:s.clientHeight,title:s.querySelector('.cv-paper-section-title').clientHeight,body:s.querySelector('.cv-paper-body').clientHeight,last:s.querySelector('textarea.cv-editable:not(.cv-paper-section-title)')?.value.slice(-4)}))}))})))",
        ),
      );
    check(!editOverflow, `${layout} editable content stays inside the same page bounds`);
    check(
      (result.text.match(/Kinh nghiệm/g) || []).length === 150,
      `${layout} pagination preserves all text`,
    );
  }
  await evaluate("window.cvCheck.setDoc(d=>({...d,layout:'one-column'}))");
  await sleep(200);
  const screenshot = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(path.join(output, "editor.png"), Buffer.from(screenshot.data, "base64"));
  await send("Emulation.setEmulatedMedia", { media: "print" });
  check(
    await evaluate(
      "[...document.querySelectorAll('.cv-decoration-hit,.cv-decoration-resize')].every(e=>getComputedStyle(e).display==='none')",
    ),
    "print hides selection and resize controls",
  );
  const pageCount = await evaluate(
    "document.querySelectorAll('.cv-print-document .cv-page-slot').length",
  );
  const pdf = await send("Page.printToPDF", {
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  });
  await writeFile(path.join(output, "cv.pdf"), Buffer.from(pdf.data, "base64"));
  await writeFile(path.join(output, "expected-pages.json"), JSON.stringify({ pageCount }));
  console.log(`PDF exported: ${pageCount} expected A4 pages`);
  await send("Emulation.setEmulatedMedia", { media: "screen" });
  await evaluate(
    "[...document.querySelectorAll('.cv-editor-tabs button')].find(b=>b.textContent.includes('Ảnh trang trí')).click()",
  );
  for (let i = 1; i < 5; i++) {
    await upload("transparent.png");
    await until(`window.cvCheck.doc.decorationImages.length === ${i + 1} && !window.cvCheck.busy`);
  }
  check(
    await evaluate(
      "[...document.querySelectorAll('.cv-decoration-panel button')].find(b=>b.textContent.includes('Thêm ảnh')).disabled",
    ),
    "add disabled at five images",
  );
  await evaluate(
    "document.querySelector('.cv-decoration-list button[aria-label^=\"Xóa ảnh\"]').click()",
  );
  await until("window.cvCheck.doc.decorationImages.length===4 && !window.cvCheck.busy");
  await evaluate("document.querySelector('#save').click()");
  await reload();
  await until("window.cvCheck?.doc.decorationImages.length===4");
  check(
    await evaluate(
      "document.querySelectorAll('.cv-print-document .cv-decoration-image').length===4 && document.querySelectorAll('#thumbnail .cv-decoration-image').length===4",
    ),
    "delete/save/reload reflected in print and thumbnail",
  );
  check(errors.length === 0, `no browser runtime exceptions (${errors.length})`);
  await writeFile(
    path.join(output, "browser-result.json"),
    JSON.stringify({ passed: true, pageCount, errors }, null, 2),
  );
  await send("Browser.close");
} finally {
  socket?.close();
  browser.kill();
  server.kill();
}
