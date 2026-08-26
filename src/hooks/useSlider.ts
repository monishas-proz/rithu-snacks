"use client";

import { useState, useCallback } from "react";

export function useSlider(length: number) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % length);
  }, [length]);

  const previous = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + length) % length);
  }, [length]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  return {
    currentIndex,
    next,
    previous,
    goTo,
  };
}

export default useSlider;
