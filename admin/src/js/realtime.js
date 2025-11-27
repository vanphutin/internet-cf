// realtime.js – dành cho WebSocket realtime chung
import { getToken, showToast } from "./utils.js";

let ws = null;

export function connectWebSocket() {
  const token = getToken();
  if (!token) return;

  ws = new WebSocket(`ws://localhost:3000?token=${token}`);

  ws.onopen = () => console.log("WS realtime connected");

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    console.log("Realtime MSG:", msg);
  };

  ws.onerror = (e) => console.error("Realtime WS error", e);
  ws.onclose = () => console.log("Realtime WS closed");
}

export function getRealtimeWS() {
  return ws;
}
