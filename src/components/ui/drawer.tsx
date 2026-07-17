"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

// Drawer Context to communicate open/close state
interface DrawerContextProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  swipeDirection: "down" | "right";
  isMobile: boolean;
  modal: boolean;
}

const DrawerContext = createContext<DrawerContextProps | undefined>(undefined);

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawer must be used within a <Drawer> provider");
  }
  return context;
}

interface DrawerProps {
  children: React.ReactNode;
  showSwipeHandle?: boolean;
  swipeDirection?: "down" | "right";
  modal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Drawer({
  children,
  showSwipeHandle = false,
  swipeDirection = "right",
  modal = false,
  open: controlledOpen,
  onOpenChange,
}: DrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setIsOpen = (open: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(open);
    }
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  const isMobile = swipeDirection === "down";

  return (
    <DrawerContext.Provider value={{ isOpen, setIsOpen, swipeDirection, isMobile, modal }}>
      {children}
    </DrawerContext.Provider>
  );
}

interface TriggerProps {
  render?: React.ReactNode;
  children?: React.ReactNode;
}

export function DrawerTrigger({ render, children }: TriggerProps) {
  const { setIsOpen } = useDrawer();

  const handleOpen = () => setIsOpen(true);

  if (render) {
    const renderEl = render as React.ReactElement<any>;
    return React.cloneElement(renderEl, {
      onClick: (e: React.MouseEvent) => {
        handleOpen();
        if (renderEl.props && renderEl.props.onClick) {
          renderEl.props.onClick(e);
        }
      },
    });
  }

  return (
    <div onClick={handleOpen} className="inline-block cursor-pointer">
      {children}
    </div>
  );
}

interface ContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerContent({ children, className = "" }: ContentProps) {
  const { isOpen, setIsOpen, swipeDirection, isMobile, modal } = useDrawer();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Slide transitions based on swipeDirection
  const variants = {
    closed: {
      x: swipeDirection === "right" ? "100%" : 0,
      y: swipeDirection === "down" ? "100%" : 0,
      opacity: 0.8,
    },
    open: {
      x: 0,
      y: 0,
      opacity: 1,
    },
  };

  // Drawer CSS positioning
  const hasRightClass = className.split(" ").some(c => c.startsWith("right-") || c.includes("right-["));
  const defaultRight = hasRightClass ? "" : "right-0";

  const drawerStyles = isMobile
    ? "fixed bottom-0 left-0 w-full h-[85vh] rounded-t-[2rem] border-t border-white/10"
    : `fixed ${defaultRight} top-0 h-full w-[450px] max-w-full rounded-l-[2rem] border-l border-white/10`;

  const hasBgClass = className.split(" ").some(c => c.startsWith("bg-"));
  const defaultBg = hasBgClass ? "" : "bg-[#0b0521]/95";

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop only if modal is true */}
          {modal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
          )}

          {/* Drawer content body */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={variants}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className={`z-50 flex flex-col ${defaultBg} backdrop-blur-2xl text-white shadow-2xl overflow-hidden ${drawerStyles} ${className}`}
            style={{
              pointerEvents: "auto", // Always allow interaction with drawer itself
            }}
          >
            {/* Top drag handle / swipe indicator for mobile */}
            {isMobile && (
              <div className="w-full flex justify-center py-3 shrink-0">
                <div className="w-12 h-1 rounded-full bg-white/20" />
              </div>
            )}

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(content, document.body);
}

export function DrawerHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { setIsOpen } = useDrawer();
  return (
    <div className={`p-5 pb-3 border-b border-white/5 flex items-center justify-between shrink-0 ${className}`}>
      <div className="flex-1 min-w-0 pr-4">{children}</div>
      <button
        onClick={() => setIsOpen(false)}
        className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function DrawerTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-sm font-extrabold uppercase text-purple-400 tracking-wider ${className}`}>{children}</h3>;
}

export function DrawerDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[10px] font-semibold text-white/40 uppercase tracking-widest mt-0.5 ${className}`}>{children}</p>;
}

export function DrawerFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 border-t border-white/5 bg-[#07011d]/50 shrink-0 ${className}`}>{children}</div>;
}

export function DrawerClose({ render, children }: TriggerProps) {
  const { setIsOpen } = useDrawer();

  const handleClose = () => setIsOpen(false);

  if (render) {
    const renderEl = render as React.ReactElement<any>;
    return React.cloneElement(renderEl, {
      onClick: (e: React.MouseEvent) => {
        handleClose();
        if (renderEl.props && renderEl.props.onClick) {
          renderEl.props.onClick(e);
        }
      },
    });
  }

  return (
    <div onClick={handleClose} className="inline-block cursor-pointer">
      {children}
    </div>
  );
}
