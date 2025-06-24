import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface KeyRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { keyName: string; reason: string; comments?: string }) => void;
}

export const KeyRequestForm: React.FC<KeyRequestFormProps> = ({ open, onClose, onSubmit }) => {
  const [keyName, setKeyName] = useState("");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ keyName, reason, comments });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-sm w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <DialogHeader>
            <DialogTitle>Request a Key</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Key name or door (e.g., Courtroom 1)"
            value={keyName}
            onChange={e => setKeyName(e.target.value)}
            required
            autoFocus
          />
          <Input
            placeholder="Reason for request"
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
          />
          <Textarea
            placeholder="Additional comments (optional)"
            value={comments}
            onChange={e => setComments(e.target.value)}
            rows={2}
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
