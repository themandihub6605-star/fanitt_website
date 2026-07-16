import {
  Dumbbell,
  Music2,
  PiggyBank,
  Palette,
  Mic2,
  Briefcase,
  ChefHat,
  Gamepad2,
  Camera,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell,
  Music2,
  PiggyBank,
  Palette,
  Mic2,
  Briefcase,
  ChefHat,
  Gamepad2,
  Camera,
  TrendingUp,
};

export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Palette;
}
