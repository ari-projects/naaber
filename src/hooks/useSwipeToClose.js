import { useRef, useState, useCallback, useEffect } from 'react';

const useSwipeToClose = (onClose, isOpen = true) => {
  const containerRef = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false); // Always start hidden for animation
  const hasInitialized = useRef(false);
  const dragThreshold = 60; // Threshold for closing
  const swipeCloseThreshold = 50; // Minimum swipe distance to close when at scroll top
  
  // Touch coordinates for drag handle
  const startY = useRef(null);
  const currentY = useRef(null);
  const isDragHandleActive = useRef(false); // Flag to prevent container handlers from interfering
  
  // Swipe-to-close state when scrollY is 0
  const swipeStartY = useRef(null);
  const isSwipeGesture = useRef(false);
  const closingViaSwipe = useRef(false);
  const currentDragOffset = useRef(0); // Track current drag offset for callbacks

  // Reset dragOffset when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      // Mark as initialized
      hasInitialized.current = true;
      setShouldRender(true);
      setDragOffset(0);
      setIsDragging(false);
      setIsVisible(false); // Start hidden
      setIsAnimating(true); // Start with animation enabled
      swipeStartY.current = null;
      isSwipeGesture.current = false;
      closingViaSwipe.current = false;
      
      // Small delay to ensure DOM is ready, then start animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true); // Trigger entrance animation
        });
      });
      
      // Clear animation state after transition completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    } else if (shouldRender) {
      // If closing via swipe, fade overlay but keep drawer at dragged position
      if (closingViaSwipe.current) {
        setIsVisible(false); // Fade overlay
        // Don't reset dragOffset - keep drawer at its swiped position
        // Delay unmounting to allow overlay fade
        setTimeout(() => {
          setShouldRender(false);
          setIsAnimating(false);
          setDragOffset(0);
          closingViaSwipe.current = false;
        }, 250);
      } else {
        // Start exit animation immediately (for close button/overlay click)
        setIsVisible(false);
        setIsAnimating(true);
        setDragOffset(0);
        // Delay unmounting to allow exit animation
        setTimeout(() => {
          setShouldRender(false);
          setIsAnimating(false);
        }, 300); // Slightly longer to ensure smooth exit
      }
    }
  }, [isOpen, shouldRender]);

  // Handle swipe-to-close when content is at scroll top
  const handleContentTouchStart = useCallback((e) => {
    // Skip if drag handle is being used
    if (isDragHandleActive.current) return;
    
    // Always record the start position - we'll check scroll position on move
    swipeStartY.current = e.touches[0].clientY;
    isSwipeGesture.current = false;
    currentDragOffset.current = 0;
  }, []);

  const handleContentTouchMove = useCallback((e) => {
    // Skip if drag handle is being used
    if (isDragHandleActive.current) return;
    
    if (swipeStartY.current === null) return;
    
    const currentTouchY = e.touches[0].clientY;
    const deltaY = currentTouchY - swipeStartY.current;
    
    // Find scrollable element
    const scrollableElement = containerRef.current?.querySelector('.overflow-y-auto') || 
                               containerRef.current?.querySelector('[class*="overflow-y"]') ||
                               containerRef.current;
    const scrollTop = scrollableElement?.scrollTop || 0;
    
    // If already in swipe gesture mode, continue tracking
    if (isSwipeGesture.current) {
      if (deltaY > 0) {
        currentDragOffset.current = deltaY;
        setDragOffset(deltaY);
        e.preventDefault();
      } else {
        // Swiping back up, reset
        currentDragOffset.current = 0;
        setDragOffset(0);
      }
      return;
    }
    
    // Start swipe gesture when at scroll top and swiping down
    if (deltaY > 10 && scrollTop <= 0) {
      isSwipeGesture.current = true;
      currentDragOffset.current = deltaY;
      setDragOffset(deltaY);
      e.preventDefault();
    } else if (scrollTop > 0) {
      // User is scrolling content - cancel swipe detection for this touch
      swipeStartY.current = null;
    }
    // For upward movement or small movements, don't start swipe but keep tracking
  }, []);

  const handleContentTouchEnd = useCallback(() => {
    // Skip if drag handle is being used
    if (isDragHandleActive.current) return;
    
    // Check if we were in a swipe gesture
    if (isSwipeGesture.current && currentDragOffset.current >= swipeCloseThreshold) {
      closingViaSwipe.current = true;
      onClose();
    } else if (currentDragOffset.current > 0) {
      // Was dragging but not enough to close - reset
      setDragOffset(0);
    }
    
    // Reset all state
    currentDragOffset.current = 0;
    swipeStartY.current = null;
    isSwipeGesture.current = false;
  }, [onClose, swipeCloseThreshold]);

  // Attach content touch handlers to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen || !shouldRender) return;

    container.addEventListener('touchstart', handleContentTouchStart, { passive: true });
    container.addEventListener('touchmove', handleContentTouchMove, { passive: false });
    container.addEventListener('touchend', handleContentTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleContentTouchStart);
      container.removeEventListener('touchmove', handleContentTouchMove);
      container.removeEventListener('touchend', handleContentTouchEnd);
    };
  }, [isOpen, shouldRender, handleContentTouchStart, handleContentTouchMove, handleContentTouchEnd]);

  // Create the drag handle component with inline touch handlers
  const DragHandle = useCallback(({ className = '', style = {} }) => {
    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
      isDragHandleActive.current = true;
      setIsDragging(false);
    };

    const handleTouchMove = (e) => {
      if (startY.current === null || !isDragHandleActive.current) return;
      
      const touch = e.touches[0];
      currentY.current = touch.clientY;
      const deltaY = currentY.current - startY.current;
      
      if (deltaY > 0) {
        setIsDragging(true);
        setDragOffset(deltaY);
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (startY.current === null || !isDragHandleActive.current) return;
      
      const deltaY = currentY.current - startY.current;
      
      if (deltaY >= dragThreshold) {
        closingViaSwipe.current = true;
        onClose();
      } else {
        setDragOffset(0);
      }
      
      setIsDragging(false);
      isDragHandleActive.current = false;
      startY.current = null;
      currentY.current = null;
    };

    return (
      <div
        className={`top-0 left-0 absolute w-full h-[32px] pb-3 flex items-center justify-center ${className}`}
        style={{
          touchAction: 'none',
          userSelect: 'none',
          ...style
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-[64px] h-[4px] bg-[#72726E] md:opacity-[0] opacity-[0.5] rounded-full" />
      </div>
    );
  }, [onClose, dragThreshold]);

  return {
    containerRef,
    dragOffset,
    isDragging,
    isAnimating,
    shouldRender,
    isVisible,
    DragHandle
  };
};

export default useSwipeToClose;
