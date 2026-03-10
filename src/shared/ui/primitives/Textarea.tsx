import React, { useCallback, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../variants";

const textareaVariants = cva(
  [
    "w-full bg-vsc-input-bg text-vsc-input-fg border border-vsc-input-border rounded-md",
    "placeholder:text-vsc-text-ghost",
    "focus:outline-none focus:ring-1 focus:ring-vsc-focus focus:border-vsc-focus",
    "transition-colors duration-fast focus-ring",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "resize-vertical",
  ].join(" "),
  {
    variants: {
      size: {
        xs: "px-1.5 py-1 text-2xs",
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-3 py-2 text-xs",
        lg: "px-3 py-2.5 text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> &
  VariantProps<typeof textareaVariants> & {
    /** When true, the textarea auto-resizes its height to fit content. */
    autoResize?: boolean;
  };

export const Textarea = React.memo(
  React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { size, className, autoResize, onChange, ...props },
    ref,
  ) {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref).current = node;
        }
      },
      [ref],
    );

    const adjustHeight = useCallback(() => {
      const el = internalRef.current;
      if (!el) return;
      el.style.height = "0";
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    useEffect(() => {
      if (autoResize) {
        adjustHeight();
      }
    }, [autoResize, adjustHeight, props.value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (autoResize) {
          adjustHeight();
        }
        onChange?.(e);
      },
      [autoResize, adjustHeight, onChange],
    );

    return (
      <textarea
        ref={setRefs}
        className={cn(
          textareaVariants({ size }),
          autoResize && "resize-none overflow-hidden",
          className,
        )}
        onChange={handleChange}
        {...props}
      />
    );
  }),
);
