import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Button } from "./Button";

describe("Button", () => {
  it("renderiza o conteúdo e responde ao variant primário", () => {
    render(<Button>Salvar</Button>);
    const btn = screen.getByRole("button", { name: "Salvar" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("bg-brand");
  });

  it("fica desabilitado e aria-busy quando loading", () => {
    render(<Button loading>Salvar</Button>);
    const btn = screen.getByRole("button", { name: "Salvar" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<Button>Salvar</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
