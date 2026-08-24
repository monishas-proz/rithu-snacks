export type MeasurementType = "weight" | "volume" | "count";

export interface VariantMeasurement {
  type: MeasurementType;
  unit: string;
  value: number;
}

export interface MeasurementFieldConfig {
  type: MeasurementType;
  label: string;
  placeholder: string;
  helperText: string;
  unitBadge: string;
  validationMessage: string;
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

export function getMeasurementFieldConfig(
  unit?: { type?: string | null; code?: string | null; name?: string | null } | null
): MeasurementFieldConfig {
  if (!unit) {
    return {
      type: "weight",
      label: "Measurement Value",
      placeholder: "e.g. 500, 1",
      helperText: "Select a unit to specify measurement",
      unitBadge: "",
      validationMessage: "Measurement value is required and must be greater than 0",
    };
  }

  const rawType = unit.type ? String(unit.type).toLowerCase() : "";
  const type: MeasurementType =
    rawType === "weight" || rawType === "volume" || rawType === "count"
      ? (rawType as MeasurementType)
      : "weight";

  const unitCode = unit.code || "";
  const unitName = unit.name || "";

  switch (type) {
    case "weight":
      return {
        type: "weight",
        label: unitCode ? `Weight (${unitCode})` : "Weight",
        placeholder: unitCode.toLowerCase() === "g" || unitCode.toLowerCase() === "gm" ? "e.g. 500" : "e.g. 1, 2",
        helperText: `Specify the weight in ${unitName ? unitName.toLowerCase() : unitCode}`,
        unitBadge: unitCode || unitName,
        validationMessage: "Weight is required and must be greater than 0",
      };
    case "volume":
      return {
        type: "volume",
        label: unitCode ? `Volume (${unitCode})` : "Volume",
        placeholder: unitCode.toLowerCase() === "ml" ? "e.g. 500" : "e.g. 1, 2",
        helperText: `Specify the volume in ${unitName ? unitName.toLowerCase() : unitCode}`,
        unitBadge: unitCode || unitName,
        validationMessage: "Volume is required and must be greater than 0",
      };
    case "count":
      return {
        type: "count",
        label: unitCode ? `Quantity (${unitCode})` : "Quantity",
        placeholder: "e.g. 1, 6, 12",
        helperText: `Specify the quantity in ${unitName ? unitName.toLowerCase() : unitCode}`,
        unitBadge: unitCode || unitName,
        validationMessage: "Quantity is required and must be greater than 0",
      };
    default:
      return {
        type: "weight",
        label: "Measurement Value",
        placeholder: "e.g. 500, 1",
        helperText: "Enter the measurement value",
        unitBadge: unitCode || unitName,
        validationMessage: "Measurement value is required and must be greater than 0",
      };
  }
}

export function calculateWeightGrams(
  unitValue: number,
  unit?: { type?: string | null; code?: string | null; conversionFactor?: number | null } | null
): number | null {
  if (!unit || !unit.type) return null;
  const rawType = String(unit.type).toLowerCase();
  if (rawType !== "weight") {
    // Non-weight units (Volume, Count) have no direct weight in grams without density.
    return null;
  }

  const factor =
    typeof unit.conversionFactor === "number" && unit.conversionFactor > 0
      ? unit.conversionFactor
      : 1;

  return Number((unitValue * factor).toFixed(2));
}

