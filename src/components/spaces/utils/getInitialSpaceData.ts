
import { EditSpaceFormData } from "../schemas/editSpaceSchema";

type SpaceType = "room" | "door" | "hallway";

type InitialData = Partial<EditSpaceFormData> & {
  type?: SpaceType;
};

export const getInitialSpaceData = (
  id: string,
  type: SpaceType,
  initialData?: InitialData
): EditSpaceFormData => {
  const baseValues = {
    id,
    type,
    name: initialData?.name || "",
    status: initialData?.status || "active",
    floorId: initialData?.floorId || "",
  };

  if (type === "room") {
    return {
      ...baseValues,
      type: "room" as const,
      roomNumber: initialData?.type === "room" ? initialData.roomNumber : "",
      roomType: initialData?.type === "room" ? initialData.roomType || "office" : "office",
      phoneNumber: initialData?.type === "room" ? initialData.phoneNumber || "" : "",
      description: initialData?.type === "room" ? initialData.description || "" : "",
      isStorage: initialData?.type === "room" ? initialData.isStorage || false : false,
      storageCapacity: initialData?.type === "room" ? initialData.storageCapacity || null : null,
      storageType: initialData?.type === "room" && initialData.isStorage ? 
        (initialData.storageType || "general_storage") : null,
      storageNotes: initialData?.type === "room" ? initialData.storageNotes || "" : "",
      parentRoomId: initialData?.type === "room" ? initialData.parentRoomId || null : null,
      currentFunction: initialData?.type === "room" ? initialData.currentFunction || "" : "",
    };
  }

  if (type === "door") {
    return {
      ...baseValues,
      type: "door" as const,
      doorType: initialData?.type === "door" ? initialData.doorType || "standard" : "standard",
      securityLevel: initialData?.type === "door" ? initialData.securityLevel || "standard" : "standard",
      passkeyEnabled: initialData?.type === "door" ? initialData.passkeyEnabled || false : false,
    };
  }

  if (type === "hallway") {
    return {
      ...baseValues,
      type: "hallway" as const,
      hallwayType: initialData?.type === "hallway" ? initialData.hallwayType || "public_main" : "public_main",
      section: initialData?.type === "hallway" ? initialData.section || "left_wing" : "left_wing",
      notes: initialData?.type === "hallway" ? initialData.notes || "" : "",
    };
  }

  return baseValues as EditSpaceFormData;
};
