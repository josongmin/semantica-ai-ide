import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils";
import { reviewCommentAtomFamily, type ReviewCommentId } from "../../../entities/review-comment";
import { createReviewComment } from "../../../shared/lib/mocks";
import { ReviewCommentCard } from "../ReviewCommentCard";
import { ReviewFileSection } from "../ReviewFileSection";

describe("ReviewFileSection", () => {
  it("renders file section with file path as title", () => {
    renderWithAtoms(<ReviewFileSection filePath="src/app.ts" commentIds={[]} />);
    expect(screen.getByText("src/app.ts")).toBeInTheDocument();
  });

  it("renders comment cards for each comment ID", () => {
    const comment1 = createReviewComment({
      id: "c1" as ReviewCommentId,
      file_path: "src/app.ts",
      message: "First issue",
    });
    const comment2 = createReviewComment({
      id: "c2" as ReviewCommentId,
      file_path: "src/app.ts",
      message: "Second issue",
    });
    renderWithAtoms(<ReviewFileSection filePath="src/app.ts" commentIds={["c1", "c2"]} />, {
      initialValues: [
        [reviewCommentAtomFamily("c1"), comment1],
        [reviewCommentAtomFamily("c2"), comment2],
      ],
    });
    expect(screen.getByText("First issue")).toBeInTheDocument();
    expect(screen.getByText("Second issue")).toBeInTheDocument();
  });

  it("shows count badge with number of comments", () => {
    renderWithAtoms(<ReviewFileSection filePath="src/app.ts" commentIds={["c1", "c2", "c3"]} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

describe("ReviewCommentCard", () => {
  it("renders nothing when comment is null", () => {
    const { container } = renderWithAtoms(<ReviewCommentCard id="missing" />, {
      initialValues: [[reviewCommentAtomFamily("missing"), null]],
    });
    expect(container.children).toHaveLength(0);
  });

  it("renders comment message", () => {
    const comment = createReviewComment({
      id: "c1" as ReviewCommentId,
      message: "Use const instead of let",
    });
    renderWithAtoms(<ReviewCommentCard id="c1" />, {
      initialValues: [[reviewCommentAtomFamily("c1"), comment]],
    });
    expect(screen.getByText("Use const instead of let")).toBeInTheDocument();
  });

  it("renders severity badge", () => {
    const comment = createReviewComment({ id: "c1" as ReviewCommentId, severity: "warning" });
    renderWithAtoms(<ReviewCommentCard id="c1" />, {
      initialValues: [[reviewCommentAtomFamily("c1"), comment]],
    });
    expect(screen.getByText("warning")).toBeInTheDocument();
  });

  it("renders line range", () => {
    const comment = createReviewComment({
      id: "c1" as ReviewCommentId,
      line_start: 10,
      line_end: 15,
    });
    renderWithAtoms(<ReviewCommentCard id="c1" />, {
      initialValues: [[reviewCommentAtomFamily("c1"), comment]],
    });
    expect(screen.getByText("Lines 10–15")).toBeInTheDocument();
  });

  it("renders suggestion code block when present", () => {
    const comment = createReviewComment({
      id: "c1" as ReviewCommentId,
      suggestion: "const x = 1;",
    });
    renderWithAtoms(<ReviewCommentCard id="c1" />, {
      initialValues: [[reviewCommentAtomFamily("c1"), comment]],
    });
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("disables accept and dismiss buttons when status is not open", () => {
    const comment = createReviewComment({ id: "c1" as ReviewCommentId, status: "accepted" });
    renderWithAtoms(<ReviewCommentCard id="c1" />, {
      initialValues: [[reviewCommentAtomFamily("c1"), comment]],
    });
    expect(screen.getByRole("button", { name: /accept/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeDisabled();
  });

  it("enables accept and dismiss buttons when status is open", () => {
    const comment = createReviewComment({ id: "c1" as ReviewCommentId, status: "open" });
    renderWithAtoms(<ReviewCommentCard id="c1" />, {
      initialValues: [[reviewCommentAtomFamily("c1"), comment]],
    });
    expect(screen.getByRole("button", { name: /accept/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /dismiss/i })).not.toBeDisabled();
  });
});
