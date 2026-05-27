import { createElement, useLayoutEffect, useSyncExternalStore } from "react"
import { createRoot, Root } from "react-dom/client"

type Hook<T> = () => T

function HookHost<T>({ hook, store }: { hook: Hook<T>; store: HookStore<T> }) {
    const value = hook()

    useLayoutEffect(() => {
        store.mutate(value)
    }, [store, value])

    return null
}

class HookStore<T> {
    private snapshot!: T
    private isReady = false
    private listeners = new Set<() => void>()
    private mountPoint: Root | null = null

    constructor(private readonly hook: Hook<T>) {
        this.ensureMounted()
    }

    destroy() {
        this.mountPoint?.unmount()
        this.mountPoint = null
        this.listeners.clear()
        this.isReady = false
    }

    subscribe = (listener: () => void) => {
        this.listeners.add(listener)
        return () => {
            this.listeners.delete(listener)
        }
    }

    getSnapshot = () => {
        if (!this.isReady) {
            throw new Error("HookStore is not ready: " + this.hook.name)
        }
        return this.snapshot
    }

    mutate(next: T) {
        if (!Object.is(next, this.snapshot)) {
            this.snapshot = next
            this.isReady = true
            this.listeners.forEach(x => x())
        }
    }

    private ensureMounted() {
        if (this.mountPoint != null) {
            return
        }

        const container = document.createElement("div")
        this.mountPoint = createRoot(container)

        this.mountPoint.render(
            createElement(HookHost, {
                hook: this.hook,
                store: this,
            })
        )
    }
}

const STORES = new Map<Hook<unknown>, HookStore<unknown>>()

function getStore<T>(hook: Hook<T>): HookStore<T> {
    const store = STORES.get(hook)
    if (store == null) {
        const newStore = new HookStore<T>(hook)
        STORES.set(hook, newStore)
        return newStore
    }

    return store as HookStore<T>
}

/**
 * Resets the global HyperHook state.
 * (This function should never be needed in a normal application run. It exists mostly for unit tests or other automated scenarios that may want to restore a clean module state.)
 */
export function resetInternalState(): void {
    for (const store of STORES.values()) {
        store.destroy()
    }
    STORES.clear()
}

/**
 * Creates a shared instance of the given hook. The shared hook can be reused across different React components. Every component will interact with the same underlying hook.
 * @param hook Named React hook
 * @returns Shared instance of the hook
 */
export default function hyper<T>(hook: Hook<T>): Hook<T> {
    if (!hook.name.startsWith("use")) {
        // Guard against flimsy inline functions
        throw new Error("Supplied hook must be a named function starting with `use...`. Given: " + hook.name)
    }

    const store = getStore(hook)

    return function useSharedHook() {
        return useSyncExternalStore(store.subscribe, store.getSnapshot)
    }
}
