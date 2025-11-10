import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20251110_185149 from './20251110_185149';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20251110_185149.up,
    down: migration_20251110_185149.down,
    name: '20251110_185149'
  },
];
