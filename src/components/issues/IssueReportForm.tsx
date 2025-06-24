import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface IssueReportFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; location: string; description: string }) => void;
}

export const IssueReportForm: React.FC<IssueReportFormProps> = ({ open, onClose, onSubmit }) => {
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ type, location, description });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-sm w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Issue type (e.g., Lighting, Door, HVAC)"
            value={type}
            onChange={e => setType(e.target.value)}
            required
            autoFocus
          />
          <Input
            placeholder="Location (e.g., Room 201, Lobby)"
            value={location}
            onChange={e => setLocation(e.target.value)}
            required
          />
          <Textarea
            placeholder="Describe the issue"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            required
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
