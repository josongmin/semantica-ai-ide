import { screen } from "@testing-library/react";

import { messageAtomFamily } from "~entities/message/core";

import { renderWithAtoms } from "../../../../tests/utils";
import { createMessage, resetIdCounter } from "../../../shared/lib/mocks";
import type { MessageId } from "../../../shared/protocol";
import { MessageRow } from "../MessageRow";

// Mock getVscodeApi
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: vi.fn(),
    getState: () => null,
    setState: () => {},
  }),
}));

// Mock MarkdownContent to simplify testing
vi.mock("../../markdown-content", () => ({
  MarkdownContent: ({ text }: { text: string }) => <div data-testid="markdown">{text}</div>,
}));

beforeEach(() => resetIdCounter());

describe("MessageRow", () => {
  it("user message renders right-aligned bubble", () => {
    const msg = createMessage({
      id: "msg_1" as MessageId,
      role: "user",
      text: "Hello agent",
      status: "final",
      created_at_ms: Date.now(),
    });

    renderWithAtoms(<MessageRow messageId={"msg_1" as MessageId} />, {
      initialValues: [[messageAtomFamily("msg_1" as MessageId), msg]],
    });

    const article = screen.getByLabelText("Your message");
    expect(article).toBeInTheDocument();
    expect(article).toHaveClass("items-end");
    expect(screen.getByText("Hello agent")).toBeInTheDocument();
  });

  it("agent message renders full-width with markdown", () => {
    const msg = createMessage({
      id: "msg_2" as MessageId,
      role: "assistant",
      text: "Here is the analysis...",
      status: "final",
      created_at_ms: Date.now(),
    });

    renderWithAtoms(<MessageRow messageId={"msg_2" as MessageId} />, {
      initialValues: [[messageAtomFamily("msg_2" as MessageId), msg]],
    });

    const article = screen.getByLabelText("Agent message");
    expect(article).toBeInTheDocument();
    expect(screen.getByTestId("markdown")).toHaveTextContent("Here is the analysis...");
  });

  it("streaming shows ThinkingIndicator when no text", () => {
    const msg = createMessage({
      id: "msg_3" as MessageId,
      role: "assistant",
      text: "",
      status: "streaming",
      created_at_ms: Date.now(),
    });

    renderWithAtoms(<MessageRow messageId={"msg_3" as MessageId} />, {
      initialValues: [[messageAtomFamily("msg_3" as MessageId), msg]],
    });

    const article = screen.getByLabelText("Agent message");
    expect(article).toHaveAttribute("aria-busy", "true");
    // ThinkingIndicator renders animated dots
    expect(article.textContent).not.toContain("Here is");
  });

  it("streaming shows partial text without cursor", () => {
    const msg = createMessage({
      id: "msg_4" as MessageId,
      role: "assistant",
      text: "Partial response...",
      status: "streaming",
      created_at_ms: Date.now(),
    });

    renderWithAtoms(<MessageRow messageId={"msg_4" as MessageId} />, {
      initialValues: [[messageAtomFamily("msg_4" as MessageId), msg]],
    });

    const article = screen.getByLabelText("Agent message");
    expect(article).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("markdown")).toHaveTextContent("Partial response...");
  });

  it("error shows error detail and retry button", () => {
    const msg = createMessage({
      id: "msg_5" as MessageId,
      role: "assistant",
      text: "Failed response",
      status: "error",
      error_detail: "Context window exceeded",
      created_at_ms: Date.now(),
    });

    renderWithAtoms(<MessageRow messageId={"msg_5" as MessageId} />, {
      initialValues: [[messageAtomFamily("msg_5" as MessageId), msg]],
    });

    expect(screen.getByText("Context window exceeded")).toBeInTheDocument();
    expect(screen.getByLabelText("Retry")).toBeInTheDocument();
  });

  it("returns null when message is not available", () => {
    const { container } = renderWithAtoms(<MessageRow messageId={"nonexistent" as MessageId} />, {
      initialValues: [],
    });

    expect(container.querySelector("article")).toBeNull();
  });
});
