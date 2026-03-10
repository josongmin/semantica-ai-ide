import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils";
import {
  remoteCommandsAtom,
  remoteQrCodeAtom,
  remoteStatusAtom,
} from "../../../entities/remote-control";
import { remotePanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { createRemoteCommand } from "../../../shared/lib/mocks";
import { RemotePanel } from "../RemotePanel";

describe("RemotePanel", () => {
  it("renders nothing when not visible", () => {
    const { container } = renderWithAtoms(<RemotePanel />);
    expect(container.children).toHaveLength(0);
  });

  it("renders panel when visible", () => {
    renderWithAtoms(<RemotePanel />, {
      initialValues: [[remotePanelVisibleAtom, true]],
    });
    expect(screen.getByRole("region", { name: /remote panel/i })).toBeInTheDocument();
  });

  it("shows disconnected state by default", () => {
    renderWithAtoms(<RemotePanel />, {
      initialValues: [
        [remotePanelVisibleAtom, true],
        [remoteStatusAtom, "disconnected"],
      ],
    });
    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /request qr code/i })).toBeInTheDocument();
  });

  it("shows QR code image when waiting", () => {
    renderWithAtoms(<RemotePanel />, {
      initialValues: [
        [remotePanelVisibleAtom, true],
        [remoteStatusAtom, "waiting"],
        [remoteQrCodeAtom, "data:image/png;base64,abc123"],
      ],
    });
    expect(screen.getByAltText(/qr code/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting for connection/i)).toBeInTheDocument();
  });

  it("shows connected banner when connected", () => {
    renderWithAtoms(<RemotePanel />, {
      initialValues: [
        [remotePanelVisibleAtom, true],
        [remoteStatusAtom, "connected"],
      ],
    });
    expect(screen.getByLabelText(/connected/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnect remote/i })).toBeInTheDocument();
  });

  it("shows recent commands list when commands exist", () => {
    const cmd1 = createRemoteCommand({ text: "run tests" });
    const cmd2 = createRemoteCommand({ text: "build project" });
    renderWithAtoms(<RemotePanel />, {
      initialValues: [
        [remotePanelVisibleAtom, true],
        [remoteCommandsAtom, [cmd1, cmd2]],
      ],
    });
    expect(screen.getByText("run tests")).toBeInTheDocument();
    expect(screen.getByText("build project")).toBeInTheDocument();
  });

  it("shows only last 5 commands", () => {
    const commands = Array.from({ length: 8 }, (_, i) =>
      createRemoteCommand({ text: `command ${i + 1}` }),
    );
    renderWithAtoms(<RemotePanel />, {
      initialValues: [
        [remotePanelVisibleAtom, true],
        [remoteCommandsAtom, commands],
      ],
    });
    expect(screen.getByText("command 1")).toBeInTheDocument();
    expect(screen.getByText("command 5")).toBeInTheDocument();
    expect(screen.queryByText("command 6")).not.toBeInTheDocument();
  });

  it("shows done badge on executed commands", () => {
    const cmd = createRemoteCommand({ text: "some command", executed: true });
    renderWithAtoms(<RemotePanel />, {
      initialValues: [
        [remotePanelVisibleAtom, true],
        [remoteCommandsAtom, [cmd]],
      ],
    });
    expect(screen.getByText("done")).toBeInTheDocument();
  });
});
