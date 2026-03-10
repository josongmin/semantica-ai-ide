import { useCallback } from "react";

import { getVscodeApi } from "../../../shared/lib";

export function usePlaybookMarket() {
  const installPlaybook = useCallback((playbookId: string) => {
    getVscodeApi().postMessage({ type: "INSTALL_PLAYBOOK", playbook_id: playbookId });
  }, []);

  const uninstallPlaybook = useCallback((playbookId: string) => {
    getVscodeApi().postMessage({ type: "UNINSTALL_PLAYBOOK", playbook_id: playbookId });
  }, []);

  const applyPlaybook = useCallback((playbookId: string) => {
    getVscodeApi().postMessage({ type: "APPLY_PLAYBOOK", playbook_id: playbookId });
  }, []);

  return { installPlaybook, uninstallPlaybook, applyPlaybook };
}
