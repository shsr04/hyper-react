import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"
import { UserConfig } from "vite"

export default defineConfig({
    plugins: [react()],
    test: {
        include: ["./src/**/*.spec.{ts,tsx}", "./worker/**/*.spec.ts"],
        coverage: {
            provider: "istanbul",
            reporter: "json",
            reportsDirectory: ".coverage_vitest",
        },
        environment: "happy-dom",
    },
    benchmark: {
        include: ["./src/**/*.bench.{ts,tsx}", "./worker/**/*.bench.ts"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
} as UserConfig)
