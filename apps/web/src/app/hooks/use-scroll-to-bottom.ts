import { useCallback, useEffect, useRef, useState } from "react";

interface UseScrollToBottomOptions {
  /**
   * The bottom threshold in pixels to consider "near the bottom"
   */
  bottomThreshold?: number;
}

/**
 * A hook to manage scrolling to the bottom of a container with automatic scroll tracking and controls.
 */
export function useScrollToBottom({
  bottomThreshold = 100,
}: UseScrollToBottomOptions = {}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  /**
   * Checks if the scroll position is near the bottom
   */
  const checkIfNearBottom = useCallback(() => {
    if (!scrollRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Calculate distance from bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    return distanceFromBottom <= bottomThreshold;
  }, [bottomThreshold]);

  /**
   * Updates state based on scroll position
   */
  const updateScrollState = useCallback(() => {
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);
    setShowScrollButton(!nearBottom);
  }, [checkIfNearBottom]);

  /**
   * Scrolls to the bottom of the container
   */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;

      try {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior,
        });
      } catch (error) {
        console.error(error);
        // Fallback for browsers that don't support scrollTo with options
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }

      // Update state after scrolling
      setIsNearBottom(true);
      setShowScrollButton(false);
    }
  }, []);

  // Monitor scroll position
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      updateScrollState();
    };

    // Add event listener
    scrollElement.addEventListener("scroll", handleScroll);

    // Check initial scroll position
    updateScrollState();

    // Cleanup
    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, [updateScrollState]);

  return {
    scrollRef,
    isNearBottom,
    showScrollButton,
    scrollToBottom,
    checkIfNearBottom,
    updateScrollState,
  };
}
