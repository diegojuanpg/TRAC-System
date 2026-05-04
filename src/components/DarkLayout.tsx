import { ReactNode } from "react";
import { motion } from "framer-motion";

interface DarkLayoutProps {
  children: ReactNode;
  className?: string;
}

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

export const DarkLayout = ({ children, className = "" }: DarkLayoutProps) => {
  return (
    <div
      className={`min-h-[100dvh] bg-black relative overflow-hidden ${className}`}
      style={{ fontFamily: JAKARTA }}
    >
      {/* Animated pure-white blurred lights */}
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '55vmax',
          height: '55vmax',
          top: '-18vmax',
          left: '-10vmax',
          background:
            'radial-gradient(circle, hsla(0,0%,100%,0.35) 0%, hsla(0,0%,100%,0.08) 32%, transparent 68%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: [0, 90, -40, 70, 0],
          y: [0, 70, 130, 50, 0],
          scale: [1, 1.15, 0.95, 1.12, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '50vmax',
          height: '50vmax',
          bottom: '-18vmax',
          right: '-14vmax',
          background:
            'radial-gradient(circle, hsla(0,0%,100%,0.3) 0%, hsla(0,0%,100%,0.07) 35%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -70, 40, -90, 0],
          y: [0, -60, -110, -30, 0],
          scale: [1, 1.12, 1.22, 0.95, 1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '40vmax',
          height: '40vmax',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(circle, hsla(0,0%,100%,0.24) 0%, hsla(0,0%,100%,0.05) 40%, transparent 72%)',
          filter: 'blur(90px)',
        }}
        animate={{
          x: [-30, 50, -20, 40, -30],
          y: [-20, 40, 70, 10, -20],
          scale: [1, 1.22, 0.9, 1.18, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '32vmax',
          height: '32vmax',
          bottom: '8%',
          left: '15%',
          background:
            'radial-gradient(circle, hsla(0,0%,100%,0.22) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
        animate={{
          x: [0, 60, -30, 20, 0],
          y: [0, -50, 20, -70, 0],
          scale: [1, 1.1, 1.28, 0.95, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Grain texture */}
      <div
        className="noise-overlay fixed inset-0 pointer-events-none"
        style={{ opacity: 0.035, zIndex: 1 }}
        aria-hidden="true"
      />

      {children}
    </div>
  );
};
