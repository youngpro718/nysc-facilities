import { CreateRelocationForm } from "@/components/relocations/forms/CreateRelocationForm";
import { useParams } from "react-router-dom";
import { RelocationDetails } from "@/components/relocations/details/RelocationDetails";

export function CreateRelocation() {
  const { id } = useParams();

  // If we have an ID and it's not "create", show the details view
  if (id && id !== "create") {
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
