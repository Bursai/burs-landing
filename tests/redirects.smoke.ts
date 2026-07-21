import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const APP_STORE_DESTINATION =
  "https://apps.apple.com/se/app/burs-ai/id6772630210?ct=meta-m1-se&mt=8";

describe("download redirect", () => {
  it("configures Vercel to send Meta ad clicks straight to the App Store", () => {
    const config = JSON.parse(readFileSync("vercel.json", "utf8"));

    expect(config.redirects).toContainEqual({
      source: "/download",
      destination: APP_STORE_DESTINATION,
      statusCode: 302,
    });
  });

  it("keeps the Cloudflare-compatible redirect in sync", () => {
    const redirects = readFileSync("public/_redirects", "utf8");
    const download = redirects
      .split("\n")
      .find((line) => line.trimStart().startsWith("/download"));

    expect(download).toMatch(
      /^\/download\s+https:\/\/apps\.apple\.com\/se\/app\/burs-ai\/id6772630210\?ct=meta-m1-se&mt=8\s+302$/,
    );
  });
});
