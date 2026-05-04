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

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

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
        return <OrthoStep formData={formData} updateFormData={updateFormData} onSkipToBW={handleSkipToBW} />;
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
            className="h-full bg-white/80"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      )}

      {/* Top nav */}
      <div className="fixed top-0 left-0 right-0 px-5 pt-5 flex items-center justify-between z-40">
        <button
          onClick={() => navigate('/')}
          className="text-[11px] font-semibold tracking-[0.18em] text-white/70 hover:text-white uppercase transition-colors"
          style={{ fontFamily: JAKARTA }}
        >
          TRAC
        </button>
        {phase === 'steps' && (
          <div
            className="text-[11px] tracking-[0.14em] text-white/45"
            style={{ fontFamily: JAKARTA }}
          >
            <span className="text-white/85 font-semibold">{currentStep + 1}</span>
            <span className="mx-1">/</span>
            {totalSteps}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <AnimatePresence mode="wait" custom={direction}>
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-6 relative">
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
              <div
                className="text-[10px] font-semibold tracking-[0.22em] text-white/55 uppercase mb-4"
                style={{ fontFamily: JAKARTA }}
              >
                {step.category}
              </div>
              <h2
                className="text-[28px] sm:text-[34px] text-center text-white mb-2"
                style={{ fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}
              >
                {step.question}
              </h2>
              <p
                className="text-[13px] text-white/55 text-center mb-8 max-w-sm leading-relaxed"
                style={{ fontFamily: JAKARTA }}
              >
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
          <div
            className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 z-40"
            style={{
              background: 'linear-gradient(to top, hsla(0,0%,0%,0.85) 40%, hsla(0,0%,0%,0.0))',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <div className="flex items-center gap-2 max-w-md mx-auto">
              <motion.button
                type="button"
                onClick={goBack}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.04 }}
                aria-label="Atrás"
                className="shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white/80 hover:text-white"
                style={{
                  fontFamily: JAKARTA,
                  background: 'linear-gradient(135deg, hsla(0,0%,100%,0.1) 0%, hsla(0,0%,100%,0.04) 100%)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  border: '1px solid hsla(0,0%,100%,0.2)',
                  boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.25)',
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
              {canSkip && (
                <motion.button
                  type="button"
                  onClick={handleSkip}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  className="shrink-0 h-12 px-4 rounded-full flex items-center gap-1.5 text-[10px] tracking-[0.14em] uppercase text-white/60 hover:text-white/90"
                  style={{
                    fontFamily: JAKARTA,
                    fontWeight: 600,
                    background: 'hsla(0,0%,100%,0.05)',
                    border: '1px solid hsla(0,0%,100%,0.12)',
                  }}
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Skip
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={goNext}
                disabled={!isStepValid()}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-[12px] tracking-[0.14em] uppercase text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontFamily: JAKARTA,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.06) 100%)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1.5px solid hsla(0,0%,100%,0.4)',
                  boxShadow: '0 6px 18px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.35)',
                }}
              >
                {currentStep === totalSteps - 1 ? 'Revisar' : 'Siguiente'}
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </DarkLayout>
  );
};

export default MorningSurvey;
