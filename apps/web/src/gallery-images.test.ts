import { describe, expect, it } from "vitest";

import { galleryImages } from "./gallery-images.js";

describe("galleryImages", () => {
  it("lists the four uploaded images with public gallery paths", () => {
    expect(galleryImages).toHaveLength(4);
    expect(galleryImages.map((img) => img.src)).toEqual([
      "/gallery/playstation-boot.png",
      "/gallery/riskbreaker-overlay.png",
      "/gallery/vagrant-story-menu.png",
      "/gallery/equipment-screen.png",
    ]);
  });

  it("includes a short description for each image", () => {
    expect(galleryImages.every((img) => img.description.length > 0)).toBe(true);
  });
});
