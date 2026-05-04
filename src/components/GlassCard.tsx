import { ReactNode, CSSProperties } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Visual intensity: "strong" for main cards, "soft" for inner panels */
  variant?: "strong" | "soft";
}

export const GlassCard = ({
  children,
  className = "",
  style,
  variant = "strong",
}: GlassCardProps) => {
  const strong = variant === "strong";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        borderRadius: strong ? 32 : 20,
        background: strong
          ? "linear-gradient(135deg, hsla(0,0%,100%,0.14) 0%, hsla(0,0%,100%,0.04) 55%, hsla(0,0%,100%,0.09) 100%)"
          : "linear-gradient(135deg, hsla(0,0%,100%,0.09) 0%, hsla(0,0%,100%,0.03) 100%)",
        backdropFilter: strong
          ? "blur(44px) saturate(170%)"
          : "blur(24px) saturate(160%)",
        WebkitBackdropFilter: strong
          ? "blur(44px) saturate(170%)"
          : "blur(24px) saturate(160%)",
        border: strong
          ? "1px solid hsla(0,0%,100%,0.2)"
          : "1px solid hsla(0,0%,100%,0.14)",
        boxShadow: strong
          ? "0 24px 70px -10px hsla(0,0%,0%,0.6), 0 10px 30px -8px hsla(0,0%,0%,0.4), inset 0 1px 0 hsla(0,0%,100%,0.3), inset 0 0 0 1px hsla(0,0%,100%,0.06), inset 0 -1px 0 hsla(0,0%,100%,0.05)"
          : "0 6px 20px hsla(0,0%,0%,0.25), inset 0 1px 0 hsla(0,0%,100%,0.22)",
        ...style,
      }}
    >
      {/* Top highlight sheen */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, hsla(0,0%,100%,0.55) 50%, transparent 100%)",
        }}
      />
      {/* Inner radial sheen */}
      {strong && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 85% 45% at 50% 0%, hsla(0,0%,100%,0.14) 0%, transparent 62%)",
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
};
