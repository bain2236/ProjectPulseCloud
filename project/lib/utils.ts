import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate recency multiplier using exponential decay
 * More recent dates get higher multipliers
 */
export function calculateRecencyMultiplier(
  dateString: string, 
  decayDays: number = 365
): number {
  const date = new Date(dateString);
  const now = new Date();
  const daysDiff = Math.max(0, (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  // Exponential decay: e^(-daysDiff / decayDays)
  return Math.exp(-daysDiff / decayDays);
}

/**
 * Map weight (0-1) to font size (12px-48px)
 */
export function weightToFontSize(weight: number): number {
  return Math.max(12, Math.min(48, 12 + (weight * 36)));
}

/**
 * Map weight (0-1) to area multiplier for Voronoi cell sizing
 */
export function weightToArea(weight: number): number {
  return Math.max(0.5, weight * 3);
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
) {
  let timeout: NodeJS.Timeout;

  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return debounced;
}

/**
 * Calculate directional pulse origin based on cursor position relative to cell center
 */
export function calculatePulseOrigin(
  cursorX: number,
  cursorY: number,
  cellCenterX: number,
  cellCenterY: number
): { x: number; y: number } {
  const dx = cursorX - cellCenterX;
  const dy = cursorY - cellCenterY;
  
  // Normalize and scale to cell edge
  const magnitude = Math.sqrt(dx * dx + dy * dy);
  if (magnitude === 0) return { x: cellCenterX, y: cellCenterY };
  
  const scale = 30; // Distance from center to pulse origin
  return {
    x: cellCenterX + (dx / magnitude) * scale,
    y: cellCenterY + (dy / magnitude) * scale
  };
}