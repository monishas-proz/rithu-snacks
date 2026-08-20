export type MeasurementType = "weight" | "volume" | "count";

export interface VariantMeasurement {
  type: MeasurementType;
  unit: string;
  value: number;
}

export function formatVariantMeasurement(
  unit: { type?: string | null; code?: string | null } | null | undefined,
  unitValue: number | bigint | unknown
): VariantMeasurement {
  const rawType = unit?.type ? String(unit.type).toLowerCase() : "count";
  const type: MeasurementType =
    rawType === "weight" || rawType === "volume" || rawType === "count"
      ? (rawType as MeasurementType)
      : "count";

  return {
    type,
    unit: unit?.code || "",
    value: unitValue !== null && unitValue !== undefined ? Number(unitValue) : 0,
  };
}
