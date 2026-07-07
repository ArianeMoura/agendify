import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Field } from "./Field";
import { Input } from "./Input";

describe("Field", () => {
  it("associa o label ao controle (htmlFor ↔ id)", () => {
    render(<Field label="Email">{(p) => <Input {...p} />}</Field>);
    // getByLabelText só encontra se a associação label↔input estiver correta.
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("marca aria-invalid e anuncia o erro com role=alert", () => {
    render(
      <Field label="Email" error="Email inválido">
        {(p) => <Input {...p} />}
      </Field>
    );
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Email inválido");
    // O erro está referenciado por aria-describedby do input.
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(
      <Field label="Nome" hint="Como aparecerá no sistema">
        {(p) => <Input {...p} />}
      </Field>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
