import { ChartConfig } from "../context/ChartContext";

export function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("dataKey" in payload) ||
    typeof payload.dataKey !== "string"
  ) {
    return;
  }

  const dataKey = payload.dataKey;
  const itemConfig = config[dataKey];

  if (!itemConfig) {
    return;
  }

  const itemKey = key in itemConfig ? itemConfig[key] : undefined;

  if (!itemKey) {
    return;
  }

  return {
    dataKey,
    config: itemConfig,
    value: itemKey,
  };
}

export function getChartId(id: string | undefined, uniqueId: string): string {
  return `chart-${id || uniqueId.replace(/:/g, "")}`;
}
