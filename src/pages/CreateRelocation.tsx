
import { CreateRelocationForm } from "@/components/relocations/forms/CreateRelocationForm";

export function CreateRelocation() {
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
