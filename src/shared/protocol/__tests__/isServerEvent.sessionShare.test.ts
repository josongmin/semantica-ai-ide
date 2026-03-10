import { isServerEvent } from "../types";

describe("isServerEvent — SET_SHARE_LINK and SET_PR_SUMMARY", () => {
  it("validates SET_SHARE_LINK with valid payload", () => {
    expect(
      isServerEvent({
        t: "SET_SHARE_LINK",
        session_id: "session_1",
        link: { url: "https://share.example.com/abc", expires_at_ms: null, masked: true },
      }),
    ).toBe(true);
  });

  it("rejects SET_SHARE_LINK without session_id", () => {
    expect(
      isServerEvent({
        t: "SET_SHARE_LINK",
        link: { url: "https://share.example.com/abc", expires_at_ms: null, masked: true },
      }),
    ).toBe(false);
  });

  it("rejects SET_SHARE_LINK without link object", () => {
    expect(
      isServerEvent({
        t: "SET_SHARE_LINK",
        session_id: "session_1",
      }),
    ).toBe(false);
  });

  it("rejects SET_SHARE_LINK with null link", () => {
    expect(
      isServerEvent({
        t: "SET_SHARE_LINK",
        session_id: "session_1",
        link: null,
      }),
    ).toBe(false);
  });

  it("validates SET_PR_SUMMARY with valid payload", () => {
    expect(
      isServerEvent({
        t: "SET_PR_SUMMARY",
        summary: {
          title: "Fix bug",
          changes: [],
          intent: "Fix the authentication bug",
          todos: [],
        },
      }),
    ).toBe(true);
  });

  it("rejects SET_PR_SUMMARY without summary", () => {
    expect(isServerEvent({ t: "SET_PR_SUMMARY" })).toBe(false);
  });

  it("rejects SET_PR_SUMMARY with null summary", () => {
    expect(isServerEvent({ t: "SET_PR_SUMMARY", summary: null })).toBe(false);
  });

  it("rejects SET_PR_SUMMARY with non-object summary", () => {
    expect(isServerEvent({ t: "SET_PR_SUMMARY", summary: "not an object" })).toBe(false);
  });
});
