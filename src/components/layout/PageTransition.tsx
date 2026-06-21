import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ y: 4 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
