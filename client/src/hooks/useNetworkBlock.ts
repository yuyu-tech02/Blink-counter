import { useEffect, useRef, useState } from "react";

interface NetworkBlockState {
  isBlocked: boolean;
  blockedAttempts: number;
}

export function useNetworkBlock() {
  const [state, setState] = useState<NetworkBlockState>({
    isBlocked: false,
    blockedAttempts: 0,
  });

  const originalFetchRef = useRef<typeof window.fetch | null>(null);
  const originalXHRRef = useRef<typeof XMLHttpRequest | null>(null);
  const originalSendBeaconRef = useRef<typeof navigator.sendBeacon | null>(
    null
  );
  const blockedAttemptsRef = useRef(0);

  const enableNetworkBlock = () => {
    if (state.isBlocked) return;

    // Store original functions
    originalFetchRef.current = window.fetch;
    originalXHRRef.current = window.XMLHttpRequest;
    originalSendBeaconRef.current = navigator.sendBeacon;

    // Override fetch
    window.fetch = async (...args) => {
      blockedAttemptsRef.current++;
      setState((prev) => ({
        ...prev,
        blockedAttempts: blockedAttemptsRef.current,
      }));
      console.warn("[Network Block] fetch() blocked:", args[0]);
      throw new Error("Network requests are blocked during measurement");
    };

    // Override XMLHttpRequest
    const BlockedXHR = function (this: XMLHttpRequest) {
      const xhr = new (originalXHRRef.current as typeof XMLHttpRequest)();
      const originalOpen = xhr.open.bind(xhr);
      const originalSend = xhr.send.bind(xhr);

      xhr.open = function (method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
        blockedAttemptsRef.current++;
        setState((prev) => ({
          ...prev,
          blockedAttempts: blockedAttemptsRef.current,
        }));
        console.warn("[Network Block] XMLHttpRequest blocked:", url);
        throw new Error("Network requests are blocked during measurement");
      };

      xhr.send = function () {
        throw new Error("Network requests are blocked during measurement");
      };

      return xhr;
    } as unknown as typeof XMLHttpRequest;

    // Copy prototype
    BlockedXHR.prototype = originalXHRRef.current!.prototype;
    window.XMLHttpRequest = BlockedXHR;

    // Override sendBeacon
    navigator.sendBeacon = function (...args) {
      blockedAttemptsRef.current++;
      setState((prev) => ({
        ...prev,
        blockedAttempts: blockedAttemptsRef.current,
      }));
      console.warn("[Network Block] sendBeacon() blocked:", args[0]);
      return false;
    };

    // Block WebSocket
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function (
      this: WebSocket,
      ...args: ConstructorParameters<typeof WebSocket>
    ) {
      blockedAttemptsRef.current++;
      setState((prev) => ({
        ...prev,
        blockedAttempts: blockedAttemptsRef.current,
      }));
      console.warn("[Network Block] WebSocket blocked:", args[0]);
      throw new Error("WebSocket is blocked during measurement");
    } as unknown as typeof WebSocket;
    window.WebSocket.prototype = OriginalWebSocket.prototype;

    setState((prev) => ({ ...prev, isBlocked: true }));
  };

  const disableNetworkBlock = () => {
    if (!state.isBlocked) return;

    // Restore original functions
    if (originalFetchRef.current) {
      window.fetch = originalFetchRef.current;
      originalFetchRef.current = null;
    }

    if (originalXHRRef.current) {
      window.XMLHttpRequest = originalXHRRef.current;
      originalXHRRef.current = null;
    }

    if (originalSendBeaconRef.current) {
      navigator.sendBeacon = originalSendBeaconRef.current;
      originalSendBeaconRef.current = null;
    }

    blockedAttemptsRef.current = 0;
    setState({ isBlocked: false, blockedAttempts: 0 });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disableNetworkBlock();
    };
  }, []);

  return {
    isBlocked: state.isBlocked,
    blockedAttempts: state.blockedAttempts,
    enableNetworkBlock,
    disableNetworkBlock,
  };
}

