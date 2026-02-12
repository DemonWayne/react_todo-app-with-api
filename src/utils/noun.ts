export const noun = (
  count: number,
  [singular, plural]: [string, string],
): string => {
  return count === 1 ? singular : plural;
};
