import React from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Scroll-to-top button component with smooth animation
 */
export function ScrollToTopButton({ show, onClick, className }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40',
            className
          )}
        >
          <Button
            size="icon"
            onClick={onClick}
            className={cn(
              'h-12 w-12 rounded-full button-floating',
              'bg-primary hover:bg-primary/90',
              'touch-target tap-feedback',
              'transition-all duration-300 btn-hover-lift'
            )}
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5 icon-hover-bounce" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
