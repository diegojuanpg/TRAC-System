import { ReactNode } from "react";

interface DarkLayoutProps {
  children: ReactNode;
  className?: string;
}

export const DarkLayout = ({ children, className = "" }: DarkLayoutProps) => {
  return (
    <div className={`min-h-screen bg-[#050505] relative overflow-hidden ${className}`}>
      {/* Diffused ambient glow — cool blue/white */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 60% 35%, hsla(210,60%,55%,0.06) 0%, transparent 60%)',
        }}
      />
      <div className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 40% 40%, hsla(220,50%,70%,0.04) 0%, transparent 55%)',
        }}
      />
      <div className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 90% 35% at 55% 45%, hsla(200,30%,85%,0.03) 0%, transparent 50%)',
        }}
      />
      {children}
    </div>
  );
};
