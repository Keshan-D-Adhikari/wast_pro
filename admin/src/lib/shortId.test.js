import { describe, it, expect } from "vitest";
import { userCode, orderCode, matchesCode } from "./shortId";

describe("short ids", () => {
  it("matches the mobile app's codes", () => {
    expect(userCode("JSErfAcDVJXtsBTtxMX0LbfWtQM2")).toBe("USR-JSERFA");
    expect(orderCode("a1b2c3d4e5f6")).toBe("ORD-A1B2C3");
    expect(userCode(undefined)).toBe("USR-??????");
  });

  it("matches a typed code with or without the prefix, dash, case or spaces", () => {
    const code = userCode("JSErfAcDVJXt");
    expect(matchesCode(code, "USR-JSERFA")).toBe(true);
    expect(matchesCode(code, "usr jserfa")).toBe(true);
    expect(matchesCode(code, "jserfa")).toBe(true);
    expect(matchesCode(code, "jse")).toBe(true);
    expect(matchesCode(code, "xyz")).toBe(false);
    expect(matchesCode(code, "")).toBe(false);
  });
});
