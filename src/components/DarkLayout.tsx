import { ReactNode } from "react";

interface DarkLayoutProps {
  children: ReactNode;
  className?: string;
}

export const DarkLayout = ({ children, className = "" }: DarkLayoutProps) => {
  return (
    <div className={`min-h-[100dvh] bg-[#080810] relative overflow-hidden ${className}`}>
      {/* Grain texture */}
      <div
        className="noise-overlay fixed inset-0 pointer-events-none"
        style={{ opacity: 0.022, zIndex: 1 }}
        aria-hidden="true"
      />
      {/* Ambient glow — primary indigo-blue */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 75% 50% at 62% 30%, hsla(215,65%,55%,0.1) 0%, transparent 60%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 55% 40% at 32% 48%, hsla(228,52%,62%,0.06) 0%, transparent 58%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 90% 30% at 50% 55%, hsla(200,35%,80%,0.025) 0%, transparent 50%)',
        }}
      />
      {children}
    </div>
  );
};
