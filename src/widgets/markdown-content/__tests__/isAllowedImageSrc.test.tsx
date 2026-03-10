/**
 * isAllowedImageSrc – Image source validation tests
 *
 * Tests the image source validation logic directly:
 * - HTTPS URLs: allowed
 * - HTTP URLs: blocked
 * - Valid data:image URIs: allowed (various MIME types)
 * - Invalid/malicious data URIs: blocked
 * - Oversized data URIs: blocked
 * - Edge cases: empty, undefined, javascript: protocol
 */
import { isAllowedImageSrc } from "../MarkdownContent";

describe("isAllowedImageSrc", () => {
  // ── HTTPS URLs ─────────────────────────────────────────
  describe("HTTPS URLs (allowed)", () => {
    it("standard HTTPS URL", () => {
      expect(isAllowedImageSrc("https://example.com/photo.png")).toBe(true);
    });

    it("HTTPS with query params and fragment", () => {
      expect(isAllowedImageSrc("https://cdn.example.com/img.jpg?w=200&h=100#section")).toBe(true);
    });

    it("HTTPS with encoded characters", () => {
      expect(isAllowedImageSrc("https://example.com/path%20to/image%2B1.png")).toBe(true);
    });
  });

  // ── HTTP URLs (blocked) ────────────────────────────────
  describe("HTTP URLs (blocked)", () => {
    it("plain HTTP URL", () => {
      expect(isAllowedImageSrc("http://example.com/photo.png")).toBe(false);
    });

    it("HTTP localhost", () => {
      expect(isAllowedImageSrc("http://localhost:3000/img.png")).toBe(false);
    });
  });

  // ── data:image URIs (allowed types) ────────────────────
  describe("valid data:image URIs", () => {
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/x-icon",
      "image/vnd.microsoft.icon",
      "image/bmp",
      "image/tiff",
      "image/avif",
    ];

    for (const mime of validTypes) {
      it(`${mime}: allowed`, () => {
        expect(isAllowedImageSrc(`data:${mime};base64,AAAA`)).toBe(true);
      });
    }

    it("case insensitive MIME type", () => {
      expect(isAllowedImageSrc("data:IMAGE/PNG;base64,AAAA")).toBe(true);
      expect(isAllowedImageSrc("data:Image/Jpeg;base64,AAAA")).toBe(true);
    });
  });

  // ── data URIs (blocked types) ──────────────────────────
  describe("blocked data URIs", () => {
    it("data:text/html", () => {
      expect(isAllowedImageSrc("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    });

    it("data:application/javascript", () => {
      expect(isAllowedImageSrc("data:application/javascript;base64,YWxlcnQoMSk=")).toBe(false);
    });

    it("data:image without base64 encoding", () => {
      expect(isAllowedImageSrc("data:image/png;utf8,notbase64")).toBe(false);
    });

    it("empty data URI", () => {
      expect(isAllowedImageSrc("data:")).toBe(false);
    });

    it("data:image with no subtype", () => {
      expect(isAllowedImageSrc("data:image/;base64,AAAA")).toBe(false);
    });
  });

  // ── Oversized data URIs ────────────────────────────────
  describe("oversized data URIs", () => {
    it("data URI exceeding 1.4MB: blocked", () => {
      const bigPayload = "A".repeat(1_400_001);
      expect(isAllowedImageSrc(`data:image/png;base64,${bigPayload}`)).toBe(false);
    });

    it("data URI at exact limit: allowed", () => {
      // "data:image/png;base64," is 22 chars, fill to exactly 1,400,000
      const payload = "A".repeat(1_400_000 - 22);
      expect(isAllowedImageSrc(`data:image/png;base64,${payload}`)).toBe(true);
    });
  });

  // ── Edge cases ─────────────────────────────────────────
  describe("edge cases", () => {
    it("undefined: blocked", () => {
      expect(isAllowedImageSrc(undefined)).toBe(false);
    });

    it("empty string: blocked", () => {
      expect(isAllowedImageSrc("")).toBe(false);
    });

    it("relative path: blocked", () => {
      expect(isAllowedImageSrc("./images/photo.png")).toBe(false);
    });

    it("protocol-relative URL: blocked", () => {
      expect(isAllowedImageSrc("//example.com/photo.png")).toBe(false);
    });

    it("javascript: protocol: blocked", () => {
      expect(isAllowedImageSrc("javascript:alert(1)")).toBe(false);
    });

    it("ftp: protocol: blocked", () => {
      expect(isAllowedImageSrc("ftp://example.com/image.png")).toBe(false);
    });

    it("file: protocol: blocked", () => {
      expect(isAllowedImageSrc("file:///etc/passwd")).toBe(false);
    });
  });
});
