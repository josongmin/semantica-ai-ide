import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { categoryPermissionsAtom } from "../../../features/permission-settings";
import { permissionSettingsOpenAtom } from "../../../shared/lib";
import { PermissionSettingsDialog } from "../PermissionSettingsDialog";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

// ─── Tests ─────────────────────────────────────────────────
describe("PermissionSettingsDialog", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("renders nothing when closed", () => {
    renderWithAtoms(<PermissionSettingsDialog />, {
      initialValues: [[permissionSettingsOpenAtom, false]],
    });
    expect(screen.queryByText("Permission Settings")).not.toBeInTheDocument();
  });

  it("renders dialog with title when open", () => {
    renderWithAtoms(<PermissionSettingsDialog />, {
      initialValues: [[permissionSettingsOpenAtom, true]],
    });
    expect(screen.getByText("Permission Settings")).toBeInTheDocument();
  });

  it("shows all 8 category rows", () => {
    renderWithAtoms(<PermissionSettingsDialog />, {
      initialValues: [[permissionSettingsOpenAtom, true]],
    });
    expect(screen.getByText("Read Files")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Write Files")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Terminal")).toBeInTheDocument();
    expect(screen.getByText("Git")).toBeInTheDocument();
    expect(screen.getByText("Analysis")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("shows preset buttons", () => {
    renderWithAtoms(<PermissionSettingsDialog />, {
      initialValues: [[permissionSettingsOpenAtom, true]],
    });
    expect(screen.getByTestId("preset-conservative")).toBeInTheDocument();
    expect(screen.getByTestId("preset-balanced")).toBeInTheDocument();
    expect(screen.getByTestId("preset-turbo")).toBeInTheDocument();
  });

  it("clicking Conservative preset sets all to ask", async () => {
    const { user, store } = renderWithAtoms(<PermissionSettingsDialog />, {
      initialValues: [[permissionSettingsOpenAtom, true]],
    });

    await user.click(screen.getByTestId("preset-conservative"));

    const perms = store.get(categoryPermissionsAtom);
    expect(perms.get("read")).toBe("ask");
    expect(perms.get("search")).toBe("ask");
    expect(perms.get("write")).toBe("ask");
    expect(perms.get("analysis")).toBe("ask");
  });

  it("clicking Turbo preset sets most to auto, delete to ask", async () => {
    const { user, store } = renderWithAtoms(<PermissionSettingsDialog />, {
      initialValues: [[permissionSettingsOpenAtom, true]],
    });

    await user.click(screen.getByTestId("preset-turbo"));

    const perms = store.get(categoryPermissionsAtom);
    expect(perms.get("read")).toBe("auto");
    expect(perms.get("write")).toBe("auto");
    expect(perms.get("delete")).toBe("ask");
    expect(perms.get("terminal")).toBe("auto");
  });

  it("Apply button sends SET_CATEGORY_PERMISSIONS and closes", async () => {
    const { user, store } = renderWithAtoms(<PermissionSettingsDialog />, {
      initialValues: [[permissionSettingsOpenAtom, true]],
    });

    await user.click(screen.getByText("Apply"));

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SET_CATEGORY_PERMISSIONS" }),
    );
    expect(store.get(permissionSettingsOpenAtom)).toBe(false);
  });

  it("Cancel closes dialog without sending message", async () => {
    const { user, store } = renderWithAtoms(<PermissionSettingsDialog />, {
      initialValues: [[permissionSettingsOpenAtom, true]],
    });

    await user.click(screen.getByText("Cancel"));

    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(store.get(permissionSettingsOpenAtom)).toBe(false);
  });

  it("Reset to defaults restores default permissions", async () => {
    const { user, store } = renderWithAtoms(<PermissionSettingsDialog />, {
      initialValues: [[permissionSettingsOpenAtom, true]],
    });

    // First change to turbo preset
    await user.click(screen.getByTestId("preset-turbo"));
    expect(store.get(categoryPermissionsAtom).get("write")).toBe("auto");

    // Then reset
    await user.click(screen.getByTestId("reset-defaults"));
    expect(store.get(categoryPermissionsAtom).get("write")).toBe("ask");
    expect(store.get(categoryPermissionsAtom).get("read")).toBe("auto");
  });
});
