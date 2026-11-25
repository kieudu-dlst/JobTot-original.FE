import test from "node:test";
import assert from "node:assert/strict";
import {
  searchCareer,
  CareerError,
  createSearchRunner,
  citationView,
  safeSourceUrl,
  selectCareerRole,
  retrySeconds,
  suggestionsDocument,
} from "../src/pages/ai-career-search/model/career-search.js";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { tmpdir } from "node:os";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { readCvImage, MAX_CV_IMAGE_BYTES } from "../src/pages/ai-career-search/model/cv-image.js";

const response = (status, data, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
const result = {
  answer: "Kỹ năng 😀 **.NET**",
  sources: [{ id: "s1", title: "Tài liệu", url: "https://example.com/a" }],
  citationIndexUnit: "utf16",
  citations: [{ startIndex: 8, endIndex: 10, text: "😀", sourceIds: ["s1"] }],
  groundingStatus: "grounded",
};
test("role selection honors explicit context even with two sessions", () => {
  assert.equal(selectCareerRole("employer", {}, {}), "employer");
  assert.equal(selectCareerRole("candidate", {}, {}), "candidate");
  assert.equal(selectCareerRole(null, null, {}), "employer");
  assert.equal(selectCareerRole(null, {}, {}), "candidate");
});
test("one generation POST after session check, with replay disabled and no history", async () => {
  const calls = [];
  const controller = new AbortController();
  const data = await searchCareer(
    "Kỹ năng backend?",
    controller.signal,
    async (path, options, flags) => {
      calls.push({ path, options, flags });
      return response(200, path === "auth/me" ? {} : result);
    },
  );
  assert.equal(data.answer, result.answer);
  assert.equal(calls.length, 2);
  assert.deepEqual(JSON.parse(calls[1].options.body), { question: "Kỹ năng backend?" });
  assert.deepEqual(calls[1].flags, { apiRoot: true, retry: false });
  assert.equal(calls[1].options.signal, controller.signal);
});
for (const [status, code] of [
  [401, "ai_unauthenticated"],
  [429, "ai_busy"],
  [503, "ai_provider_quota"],
  [503, "ai_provider_unavailable"],
  [503, "ai_configuration"],
  [504, "ai_timeout"],
]) {
  test(`safe error for ${status}/${code}, without retry`, async () => {
    let posts = 0;
    await assert.rejects(
      searchCareer("Question", new AbortController().signal, async (path) => {
        if (path === "auth/me") return response(200, {});
        posts++;
        return response(status, { code, detail: "RAW SECRET STACK" }, { "Retry-After": "12" });
      }),
      (error) => error.code === code && !error.message.includes("RAW") && error.retryAfter === 12,
    );
    assert.equal(posts, 1);
  });
}
test("invalid question never calls backend", async () => {
  for (const q of [" ", "x".repeat(2001)])
    await assert.rejects(
      searchCareer(q, new AbortController().signal, () => {
        throw new Error("must not call");
      }),
      (e) => e.code === "ai_invalid_question",
    );
});

test("only the current attached CV image is sent, without filename or preview metadata", async () => {
  const requests = [];
  const image = { mimeType: "image/png", data: "fixture-base64", name: "private-name.png", preview: "data:image/png;base64,fixture-base64" };
  const fetch = async (path, options) => { if (path === "auth/me") return response(200, {}); requests.push(JSON.parse(options.body)); return response(200, result); };
  await searchCareer("Review my CV", new AbortController().signal, fetch, image);
  await searchCareer("New question", new AbortController().signal, fetch);
  assert.deepEqual(requests, [{ question: "Review my CV", image: { mimeType: "image/png", data: "fixture-base64" } }, { question: "New question" }]);
  for (const file of [{ type: "application/pdf", size: 100 }, { type: "image/png", size: MAX_CV_IMAGE_BYTES + 1 }, { type: "image/jpeg", size: 0 }])
    await assert.rejects(readCvImage(file), /5 MB/);
});
test("configuration failures distinguish local validation from safe Google rejection metadata", async () => {
  for (const [diagnostic, expected] of [
    [{ failureStage: "key_validation" }, "định dạng"],
    [{ failureStage: "provider_http", providerStatus: 401 }, "xác thực"],
    [{ failureStage: "provider_http", providerStatus: 403 }, "quyền"],
    [{ failureStage: "provider_http", providerStatus: 404 }, "model"],
    [
      { failureStage: "provider_http", providerStatus: 400, providerReason: "SERVICE_DISABLED" },
      "chưa được bật",
    ],
    [
      { failureStage: "provider_http", providerStatus: 400, providerReason: "API_KEY_INVALID" },
      "không hợp lệ",
    ],
    [
      { failureStage: "provider_http", providerStatus: 400, providerReason: "SECRET_VALUE" },
      "tham số",
    ],
    [{ failureStage: "__proto__", providerReason: "__proto__" }, "chưa sẵn sàng"],
  ]) {
    let posts = 0;
    await assert.rejects(
      searchCareer("Kỹ năng?", new AbortController().signal, async (path) => {
        if (path === "auth/me") return response(200, {});
        posts++;
        return response(503, { code: "ai_configuration", detail: "SECRET_VALUE", ...diagnostic });
      }),
      (error) => error.message.includes(expected) && !error.message.includes("SECRET_VALUE"),
    );
    assert.equal(posts, 1);
  }
});
test("Google quota diagnostics distinguish a zero allowance from daily and per-minute limits", async () => {
  for (const [quotaViolations, expected] of [
    [[{ kind: "requests_per_minute", limit: 0 }], "bằng 0"],
    [[{ kind: "requests_per_day", limit: 500 }], "trong ngày"],
    [[{ kind: "tokens_per_minute", limit: 250000 }], "token mỗi phút"],
    [[{ kind: "requests_per_minute", limit: 15 }], "yêu cầu mỗi phút"],
    [[{ kind: "google_search", limit: 100 }], "Google Search"],
    [[{ kind: "SECRET_VALUE", limit: -1 }], "hạn mức"],
    [[{ kind: "__proto__" }], "hạn mức"],
  ]) {
    await assert.rejects(
      searchCareer("Kỹ năng?", new AbortController().signal, async (path) =>
        path === "auth/me"
          ? response(200, {})
          : response(503, { code: "ai_provider_quota", quotaViolations }),
      ),
      (error) => error.message.includes(expected) && !error.message.includes("SECRET_VALUE"),
    );
  }
});
test("network failure is separate from provider timeout", async () => {
  await assert.rejects(
    searchCareer("Question", new AbortController().signal, async () => {
      throw new TypeError("network");
    }),
    (e) => e.code === "network",
  );
});
test("abort propagates and a cancelled or stale answer cannot overwrite a newer answer", async () => {
  const pending = [];
  const runner = createSearchRunner(
    (question, signal) => new Promise((resolve) => pending.push({ question, signal, resolve })),
  );
  const old = runner.run("old");
  const recent = runner.run("new");
  assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve("new answer");
  assert.equal((await recent).question, "new");
  pending[0].resolve("old answer");
  assert.equal(await old, null);
  const cancelled = runner.run("cancel");
  runner.cancel();
  pending[2].resolve("late answer");
  assert.equal(await cancelled, null);
});
test("failed question is preserved independently from edited input", async () => {
  const runner = createSearchRunner(async () => {
    throw new CareerError("ai_timeout");
  });
  const failed = await runner.run("original question");
  assert.equal(failed.question, "original question");
  assert.equal(failed.error.code, "ai_timeout");
});
test("UTF-16 emoji, overlapping citations, unsafe sources and metadata mismatch", () => {
  const overlapping = {
    startIndex: 0,
    endIndex: 10,
    text: "Kỹ năng 😀",
    sourceIds: ["s1", "s1", "bad"],
  };
  const view = citationView({
    ...result,
    sources: [...result.sources, { id: "bad", title: "Bad", url: "javascript:alert(1)" }],
    citations: [
      ...result.citations,
      overlapping,
      { startIndex: 9, endIndex: 10, text: result.answer.slice(9, 10), sourceIds: ["s1"] },
    ],
  });
  assert.equal(view.sources.length, 1);
  assert.equal(view.citations.length, 2);
  assert.deepEqual(view.citations[1].sourceIds, ["s1"]);
  assert.equal(citationView({ ...result, citationIndexUnit: "bytes" }).citations.length, 0);
  assert.deepEqual(citationView({ answer: "No metadata" }), { sources: [], citations: [] });
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hi",
    "//example.com",
    "https://user:secret@example.com",
  ])
    assert.equal(safeSourceUrl(url), null);
});
test("Retry-After seconds and dates are bounded", () => {
  assert.equal(retrySeconds("30"), 30);
  assert.equal(retrySeconds("invalid"), 0);
  assert.equal(retrySeconds("Thu, 01 Jan 1970 00:01:00 GMT", 0), 60);
});
test("Markdown renders tables and code; answer HTML is never executed; source labels are escaped", async () => {
  const server = await createServer({
    cacheDir: path.join(tmpdir(), "jobtot-ai-render-checks"),
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true },
    appType: "custom",
  });
  try {
    const { CareerAnswer } = await server.ssrLoadModule(
      "/src/pages/ai-career-search/ui/career-answer.jsx",
    );
    const answer =
      "# Kỹ năng 😀\n\n| Kỹ năng | Mức độ |\n|---|---|\n| .NET | Cơ bản |\n\n```js\nconst x = 1;\n```\n\n<script>alert(1)</script>\n\n[x](javascript:alert%281%29)";
    const html = renderToStaticMarkup(
      React.createElement(CareerAnswer, {
        question: "Q",
        result: {
          ...result,
          answer,
          citations: [],
          sources: [{ id: "s1", title: "<script>bad</script>", url: "https://example.com" }],
        },
      }),
    );
    assert.ok(html.includes("<table>"));
    assert.ok(html.includes("<code"));
    assert.ok(!html.includes("<script>"));
    assert.ok(!html.includes('href="javascript:'));
    assert.ok(html.includes("&lt;script&gt;bad&lt;/script&gt;"));
    assert.ok(html.includes('rel="noopener noreferrer"'));
    const widget =
      '<style>.chip{color:red}</style><a href="https://google.com/search?q=skills">Search</a><script>bad()</script>';
    const isolated = renderToStaticMarkup(
      React.createElement(CareerAnswer, {
        question: "Q",
        result: { ...result, searchSuggestionsHtml: widget },
      }),
    );
    assert.ok(isolated.includes('sandbox="allow-popups allow-popups-to-escape-sandbox"'));
    assert.ok(!isolated.includes("allow-scripts"));
    assert.ok(!isolated.includes("allow-same-origin"));
    assert.ok(suggestionsDocument(widget).includes("script-src 'none'"));
    assert.ok(suggestionsDocument(widget).includes(widget));
    for (const groundingStatus of ["no_sources", "not_grounded"]) {
      const output = renderToStaticMarkup(
        React.createElement(CareerAnswer, {
          question: "Q",
          result: { answer: "Response", groundingStatus },
        }),
      );
      assert.ok(!output.includes("đã kiểm chứng"));
      assert.ok(output.includes("ai-grounding"));
    }
  } finally {
    await server.close();
  }
});

test("conversation clears sent input and sends only the next new question", async () => {
  const { Window } = await import("happy-dom");
  const window = new Window({
    url: "http://localhost",
    width: 1200,
    settings: {
      enableJavaScriptEvaluation: false,
      enableImageFileLoading: false,
      enableCSSFileLoading: false,
    },
  });
  const saved = new Map();
  const calls = [];
  let generations = 0;
  const historyId = "11111111-1111-4111-8111-111111111111";
  const storedMessages = [];
  for (const [key, value] of Object.entries({
    window,
    document: window.document,
    navigator: window.navigator,
    HTMLElement: window.HTMLElement,
    Event: window.Event,
    FileReader: window.FileReader,
    sessionStorage: window.sessionStorage,
    localStorage: window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
    fetch: async (url, options) => {
      const pathname = new URL(url, "http://localhost").pathname;
      calls.push({ pathname, options });
      if (pathname === "/api/candidate/auth/me") return response(200, {});
      if (pathname === "/api/ai/conversations") return response(200, generations ? [{ id: historyId, title: "Câu hỏi thứ nhất" }] : []);
      if (pathname === `/api/ai/conversations/${historyId}`) return response(200, { messages: storedMessages, hasMore: false });
      if (pathname.endsWith("/image")) return new Response(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jK1sAAAAASUVORK5CYII=", "base64"), {headers:{"Content-Type":"image/png"}});
      assert.equal(pathname, "/api/ai/career-search");
      const sent = JSON.parse(options.body);
      storedMessages.push({id:storedMessages.length+1,role:"user",content:sent.question,hasImage:!!sent.image,state:"Completed"});
      storedMessages.push({id:storedMessages.length+1,role:"assistant",content:result.answer,hasImage:false,state:"Completed"});
      return ++generations === 1
        ? response(504, { code: "ai_timeout", detail: "RAW STACK", conversationId:historyId })
        : response(200, {...result, conversationId:historyId, jobs: [{id:"11111111-1111-1111-1111-111111111111", title:"Public job", companyName:"Public company", location:"Ha Noi", url:"https://invalid.example"}]});
    },
  })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const server = await createServer({
    cacheDir: path.join(tmpdir(), "jobtot-ai-form-checks"),
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true },
    appType: "custom",
  });
  let root;
  try {
    const { createRoot } = await import("react-dom/client");
    const { act } = React;
    const { CareerSearchForm } = await server.ssrLoadModule(
      "/src/pages/ai-career-search/ui/career-search-page.jsx",
    );
    const { MemoryRouter } = await import("react-router-dom");
    const container = window.document.createElement("div");
    window.document.body.append(container);
    root = createRoot(container);
    window.sessionStorage.setItem("jobtot.candidate.tokens", JSON.stringify({accessToken:"fixture-only",refreshToken:"fixture-refresh"}));
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          {},
          React.createElement(CareerSearchForm, { employer: false, login: "/login" }),
        ),
      );
    });
    const input = window.document.querySelector("textarea");
    assert.equal(input.maxLength, 2000);
    assert.equal(input.id, window.document.querySelector('label[for="career-question"]').htmlFor);
    window.sessionStorage.setItem("jobtot.candidate.tokens", JSON.stringify({accessToken:"fixture-only",refreshToken:"fixture-refresh"}));
    async function send(text) {
      await act(async () => {input.value=text;input.dispatchEvent(new window.Event("input",{bubbles:true}));});
      await act(async () => {container.querySelector("form").dispatchEvent(new window.Event("submit",{bubbles:true,cancelable:true}));await new Promise(resolve=>setTimeout(resolve,30));});
      assert.equal(input.value, "");
    }
    await send("Câu hỏi thứ nhất");
    assert.ok(!container.textContent.includes("RAW STACK"));
    await send("Câu hỏi mới");
    const posts=calls.filter(call=>call.options.method === "POST");
    assert.deepEqual(posts.map(call=>JSON.parse(call.options.body)),[{question:"Câu hỏi thứ nhất"},{question:"Câu hỏi mới",conversationId:historyId}]);
    assert.equal(container.querySelectorAll(".ai-message--user").length,2);
    assert.equal(container.querySelectorAll(".ai-message--assistant").length,1);
    assert.equal(container.querySelector(".ai-job-result a").getAttribute("href"), "/jobs/11111111-1111-1111-1111-111111111111");
    assert.ok(container.querySelector(".ai-job-result").textContent.includes("Public company"));
    const imageInput = container.querySelector('input[type="file"]');
    const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jK1sAAAAASUVORK5CYII=";
    async function attach() {
      const transfer = new window.DataTransfer();
      transfer.items.add(new window.File([Buffer.from(png, "base64")], "cv.png", { type: "image/png" }));
      imageInput.files = transfer.files;
      await act(async () => {imageInput.dispatchEvent(new window.Event("change", { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 30));});
    }
    await attach();
    assert.ok(container.querySelector(".ai-image-preview img"));
    await act(async () => container.querySelector('button[aria-label="Xóa ảnh CV"]').click());
    assert.equal(container.querySelector(".ai-image-preview"), null);
    await attach();
    await act(async () => {container.querySelector("form").dispatchEvent(new window.Event("submit", {bubbles:true,cancelable:true}));await new Promise(resolve=>setTimeout(resolve,30));});
    assert.equal(container.querySelector(".ai-image-preview"), null);
    assert.ok(container.querySelector(".ai-sent-image"));
    const imagePost = JSON.parse(calls.filter(call => call.options.method === "POST")[2].options.body);
    assert.deepEqual(imagePost.image, {mimeType:"image/png",data:png});
    await send("Câu hỏi sau ảnh");
    assert.deepEqual(JSON.parse(calls.filter(call => call.options.method === "POST")[3].options.body), {question:"Câu hỏi sau ảnh",conversationId:historyId});
    await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent.includes("Cuộc trò chuyện mới")).click());
    assert.equal(container.querySelectorAll(".ai-message").length,0);
    const historyToggle = container.querySelector(".ai-history-toggle");
    await act(async () => historyToggle.click());
    assert.equal(historyToggle.getAttribute("aria-expanded"), "true");
    await act(async () => {container.querySelector(".ai-history-item").click();await new Promise(resolve=>setTimeout(resolve,50));});
    assert.equal(historyToggle.getAttribute("aria-expanded"), "false");
    assert.equal(container.querySelector('.ai-history-item[aria-current="page"]').title, "Câu hỏi thứ nhất");
    assert.equal(container.querySelectorAll(".ai-message--user").length,4);
    assert.equal(container.querySelectorAll(".ai-message--assistant").length,4);
    assert.ok(container.querySelector(".ai-sent-image").src.startsWith("blob:"));
    assert.equal(calls.filter(call => call.options.method === "POST").length,4,"opening history must not replay a generation");
    assert.equal(window.localStorage.length,0);
    const stylesheet=await readFile(new URL("../src/pages/ai-career-search/ui/career-search.css",import.meta.url),"utf8");
    assert.ok(!stylesheet.includes(".ai-page button"));
    assert.match(stylesheet, /max-width:\s*640px/);
    const style = window.document.createElement("style");
    style.textContent = stylesheet;
    window.document.head.append(style);
    window.happyDOM.setViewport({width:1400,height:900});
    const layout = container.querySelector(".ai-conversation");
    assert.ok(window.getComputedStyle(layout).gridTemplateAreas.includes("history chat"));
    const employerMarkup = renderToStaticMarkup(React.createElement(MemoryRouter,{},React.createElement(CareerSearchForm,{employer:true,login:"/login"})));
    assert.ok(employerMarkup.includes("ai-conversation--employer"));
    layout.classList.replace("ai-conversation--candidate","ai-conversation--employer");
    assert.ok(window.getComputedStyle(layout).gridTemplateAreas.includes("chat history"));
    layout.classList.replace("ai-conversation--employer","ai-conversation--candidate");
    window.happyDOM.setViewport({width:390,height:844});
    assert.equal(window.getComputedStyle(container.querySelector(".ai-history-sidebar")).display,"none");
    await act(async () => historyToggle.click());
    assert.equal(window.getComputedStyle(container.querySelector(".ai-history-sidebar")).display,"flex");
    assert.equal(container.querySelector(".ai-history-delete"), null);
    await act(async () => root.unmount());
    root = null;
  } finally {
    if (root) await React.act(async () => root.unmount());
    await server.close();
    await window.happyDOM.close();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
