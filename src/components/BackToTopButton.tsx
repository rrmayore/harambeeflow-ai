import React, { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";

interface BackToTopButtonProps {
  /** Scroll distance threshold in pixels before the button becomes visible */
  threshold?: number;
  /** Primary viewport element ID to listen for scroll events */
  containerId?: string;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({
  threshold,
  containerId = "main-tab-viewport",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isModalOrOverlayOpen, setIsModalOrOverlayOpen] = useState(false);

  const checkScroll = useCallback(() => {
    // 1. Context check: Hide if an active modal, STK push prompt, or onboarding overlay is blocking the view
    const openModal = document.querySelector(
      '[role="dialog"], [id*="modal"]:not(.hidden), [id*="stk-push"], .fixed.inset-0.z-50, [id="onboarding-wizard-container"]'
    );
    const bodyLocked = document.body.classList.contains("overflow-hidden") || document.body.style.overflow === "hidden";
    
    if (openModal || bodyLocked) {
      setIsModalOrOverlayOpen(true);
      setIsVisible(false);
      return;
    } else {
      setIsModalOrOverlayOpen(false);
    }

    // Dynamic threshold defaults to approximately one full viewport height (~500-600px)
    const effectiveThreshold = threshold ?? Math.max(450, window.innerHeight * 0.75);

    let scrollTop = 0;
    let scrollHeight = 0;
    let clientHeight = 0;

    // Check main tab viewport container first
    const container = containerId ? document.getElementById(containerId) : null;
    if (container && container.scrollHeight > container.clientHeight) {
      scrollTop = container.scrollTop;
      scrollHeight = container.scrollHeight;
      clientHeight = container.clientHeight;
    } else {
      // Fallback to window/documentElement
      scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      );
      clientHeight = window.innerHeight;
    }

    const totalScrollable = scrollHeight - clientHeight;
    if (totalScrollable > 50) {
      const progress = Math.min(100, Math.max(0, (scrollTop / totalScrollable) * 100));
      setScrollProgress(progress);
    } else {
      setScrollProgress(0);
    }

    // Toggle visibility based on effective threshold
    setIsVisible(scrollTop >= effectiveThreshold && totalScrollable > 200);
  }, [threshold, containerId]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check
    checkScroll();

    // Attach passive scroll listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    const container = containerId ? document.getElementById(containerId) : null;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    // Periodic check to detect page dynamic content expansion or modal dismissals
    const intervalId = setInterval(checkScroll, 600);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      clearInterval(intervalId);
    };
  }, [checkScroll, containerId]);

  const scrollToTop = () => {
    // Smooth scroll window
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Smooth scroll main container viewport
    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        container.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }

    // Cross-browser fallbacks
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isModalOrOverlayOpen) {
    return null;
  }

  // Circular SVG calculations
  const size = 52; // 52px total diameter for comfortable touch target (>48px)
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={`Back to top (${Math.round(scrollProgress)}% scrolled)`}
      title={`Back to Top - ${Math.round(scrollProgress)}% Scrolled`}
      className={`fixed z-[45] flex items-center justify-center w-13 h-13 rounded-full bg-slate-900/95 text-white shadow-2xl shadow-emerald-950/60 border border-emerald-500/30 backdrop-blur-md transition-all duration-300 ease-out cursor-pointer hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-8 scale-90 pointer-events-none"
      } bottom-[calc(4.8rem+env(safe-area-inset-bottom))] md:bottom-8 right-4 sm:right-6 md:right-8 group`}
    >
      {/* Scroll Progress Ring SVG */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0 pointer-events-none -rotate-90 transform"
        aria-hidden="true"
      >
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-emerald-400 transition-[stroke-dashoffset] duration-150 ease-out"
        />
      </svg>

      {/* Button Core & Icon */}
      <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600/90 group-hover:bg-emerald-500 transition-colors duration-200 shadow-inner">
        <ArrowUp className="w-5 h-5 text-white stroke-[2.5] transition-transform duration-200 group-hover:-translate-y-0.5" />
      </div>

      {/* Subtle Glow Backdrop */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Visually hidden screen reader label */}
      <span className="sr-only">Back to top of page</span>
    </button>
  );
};
