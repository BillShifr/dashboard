import { describe, expect, it } from "vitest";
import { result, scaleColor } from "@/domain/disp/metrics/result";

describe("disp metrics", () => {
  it("treats blank as distinct from zero and computes percent", () => {
    const records = {
      a: { plan: 100, fact: 80 },
      b: { plan: null, fact: null },
    };
    const total = result(records, ["a", "b"]);
    expect(total.active).toEqual(["a"]);
    expect(total.complete).toEqual(["a"]);
    expect(total.percent).toBe(80);
  });

  it("returns null percent when plan is missing among active", () => {
    const records = {
      a: { plan: 100, fact: 50 },
      b: { plan: null, fact: 10 },
    };
    expect(result(records, ["a", "b"]).percent).toBeNull();
  });

  it("maps palette bins", () => {
    const colors = ["a", "b", "c", "d", "e"];
    expect(scaleColor(null, colors, "empty")).toBe("empty");
    expect(scaleColor(49, colors, "empty")).toBe("a");
    expect(scaleColor(50, colors, "empty")).toBe("b");
    expect(scaleColor(75, colors, "empty")).toBe("c");
    expect(scaleColor(90, colors, "empty")).toBe("d");
    expect(scaleColor(100, colors, "empty")).toBe("d");
    expect(scaleColor(100.01, colors, "empty")).toBe("e");
  });
});
