import { describe, expect, it } from "vitest";

import { DOCS_DEV_PORT, docsServerConfig } from "./docs-site.js";

describe("docs-site", () => {
  it("uses a fixed dev port", () => {
    expect(DOCS_DEV_PORT).toBe(5174);
  });

  it("docsServerConfig matches Vite server block shape", () => {
    expect(docsServerConfig()).toEqual({ port: 5174 });
  });
});
