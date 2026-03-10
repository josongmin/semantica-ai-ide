import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SegmentedControl, type SegmentedOption } from "../SegmentedControl";
const OPTIONS: SegmentedOption[] = [
  { value: "auto", label: "Auto" },
  { value: "ask", label: "Ask" },
  { value: "block", label: "Block" },
];

describe("SegmentedControl", () => {
  // ── Rendering ────────────────────────────────────────────
  it("renders all options as radio buttons", () => {
    render(<SegmentedControl options={OPTIONS} value="ask" onValueChange={vi.fn()} />);

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(screen.getByText("Auto")).toBeInTheDocument();
    expect(screen.getByText("Ask")).toBeInTheDocument();
    expect(screen.getByText("Block")).toBeInTheDocument();
  });

  it("marks selected option with aria-checked", () => {
    render(<SegmentedControl options={OPTIONS} value="ask" onValueChange={vi.fn()} />);

    const checked = screen.getByRole("radio", { checked: true });
    expect(checked).toHaveTextContent("Ask");
  });

  it("selected option has tabIndex 0, others have -1", () => {
    render(<SegmentedControl options={OPTIONS} value="block" onValueChange={vi.fn()} />);

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      if (radio.textContent === "Block") {
        expect(radio).toHaveAttribute("tabindex", "0");
      } else {
        expect(radio).toHaveAttribute("tabindex", "-1");
      }
    }
  });

  it("renders inside a radiogroup", () => {
    render(<SegmentedControl options={OPTIONS} value="auto" onValueChange={vi.fn()} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });

  // ── Click interaction ────────────────────────────────────
  it("calls onValueChange when clicking an unselected option", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<SegmentedControl options={OPTIONS} value="ask" onValueChange={onValueChange} />);

    await user.click(screen.getByText("Block"));
    expect(onValueChange).toHaveBeenCalledWith("block");
  });

  it("calls onValueChange when clicking already selected option", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<SegmentedControl options={OPTIONS} value="ask" onValueChange={onValueChange} />);

    await user.click(screen.getByText("Ask"));
    expect(onValueChange).toHaveBeenCalledWith("ask");
  });

  // ── Keyboard navigation ──────────────────────────────────
  it("ArrowRight moves to next option", () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="auto" onValueChange={onValueChange} />);

    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenCalledWith("ask");
  });

  it("ArrowLeft moves to previous option", () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="ask" onValueChange={onValueChange} />);

    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowLeft" });
    expect(onValueChange).toHaveBeenCalledWith("auto");
  });

  it("ArrowRight wraps around from last to first", () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="block" onValueChange={onValueChange} />);

    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenCalledWith("auto");
  });

  it("ArrowLeft wraps around from first to last", () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="auto" onValueChange={onValueChange} />);

    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowLeft" });
    expect(onValueChange).toHaveBeenCalledWith("block");
  });

  it("ArrowDown behaves like ArrowRight", () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="auto" onValueChange={onValueChange} />);

    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowDown" });
    expect(onValueChange).toHaveBeenCalledWith("ask");
  });

  it("ArrowUp behaves like ArrowLeft", () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="ask" onValueChange={onValueChange} />);

    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowUp" });
    expect(onValueChange).toHaveBeenCalledWith("auto");
  });

  it("ignores non-arrow keys", () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="ask" onValueChange={onValueChange} />);

    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "Enter" });
    fireEvent.keyDown(group, { key: "Space" });
    fireEvent.keyDown(group, { key: "Tab" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("does nothing when value is not found in options", () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        options={OPTIONS}
        value={"invalid" as string}
        onValueChange={onValueChange}
      />,
    );

    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  // ── Size variants ────────────────────────────────────────
  it("renders with sm size by default", () => {
    render(<SegmentedControl options={OPTIONS} value="auto" onValueChange={vi.fn()} />);
    const radio = screen.getAllByRole("radio")[0];
    if (radio === undefined) throw new Error("expected radio element");
    expect(radio.className).toContain("text-2xs");
  });

  it("renders with md size when specified", () => {
    render(<SegmentedControl options={OPTIONS} value="auto" onValueChange={vi.fn()} size="md" />);
    const radio = screen.getAllByRole("radio")[0];
    if (radio === undefined) throw new Error("expected radio element");
    expect(radio.className).toContain("text-xs");
  });

  // ── Two options edge case ────────────────────────────────
  it("works with two options", () => {
    const twoOptions: SegmentedOption[] = [
      { value: "on", label: "On" },
      { value: "off", label: "Off" },
    ];
    const onValueChange = vi.fn();
    render(<SegmentedControl options={twoOptions} value="on" onValueChange={onValueChange} />);

    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenCalledWith("off");
  });
});
