import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("download redirect", () => {
  it("sends Meta ad clicks straight to the BURS App Store listing", () => {
    const redirects = readFileSync("public/_redirects", "utf8");
    const download = redirects
      .split("\n")
      .find((line) => line.trimStart().startsWith("/download"));

    expect(download).toMatch(
      /^\/download\s+https:\/\/apps\.apple\.com\/se\/app\/burs-ai\/id6772630210\?ct=meta-m1-se&mt=8\s+302$/,
    );
  });
});
