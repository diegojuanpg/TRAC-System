import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface SurveySuccessProps {
  onClose: () => void;
}

export const SurveySuccess = ({ onClose }: SurveySuccessProps) => {
  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 rounded-full border border-white/[0.15] flex items-center justify-center mx-auto mb-6" style={{ boxShadow: '0 0 30px -8px hsla(210,60%,55%,0.15)' }}>
        <Check className="h-8 w-8 text-foreground/70" />
      </div>
      <h2 className="text-3xl font-semibold text-foreground/90 mb-2 tracking-tight">Registrado.</h2>
      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
        Tus datos fueron guardados<br />en la base de datos.
      </p>
      <p className="font-mono text-[10px] text-muted-foreground/40 tracking-[0.1em] uppercase mb-8">{today}</p>
      <Button variant="nav" size="full" onClick={onClose} className="max-w-xs mx-auto">
        <span className="font-mono text-xs tracking-[0.06em] uppercase">Volver al inicio</span>
      </Button>
    </div>
  );
};
