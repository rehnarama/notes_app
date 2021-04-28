import * as React from "react";

const useSingleton = <T>(factory: () => T) => {
  const ref = React.useRef<T | null>(null);
  if (ref.current === null) {
    ref.current = factory();
  }

  return ref.current;
};

export default useSingleton
