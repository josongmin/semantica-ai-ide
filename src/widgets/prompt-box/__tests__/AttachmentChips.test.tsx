import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createAttachment } from "../../../shared/lib/mocks";
import { AttachmentChips } from "../AttachmentChips";

describe("AttachmentChips", () => {
  it("renders nothing when no attachments", () => {
    const { container } = render(<AttachmentChips attachments={[]} onRemove={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders chips for each attachment", () => {
    const attachments = [
      createAttachment({ name: "foo.ts", path: "src/foo.ts" }),
      createAttachment({ name: "bar.tsx", path: "src/bar.tsx" }),
    ];

    render(<AttachmentChips attachments={attachments} onRemove={vi.fn()} />);

    expect(screen.getByText("foo.ts")).toBeInTheDocument();
    expect(screen.getByText("bar.tsx")).toBeInTheDocument();
  });

  it("calls onRemove with correct path when X is clicked", async () => {
    const onRemove = vi.fn();
    const attachments = [createAttachment({ name: "foo.ts", path: "src/foo.ts" })];

    render(<AttachmentChips attachments={attachments} onRemove={onRemove} />);

    await userEvent.click(screen.getByLabelText("Remove foo.ts"));

    expect(onRemove).toHaveBeenCalledWith("src/foo.ts");
  });

  it("renders container with data-testid", () => {
    const attachments = [createAttachment()];

    render(<AttachmentChips attachments={attachments} onRemove={vi.fn()} />);

    expect(screen.getByTestId("attachment-chips")).toBeInTheDocument();
  });
});
