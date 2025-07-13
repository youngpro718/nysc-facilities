import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KeyRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { reason: string }) => void;
}

export const KeyRequestForm: React.FC<KeyRequestFormProps> = ({ open, onClose, onSubmit }) => {
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ reason });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-sm w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <DialogHeader>
            <DialogTitle>Request a Key</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Reason for key request (e.g., access to specific room/area)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="ml-2">Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
