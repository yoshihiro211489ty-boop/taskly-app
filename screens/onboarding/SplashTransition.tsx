import React from 'react';
import { useAuth } from '../../lib/AuthContext';
import { OnboardingScreen } from './OnboardingScreen';

/**
 * SplashTransition — thin wrapper around OnboardingScreen.
 *
 * Calls `refreshProfile` on completion so the parent navigator can
 * re-evaluate auth state and move to the main app screens.
 * Intended as the entry point for future navigation use.
 */
export function SplashTransition() {
  const { refreshProfile } = useAuth();

  const handleComplete = async () => {
    await refreshProfile();
  };

  return <OnboardingScreen onComplete={handleComplete} />;
}
