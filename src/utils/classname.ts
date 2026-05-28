export function className(
  ...classNames: (string | undefined | null | boolean)[]
) {
  return classNames.filter((x) => x).join(" ");
}
