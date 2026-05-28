export function filterUniquePredicate<T>(isEqual?: (a: T, b: T) => boolean) {
  return (row: T, index: number, arr: T[]) => {
    if (isEqual) return arr.findIndex((x) => isEqual(row, x)) === index;
    return arr.findIndex((x) => x === row) === index;
  };
}
