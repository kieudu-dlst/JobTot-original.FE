// Real React + ASP.NET controllers/services, isolated InMemory DB and provider fixtures.
// Build FE and BE/tools/ExternalAuthChecks first, then run from FE with the fixture server on 5199.
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const origin = "http://127.0.0.1:5199";
const runId = Date.now().toString();
const output = path.resolve("../.artifacts/external-auth-checks");
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
const checks = [],
  errors = [];
const authRequests = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
  assert.ok((await fetch(`${origin}/login`)).ok, "fixture server started");
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })
  ).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let nextId = 0;
  const pending = new Map(),
    events = new Map();
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
      const id = ++nextId,
        timer = setTimeout(() => reject(new Error(`CDP timed out: ${method}`)), 30000);
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
    for (let i = 0; i < 250; i++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await sleep(50);
    }
    throw new Error(
      `Timed out ${expression}\n${await evaluate("JSON.stringify({body:document.body.innerText.slice(0,1500),otpLength:document.querySelector('input[autocomplete=one-time-code]')?.value.length,button:(()=>{const e=document.querySelector('form button[type=submit]');if(!e)return null;const r=e.getBoundingClientRect();return {disabled:e.disabled,x:r.x,y:r.y,width:r.width,height:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,120)}})()})")}\n${JSON.stringify(authRequests.slice(-12))}`,
    );
  }
  async function check(expression, name) {
    assert.ok(
      await evaluate(expression),
      `${name}: ${await evaluate("document.body.innerText.slice(0,1200)")}`,
    );
    checks.push(name);
    console.log(`PASS ${name}`);
  }
  async function click(selector) {
    await until(
      `!!document.querySelector(${JSON.stringify(selector)}) && !document.querySelector(${JSON.stringify(selector)}).disabled`,
    );
    const point = await evaluate(
      `(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el)throw Error('Missing ${selector}'); el.scrollIntoView({behavior:'instant',block:'center',inline:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`,
    );
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
  async function fill(selector, value) {
    await evaluate(
      `(() => {const el=document.querySelector(${JSON.stringify(selector)});const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
  }
  async function navigate(url, clean = false) {
    if (clean) await evaluate("sessionStorage.clear();localStorage.clear()");
    await send("Page.navigate", { url: origin + url });
    await until(
      `location.href===${JSON.stringify(origin + url)} && document.readyState==='complete'`,
    );
  }
  async function screenshot(name) {
    await evaluate("window.scrollTo(0,0);document.fonts.ready.then(()=>true)");
    const value = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(path.join(output, name + ".png"), Buffer.from(value.data, "base64"));
  }
  async function consent(code, cancel = false) {
    await until("!!document.querySelector('#approve')");
    if (!cancel)
      await evaluate(
        `(() => {const a=document.querySelector('#approve'),u=new URL(a.href);u.searchParams.set('code',${JSON.stringify(code)});a.href=u.href;})()`,
      );
    await click(cancel ? "#cancel" : "#approve");
    await until("location.pathname==='/auth/external' && !!document.querySelector('main h1')");
  }
  async function confirmAll() {
    const count = await evaluate("document.querySelectorAll('form button[role=checkbox]').length");
    for (let i = 0; i < count; i++)
      await click(
        `form button[role=checkbox]:nth-of-type(1)`.replace(
          ":nth-of-type(1)",
          `[data-check-index="${i}"]`,
        ),
      );
  }
  async function markCheckboxes() {
    await evaluate(
      "document.querySelectorAll('form button[role=checkbox]').forEach((el,i)=>el.dataset.checkIndex=i)",
    );
    await confirmAll();
  }
  async function logged(role, name) {
    await until(
      `!!(sessionStorage.getItem('jobtot.${role}.tokens') || localStorage.getItem('jobtot.${role}.tokens'))`,
    );
    await check(
      `(async()=>{const token=JSON.parse(sessionStorage.getItem('jobtot.${role}.tokens') || localStorage.getItem('jobtot.${role}.tokens')).accessToken;const r=await fetch('/api/${role}/auth/me',{headers:{Authorization:'Bearer '+token}});return r.status===200 && (await r.json()).accountType===${JSON.stringify(role === "candidate" ? "Candidate" : "Employer")};})()`,
      name,
    );
  }
  events.set("Runtime.exceptionThrown", (event) => errors.push(event.exceptionDetails));
  events.set("Network.requestWillBeSent", (event) => {
    if (event.request.url.includes("/auth/"))
      authRequests.push(new URL(event.request.url).pathname);
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
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
    for (const role of ["candidate", "employer"]) {
      for (const route of ["login", "register"]) {
        await navigate(`/${route}?role=${role}`);
        await until("document.querySelectorAll('.social-auth-button').length===1");
        await check(
          `document.querySelector('.social-auth-google').textContent.includes('${route === "register" ? "Đăng ký" : "Đăng nhập"} bằng Google') && !document.querySelector('.social-auth-facebook, .social-auth-linkedin')`,
          `${mode} ${role} ${route}: Google is the only social authentication button`,
        );
        await check(
          "(() => {const button=document.querySelector('.social-auth-google').getBoundingClientRect();const container=document.querySelector('.social-auth-buttons').getBoundingClientRect();return Math.abs(button.width-container.width)<2 && button.height>=48 && document.documentElement.scrollWidth<=innerWidth;})()",
          `${mode} ${role} ${route}: Google fills the available width without overflow`,
        );
        await check(
          "!!document.querySelector('form input[type=password]')",
          `${mode} ${role} ${route}: email and password fields remain available`,
        );
        await screenshot(`${mode}-${role}-${route}`);
      }
    }
    {
      const provider = "google";
      await navigate("/register", true);
      await until("!!document.querySelector('.social-auth-google')");
      await click(`.social-auth-${provider}`);
      const code = `${provider}-candidate-${mode}-${runId}`;
      await consent(code);
      await until("!!document.querySelector('form #fullName')");
      await check(
        "document.querySelectorAll('form input[type=password]').length===0",
        `${mode} ${provider}: external registration does not ask for a new password`,
      );
      await markCheckboxes();
      await click("form button[type=submit]");
      await logged("candidate", `${mode} ${provider}: register end to end`);
      await navigate("/login", true);
      await until("!!document.querySelector('.social-auth-google')");
      await click(`.social-auth-${provider}`);
      await consent(code);
      await until("!!document.querySelector('.external-auth-actions button:not([role=checkbox])')");
      await click(".external-auth-actions button:not([role=checkbox])");
      await logged("candidate", `${mode} ${provider}: linked login end to end`);
    }
    await navigate("/register?role=employer", true);
    await until("!!document.querySelector('.social-auth-google')");
    await click(".social-auth-google");
    await consent(`google-employer-${mode}-${runId}`);
    await until(
      "!!document.querySelector('form #companyName') && document.querySelector('#headOfficeProvinceId option[value]')",
    );
    await fill("#workPhone", `09${runId.slice(-7)}${mode === "desktop" ? "1" : "2"}`);
    await fill("#companyName", `Công ty ${mode}`);
    await fill("#taxCode", `0${runId.slice(-8)}${mode === "desktop" ? "1" : "2"}`);
    await fill("#headOfficeProvinceId", "00000000-0000-0000-0000-000000000001");
    await markCheckboxes();
    await click("form button[type=submit]");
    await logged("employer", `${mode}: employer Google completes required company information`);
    await navigate("/login?role=employer", true);
    await until("!!document.querySelector('.social-auth-google')");
    await click(".social-auth-google");
    await consent(`google-employer-${mode}-${runId}`);
    await until("!!document.querySelector('.external-auth-actions button:not([role=checkbox])')");
    await click(".external-auth-actions button:not([role=checkbox])");
    await logged("employer", `${mode}: employer Google login`);
    // Provider email already belongs to the existing Google account: authenticate that
    // account using its original provider, return to the pending flow, then confirm linking.
    await navigate("/register", true);
    await until("!!document.querySelector('.social-auth-google')");
    await click(".social-auth-google");
    await consent(`google-candidate-${mode}-${runId}-alias`);
    await until("document.body.innerText.includes('Email đã có tài khoản Job Tốt')");
    await check(
      "!sessionStorage.getItem('jobtot.candidate.tokens')",
      `${mode}: duplicate email never signs in or creates an account automatically`,
    );
    await click(".external-auth-actions button:not([role=checkbox])");
    await click('main a[href^="/login?role="]');
    await until("!!document.querySelector('.social-auth-google')");
    await click(".social-auth-google");
    await consent(`google-candidate-${mode}-${runId}`);
    await until("!!document.querySelector('.external-auth-actions button:not([role=checkbox])')");
    await click(".external-auth-actions button:not([role=checkbox])");
    await until(
      "document.querySelector('.external-auth-actions')?.textContent.includes('Xác nhận liên kết với')",
    );
    await click(".external-auth-actions button:not([role=checkbox])");
    await logged(
      "candidate",
      `${mode}: duplicate email links only after authenticating the existing account and confirming`,
    );
    for (const role of ["candidate", "employer"]) {
      const employer = role === "employer";
      const email = `email.${role}.${mode}.${runId}@checks.example`;
      await navigate(`/register?role=${role}`, true);
      await until("!!document.querySelector('form #fullName')");
      await fill("#fullName", "Tài khoản email kiểm thử");
      await fill(employer ? "#email" : "#identity", email);
      await fill("#password", "Password123!");
      await fill("#confirmPassword", "Password123!");
      if (employer) {
        await until("!document.querySelector('#headOfficeProvinceId').disabled");
        await fill("#workPhone", `09${runId.slice(-7)}${mode === "desktop" ? "5" : "6"}`);
        await fill("#companyName", `Công ty email ${mode}`);
        await fill("#taxCode", `0${runId.slice(-8)}${mode === "desktop" ? "5" : "6"}`);
        await fill("#headOfficeProvinceId", "00000000-0000-0000-0000-000000000001");
        await markCheckboxes();
      }
      await click("form button[type=submit]");
      await until("!!document.querySelector('input[autocomplete=one-time-code]')");
      const otp = (
        await (await fetch(`${origin}/checks/mail?email=${encodeURIComponent(email)}`)).json()
      ).code;
      await fill("input[autocomplete=one-time-code]", otp);
      await check(
        `document.documentElement.scrollWidth<=${width}`,
        `${mode} ${role}: email OTP stays within viewport`,
      );
      await click("form button[type=submit]");
      await logged(role, `${mode} ${role}: email/password registration and OTP end to end`);
      await navigate(`/login?role=${role}`, true);
      await until(`!!document.querySelector('form ${employer ? "#email" : "#identity"}')`);
      await fill(employer ? "#email" : "#identity", email);
      await fill("#password", "Password123!");
      await click("form button[type=submit]");
      await logged(role, `${mode} ${role}: email/password login end to end`);
      await navigate(`/login?role=${role}`, true);
      await until("!!document.querySelector('.social-auth-google')");
      await click(".social-auth-google");
      await consent(`email-${role}-${mode}-${runId}`);
      await until("document.body.innerText.includes('Email đã có tài khoản Job Tốt')");
      await click(".external-auth-actions button:not([role=checkbox])");
      await until("!!document.querySelector('form button[data-slot=dialog-trigger]')");
      await click("form button[data-slot=dialog-trigger]");
      await until("!!document.querySelector('#recovery-email')");
      await fill("#recovery-email", email);
      await click("[role=dialog] button[type=submit]");
      await until(
        "document.querySelector('[role=dialog] [role=status]')?.textContent.includes('30 phút')",
      );
      await click("[role=dialog] button[data-slot=dialog-close]");
      await until("!document.querySelector('[role=dialog]')");
      const temporary = (
        await (
          await fetch(`${origin}/checks/temporary-password?email=${encodeURIComponent(email)}`)
        ).json()
      ).password;
      await fill(employer ? "#email" : "#identity", email);
      await fill("#password", temporary);
      await markCheckboxes();
      await click("form button[type=submit]");
      await until(
        "document.querySelectorAll('main form input[autocomplete=new-password]').length===2",
      );
      await fill("main form input[autocomplete=new-password]:first-of-type", "ChangedPassword123!");
      await evaluate(
        "document.querySelectorAll('main form input[autocomplete=new-password]').forEach((el,i)=>el.dataset.passwordIndex=i)",
      );
      await fill('main form input[data-password-index="1"]', "ChangedPassword123!");
      await click("form button[type=submit]");
      await logged(
        role,
        `${mode} ${role}: forgot password, temporary password change and external linking end to end`,
      );
    }
    await navigate("/login", true);
    await until("!!document.querySelector('.social-auth-google')");
    await click(".social-auth-google");
    await consent("unused", true);
    await until("document.body.innerText.includes('Bạn đã hủy xác thực')");
    await check(
      "document.body.innerText.includes('Bạn đã hủy xác thực') && !sessionStorage.getItem('jobtot.candidate.tokens')",
      `${mode}: canceled authentication has Vietnamese feedback and no session`,
    );
    await screenshot(`${mode}-cancel`);
    await navigate("/register", true);
    await until("!!document.querySelector('.social-auth-google')");
    await click(".social-auth-google");
    await consent("missing");
    await until("!!document.querySelector('form #fullName')");
    await click("form button[type=submit]");
    await check(
      "document.querySelector('#fullName-error') && document.querySelector('#identity-error') && !sessionStorage.getItem('jobtot.candidate.tokens')",
      `${mode}: missing profile information must be completed before registration`,
    );
    await navigate("/login", true);
    await until("!!document.querySelector('.social-auth-google')");
    await click(".social-auth-google");
    await consent("provider-error");
    await until("document.body.innerText.includes('Không thể xác thực kết quả từ nhà cung cấp')");
    await check(
      "!sessionStorage.getItem('jobtot.candidate.tokens')",
      `${mode}: provider errors display Vietnamese feedback without a session`,
    );
    await navigate("/login", true);
    await until("!!document.querySelector('.social-auth-google')");
    events.set("Fetch.requestPaused", ({ requestId }) => {
      void send("Fetch.fulfillRequest", {
        requestId,
        responseCode: 503,
        responseHeaders: [{ name: "Content-Type", value: "application/json" }],
        body: Buffer.from(
          JSON.stringify({
            detail: "Google chưa được cấu hình. Vui lòng sử dụng email hoặc thử lại sau.",
          }),
        ).toString("base64"),
      });
    });
    await send("Fetch.enable", {
      patterns: [{ urlPattern: "*/api/candidate/auth/external/google/start" }],
    });
    await click(".social-auth-google");
    await until(
      "document.querySelector('.social-auth-message')?.textContent.includes('Google chưa được cấu hình')",
    );
    await check(
      "!!document.querySelector('form #password')",
      `${mode}: unconfigured provider explains the error and keeps email login available`,
    );
    await send("Fetch.disable");
  }
  assert.deepEqual(errors, [], "no browser runtime exceptions");
  await writeFile(
    path.join(output, "browser-result.json"),
    JSON.stringify(
      { passed: true, checks, errors, providers: "local fixtures, not live accounts" },
      null,
      2,
    ),
  );
  console.log(`PASS ${checks.length} browser assertions; no runtime exceptions`);
  await send("Browser.close");
} finally {
  socket?.close();
  browser.kill();
}
