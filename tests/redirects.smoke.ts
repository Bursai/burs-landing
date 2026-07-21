import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const APP_STORE_DESTINATION =
  "https://apps.apple.com/se/app/burs-ai/id6772630210?ct=meta-m1-se&mt=8";
const DOWNLOAD_SOURCES = ["/download", "/download/"];

describe("download redirect", () => {
  it("configures Vercel to send Meta ad clicks straight to the App Store", () => {
    const config = JSON.parse(readFileSync("vercel.json", "utf8"));

    expect(config.redirects).toEqual(
      expect.arrayContaining(
        DOWNLOAD_SOURCES.map((source) => ({
          source,
          destination: APP_STORE_DESTINATION,
          statusCode: 302,
        })),
      ),
    );
  });

  it("keeps the Cloudflare-compatible redirect in sync", () => {
    const redirects = readFileSync("public/_redirects", "utf8");
    const download = redirects
      .split("\n")
      .map((line) => line.trim().split(/\s+/))
      .filter(([source]) => DOWNLOAD_SOURCES.includes(source));

    expect(download).toEqual(
      DOWNLOAD_SOURCES.map((source) => [
        source,
        APP_STORE_DESTINATION,
        "302",
      ]),
    );
  });
});
