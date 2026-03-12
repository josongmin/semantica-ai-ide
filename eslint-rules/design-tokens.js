/**
 * Custom ESLint rules to enforce design token usage in Tailwind class names.
 *
 * Rules:
 * - no-hardcoded-color:     Bans `bg-[#hex]`, `text-[#hex]`, `border-[#hex]`, `rgba(…)` in class strings
 * - no-arbitrary-text-size: Bans `text-[Npx]`, `text-[Nrem]` — use token sizes (text-xs, text-sm, etc.)
 * - no-hardcoded-z-index:   Bans `z-[N]` — use token z-index (z-(--z-overlay), etc.)
 */

// ─── Helpers ────────────────────────────────────────────

/** Extract raw string values from a JSX expression (handles template literals, string concatenation, etc.) */
function extractClassStrings(node) {
  if (!node) return [];
  if (node.type === "Literal" && typeof node.value === "string") {
    return [{ value: node.value, node }];
  }
  if (node.type === "TemplateLiteral") {
    return node.quasis.map((q) => ({ value: q.value.raw, node: q }));
  }
  if (node.type === "BinaryExpression" && node.operator === "+") {
    return [...extractClassStrings(node.left), ...extractClassStrings(node.right)];
  }
  if (node.type === "CallExpression") {
    return node.arguments.flatMap((arg) => extractClassStrings(arg));
  }
  if (node.type === "ConditionalExpression") {
    return [
      ...extractClassStrings(node.consequent),
      ...extractClassStrings(node.alternate),
    ];
  }
  if (node.type === "LogicalExpression") {
    return [
      ...extractClassStrings(node.left),
      ...extractClassStrings(node.right),
    ];
  }
  return [];
}

// ─── Patterns ───────────────────────────────────────────

// Matches: bg-[#hex], text-[#hex], border-[#hex], from-[#hex], via-[#hex], to-[#hex], etc.
const HARDCODED_HEX_RE =
  /\b(?:bg|text|border|from|via|to|ring|outline|shadow|fill|stroke|accent|caret|decoration)-\[#[0-9a-fA-F]{3,8}\]/;

// Matches: rgba(…), hsla(…), rgb(…), hsl(…) inside class strings
const HARDCODED_RGBA_RE = /\brgba?\s*\(|hsla?\s*\(/;

// Matches: text-[12px], text-[0.75rem], text-[1.2em]
const ARBITRARY_TEXT_SIZE_RE = /\btext-\[\d+(?:\.\d+)?(?:px|rem|em)\]/;

// Matches: z-[10], z-[999], etc. (but not z-[--z-*] which is token-based)
const HARDCODED_Z_RE = /\bz-\[\d+\]/;

// ─── Rules ──────────────────────────────────────────────

/** @type {import("eslint").Rule.RuleModule} */
const noHardcodedColor = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow hardcoded hex/rgba colors in Tailwind class names — use design tokens (bg-vsc-*, text-vsc-*, etc.)",
    },
    messages: {
      hardcodedHex:
        'Hardcoded hex color "{{match}}" — use a design token (e.g. bg-vsc-success, text-chart-blue).',
      hardcodedRgba:
        "Hardcoded rgba/hsla color — use a design token or color-mix() with CSS custom properties.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (
          node.name.name !== "className" &&
          node.name.name !== "class"
        ) {
          return;
        }
        const strings = extractClassStrings(
          node.value?.type === "JSXExpressionContainer"
            ? node.value.expression
            : node.value,
        );
        for (const { value, node: strNode } of strings) {
          const hexMatch = HARDCODED_HEX_RE.exec(value);
          if (hexMatch) {
            context.report({
              node: strNode,
              messageId: "hardcodedHex",
              data: { match: hexMatch[0] },
            });
          }
          if (HARDCODED_RGBA_RE.test(value)) {
            context.report({
              node: strNode,
              messageId: "hardcodedRgba",
            });
          }
        }
      },
    };
  },
};

/** @type {import("eslint").Rule.RuleModule} */
const noArbitraryTextSize = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow arbitrary text sizes like text-[12px] — use token sizes (text-3xs, text-2xs, text-xs, text-sm, text-md, text-lg)",
    },
    messages: {
      arbitrarySize:
        'Arbitrary text size "{{match}}" — use a design token (text-3xs…text-lg).',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (
          node.name.name !== "className" &&
          node.name.name !== "class"
        ) {
          return;
        }
        const strings = extractClassStrings(
          node.value?.type === "JSXExpressionContainer"
            ? node.value.expression
            : node.value,
        );
        for (const { value, node: strNode } of strings) {
          const match = ARBITRARY_TEXT_SIZE_RE.exec(value);
          if (match) {
            context.report({
              node: strNode,
              messageId: "arbitrarySize",
              data: { match: match[0] },
            });
          }
        }
      },
    };
  },
};

/** @type {import("eslint").Rule.RuleModule} */
const noHardcodedZIndex = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow hardcoded z-index like z-[10] — use token z-index (z-(--z-sticky), z-(--z-overlay), etc.)",
    },
    messages: {
      hardcodedZ:
        'Hardcoded z-index "{{match}}" — use a design token (z-(--z-base), z-(--z-sticky), z-(--z-floating), z-(--z-overlay), z-(--z-modal)).',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (
          node.name.name !== "className" &&
          node.name.name !== "class"
        ) {
          return;
        }
        const strings = extractClassStrings(
          node.value?.type === "JSXExpressionContainer"
            ? node.value.expression
            : node.value,
        );
        for (const { value, node: strNode } of strings) {
          const match = HARDCODED_Z_RE.exec(value);
          if (match) {
            context.report({
              node: strNode,
              messageId: "hardcodedZ",
              data: { match: match[0] },
            });
          }
        }
      },
    };
  },
};

// ─── Plugin Export ───────────────────────────────────────

export default {
  rules: {
    "no-hardcoded-color": noHardcodedColor,
    "no-arbitrary-text-size": noArbitraryTextSize,
    "no-hardcoded-z-index": noHardcodedZIndex,
  },
};
