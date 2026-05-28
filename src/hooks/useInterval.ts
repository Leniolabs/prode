import React from "react";

export function useMutable<T>(memoized: T) {
  const ref = React.useRef(memoized);
  React.useEffect(() => {
    ref.current = memoized;
  }, [memoized]);
  return ref;
}

export function useInterval(
  f: Function,
  ms: number,
  executeInmediate?: boolean
) {
  const functionRef = React.useRef(f);

  React.useEffect(() => {
    functionRef.current?.();
  }, []);

  React.useEffect(() => {
    if (executeInmediate) functionRef.current?.();

    const interval = setInterval(() => {
      functionRef.current?.();
    }, ms);

    return () => {
      clearInterval(interval);
    };
  }, [ms]);
}
