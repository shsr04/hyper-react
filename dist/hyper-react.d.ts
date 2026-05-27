type Hook<T> = () => T
/**
 * Resets the global HyperHook state.
 * (This function should never be needed in a normal application run. It exists mostly for unit tests or other automated scenarios that may want to restore a clean module state.)
 */
export declare function resetInternalState(): void
/**
 * Creates a shared instance of the given hook. The shared hook can be reused across different React components. Every component will interact with the same underlying hook.
 * @param hook Named React hook
 * @returns Shared instance of the hook
 */
export default function hyper<T>(hook: Hook<T>): Hook<T>
export {}
