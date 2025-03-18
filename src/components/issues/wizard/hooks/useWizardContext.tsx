
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { UserAssignment } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

type WizardStep = 'type' | 'location' | 'details' | 'review';

interface WizardContextType {
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;
  selectedIssueType: string | null;
  setSelectedIssueType: (type: string | null) => void;
  isEmergency: boolean;
  setIsEmergency: (isEmergency: boolean) => void;
  useAssignedRoom: boolean;
  setUseAssignedRoom: (useAssignedRoom: boolean) => void;
  handlePhotoUpload: (files: FileList) => Promise<void>;
  selectedPhotos: string[];
  setSelectedPhotos: (photos: string[]) => void;
  uploading: boolean;
  assignedRooms?: UserAssignment[];
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children, assignedRooms }: { children: ReactNode, assignedRooms?: UserAssignment[] }) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [selectedIssueType, setSelectedIssueType] = useState<string | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [useAssignedRoom, setUseAssignedRoom] = useState(!!assignedRooms?.length);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `issue-photos/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('issue-photos')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('issue-photos')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(publicUrl);
      }
      
      setSelectedPhotos(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error in handlePhotoUpload:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <WizardContext.Provider value={{
      currentStep,
      setCurrentStep,
      selectedIssueType,
      setSelectedIssueType,
      isEmergency,
      setIsEmergency,
      useAssignedRoom,
      setUseAssignedRoom,
      handlePhotoUpload,
      selectedPhotos,
      setSelectedPhotos,
      uploading,
      assignedRooms
    }}>
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
  
  const steps: WizardStep[] = ['type', 'location', 'details', 'review'];
  const currentIndex = steps.indexOf(currentStep);
  
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < steps.length - 1;
  
  const goBack = () => {
    if (canGoBack) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };
  
  const goForward = () => {
    if (canGoForward) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };
  
  return {
    currentStep,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
  };
}
