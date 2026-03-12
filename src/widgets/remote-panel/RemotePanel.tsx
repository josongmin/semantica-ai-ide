import React, { useState } from "react";

import { useRemoteControl } from "../../features/remote-control";
import { Badge, Button, ConfirmDialog, InlineBanner, Text } from "../../shared/ui";

const MAX_RECENT_COMMANDS = 5;

export const RemotePanel = React.memo(function RemotePanel() {
  const { panelVisible, status, qrCodeDataUrl, commands, requestQr, disconnect } =
    useRemoteControl();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  if (!panelVisible) return null;

  const recentCommands = commands.slice(0, MAX_RECENT_COMMANDS);

  function handleDisconnect() {
    disconnect();
    setConfirmDisconnect(false);
  }

  return (
    <div
      className="border-t border-vsc-border bg-vsc-surface-1"
      role="region"
      aria-label="Remote panel"
    >
      <div className="px-3 py-2 border-b border-vsc-border">
        <Text size="3xs" tone="secondary" className="font-medium tracking-wide">
          Remote Control
        </Text>
      </div>

      <div className="px-3 py-3 flex flex-col gap-3">
        {status === "disconnected" && (
          <div className="flex flex-col items-center gap-2">
            <Text size="xs" tone="tertiary">
              Not connected
            </Text>
            <Button size="sm" variant="ghost" onClick={requestQr} aria-label="Request QR code">
              Request QR Code
            </Button>
          </div>
        )}

        {status === "waiting" && (
          <div className="flex flex-col items-center gap-3">
            {qrCodeDataUrl && (
              <img
                src={qrCodeDataUrl}
                alt="QR code for remote pairing"
                className="w-32 h-32 rounded"
                aria-label="Remote QR code"
              />
            )}
            <Text size="xs" tone="tertiary">
              Waiting for connection…
            </Text>
          </div>
        )}

        {status === "connected" && (
          <div className="flex flex-col gap-2">
            <InlineBanner
              variant="success"
              icon="pass-filled"
              bordered
              actions={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmDisconnect(true)}
                  aria-label="Disconnect remote"
                >
                  Disconnect
                </Button>
              }
            >
              <div className="flex items-center gap-2">
                <Badge text="Connected" variant="success" />
                <Text size="xs" tone="secondary">
                  Remote device connected
                </Text>
              </div>
              <ConfirmDialog
                open={confirmDisconnect}
                onConfirm={handleDisconnect}
                onCancel={() => setConfirmDisconnect(false)}
                title="Disconnect remote"
                description="Disconnect the remote device? You'll need to scan a new QR code to reconnect."
                confirmLabel="Disconnect"
                confirmVariant="danger"
              />
            </InlineBanner>
          </div>
        )}

        {recentCommands.length > 0 && (
          <div>
            <Text size="3xs" tone="tertiary" className="mb-1 tracking-wide">
              Recent Commands
            </Text>
            <div
              role="list"
              className="divide-y divide-vsc-border border border-vsc-border rounded"
            >
              {recentCommands.map((command) => (
                <div
                  key={command.id}
                  className="flex items-center gap-2 px-3 py-1.5"
                  role="listitem"
                >
                  <Text size="xs" tone="primary" className="flex-1 min-w-0 truncate">
                    {command.text}
                  </Text>
                  {command.executed && <Badge text="done" variant="success" className="shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
