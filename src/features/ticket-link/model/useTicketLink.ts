import { useCallback } from "react";

import { getVscodeApi } from "../../../shared/lib/vscodeApi";

export function useTicketLink() {
  const openTicketUrl = useCallback((url: string) => {
    getVscodeApi().postMessage({ type: "OPEN_FILE", file_path: url });
  }, []);

  const linkTicket = useCallback((ticketKey: string, platform: string) => {
    getVscodeApi().postMessage({ type: "LINK_TICKET", ticket_key: ticketKey, platform });
  }, []);

  const unlinkTicket = useCallback((ticketId: string) => {
    getVscodeApi().postMessage({ type: "UNLINK_TICKET", ticket_id: ticketId });
  }, []);

  const syncTicketStatus = useCallback((ticketId: string) => {
    getVscodeApi().postMessage({ type: "SYNC_TICKET_STATUS", ticket_id: ticketId });
  }, []);

  return { openTicketUrl, linkTicket, unlinkTicket, syncTicketStatus };
}
