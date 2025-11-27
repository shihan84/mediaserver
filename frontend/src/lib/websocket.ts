let socket: WebSocket | null = null;

// Get WebSocket URL based on environment
const getWebSocketUrl = (): string => {
  // In production, use the same host as the frontend with wss://
  if (import.meta.env.PROD) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  }
  // In development, use localhost
  return 'ws://localhost:3001';
};

export const connectWebSocket = (token: string): WebSocket => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  const wsUrl = `${getWebSocketUrl()}?token=${encodeURIComponent(token)}`;
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket connected');
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
    socket = null;
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const getSocket = (): WebSocket | null => {
  return socket;
};

export const sendWebSocketMessage = (message: any) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.error('WebSocket is not connected');
  }
};

