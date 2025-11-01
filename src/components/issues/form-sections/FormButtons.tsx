
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface FormButtonsProps {
  onClose: () => void;
  updateIssueMutation: UseMutationResult<any, any, any>;
}

export function FormButtons({ onClose, updateIssueMutation }: FormButtonsProps) {
  return (
    <div className="flex justify-end gap-2 sticky bottom-0 py-4 bg-background border-t mt-6">
      <Button variant="outline" onClick={onClose} type="button">
        Cancel
      </Button>
      <Button 
        type="submit"
        disabled={updateIssueMutation.isPending}
      >
        {updateIssueMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Issue'
        )}
      </Button>
    </div>
  );
}
