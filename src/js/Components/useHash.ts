import * as React from "react";

/**
 * Removes the '#' in-front of a URL hash
 * @param hash A URL hash in the form '#blablabla'
 * @returns hash but without the '#', i.e. blablabla
 */
function parseHash(hash: string) {
  return hash.substr(1);
}

function useHash() {
  const [hash, _setHash] = React.useState<string>(parseHash(location.hash));
  React.useEffect(() => {
    function onHashChange() {
      _setHash(parseHash(location.hash));
    }
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [_setHash]);

  const setHash = React.useCallback((newHash: string) => {
    location.hash = `#${newHash}`;
  }, []);

  return {
    hash,
    setHash
  };
}

export default useHash;
