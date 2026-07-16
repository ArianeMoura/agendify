import { describe, expect, it } from "vitest";
import { toLocalInput, toUtcIso } from "./date";

// O bug original só aparece em fuso com offset != 0. O ambiente de teste roda com
// TZ=America/Sao_Paulo (vitest.config.ts), então 14:00 local = 17:00Z no inverno.
describe("toUtcIso", () => {
  it("converte hora de parede local para o instante UTC correspondente", () => {
    // A regressão: a versão antiga só grudava um "Z" e devolvia "2026-07-15T14:00:00Z",
    // gravando a reserva 3h adiantada.
    expect(toUtcIso("2026-07-15T14:00")).toBe("2026-07-15T17:00:00.000Z");
  });

  it("preserva string vazia (input ainda não preenchido)", () => {
    expect(toUtcIso("")).toBe("");
  });
});

describe("toLocalInput", () => {
  it("converte o instante UTC de volta para a hora de parede local", () => {
    expect(toLocalInput("2026-07-15T17:00:00Z")).toBe("2026-07-15T14:00");
  });

  it("preserva string vazia e rejeita data inválida", () => {
    expect(toLocalInput("")).toBe("");
    expect(toLocalInput("nao-e-data")).toBe("");
  });
});

describe("round-trip", () => {
  it("volta ao horário que o usuário digitou", () => {
    const digitado = "2026-07-15T14:00";
    expect(toLocalInput(toUtcIso(digitado))).toBe(digitado);
  });

  it("atravessa a virada do dia sem deslizar", () => {
    // 23:00 em São Paulo é 02:00Z do dia seguinte — o caso que a versão antiga
    // exibia como se ainda fosse dia 15.
    expect(toUtcIso("2026-07-15T23:00")).toBe("2026-07-16T02:00:00.000Z");
    expect(toLocalInput("2026-07-16T02:00:00Z")).toBe("2026-07-15T23:00");
  });
});
