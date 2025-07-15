import { useState, useEffect } from "react";

export function useConnectionStatus() {
  const [status, setStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [serverInfo, setServerInfo] = useState<string>("");

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/health");
      if (response.ok || response.status === 206) {
        const data = await response.json();
        if (data.status === "healthy" || data.status === "partial") {
          setStatus("connected");
          if (data.details?.baseURL) {
            try {
              const url = new URL(data.details.baseURL);
              setServerInfo(`${url.hostname}:${url.port || "80"}`);
            } catch {
              setServerInfo(data.details.baseURL);
            }
          }
        } else {
          setStatus("disconnected");
        }
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return { status, serverInfo, checkConnection };
}
