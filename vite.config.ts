import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig(_ => {
    return {
        appType: "custom",
        build: {
            lib: {
                name: "hyper-react",
                entry: "src/hyper-react.ts",
                formats: ["es"],
            },
        },
        plugins: [react()],
    }
})
