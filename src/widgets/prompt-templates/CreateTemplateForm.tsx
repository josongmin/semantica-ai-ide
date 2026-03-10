import React, { useCallback, useState } from "react";

import type { PromptTemplateScope } from "../../shared/protocol";
import { Button, Icon, Text } from "../../shared/ui";

interface CreateTemplateFormProps {
  readonly onSave: (data: {
    name: string;
    description: string;
    template: string;
    scope: PromptTemplateScope;
    category?: string;
  }) => void;
  readonly onCancel: () => void;
}

export const CreateTemplateForm = React.memo(function CreateTemplateForm({
  onSave,
  onCancel,
}: CreateTemplateFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("");
  const [scope, setScope] = useState<PromptTemplateScope>("personal");
  const [category, setCategory] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !template.trim()) return;
      onSave({
        name: name.trim(),
        description: description.trim(),
        template: template.trim(),
        scope,
        category: category.trim() || undefined,
      });
    },
    [name, description, template, scope, category, onSave],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3"
      data-testid="create-template-form"
    >
      <div className="flex flex-col gap-1">
        <Text size="xs" weight="medium">
          Name
        </Text>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-2 py-1.5 text-xs rounded border border-vsc-panel-border bg-vsc-input-bg text-vsc-input-fg focus:border-vsc-focusBorder focus:ring-1 focus:ring-vsc-focus/30 outline-none"
          placeholder="Template name"
          data-testid="template-name-input"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Text size="xs" weight="medium">
          Description
        </Text>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="px-2 py-1.5 text-xs rounded border border-vsc-panel-border bg-vsc-input-bg text-vsc-input-fg focus:border-vsc-focusBorder focus:ring-1 focus:ring-vsc-focus/30 outline-none"
          placeholder="Brief description"
          data-testid="template-description-input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Text size="xs" weight="medium">
          Template Text
        </Text>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="px-2 py-1.5 text-xs rounded border border-vsc-panel-border bg-vsc-input-bg text-vsc-input-fg focus:border-vsc-focusBorder focus:ring-1 focus:ring-vsc-focus/30 outline-none resize-y min-h-[80px]"
          placeholder="Enter your prompt template..."
          data-testid="template-text-input"
          required
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <Text size="xs" weight="medium">
            Scope
          </Text>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as PromptTemplateScope)}
            className="px-2 py-1.5 text-xs rounded border border-vsc-panel-border bg-vsc-input-bg text-vsc-input-fg focus:border-vsc-focusBorder focus:ring-1 focus:ring-vsc-focus/30 outline-none"
            data-testid="template-scope-select"
          >
            <option value="personal">Personal</option>
            <option value="team">Team</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <Text size="xs" weight="medium">
            Category (optional)
          </Text>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2 py-1.5 text-xs rounded border border-vsc-panel-border bg-vsc-input-bg text-vsc-input-fg focus:border-vsc-focusBorder focus:ring-1 focus:ring-vsc-focus/30 outline-none"
            placeholder="e.g. refactoring"
            data-testid="template-category-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-vsc-panel-border">
        <Button variant="ghost" size="sm" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" data-testid="template-save-button">
          <Icon name="save" tokenSize="sm" />
          Save Template
        </Button>
      </div>
    </form>
  );
});
