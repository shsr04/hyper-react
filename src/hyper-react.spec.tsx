import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import hyper, { resetInternalState } from "./hyper-react"
import "@testing-library/jest-dom/vitest"

describe("hyper-react library", () => {
    afterEach(() => {
        cleanup()
        resetInternalState()
    })

    describe("State sharing", () => {
        function useCounterState() {
            const [count, setCount] = useState(2)
            return { count, setCount }
        }

        let useCounter: typeof useCounterState

        beforeEach(() => {
            // Recreate hook instances to avoid stale module state
            useCounter = hyper(useCounterState)
        })

        function CounterProbe() {
            const { count, setCount } = useCounter()

            return (
                <>
                    <span data-testid="count">{count}</span>
                    <button data-testid="increment" onClick={() => setCount(prev => prev + 1)}></button>
                </>
            )
        }

        describe("Single hook", () => {
            describe("Simple passthrough", () => {
                it("allows accessing the hook", async () => {
                    render(<CounterProbe />)

                    expect(screen.getByTestId("count").textContent).toBe("2")

                    await userEvent.click(screen.getByTestId("increment"))

                    expect(screen.getByTestId("count").textContent).toBe("3")
                })
            })
        })

        describe("Two sibling hooks", () => {
            it("should share state", async () => {
                render(
                    <>
                        <CounterProbe />
                        <CounterProbe />
                    </>
                )

                screen.getAllByTestId("count").forEach(x => expect(x).toHaveTextContent("2"))

                await userEvent.click(screen.getAllByTestId("increment")[0])

                screen.getAllByTestId("count").forEach(x => expect(x).toHaveTextContent("3"))
            })
        })
    })

    describe("State separation", () => {
        function useNameState() {
            const [name, setName] = useState("")
            return { name, setName }
        }
        function useAddressState() {
            const [address, setAddress] = useState("")
            return { address, setAddress }
        }

        let useName: typeof useNameState
        let useAddress: typeof useAddressState

        beforeEach(() => {
            // Recreate hook instances to avoid stale module state
            useName = hyper(useNameState)
            useAddress = hyper(useAddressState)
        })

        function NameField() {
            const { name, setName } = useName()
            return <input data-testid="name" type="text" value={name} onChange={e => setName(e.target.value)} />
        }

        function AddressField() {
            const { address, setAddress } = useAddress()
            return <input data-testid="address" type="text" value={address} onChange={e => setAddress(e.target.value)} />
        }

        it("should keep state separate", async () => {
            render(
                <>
                    <NameField />
                    <AddressField />
                </>
            )

            expect(screen.getByTestId("name")).toHaveValue("")
            expect(screen.getByTestId("address")).toHaveValue("")

            await userEvent.type(screen.getByTestId("name"), "cool guy")
            await userEvent.type(screen.getByTestId("address"), "my home")

            expect(screen.getByTestId("name")).toHaveValue("cool guy")
            expect(screen.getByTestId("address")).toHaveValue("my home")
        })
    })

    describe("Timing effects", () => {
        let called = 0

        function useMountValueState() {
            const [value, setValue] = useState(0)

            useLayoutEffect(() => {
                called += 0.5
                setValue(1)
            }, [])

            useEffect(() => {
                called += 0.5
                setValue(prev => prev * 2)
            }, [])

            return [value, setValue] as const
        }

        let useMountValue: typeof useMountValueState

        beforeEach(() => {
            called = 0
            useMountValue = hyper(useMountValueState)
        })

        function EffectProbe() {
            const [value] = useMountValue()

            return <span data-testid="value">{value}</span>
        }

        it("should run mount effects", () => {
            render(<EffectProbe />)

            expect(screen.getByTestId("value")).toHaveTextContent("2")
        })

        it("should run effects only once", () => {
            render(
                <>
                    <EffectProbe />
                    <EffectProbe />
                    <EffectProbe />
                </>
            )

            screen.getAllByTestId("value").forEach(x => expect(x).toHaveTextContent("2"))

            expect(called).toBe(1)
        })
    })

    describe("Realistic setup", () => {
        function useMoviesState() {
            const [movies, setMovies] = useState<string[]>([])

            useEffect(() => {
                setMovies(["A Hidden Life", "High Noon", "Gone With The Wind", "Heat", "Demolition Man"])
            }, [])

            return movies
        }

        let useMovies: typeof useMoviesState

        function useFiltersState() {
            const [filters, setFilters] = useState<"action" | "all">("all")

            const toggleActionMovies = useCallback(() => {
                setFilters(prev => (prev === "all" ? "action" : "all"))
            }, [])

            return { filters, toggleActionMovies }
        }

        let useFilters: typeof useFiltersState

        function useFilteredMoviesState() {
            const movies = useMovies()
            const { filters } = useFilters()

            if (filters === "all") {
                return movies
            }

            return movies.filter(x => x.match(/High|Heat|Demo/u))
        }

        let useFilteredMovies: typeof useFilteredMoviesState

        beforeEach(() => {
            useMovies = hyper(useMoviesState)
            useFilters = hyper(useFiltersState)
            useFilteredMovies = hyper(useFilteredMoviesState)
        })

        function MovieList() {
            const filteredMovies = useFilteredMovies()
            const { filters, toggleActionMovies } = useFilters()

            return (
                <div>
                    <label>
                        <input checked={filters === "action"} type="checkbox" onChange={toggleActionMovies} />
                        Action only
                    </label>

                    <ul>
                        {filteredMovies.map(movie => (
                            <li key={movie}>{movie}</li>
                        ))}
                    </ul>
                </div>
            )
        }

        it("should filter the movie list", async () => {
            const user = userEvent.setup()

            render(<MovieList />)

            expect(screen.getByText("A Hidden Life")).toBeInTheDocument()
            expect(screen.getByText("High Noon")).toBeInTheDocument()
            expect(screen.getByText("Gone With The Wind")).toBeInTheDocument()
            expect(screen.getByText("Heat")).toBeInTheDocument()
            expect(screen.getByText("Demolition Man")).toBeInTheDocument()

            await user.click(screen.getByLabelText("Action only"))

            expect(screen.queryByText("A Hidden Life")).not.toBeInTheDocument()
            expect(screen.getByText("High Noon")).toBeInTheDocument()
            expect(screen.queryByText("Gone With The Wind")).not.toBeInTheDocument()
            expect(screen.getByText("Heat")).toBeInTheDocument()
            expect(screen.getByText("Demolition Man")).toBeInTheDocument()
        })
    })
})
