
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SpaceConnectionForm } from "./SpaceConnectionForm";

interface ConnectionDialogProps {
  floorId: string;
}

export function ConnectionDialog({ floorId }: ConnectionDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Connect Spaces</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Spaces</DialogTitle>
          <DialogDescription>
            Create a connection between two spaces on this floor.
          </DialogDescription>
        </DialogHeader>
        <SpaceConnectionForm floorId={floorId} />
      </DialogContent>
    </Dialog>
  );
}
