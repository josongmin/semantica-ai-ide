import { render, screen } from "@testing-library/react";

import { InlineBanner } from "../InlineBanner";

describe("InlineBanner", () => {
  it("renders children", () => {
    render(<InlineBanner variant="info">Something happened</InlineBanner>);
    expect(screen.getByText("Something happened")).toBeInTheDocument();
  });

  it('error variant uses role="alert", others use role="status"', () => {
    const { unmount } = render(<InlineBanner variant="error">Err</InlineBanner>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    unmount();

    render(<InlineBanner variant="info">Info</InlineBanner>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("error variant applies background and text classes", () => {
    render(<InlineBanner variant="error">Error occurred</InlineBanner>);
    const el = screen.getByRole("alert");
    expect(el.className).toMatch(/bg-vsc-error\/5/);
    expect(el.className).toMatch(/text-vsc-error/);
  });

  it("success variant applies background and text classes", () => {
    render(<InlineBanner variant="success">All good</InlineBanner>);
    const el = screen.getByRole("status");
    expect(el.className).toMatch(/bg-vsc-success\/5/);
    expect(el.className).toMatch(/text-vsc-success/);
  });

  it('default icon mapping: error uses "error", success uses "pass-filled"', () => {
    const { unmount } = render(<InlineBanner variant="error">Error</InlineBanner>);
    const errorIcon = screen.getByRole("alert").querySelector("i");
    expect(errorIcon?.className).toContain("codicon-error");
    unmount();

    render(<InlineBanner variant="success">Success</InlineBanner>);
    const successIcon = screen.getByRole("status").querySelector("i");
    expect(successIcon?.className).toContain("codicon-pass-filled");
  });

  it("custom icon prop overrides default icon", () => {
    render(
      <InlineBanner variant="error" icon="flame">
        Custom icon
      </InlineBanner>,
    );
    const icon = screen.getByRole("alert").querySelector("i");
    expect(icon?.className).toContain("codicon-flame");
    expect(icon?.className).not.toContain("codicon-error");
  });
});
