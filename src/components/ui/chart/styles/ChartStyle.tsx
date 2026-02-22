import * as React from "react";
import { ChartConfig, THEMES } from "../context/ChartContext";

// Allowlist for CSS color values: hex, rgb/rgba, hsl/hsla, named colors, CSS vars
const SAFE_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|var\(--[a-zA-Z0-9-]+\)|[a-zA-Z]+)$/;

function sanitizeColor(value: string): string | null {
  const trimmed = value.trim();
  return SAFE_COLOR_RE.test(trimmed) ? trimmed : null;
}

export function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const cssVars = React.useMemo(() => {
    const vars: Record<string, Record<string, string>> = {};

    for (const [key, item] of Object.entries(config)) {
      const selector = `[data-chart="${id}"]`;

      if ("color" in item && item.color) {
        const safe = sanitizeColor(item.color);
        if (safe) {
          if (!vars[selector]) vars[selector] = {};
          vars[selector][`--${key}`] = safe;
        }
      }

      if ("theme" in item && item.theme) {
        for (const [theme, color] of Object.entries(item.theme)) {
          const safe = sanitizeColor(color);
          if (!safe) continue;
          const themeSelector = THEMES[theme as keyof typeof THEMES];
          const fullSelector = themeSelector ? `${themeSelector} ${selector}` : selector;
          if (!vars[fullSelector]) vars[fullSelector] = {};
          vars[fullSelector][`--${key}`] = safe;
        }
      }
    }

    return vars;
  }, [id, config]);

  const css = React.useMemo(() => {
    return Object.entries(cssVars)
      .map(([selector, vars]) => {
        const props = Object.entries(vars)
          .map(([k, v]) => `${k}: ${v};`)
          .join(" ");
        return `${selector} { ${props} }`;
      })
      .join("\n");
  }, [cssVars]);

  if (!css) return null;

  // All color values in `css` are validated against SAFE_COLOR_RE before injection.
  // eslint-disable-next-line react/no-danger
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
