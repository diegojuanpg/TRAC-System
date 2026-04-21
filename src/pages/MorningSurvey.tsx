import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { STEPS, CONTEXT_OPTIONS, type FormData } from "@/data/surveySteps";
import { Button } from "@/components/ui/button";
import { NumberStep } from "@/components/survey/NumberStep";
import { ScaleStep } from "@/components/survey/ScaleStep";
import { ContextStep } from "@/components/survey/ContextStep";
import { TapTestStep } from "@/components/survey/TapTestStep";
import { OrthoStep } from "@/components/survey/OrthoStep";
import { SurveyIntro } from "@/components/survey/SurveyIntro";
import { SurveySummary } from "@/components/survey/SurveySummary";
import { SurveySuccess } from "@/components/survey/SurveySuccess";
import { DarkLayout } from "@/components/DarkLayout";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { useSubmitToScript } from "@/hooks/useSubmitToScript";

type Phase = 'intro' | 'steps' | 'summary' | 'success';

const MorningSurvey = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { submit } = useSubmitToScript();
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [direction, setDirection] = useState(1);

  const totalSteps = STEPS.length;
  const step = STEPS[currentStep];
  const progress = phase === 'steps' ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const isStepValid = (): boolean => {
    if (!step) return false;
    if (step.type === 'number') return formData[step.id] !== undefined;
    if (step.type === 'scale') return formData[step.id] !== undefined;
    if (step.type === 'context') return formData.contexto !== undefined;
    if (step.type === 'tap') return formData.tap_total !== undefined;
    if (step.type === 'ortho') {
      return formData.hr1 !== undefined && formData.hr2 !== undefined &&
             formData.hr3 !== undefined && formData.hr4 !== undefined;
    }
    return false;
  };

  const canSkip = step?.type === 'number' || step?.type === 'tap' || step?.type === 'ortho';

  const updateFormData = (key: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      setPhase('summary');
    }
  };

  const goBack = () => {
    if (currentStep === 0) {
      setPhase('intro');
    } else {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    const s = STEPS[currentStep];
    if (s.type === 'number') {
      setFormData(prev => { const n = { ...prev }; delete n[s.id]; return n; });
    } else if (s.type === 'tap') {
      setFormData(prev => { const n = { ...prev }; delete n.tap_total; delete n.tap_variance; delete n.tap_pauses; return n; });
    } else if (s.type === 'ortho') {
      setFormData(prev => { const n = { ...prev }; delete n.hr1; delete n.hr2; delete n.hr3; delete n.hr4; return n; });
    }
    goNext();
  };

  const handleSkipToBW = () => {
    // Drop all physiological fields before BW to avoid partial dirty states
    setFormData(prev => {
      const n = { ...prev };
      delete n.hr1; delete n.hr2; delete n.hr3; delete n.hr4;
      delete n.tap_total; delete n.tap_variance; delete n.tap_pauses;
      return n;
    });
    const targetIdx = STEPS.findIndex(s => s.id === 'bodyweight');
    if (targetIdx !== -1) {
      setDirection(1);
      setCurrentStep(targetIdx);
    }
  };

  const handleSubmit = async () => {
    try {
      await submit({
        email: user?.email ?? 'unknown',
        form_type: 'morning_survey',
        data: formData as Record<string, unknown>,
      });
    } catch (err) {
      console.error('Submit error:', err);
    }
    setPhase('success');
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const renderStep = () => {
    if (!step) return null;
    switch (step.type) {
      case 'number':
        return <NumberStep step={step} value={formData[step.id]} onChange={(v) => updateFormData(step.id, v)} />;
      case 'scale':
        return <ScaleStep step={step} value={formData[step.id] as number} onChange={(v) => updateFormData(step.id, v)} />;
      case 'context':
        return <ContextStep value={formData.contexto as string} onChange={(v) => updateFormData('contexto', v)} />;
      case 'tap':
        return <TapTestStep formData={formData} updateFormData={updateFormData} />;
      case 'ortho':
        return <OrthoStep formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <DarkLayout>
      {/* Progress bar */}
      {phase === 'steps' && (
        <div className="fixed top-0 left-0 right-0 h-[2px] bg-white/[0.06] z-50">
          <motion.div
            className="h-full bg-foreground/60"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      )}

      {/* Top nav */}
      <div className="fixed top-0 left-0 right-0 px-5 pt-5 flex items-center justify-between z-40">
        <button onClick={() => navigate('/')} className="font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground/60 uppercase hover:text-foreground/80 transition-colors">
          TRAC
        </button>
        {phase === 'steps' && (
          <div className="font-mono text-xs text-muted-foreground/50">
            <span className="text-foreground/70 font-medium">{currentStep + 1}</span> / {totalSteps}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <AnimatePresence mode="wait" custom={direction}>
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex items-center justify-center p-6">
              <SurveyIntro onStart={() => { setPhase('steps'); setCurrentStep(0); }} totalSteps={totalSteps} />
            </motion.div>
          )}

          {phase === 'steps' && (
            <motion.div
              key={`step-${currentStep}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-28"
            >
              <div className="font-mono text-[10px] font-medium tracking-[0.18em] text-muted-foreground/50 uppercase mb-4">
                {step.category}
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-center text-foreground/90 mb-2 tracking-tight">
                {step.question}
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-8 max-w-sm leading-relaxed">
                {step.hint}
              </p>
              {renderStep()}
            </motion.div>
          )}

          {phase === 'summary' && (
            <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex items-center justify-center p-6">
              <SurveySummary formData={formData} onSubmit={handleSubmit} onBack={() => { setPhase('steps'); setCurrentStep(totalSteps - 1); }} />
            </motion.div>
          )}

          {phase === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex items-center justify-center p-6">
              <SurveySuccess onClose={() => navigate('/')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom nav */}
        {phase === 'steps' && (
          <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-[#050505]/90 backdrop-blur-xl border-t border-white/[0.06] z-40">
            <div className="flex items-center gap-2 max-w-md mx-auto">
              <Button variant="nav" size="icon" onClick={goBack} className="shrink-0 h-12 w-12">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              {canSkip && (
                <Button variant="ghost" onClick={handleSkip} className="shrink-0 font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground/50">
                  <SkipForward className="h-3.5 w-3.5 mr-1" />
                  Skip
                </Button>
              )}
              <Button variant="nav" size="full" onClick={goNext} disabled={!isStepValid()} className="flex-1">
                <span className="font-mono text-xs tracking-[0.06em] uppercase">
                  {currentStep === totalSteps - 1 ? 'Revisar' : 'Siguiente'}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DarkLayout>
  );
};

export default MorningSurvey;
