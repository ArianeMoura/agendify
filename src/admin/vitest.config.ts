import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    // Fuso fixo: a conversão datetime-local <-> UTC só é exercitada de verdade com offset
    // != 0. Sem pinar, a suíte passaria à toa numa máquina em UTC (foi assim que o bug de
    // 3h no formulário de reservas escapou).
    env: { TZ: "America/Sao_Paulo" },
  },
  resolve: {
    // Espelha o alias "@/*" do tsconfig para os testes.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
