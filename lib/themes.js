export const ZURA_THEMES = [
  { id: 'solid-1', name: 'Midnight Blue', value: '#0a192f' },
  { id: 'solid-2', name: 'Deep Crimson', value: '#2d0a0a' },
  { id: 'solid-3', name: 'Forest Green', value: '#0a2d18' },
  { id: 'solid-4', name: 'Classic Black', value: '#0a0a0a' },
];

// Generate 100+ gradients programmatically
export const NYNZZ_GRADIENTS = Array.from({ length: 110 }).map((_, i) => {
  const hue1 = (i * 13) % 360;
  const hue2 = (i * 27 + 100) % 360;
  return {
    id: `gradient-${i}`,
    name: `Premium Gradient ${i + 1}`,
    value: `linear-gradient(135deg, hsl(${hue1}, 60%, 15%), hsl(${hue2}, 60%, 10%))`
  };
});
