import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { cn, CodeBlockActions, ErrorBoundary } from "../../shared/ui";
import { MermaidDiagram } from "../mermaid-diagram";
import { CommitMessageCard, parseCommitMessage } from "./CommitMessageCard";
import { isAllowedImageSrc, STATIC_COMPONENTS } from "./markdownComponents";

// eslint-disable-next-line react-refresh/only-export-components
export { isAllowedImageSrc };

interface MarkdownContentProps {
  text: string;
  className?: string;
}

// Hoisted to module level to avoid re-creating on every render
const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeHighlight];

/** Lightweight loading skeleton for large markdown blocks. */
function MarkdownSkeleton() {
  return (
    <div className="flex flex-col gap-2 py-2 animate-pulse">
      <div className="h-3 w-[90%] rounded bg-vsc-surface-2" />
      <div className="h-3 w-[75%] rounded bg-vsc-surface-2" />
      <div className="h-3 w-[85%] rounded bg-vsc-surface-2" />
      <div className="h-3 w-[60%] rounded bg-vsc-surface-2" />
    </div>
  );
}

/**
 * Renders markdown text with GFM support, syntax highlighting, and copy buttons.
 * Uses VSCode theme variables for native look.
 */
export const MarkdownContent = React.memo(function MarkdownContent({
  text,
  className,
}: MarkdownContentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deferred mount for lazy code-highlight initialization
    setMounted(true);
  }, []);

  // `pre` must be per-render because CodeBlockActions captures dynamic `codeText`
  const components = React.useMemo(
    () => ({
      ...STATIC_COMPONENTS,
      pre({ children }: { children?: React.ReactNode }) {
        const codeText = extractCodeText(children);
        const lang = extractLanguage(children);

        // Route mermaid blocks to the diagram renderer
        if (lang === "mermaid" && codeText) {
          return (
            <ErrorBoundary
              fallback={
                <div className="relative group/code my-1.5 -mx-1">
                  <div className="flex items-center h-[--height-row-sm] px-3 bg-vsc-surface-3 text-2xs text-vsc-error font-medium">
                    mermaid (error)
                  </div>
                  <pre className="px-3 py-2 bg-vsc-code-bg overflow-auto text-xs leading-normal m-0">
                    <code>{codeText}</code>
                  </pre>
                </div>
              }
            >
              <MermaidDiagram source={codeText} />
            </ErrorBoundary>
          );
        }

        /* -- Language-tagged: edge-to-edge code block -- */
        if (lang) {
          return (
            <div className="relative group/code my-1.5 -mx-1">
              <div className="flex items-center h-[--height-row-sm] px-3 bg-vsc-surface-3 text-2xs text-vsc-text-tertiary font-medium">
                {lang}
              </div>
              <pre className="px-3 py-2.5 bg-vsc-code-bg overflow-auto text-xs leading-normal m-0">
                {children}
              </pre>
              {codeText && <CodeBlockActions code={codeText} language={lang} />}
            </div>
          );
        }

        /* -- Commit message card -- */
        if (codeText && parseCommitMessage(codeText)) {
          return (
            <CommitMessageCard codeText={codeText} actions={<CodeBlockActions code={codeText} />} />
          );
        }

        /* -- Plain block (fallback) -- */
        return (
          <div className="relative group/code my-1.5">
            <pre
              className="px-4 py-3 bg-vsc-code-bg/60 border border-vsc-border/40 rounded-md
                         overflow-auto text-xs leading-relaxed m-0"
            >
              {children}
            </pre>
            {codeText && <CodeBlockActions code={codeText} />}
          </div>
        );
      },
    }),
    [],
  );

  // Show skeleton on first render frame for large text blocks
  if (!mounted && text.length > 5000) {
    return (
      <div className={cn("markdown-body", className)}>
        <MarkdownSkeleton />
      </div>
    );
  }

  return (
    <div className={cn("markdown-body", className)}>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});

/** Safely extract props from a React element */
function getElementProps(el: React.ReactElement): Record<string, unknown> {
  return el.props as Record<string, unknown>;
}

/** Extract plain text from code block children for copy button */
function extractCodeText(children: React.ReactNode): string {
  if (children === null || children === undefined) return "";
  const child = React.Children.toArray(children)[0];
  if (React.isValidElement(child)) {
    const props = getElementProps(child);
    const childChildren = props.children as React.ReactNode | undefined;
    if (childChildren !== null && childChildren !== undefined) {
      if (typeof childChildren === "string") return childChildren;
      return extractCodeTextRecursive(childChildren);
    }
  }
  return typeof children === "string" ? children : "";
}

function extractCodeTextRecursive(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return (node as React.ReactNode[]).map(extractCodeTextRecursive).join("");
  if (React.isValidElement(node)) {
    const props = getElementProps(node);
    const childChildren = props.children as React.ReactNode | undefined;
    if (childChildren !== null && childChildren !== undefined) {
      return extractCodeTextRecursive(childChildren);
    }
  }
  return "";
}

/** Extract language from code block className (e.g. "language-typescript" -> "typescript") */
function extractLanguage(children: React.ReactNode): string {
  if (children === null || children === undefined) return "";
  const child = React.Children.toArray(children)[0];
  if (React.isValidElement(child)) {
    const props = getElementProps(child);
    const cls: string = typeof props.className === "string" ? props.className : "";
    const match = /language-(\w+)/.exec(cls);
    return match?.[1] ?? "";
  }
  return "";
}
