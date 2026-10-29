/**
 * Shared placeholder markers for authoring documents: planning files, script,
 * storyboard, visual style, and ShotBriefs must all be free of scaffolding text
 * before they can be approved or validated.
 */
export const placeholderTerms = [
  'Replace with',
  'Complete the discussion-first content plan',
  'After the content plan is approved',
  'Describe the science',
  'Define palette',
  'Define the visual identity',
  'Choose a named',
  '在这里写',
  'TODO',
  'TBD',
] as const;

export function containsPlaceholder(value: string): boolean {
  return placeholderTerms.some((term) => value.includes(term));
}