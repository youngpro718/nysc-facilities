import * as React from "react";
import { ChartConfig, THEMES } from "../context/ChartContext";

export function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const cssVars = React.useMemo(() => {
    const vars: Record<string, Record<string, string>> = {};

    for (const [key, item] of Object.entries(config)) {
      const selector = `[data-chart="${id}"]`;

      if ("color" in item && item.color) {
        if (!vars[selector]) {
          vars[selector] = {};
        }
        vars[selector][`--${key}`] = item.color;
      }

      if ("theme" in item && item.theme) {
        for (const [theme, color] of Object.entries(item.theme)) {
          const themeSelector = THEMES[theme as keyof typeof THEMES];
          const fullSelector = themeSelector
            ? `${themeSelector} ${selector}`
            : selector;

          if (!vars[fullSelector]) {
            vars[fullSelector] = {};
          }
          vars[fullSelector][`--${key}`] = color;
        }
      }
    }

    return vars;
  }, [id, config]);

  const css = React.useMemo(() => {
    const styles: string[] = [];

    for (const [selector, vars] of Object.entries(cssVars)) {
      const style = `${selector} { ${Object.entries(vars)
        .map(([key, value]) => `${key}: ${value};`)
        .join(" ")} }`;
      styles.push(style);
    }

    return styles.join("\n");
  }, [cssVars]);

  if (!css) {
    return null;
  }

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
