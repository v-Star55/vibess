"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useUserStore } from "../store/store";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUserStore();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(() => socketRef.current?.connected || false);

  useEffect(() => {
    // Only connect if user is authenticated (client-side)
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    if (!socketRef.current) {
      console.log("Initializing Socket.io connection to:", SOCKET_URL);
      const socket = io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: true,
        transports: ["websocket"],
        auth: {
          userId: user.id,
        }
      });

      socketRef.current = socket;

      const handleConnect = () => {
        setConnected(true);
        console.log("Socket.io connection established");
      };

      const handleDisconnect = () => {
        setConnected(false);
        console.log("Socket.io connection closed");
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      // Handle race condition if socket connects instantly
      if (socket.connected) {
        handleConnect();
      }
    } else {
      // Sync state if socket already exists
      setConnected(socketRef.current.connected);
    }

    return () => {
      // Keep socket open unless user changes/logs out
    };
  }, [user]);

  // Clean up socket on unmount (entire app unmount)
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
