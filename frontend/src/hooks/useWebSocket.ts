import { useEffect, useRef } from "react";

export function useWebSocket(
  url: string,
  onMessage: (data: any) => void,
  deps: any[] = []
) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected:", url);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("WS parse error:", err, event.data);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed:", url);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
