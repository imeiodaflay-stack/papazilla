import { useCallback, useLayoutEffect, useRef, useState, type UIEvent } from 'react';

/**
 * Mantém o divisor de um rodapé fixo coerente com o conteúdo rolável:
 * visível desde o início quando todo o conteúdo cabe na tela e visível apenas
 * no fim quando existe rolagem.
 */
export function useScrollAwareFooter() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [dividerVisible, setDividerVisible] = useState(true);

  const updateDivider = useCallback((body: HTMLDivElement | null = bodyRef.current) => {
    if (!body) return;
    const hasOverflow = body.scrollHeight > body.clientHeight + 1;
    const reachedEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 2;
    setDividerVisible(!hasOverflow || reachedEnd);
  }, []);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    updateDivider(body);

    const resizeObserver = new ResizeObserver(() => updateDivider(body));
    resizeObserver.observe(body);

    const mutationObserver = new MutationObserver(() => updateDivider(body));
    mutationObserver.observe(body, { childList: true, subtree: true, characterData: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateDivider]);

  function onBodyScroll(event: UIEvent<HTMLDivElement>) {
    updateDivider(event.currentTarget);
  }

  return { bodyRef, dividerVisible, onBodyScroll };
}
