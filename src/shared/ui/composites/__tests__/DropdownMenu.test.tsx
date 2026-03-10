import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";

import { DropdownMenu, type DropdownMenuItem } from "../DropdownMenu";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

describe("DropdownMenu", () => {
  const onSelect = vi.fn();
  const items: DropdownMenuItem[] = [
    { id: "edit", label: "Edit" },
    { id: "copy", label: "Copy" },
    { id: "delete", label: "Delete", danger: true },
  ];

  beforeEach(() => {
    onSelect.mockClear();
  });

  const renderDropdown = (props: Partial<React.ComponentProps<typeof DropdownMenu>> = {}) =>
    render(
      <DropdownMenu
        items={items}
        onSelect={onSelect}
        trigger={<button type="button">Menu</button>}
        {...props}
      />,
      { wrapper: JotaiWrapper },
    );

  it("renders trigger button", () => {
    renderDropdown();
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("menu is not visible by default", () => {
    renderDropdown();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens menu on trigger click", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByText("Menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("trigger has aria-haspopup=menu", () => {
    renderDropdown();
    expect(screen.getByText("Menu")).toHaveAttribute("aria-haspopup", "menu");
  });

  it("trigger has aria-expanded when open", async () => {
    const user = userEvent.setup();
    renderDropdown();

    expect(screen.getByText("Menu")).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByText("Menu"));
    expect(screen.getByText("Menu")).toHaveAttribute("aria-expanded", "true");
  });

  it("renders all menu items", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByText("Menu"));
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("menu items have role=menuitem", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByText("Menu"));
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
  });

  it("clicking item calls onSelect and closes menu", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByText("Menu"));
    await user.click(screen.getByText("Edit"));

    expect(onSelect).toHaveBeenCalledWith("edit");
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("Escape closes menu", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByText("Menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("outside click closes menu", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <span data-testid="outside">Outside</span>
        <DropdownMenu
          items={items}
          onSelect={onSelect}
          trigger={<button type="button">Menu</button>}
        />
      </div>,
      { wrapper: JotaiWrapper },
    );

    await user.click(screen.getByText("Menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByTestId("outside"));
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("disabled item has aria-disabled", async () => {
    const user = userEvent.setup();
    const itemsWithDisabled: DropdownMenuItem[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
    ];
    render(
      <DropdownMenu
        items={itemsWithDisabled}
        onSelect={onSelect}
        trigger={<button type="button">Menu</button>}
      />,
      { wrapper: JotaiWrapper },
    );

    await user.click(screen.getByText("Menu"));
    expect(screen.getByText("B")).toHaveAttribute("aria-disabled", "true");
  });

  it("disabled item click does not call onSelect", async () => {
    const user = userEvent.setup();
    const itemsWithDisabled: DropdownMenuItem[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
    ];
    render(
      <DropdownMenu
        items={itemsWithDisabled}
        onSelect={onSelect}
        trigger={<button type="button">Menu</button>}
      />,
      { wrapper: JotaiWrapper },
    );

    await user.click(screen.getByText("Menu"));
    await user.click(screen.getByText("B"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keyboard ArrowDown navigates items", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByText("Menu"));

    // First item should be focused automatically
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toHaveTextContent("Copy");
  });

  it("toggle: second click on trigger closes menu", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByText("Menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByText("Menu"));
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });
});
