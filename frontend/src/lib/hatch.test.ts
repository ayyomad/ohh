import { describe, expect, it } from "vitest";
import { hatchFromId } from "./hatch";

const ANGLES = [30, 45, 60, 120, 135, 150];

describe("hatchFromId", () => {
  it("is deterministic for a given id", () => {
    const id = "3f5c1a2e-9b64-4f7d-a111-222233334444";
    const first = hatchFromId(id);
    const second = hatchFromId(id);
    expect(second).toEqual(first);
  });

  it("stays in the documented ranges for arbitrary ids", () => {
    for (const id of [
      "00000000-0000-4000-8000-000000000000",
      "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      "7f3a90a2-1133-4c7e-9be5-5e9d3f01cd02",
      "empty-state",
    ]) {
      const { angle, spacing, strokeWidth } = hatchFromId(id);
      expect(ANGLES).toContain(angle);
      expect(spacing).toBeGreaterThanOrEqual(6);
      expect(spacing).toBeLessThanOrEqual(12);
      expect([1, 2]).toContain(strokeWidth);
    }
  });

  it("produces different patterns for enough different ids", () => {
    // Not a strict uniqueness guarantee — two ids CAN collide — but 20
    // distinct id strings should not all agree.
    const outputs = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      outputs.add(JSON.stringify(hatchFromId(`board-id-${i}`)));
    }
    expect(outputs.size).toBeGreaterThan(3);
  });
});
