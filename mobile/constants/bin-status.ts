import { Palette, StatusTone } from './design';

/**
 * The ESP32 firmware computes and uploads this exact status string per
 * compartment (see bins/{binId}/{type}/status in Realtime Database) —
 * EMPTY / LOW / HALF / 75% / FULL / ERROR. Keep this in sync with the
 * firmware's status enum rather than re-deriving a status from `level`.
 */
export type FirmwareBinStatus = 'EMPTY' | 'LOW' | 'HALF' | '75%' | 'FULL' | 'ERROR';

const TONE_BY_STATUS: Record<FirmwareBinStatus, StatusTone> = {
  EMPTY: 'neutral',
  LOW: 'info',
  HALF: 'warning',
  '75%': 'warning',
  FULL: 'danger',
  ERROR: 'danger',
};

/** Maps a firmware status string to a semantic colour tone, defaulting to neutral. */
export function binStatusTone(status?: string): StatusTone {
  return TONE_BY_STATUS[(status || '').toUpperCase() as FirmwareBinStatus] ?? 'neutral';
}

/** Human-readable label for a firmware status string. */
export function binStatusLabel(status?: string): string {
  if (!status) return 'No data';
  const upper = status.toUpperCase();
  if (upper === 'ERROR') return 'Sensor error';
  if (upper === '75%') return '75% full';
  return upper.charAt(0) + upper.slice(1).toLowerCase();
}

/** True once the firmware itself reports the compartment as full. */
export function isBinFull(status?: string): boolean {
  return (status || '').toUpperCase() === 'FULL';
}

export const binStatusColor = (status?: string) => Palette.status[binStatusTone(status)];
