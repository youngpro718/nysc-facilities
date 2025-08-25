import { useState } from "react";
import { LightingFixturesList } from "./LightingFixturesList";
import { LightingFixture } from "@/types/lighting";

interface LightingFixturesListWithSelectionProps {
  selectedFixtures: string[];
  onSelectionChange: (selected: string[]) => void;
  selectedBuilding?: string;
  selectedFloor?: string;
  statusFilter?: string;
  fixtures?: LightingFixture[];
  isLoading?: boolean;
  refetch?: () => void;
  targetRoomId?: string;
  targetFixtureId?: string;
}

export function LightingFixturesListWithSelection({
  selectedFixtures,
  onSelectionChange,
  ...props
}: LightingFixturesListWithSelectionProps) {
  // This wrapper component handles selection state for the fixtures list
  // The actual selection logic is handled internally by LightingFixturesList
  // This component is for future enhancement when we need external selection control
  
  return <LightingFixturesList {...props} />;
}