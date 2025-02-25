import React, { createContext, useContext, useState } from 'react';
import { WizardContextType, WizardStep } from '../types';
import { StandardizedIssueType } from '../../constants/issueTypes';

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<StandardizedIssueType | null>(null);
  const [useAssignedRoom, setUseAssignedRoom] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (files: FileList) => {
    try {
      setUploading(true);
      // Implement photo upload logic here
      const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
          // Mock upload - replace with actual upload logic
          return URL.createObjectURL(file);
        })
      );
      setSelectedPhotos((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading photos:', error);
    } finally {
      setUploading(false);
    }
  };

  const value = {
    currentStep,
    setCurrentStep,
    isEmergency,
    setIsEmergency,
    selectedIssueType,
    setSelectedIssueType,
    useAssignedRoom,
    setUseAssignedRoom,
    selectedPhotos,
    setSelectedPhotos,
    handlePhotoUpload,
    uploading,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizardContext() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizardContext must be used within a WizardProvider');
  }
  return context;
}

export function useWizardNavigation() {
  const { currentStep, setCurrentStep } = useWizardContext();

  const steps: WizardStep[] = ['type', 'details', 'review'];
  const currentIndex = steps.indexOf(currentStep);

  return {
    currentStep,
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < steps.length - 1,
    goBack: () => setCurrentStep(steps[currentIndex - 1]),
    goForward: () => setCurrentStep(steps[currentIndex + 1]),
  };
}
