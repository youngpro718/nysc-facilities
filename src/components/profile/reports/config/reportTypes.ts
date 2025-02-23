
import { FileText, Lightbulb, User, Key, DoorOpen, Bug, Database } from "lucide-react";

export const reports = [
  {
    title: "Floorplan Report",
    description: "Comprehensive report of building's floorplan data, including room and hallway details.",
    icon: FileText,
    type: "floorplan"
  },
  {
    title: "Lighting Report",
    description: "Status and maintenance information for all lighting fixtures.",
    icon: Lightbulb,
    type: "lighting"
  },
  {
    title: "Occupant Report",
    description: "Details about building occupants and their assignments.",
    icon: User,
    type: "occupant"
  },
  {
    title: "Key Report",
    description: "Key inventory and assignment status.",
    icon: Key,
    type: "key"
  },
  {
    title: "Room Report",
    description: "Room occupancy and status information.",
    icon: DoorOpen,
    type: "room"
  },
  {
    title: "Issue Report",
    description: "Comprehensive report of all facility issues and their status.",
    icon: Bug,
    type: "issue"
  },
  {
    title: "Full Database Report",
    description: "Complete database export with all facility management data.",
    icon: Database,
    type: "database"
  }
] as const;

