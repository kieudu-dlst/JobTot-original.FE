import test from "node:test";
import assert from "node:assert/strict";
import { createChatSocket } from "../src/pages/messages/model/chat-socket.js";

test("missing backend endpoint is reported as a version mismatch, not invalid credentials", async () => {
  const events = [];
  const client = createChatSocket(false, { request: async () => ({ ok: false, status: 404 }), baseUrl: "http://localhost" });
  client.subscribe(event => events.push(event));
  client.start();
  await assert.rejects(client.invoke("send", "conversation", {}), /endpoint chat WebSocket/);
  assert.ok(events.some(event => event.type === "error" && event.message.includes("khởi động lại")));
  client.stop();
});

globalThis.window = Object.assign(new EventTarget(), { location: { origin: "http://localhost" } });
class Socket {
  static instances = [];
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    Socket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen();
    });
  }
  send(text) {
    const command = JSON.parse(text);
    this.last = command;
    if (command.type === "send")
      queueMicrotask(() =>
        this.onmessage({
          data: JSON.stringify({ type: "result", id: command.id, ok: true, data: command.data }),
        }),
      );
  }
  close() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.onclose();
  }
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
test("employers connect to the same chat endpoint and disconnect on logout", async () => {
  const client = createChatSocket(true, {
    WebSocketImpl: Socket,
    request: async () => ({ ok: true, json: async () => ({ ticket: "employer-ticket" }) }),
  });
  try {
    client.start();
    await tick();
    const socket = Socket.instances.at(-1);
    assert.equal(new URL(socket.url).pathname, "/api/messages/socket");
    window.dispatchEvent(new Event("employer-session-ended"));
    assert.equal(socket.readyState, 3);
  } finally {
    client.stop();
  }
});
test("one connection multiplexes commands, dispatches server events and keeps stable message IDs", async () => {
  let tickets = 0;
  const client = createChatSocket(false, {
    WebSocketImpl: Socket,
    request: async () => {
      tickets++;
      return { ok: true, json: async () => ({ ticket: "one-use" }) };
    },
  });
  const events = [];
  const unsubscribe = client.subscribe((event) => events.push(event));
  client.start();
  const payload = { text: "hello", clientMessageId: "stable-retry-id" };
  const [a, b] = await Promise.all([
    client.invoke("send", "conversation", payload),
    client.invoke("send", "conversation", payload),
  ]);
  assert.equal(tickets, 1);
  assert.deepEqual(a, payload);
  assert.deepEqual(b, payload);
  const socket = Socket.instances.at(-1);
  assert.equal(new URL(socket.url).searchParams.get("ticket"), "one-use");
  assert.equal(new URL(socket.url).protocol, "ws:");
  assert.equal(new URL(socket.url).pathname, "/api/messages/socket");
  socket.onmessage({ data: JSON.stringify({ type: "message", conversationId: "conversation" }) });
  assert.ok(events.some((e) => e.type === "message"));
  const pending = client.invoke("read", "conversation", { messageIds: [1] });
  const rejected = assert.rejects(pending, /ngắt/);
  await tick();
  socket.close();
  await rejected;
  client.stop();
  unsubscribe();
});
test("reconnect obtains a fresh ticket and emits ready for history catch-up", async () => {
  let tickets = 0,
    ready = 0;
  const client = createChatSocket(true, {
    WebSocketImpl: Socket,
    baseUrl: "https://api.example",
    request: async () => ({ ok: true, json: async () => ({ ticket: String(++tickets) }) }),
  });
  client.subscribe((event) => {
    if (event.type === "ready") ready++;
  });
  client.start();
  await tick();
  const previous = Socket.instances.at(-1);
  previous.close();
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.equal(tickets, 2);
  assert.equal(ready, 2);
  assert.equal(new URL(Socket.instances.at(-1).url).protocol, "wss:");
  assert.notEqual(Socket.instances.at(-1), previous);
  client.stop();
});
