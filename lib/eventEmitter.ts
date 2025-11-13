type EventHandler = (...args: any[]) => void;

class SimpleEventEmitter {
  private listeners = new Map<string, Set<EventHandler>>();

  on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        handler(...args);
      });
    }
  }
}

// Create a global event emitter for communication between components
export const eventEmitter = new SimpleEventEmitter();

// Event names
export const EVENTS = {
  REFRESH_COMMUNITY: 'refreshCommunity',
  ARTICLE_SHARED: 'articleShared',
};