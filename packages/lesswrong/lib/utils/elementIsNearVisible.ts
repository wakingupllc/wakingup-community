// Returns whether an element, which is presumed to be either visible or below
// the screen, is within `distance` of being visible. This is used for infinite
// scroll; the next segment starts loading when the scroll position reaches
// `distance` of the bottom.
export const elementIsNearVisible = function(element: HTMLElement|null, distance: number) {
  if (typeof window === 'undefined') return false;
  if (!element) return false;

  const top = element.getBoundingClientRect().y;
  const windowHeight = window.innerHeight;
  return (top - distance) <= windowHeight;
}
