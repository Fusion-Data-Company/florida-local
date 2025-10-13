import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<any>;
  validation?: (data: any) => boolean | Promise<boolean>;
  isOptional?: boolean;
}

export interface MagicFormWizardProps {
  steps: WizardStep[];
  initialData?: Record<string, any>;
  onComplete: (data: Record<string, any>) => void | Promise<void>;
  onStepChange?: (stepId: string, data: Record<string, any>) => void;
  className?: string;
  showProgress?: boolean;
  allowSkip?: boolean;
  submitButtonText?: string;
  loading?: boolean;
}

export default function MagicFormWizard({
  steps,
  initialData = {},
  onComplete,
  onStepChange,
  className,
  showProgress = true,
  allowSkip = false,
  submitButtonText = "Complete",
  loading = false
}: MagicFormWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const updateFormData = useCallback((stepId: string, data: any) => {
    setFormData(prev => ({ ...prev, [stepId]: data }));
    onStepChange?.(stepId, { ...formData, [stepId]: data });
  }, [formData, onStepChange]);

  const validateStep = useCallback(async (step: WizardStep): Promise<boolean> => {
    if (!step.validation) return true;

    setIsValidating(true);
    try {
      const stepData = formData[step.id];
      const isValid = await step.validation(stepData);
      
      if (!isValid) {
        setStepErrors(prev => ({ ...prev, [step.id]: 'Please complete this step correctly' }));
        return false;
      } else {
        setStepErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[step.id];
          return newErrors;
        });
        return true;
      }
    } catch (error) {
      setStepErrors(prev => ({ 
        ...prev, 
        [step.id]: error instanceof Error ? error.message : 'Validation failed' 
      }));
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [formData]);

  const handleNext = useCallback(async () => {
    if (isValidating) return;

    const isValid = await validateStep(currentStep);
    if (!isValid) return;

    // Mark step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep.id]));

    if (isLastStep) {
      // Complete the wizard
      try {
        await onComplete(formData);
      } catch (error) {
        console.error('Error completing wizard:', error);
      }
    } else {
      // Move to next step
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStep, isLastStep, validateStep, onComplete, formData, isValidating]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleSkip = useCallback(() => {
    if (allowSkip && !isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [allowSkip, isLastStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
    }
  }, [steps.length]);

  const StepComponent = currentStep.component;
  const stepData = formData[currentStep.id] || {};

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* Progress Header */}
      {showProgress && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="miami-glass miami-card-glow">
            <CardContent className="p-6">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Step {currentStepIndex + 1} of {steps.length}</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Step Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {steps.map((step, index) => (
                    <motion.button
                      key={step.id}
                      onClick={() => goToStep(index)}
                      className={cn(
                        "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                        index === currentStepIndex
                          ? "bg-primary text-white shadow-lg"
                          : index < currentStepIndex
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                        index < currentStepIndex
                          ? "bg-emerald-600 text-white"
                          : index === currentStepIndex
                          ? "bg-white text-primary"
                          : "bg-slate-300 text-slate-600"
                      )}>
                        {index < currentStepIndex ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="hidden sm:block">{step.title}</span>
                      
                      {/* Error indicator */}
                      {stepErrors[step.id] && (
                        <div className="absolute -top-1 -right-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                      
                      {/* Optional badge */}
                      {step.isOptional && (
                        <Badge variant="outline" className="text-xs">
                          Optional
                        </Badge>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Current Step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="miami-glass miami-card-glow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white font-bold">
                  {currentStepIndex + 1}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{currentStep.title}</h2>
                  {currentStep.description && (
                    <p className="text-slate-600 mt-1">{currentStep.description}</p>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Message */}
              {stepErrors[currentStep.id] && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{stepErrors[currentStep.id]}</span>
                </motion.div>
              )}

              {/* Step Content */}
              <div className="min-h-[300px]">
                <StepComponent
                  data={stepData}
                  updateData={(data: any) => updateFormData(currentStep.id, data)}
                  isFirstStep={isFirstStep}
                  isLastStep={isLastStep}
                  isValidating={isValidating}
                />
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-white/20">
                <div className="flex gap-3">
                  {!isFirstStep && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      className="flex items-center gap-2 glass-panel border-white/30 hover:border-primary/50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  )}
                  
                  {allowSkip && !isLastStep && (
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      Skip this step
                    </Button>
                  )}
                </div>

                <div className="flex gap-3">
                  {isLastStep ? (
                    <Button
                      variant="fl-gold"
                      onClick={handleNext}
                      disabled={isValidating || loading}
                      className="flex items-center gap-2 miami-hover-lift px-8"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          {submitButtonText}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="fl-gold"
                      onClick={handleNext}
                      disabled={isValidating}
                      className="flex items-center gap-2 miami-hover-lift px-8"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Step Summary (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-6 bg-slate-50">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Debug Info</h3>
            <pre className="text-xs text-slate-600 overflow-auto">
              {JSON.stringify({ currentStepIndex, completedSteps: Array.from(completedSteps), formData }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
