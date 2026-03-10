import React from "react";
import { useAtomValue } from "jotai";

import { messageAtomFamily } from "~entities/message/core";

import type { MessageId } from "../../shared/protocol";
import { AgentMessageRow } from "./AgentMessageRow";
import { UserMessageRow } from "./UserMessageRow";

interface MessageRowProps {
  messageId: MessageId;
}

/**
 * Single message row — thin dispatcher that delegates to
 * `UserMessageRow` or `AgentMessageRow` based on `msg.role`.
 */
export const MessageRow = React.memo(function MessageRow({ messageId }: MessageRowProps) {
  const msg = useAtomValue(messageAtomFamily(messageId));
  if (!msg) return null;
  return msg.role === "user"
    ? <UserMessageRow messageId={messageId} />
    : <AgentMessageRow messageId={messageId} />;
});
