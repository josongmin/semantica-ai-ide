import React from "react";

/** Max data URI size (1 MB base64 ~ 750 KB decoded) */
const MAX_DATA_URI_LENGTH = 1_400_000;

/** Only allow HTTPS URLs and valid data:image URIs */
export function isAllowedImageSrc(src: string | undefined): boolean {
  if (!src) return false;
  if (src.startsWith("https://")) return true;
  // Validate data URI: must be a real image MIME type and within size limit
  if (/^data:image\/[a-z0-9][a-z0-9.+-]*;base64,/i.test(src)) {
    return src.length <= MAX_DATA_URI_LENGTH;
  }
  return false;
}

/**
 * Stable component overrides for ReactMarkdown.
 * `pre` needs CodeBlockActions which captures dynamic text, so it is set per-render.
 * All other components are hoisted here to avoid identity changes.
 */
export const STATIC_COMPONENTS = {
  code({ children, className: codeClass }: { children?: React.ReactNode; className?: string }) {
    const isBlock = (codeClass?.startsWith("hljs") ?? false) || (codeClass?.startsWith("language-") ?? false);
    if (isBlock) {
      return <code className={codeClass}>{children}</code>;
    }
    return (
      <code className="px-1.5 py-0.5 rounded-sm bg-vsc-code-bg text-[length:inherit] text-vsc-fg">{children}</code>
    );
  },
  a({ href, children }: { href?: string; children?: React.ReactNode }) {
    // Block dangerous URI schemes -- only allow http(s) and fragment links
    const safeHref =
      href && (/^https?:\/\//i.test(href) || href.startsWith("#")) ? href : undefined;
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-vsc-link hover:underline"
      >
        {children}
      </a>
    );
  },
  p({ children }: { children?: React.ReactNode }) {
    return <p className="my-2 leading-relaxed">{children}</p>;
  },
  h1({ children }: { children?: React.ReactNode }) {
    return <h1 className="text-xs font-bold mt-5 mb-2.5 text-vsc-fg">{children}</h1>;
  },
  h2({ children }: { children?: React.ReactNode }) {
    return <h2 className="text-xs font-bold mt-4 mb-2 text-vsc-fg">{children}</h2>;
  },
  h3({ children }: { children?: React.ReactNode }) {
    return <h3 className="text-xs font-semibold mt-3 mb-1.5 text-vsc-fg">{children}</h3>;
  },
  ul({ children }: { children?: React.ReactNode }) {
    return <ul className="my-2 pl-6 list-disc">{children}</ul>;
  },
  ol({ children }: { children?: React.ReactNode }) {
    return <ol className="my-2 pl-6 list-decimal">{children}</ol>;
  },
  li({ children }: { children?: React.ReactNode }) {
    return <li className="my-1">{children}</li>;
  },
  blockquote({ children }: { children?: React.ReactNode }) {
    return (
      <blockquote className="border-l-2 border-vsc-info/40 pl-4 py-1 my-2.5 text-vsc-text-secondary italic">
        {children}
      </blockquote>
    );
  },
  table({ children }: { children?: React.ReactNode }) {
    return (
      <div className="overflow-auto my-3">
        <table className="border-collapse text-xs w-full">{children}</table>
      </div>
    );
  },
  th({ children }: { children?: React.ReactNode }) {
    return (
      <th className="border border-vsc-border px-3 py-1.5 bg-vsc-sidebar text-left font-medium">
        {children}
      </th>
    );
  },
  td({ children }: { children?: React.ReactNode }) {
    return <td className="border border-vsc-border px-3 py-1.5">{children}</td>;
  },
  img({ src, alt }: { src?: string; alt?: string }) {
    if (!isAllowedImageSrc(src)) {
      return (
        <span className="text-vsc-text-tertiary text-xs">[Image blocked: {alt ?? "unknown"}]</span>
      );
    }
    return (
      <img
        src={src}
        alt={alt ?? ""}
        className="max-w-full rounded-md my-3 border border-vsc-border"
        loading="lazy"
      />
    );
  },
  hr() {
    return <hr className="border-vsc-border my-4" />;
  },
} as const;
