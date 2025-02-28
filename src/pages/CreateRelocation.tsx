
import { CreateRelocationForm } from "@/components/relocations/forms/CreateRelocationForm";
import { useParams } from "react-router-dom";
import { RelocationDetails } from "@/components/relocations/details/RelocationDetails";
import { z } from "zod";

export function CreateRelocation() {
  const { id } = useParams();
  
  // Validate that the ID is a valid UUID when present and not "create"
  const isValidUuid = id ? z.string().uuid().safeParse(id).success : false;

  // If we have an ID and it's a valid UUID, show the details view
  if (id && isValidUuid) {
    return (
      <div className="container mx-auto py-6">
        <RelocationDetails id={id} />
      </div>
    );
  }

  // Otherwise show the create form
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create Relocation</h1>
      </div>
      <CreateRelocationForm />
    </div>
  );
}

export default CreateRelocation;
