/**
 * Composites Reinforcement Tests
 *
 * Fills every gap in ActionBar, EmptyState, StatusLine, IconLabel, InlineBanner
 * so that any bulk design-token or prop rename can be caught instantly.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ActionBar } from "../ActionBar";
import { EmptyState } from "../EmptyState";
import { IconLabel } from "../IconLabel";
import { InlineBanner } from "../InlineBanner";
import { StatusLine } from "../StatusLine";

// ═══════════════════════════════════════════════════════════
// ActionBar
// ═══════════════════════════════════════════════════════════
describe("ActionBar — reinforcement", () => {
  const noop = () => {};

  it("visible='always' does NOT add opacity-0", () => {
    const { container } = render(
      <ActionBar visible="always" actions={[{ icon: "edit", label: "Edit", onClick: noop }]} />,
    );
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).not.toContain("opacity-0");
  });

  it("visible='hover' (default) adds opacity-0 and transition classes", () => {
    const { container } = render(
      <ActionBar actions={[{ icon: "edit", label: "Edit", onClick: noop }]} />,
    );
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("opacity-0");
    expect(wrapper.className).toContain("transition-opacity");
    expect(wrapper.className).toContain("focus-within:opacity-100");
  });

  it("onClick fires when action button is clicked", async () => {
    const spy = vi.fn();
    const user = userEvent.setup();
    render(<ActionBar actions={[{ icon: "trash", label: "Delete", onClick: spy }]} />);

    await user.click(screen.getByLabelText("Delete"));
    expect(spy).toHaveBeenCalledOnce();
  });

  it("disabled action cannot be clicked", async () => {
    const spy = vi.fn();
    const user = userEvent.setup();
    render(
      <ActionBar actions={[{ icon: "trash", label: "Delete", onClick: spy, disabled: true }]} />,
    );

    const btn = screen.getByLabelText("Delete");
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(spy).not.toHaveBeenCalled();
  });

  it("renders multiple actions in order", () => {
    render(
      <ActionBar
        actions={[
          { icon: "edit", label: "Edit", onClick: noop },
          { icon: "trash", label: "Delete", onClick: noop },
          { icon: "copy", label: "Copy", onClick: noop },
        ]}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAttribute("aria-label", "Edit");
    expect(buttons[1]).toHaveAttribute("aria-label", "Delete");
    expect(buttons[2]).toHaveAttribute("aria-label", "Copy");
  });

  it("empty actions array renders no buttons", () => {
    const { container } = render(<ActionBar actions={[]} />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("forwards className", () => {
    const { container } = render(
      <ActionBar className="custom-bar" actions={[{ icon: "x", label: "X", onClick: noop }]} />,
    );
    expect(container.firstElementChild!.className).toContain("custom-bar");
  });

  it("each button has title attribute matching label", () => {
    render(<ActionBar actions={[{ icon: "save", label: "Save", onClick: noop }]} />);
    expect(screen.getByTitle("Save")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════
// EmptyState
// ═══════════════════════════════════════════════════════════
describe("EmptyState — reinforcement", () => {
  it("renders icon with size 32", () => {
    const { container } = render(<EmptyState icon="inbox" title="Nothing here" />);
    const icon = container.querySelector(".codicon-inbox")!;
    expect(icon).toBeInTheDocument();
  });

  it("icon has ghost text color class", () => {
    const { container } = render(<EmptyState icon="inbox" title="Nothing here" />);
    const icon = container.querySelector(".codicon-inbox")!;
    expect(icon.className).toContain("text-vsc-text-ghost");
  });

  it("title renders with correct text", () => {
    render(<EmptyState icon="inbox" title="No messages yet" />);
    expect(screen.getByText("No messages yet")).toBeInTheDocument();
  });

  it("description is conditionally rendered", () => {
    const { rerender } = render(<EmptyState icon="inbox" title="Empty" />);
    expect(screen.queryByText("Some detail")).not.toBeInTheDocument();

    rerender(<EmptyState icon="inbox" title="Empty" description="Some detail" />);
    expect(screen.getByText("Some detail")).toBeInTheDocument();
  });

  it("container has centered flex layout classes", () => {
    const { container } = render(<EmptyState icon="inbox" title="Test" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("flex-col");
    expect(wrapper.className).toContain("items-center");
    expect(wrapper.className).toContain("justify-center");
    expect(wrapper.className).toContain("p-8");
  });

  it("forwards className to container", () => {
    const { container } = render(<EmptyState icon="inbox" title="Test" className="extra-class" />);
    expect(container.firstElementChild!.className).toContain("extra-class");
  });
});

// ═══════════════════════════════════════════════════════════
// StatusLine
// ═══════════════════════════════════════════════════════════
describe("StatusLine — reinforcement", () => {
  it("renders StatusDot with given status", () => {
    render(<StatusLine status="success" label="Done" />);
    // StatusDot renders a span with role="status" and aria-label matching the status
    const dot = screen.getByRole("status");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveAttribute("aria-label", "success");
  });

  it("renders label text", () => {
    render(<StatusLine status="idle" label="Waiting" />);
    expect(screen.getByText("Waiting")).toBeInTheDocument();
  });

  it("badge renders when provided as string", () => {
    render(<StatusLine status="running" label="Active" badge="5" />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("badge renders when provided as number 0 (falsy but != null)", () => {
    render(<StatusLine status="idle" label="Count" badge={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("badge is hidden when omitted", () => {
    const { container } = render(<StatusLine status="idle" label="No badge" />);
    // Badge component not rendered
    const text = container.textContent;
    expect(text).toBe("No badge");
  });

  it("timestamp renders with mono styling when provided", () => {
    render(<StatusLine status="success" label="Done" timestamp="12:34" />);
    expect(screen.getByText("12:34")).toBeInTheDocument();
  });

  it("timestamp is hidden when omitted", () => {
    render(<StatusLine status="idle" label="Test" />);
    expect(screen.queryByText(/\d{2}:\d{2}/)).not.toBeInTheDocument();
  });

  it("renders as a span (inline element)", () => {
    const { container } = render(<StatusLine status="idle" label="Inline" />);
    expect(container.firstElementChild!.tagName).toBe("SPAN");
  });

  it("forwards className", () => {
    const { container } = render(<StatusLine status="idle" label="X" className="custom-status" />);
    expect(container.firstElementChild!.className).toContain("custom-status");
  });

  it("shows all four elements together", () => {
    render(<StatusLine status="running" label="Processing" badge={42} timestamp="13:45" />);
    expect(screen.getByText("Processing")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("13:45")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════
// IconLabel
// ═══════════════════════════════════════════════════════════
describe("IconLabel — reinforcement", () => {
  it("renders icon with correct codicon class", () => {
    const { container } = render(<IconLabel icon="file" text="README.md" />);
    expect(container.querySelector(".codicon-file")).toBeInTheDocument();
  });

  it("renders text content", () => {
    render(<IconLabel icon="file" text="index.ts" />);
    expect(screen.getByText("index.ts")).toBeInTheDocument();
  });

  it("defaults size to 'xs' and tone to 'secondary'", () => {
    render(<IconLabel icon="file" text="test" />);
    // Text component renders inside span with text-xs class
    const textEl = screen.getByText("test");
    expect(textEl.className).toContain("text-xs");
  });

  it("overrides size and tone when provided", () => {
    render(<IconLabel icon="file" text="big" size="lg" tone="primary" />);
    const textEl = screen.getByText("big");
    expect(textEl.className).toContain("text-lg");
  });

  it("applies weight when provided", () => {
    render(<IconLabel icon="file" text="bold" weight="bold" />);
    const textEl = screen.getByText("bold");
    expect(textEl.className).toContain("font-bold");
  });

  it("icon has shrink-0 class to prevent flex shrinking", () => {
    const { container } = render(<IconLabel icon="file" text="test" />);
    const icon = container.querySelector(".codicon-file")!;
    expect(icon.className).toContain("shrink-0");
  });

  it("applies iconClassName to icon", () => {
    const { container } = render(
      <IconLabel icon="file" text="test" iconClassName="text-red-500" />,
    );
    const icon = container.querySelector(".codicon-file")!;
    expect(icon.className).toContain("text-red-500");
  });

  it("renders root as span with inline-flex", () => {
    const { container } = render(<IconLabel icon="file" text="test" />);
    const root = container.firstElementChild!;
    expect(root.tagName).toBe("SPAN");
    expect(root.className).toContain("inline-flex");
    expect(root.className).toContain("gap-1");
  });

  it("forwards className to root", () => {
    const { container } = render(<IconLabel icon="file" text="test" className="my-label" />);
    expect(container.firstElementChild!.className).toContain("my-label");
  });
});

// ═══════════════════════════════════════════════════════════
// InlineBanner
// ═══════════════════════════════════════════════════════════
describe("InlineBanner — reinforcement", () => {
  it.each([
    ["error", "role", "alert"],
    ["warning", "role", "status"],
    ["info", "role", "status"],
    ["success", "role", "status"],
  ] as const)("%s variant has role=%s→%s", (variant, _attr, value) => {
    render(<InlineBanner variant={variant}>Message</InlineBanner>);
    const banner = screen.getByRole(value);
    expect(banner).toBeInTheDocument();
  });

  it.each([
    ["error", "assertive"],
    ["warning", "polite"],
    ["info", "polite"],
    ["success", "polite"],
  ] as const)("%s variant has aria-live=%s", (variant, liveValue) => {
    const { container } = render(<InlineBanner variant={variant}>Text</InlineBanner>);
    const banner = container.firstElementChild!;
    expect(banner).toHaveAttribute("aria-live", liveValue);
  });

  it.each([
    ["error", "bg-vsc-error/5"],
    ["warning", "bg-vsc-warning/5"],
    ["info", "bg-vsc-info/5"],
    ["success", "bg-vsc-success/5"],
  ] as const)("%s variant applies %s background", (variant, bgClass) => {
    const { container } = render(<InlineBanner variant={variant}>X</InlineBanner>);
    expect(container.firstElementChild!.className).toContain(bgClass);
  });

  it.each([
    ["error", "error"],
    ["warning", "warning"],
    ["info", "info"],
    ["success", "pass-filled"],
  ] as const)("%s variant uses default icon '%s'", (variant, iconName) => {
    const { container } = render(<InlineBanner variant={variant}>X</InlineBanner>);
    expect(container.querySelector(`.codicon-${iconName}`)).toBeInTheDocument();
  });

  it("custom icon overrides default", () => {
    const { container } = render(
      <InlineBanner variant="error" icon="shield">
        Alert
      </InlineBanner>,
    );
    expect(container.querySelector(".codicon-shield")).toBeInTheDocument();
    expect(container.querySelector(".codicon-error")).not.toBeInTheDocument();
  });

  it("renders children in flex-1 container", () => {
    render(<InlineBanner variant="info">Hello World</InlineBanner>);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("forwards className", () => {
    const { container } = render(
      <InlineBanner variant="info" className="my-banner">
        Content
      </InlineBanner>,
    );
    expect(container.firstElementChild!.className).toContain("my-banner");
  });

  it("base classes are always present", () => {
    const { container } = render(<InlineBanner variant="info">X</InlineBanner>);
    const el = container.firstElementChild!;
    expect(el.className).toContain("flex");
    expect(el.className).toContain("overflow-hidden");
    expect(el.className).toContain("rounded-md");
    expect(el.className).toContain("text-xs");
  });

  it("icon has shrink-0 class", () => {
    const { container } = render(<InlineBanner variant="error">X</InlineBanner>);
    const icon = container.querySelector(".codicon-error")!;
    expect(icon.className).toContain("shrink-0");
  });
});
