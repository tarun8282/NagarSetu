import { useEffect, useRef, useCallback } from 'react';

const SOCKET_URL: string =
    (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:5050';

// Lazily loaded socket instance
let globalSocket: any = null;
let socketModule: any = null;

async function loadSocketIO() {
    if (!socketModule) {
        try {
            socketModule = await import('socket.io-client');
        } catch {
            console.warn('[Socket] socket.io-client not installed — run: npm install socket.io-client');
            return null;
        }
    }
    return socketModule;
}

async function getSocket() {
    const mod = await loadSocketIO();
    if (!mod) return null;

    if (!globalSocket || !globalSocket.connected) {
        globalSocket = mod.io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        globalSocket.on('connect', () =>
            console.log('[Socket] Connected:', globalSocket.id));
        globalSocket.on('disconnect', (reason: string) =>
            console.warn('[Socket] Disconnected:', reason));
        globalSocket.on('connect_error', (err: Error) =>
            console.error('[Socket] Connection error:', err.message));
    }
    return globalSocket;
}

interface UseSocketOptions {
    /** Room to join: "city:<uuid>" | "state:<uuid>" | "citizen:<uuid>" */
    room?: string;
    /** Map of socket event names → handlers */
    events?: Record<string, (data: any) => void>;
}

/**
 * useSocket — lazily connects to Socket.IO, joins a room, listens for events.
 *
 * @example
 * useSocket({
 *   room: `city:${user.city_id}`,
 *   events: { 'complaint:change': () => reload() }
 * });
 */
export function useSocket(options: UseSocketOptions = {}) {
    const { room, events } = options;
    const socketRef = useRef<any>(null);

    useEffect(() => {
        let mounted = true;
        const handlers = events || {};

        getSocket().then((socket) => {
            if (!socket || !mounted) return;
            socketRef.current = socket;

            // Join room (format: "type:id")
            if (room) {
                const colonIdx = room.indexOf(':');
                if (colonIdx !== -1) {
                    const type = room.slice(0, colonIdx);
                    const id   = room.slice(colonIdx + 1);
                    if (id) socket.emit(`join:${type}`, id);
                }
            }

            // Register handlers
            Object.entries(handlers).forEach(([event, handler]) => {
                socket.on(event, handler);
            });
        });

        return () => {
            mounted = false;
            const socket = socketRef.current;
            if (!socket) return;
            // Deregister handlers on cleanup
            Object.entries(handlers).forEach(([event, handler]) => {
                socket.off(event, handler);
            });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room]);

    const emit = useCallback((event: string, data?: any) => {
        socketRef.current?.emit(event, data);
    }, []);

    return { emit };
}

export default useSocket;
