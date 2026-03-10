import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { promptTemplatesAtom,templateLibraryOpenAtom } from "../../../features/prompt-templates";
import { createPromptTemplate, resetIdCounter } from "../../../shared/lib/mocks";
import { PromptTemplateLibrary } from "../PromptTemplateLibrary";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

const personalTemplates = [
  createPromptTemplate({ id: "tpl-1", name: "Code Review", scope: "personal" }),
  createPromptTemplate({ id: "tpl-2", name: "Bug Fix", scope: "personal" }),
];

describe("PromptTemplateLibrary", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    resetIdCounter();
  });

  it("renders nothing when library is closed", () => {
    const { container } = renderWithAtoms(<PromptTemplateLibrary />);
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog when open", () => {
    renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [[templateLibraryOpenAtom, true]],
    });

    expect(screen.getByText("Prompt Templates")).toBeTruthy();
  });

  it("shows Personal and Team tabs", () => {
    renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [[templateLibraryOpenAtom, true]],
    });

    expect(screen.getByText("Personal")).toBeTruthy();
    expect(screen.getByText("Team")).toBeTruthy();
  });

  it("shows search input", () => {
    renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [[templateLibraryOpenAtom, true]],
    });

    expect(screen.getByTestId("template-search-input")).toBeTruthy();
  });

  it("shows Create button", () => {
    renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [[templateLibraryOpenAtom, true]],
    });

    expect(screen.getByTestId("create-template-button")).toBeTruthy();
  });

  it("shows empty state when no templates", () => {
    renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [[templateLibraryOpenAtom, true]],
    });

    expect(screen.getByText("No personal templates yet")).toBeTruthy();
  });

  it("shows template cards when templates exist", async () => {
    renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [
        [templateLibraryOpenAtom, true],
        [promptTemplatesAtom, personalTemplates],
      ],
    });

    expect(await screen.findByTestId("template-card-tpl-1")).toBeTruthy();
    expect(screen.getByTestId("template-card-tpl-2")).toBeTruthy();
    expect(screen.getByText("Code Review")).toBeTruthy();
    expect(screen.getByText("Bug Fix")).toBeTruthy();
  });

  it("shows Use button on each template card", async () => {
    renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [
        [templateLibraryOpenAtom, true],
        [
          promptTemplatesAtom,
          [createPromptTemplate({ id: "tpl-1", name: "My Template", scope: "personal" })],
        ],
      ],
    });

    expect(await screen.findByTestId("template-use-tpl-1")).toBeTruthy();
  });

  it("sends APPLY_PROMPT_TEMPLATE when Use is clicked", async () => {
    const { user } = renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [
        [templateLibraryOpenAtom, true],
        [
          promptTemplatesAtom,
          [createPromptTemplate({ id: "tpl-1", name: "My Template", scope: "personal" })],
        ],
      ],
    });

    const useBtn = await screen.findByTestId("template-use-tpl-1");
    await user.click(useBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "APPLY_PROMPT_TEMPLATE",
      template_id: "tpl-1",
    });
  });

  it("sends DELETE_PROMPT_TEMPLATE when delete is clicked", async () => {
    const { user } = renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [
        [templateLibraryOpenAtom, true],
        [promptTemplatesAtom, [createPromptTemplate({ id: "tpl-1", scope: "personal" })]],
      ],
    });

    const deleteBtn = await screen.findByTestId("template-delete-tpl-1");
    await user.click(deleteBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DELETE_PROMPT_TEMPLATE",
      template_id: "tpl-1",
    });
  });

  it("shows category badge on template card", async () => {
    renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [
        [templateLibraryOpenAtom, true],
        [
          promptTemplatesAtom,
          [
            createPromptTemplate({
              id: "tpl-1",
              name: "Refactor Helper",
              scope: "personal",
              category: "refactoring",
            }),
          ],
        ],
      ],
    });

    expect(await screen.findByText("refactoring")).toBeTruthy();
  });

  it("shows create template form when Create is clicked", async () => {
    const { user } = renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [[templateLibraryOpenAtom, true]],
    });

    const createBtn = screen.getByTestId("create-template-button");
    await user.click(createBtn);

    expect(screen.getByTestId("create-template-form")).toBeTruthy();
    expect(screen.getByTestId("template-name-input")).toBeTruthy();
    expect(screen.getByTestId("template-text-input")).toBeTruthy();
    expect(screen.getByTestId("template-scope-select")).toBeTruthy();
  });

  it("sends SAVE_PROMPT_TEMPLATE when form is submitted", async () => {
    const { user } = renderWithAtoms(<PromptTemplateLibrary />, {
      initialValues: [[templateLibraryOpenAtom, true]],
    });

    // Open create form
    await user.click(screen.getByTestId("create-template-button"));

    // Fill form - avoid curly braces since userEvent.type interprets them
    const nameInput = screen.getByTestId("template-name-input");
    const textInput = screen.getByTestId("template-text-input");
    await user.type(nameInput, "New Template");
    await user.type(textInput, "Review this code please");

    // Submit
    const saveBtn = screen.getByTestId("template-save-button");
    await user.click(saveBtn);

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "SAVE_PROMPT_TEMPLATE",
        template: expect.objectContaining({
          name: "New Template",
          template: "Review this code please",
          scope: "personal",
        }),
      }),
    );
  });
});
