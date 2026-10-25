"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

interface TerminalBlockProps {
  code: string;
  filename?: string;
  language?: string;
  className?: string;
  showCopy?: boolean;
}

export function TerminalBlock({
  code,
  filename,
  language,
  className,
  showCopy = true,
}: TerminalBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div
      className={cn(
        "rounded-lg border border-border-subtle bg-bg-void overflow-hidden",
        className
      )}
    >
      {/* Window chrome header */}
      <div className="flex items-center justify-between h-10 px-4 bg-bg-surface border-b border-border-faint">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <span className="w-3 h-3 rounded-full bg-gs-300" />
          <span className="w-3 h-3 rounded-full bg-gs-300" />
          <span className="w-3 h-3 rounded-full bg-gs-300" />
          {filename && (
            <span className="ml-3 text-xs text-text-muted font-code">
              {filename}
            </span>
          )}
        </div>
        {showCopy && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors duration-150"
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-signal" />
                <span className="text-signal">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Code content */}
      <pre className="p-4 overflow-x-auto text-sm leading-[1.7] font-code text-text-code">
        <code data-language={language}>{code}</code>
      </pre>
    </div>
  );
}
