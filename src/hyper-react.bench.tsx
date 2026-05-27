/** @vitest-environment happy-dom */

import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { bench, describe } from "vitest"
import hyper from "./hyper-react"
import { useBetween } from "use-between"

const PROBE_COUNT = 10_000
const INCREMENT_COUNT = 10

async function timeoutFor(ms: number) {
    return new Promise(res => setTimeout(res, ms))
}

function useCounterState() {
    const [count, setCount] = useState(0)
    return { count, setCount }
}

function createProbeElements(useCounter: typeof useCounterState) {
    function CounterProbe() {
        const { count } = useCounter()
        return <span data-testid="probe" data-count={count} />
    }

    return Array.from({ length: PROBE_COUNT }, (_, index) => <CounterProbe key={index} />)
}

function createCounter(useCounter: typeof useCounterState) {
    const probes = createProbeElements(useCounter)

    function CounterHarness() {
        const { count, setCount } = useCounter()

        useEffect(() => {
            // Auto-increments 10 times
            setTimeout(() => {
                setCount(prev => {
                    if (prev < INCREMENT_COUNT) {
                        return prev + 1
                    }
                    return prev
                })
            }, 0)
        }, [count])

        return (
            <div>
                <span data-testid="count">{count}</span>
                {probes}
            </div>
        )
    }

    return <CounterHarness />
}

describe("hyper-react benchmark", () => {
    bench("mounts 10k shared probes and increments 10 times", async () => {
        const useCounter = hyper(useCounterState)

        const container = document.createElement("div")
        document.body.appendChild(container)
        const root = createRoot(container)
        root.render(createCounter(useCounter))

        await (async () => {
            const deadline = performance.now() + 10_000

            while (performance.now() < deadline) {
                const probes = document.querySelectorAll<HTMLSpanElement>('[data-testid="probe"]')
                if (probes.length == PROBE_COUNT && Array.from(probes.values()).every(x => x.dataset["count"] === "10")) {
                    return
                }

                await timeoutFor(0)
            }

            throw new Error("deadline exceeded")
        })()

        container.remove()
    })
})

describe("useBetween benchmark", () => {
    bench("mounts 10k shared probes and increments 10 times", async () => {
        const useCounter = () => useBetween(useCounterState)

        const container = document.createElement("div")
        document.body.appendChild(container)
        const root = createRoot(container)
        root.render(createCounter(useCounter))

        await (async () => {
            const deadline = performance.now() + 10_000

            while (performance.now() < deadline) {
                const probes = document.querySelectorAll<HTMLSpanElement>('[data-testid="probe"]')
                if (probes.length == PROBE_COUNT && Array.from(probes.values()).every(x => x.dataset["count"] === "10")) {
                    return
                }

                await timeoutFor(0)
            }

            throw new Error("deadline exceeded")
        })()

        container.remove()
    })
})
