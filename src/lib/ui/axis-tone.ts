import type { Tone } from "@/components/ui/card";

/**
 * The reference colour-codes curriculum axes (Eje 1 blue, Eje 2 green).
 * Tones are assigned by the axis' position in `display_order` rather than by
 * name, so the mapping follows the data instead of hardcoding today's two axes.
 */
const cycle: Tone[] = ["primary", "success", "accent", "warning"];

export function axisTone(index: number): Tone {
  if (!Number.isInteger(index) || index < 0) return "neutral";
  return cycle[index % cycle.length];
}

/** Builds a name -> tone lookup from the ordered axis list the library already loads. */
export function axisToneResolver(axes: readonly { name: string }[]) {
  const positions = new Map(axes.map((axis, index) => [axis.name, index]));
  return (axisName: string | null | undefined): Tone => {
    const index = axisName === null || axisName === undefined ? undefined : positions.get(axisName);
    return index === undefined ? "neutral" : axisTone(index);
  };
}
