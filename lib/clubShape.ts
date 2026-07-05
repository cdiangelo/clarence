export type ClubShape = 'driver' | 'fairway' | 'hybrid' | 'iron' | 'wedge' | 'putter';

export function clubShape(slot: string): ClubShape {
  if (slot === 'driver') return 'driver';
  if (['3w', '5w', '7w'].includes(slot)) return 'fairway';
  if (['3h', '4h', '5h'].includes(slot)) return 'hybrid';
  if (slot === 'putter') return 'putter';
  if (/^\d+i$/.test(slot) || slot === 'PW') return 'iron';
  return 'wedge';
}

// Real cropped photos of an actual Titleist set. No real wedge/putter photo
// was available, so those two categories have no entry here.
export const CLUB_PHOTO: Partial<Record<ClubShape, string>> = {
  driver: '/clubheads/driver.jpg',
  fairway: '/clubheads/fairway.jpg',
  hybrid: '/clubheads/hybrid.jpg',
  iron: '/clubheads/iron.jpg',
};
