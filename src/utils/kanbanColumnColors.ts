export const KANBAN_COLUMN_COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#06b6d4',
  '#22c55e',
  '#f59e0b',
  '#ec4899',
  '#ef4444',
  '#64748b',
] as const;

export function pickKanbanColumnColor(index: number): string {
  return KANBAN_COLUMN_COLORS[index % KANBAN_COLUMN_COLORS.length];
}

export function isValidHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}
