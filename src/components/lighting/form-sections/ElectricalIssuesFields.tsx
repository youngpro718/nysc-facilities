
import { useId, useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { LightingFixtureFormData } from "../schemas/lightingSchema";
import { cn } from "@/lib/utils";

const ballastIssues = [
  { value: "flicker", label: "Flickering Light" },
  { value: "startup_delay", label: "Delayed Startup" },
  { value: "noise", label: "Humming or Buzzing" },
  { value: "overheating", label: "Overheating" },
  { value: "early_failure", label: "Early Failure" },
  { value: "dimming_issues", label: "Dimming Problems" },
  { value: "no_start", label: "Won't Start" },
  { value: "intermittent", label: "Intermittent Operation" }
];

interface ElectricalIssuesFieldsProps {
  form: UseFormReturn<LightingFixtureFormData>;
}

export function ElectricalIssuesFields({ form }: ElectricalIssuesFieldsProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState("");

  const handleIssueSelect = (value: string) => {
    setSelectedIssue(value);
    form.setValue("ballast_issue", value !== "");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Ballast Issue</h4>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-background px-3 font-normal"
            >
              <span className={cn("truncate", !selectedIssue && "text-muted-foreground")}>
                {selectedIssue
                  ? ballastIssues.find((issue) => issue.value === selectedIssue)?.label
                  : "Select ballast issue"}
              </span>
              <ChevronDown
                size={16}
                strokeWidth={2}
                className="shrink-0 text-muted-foreground/80"
                aria-hidden="true"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full min-w-[var(--radix-popper-anchor-width)] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search ballast issues..." />
              <CommandList>
                <CommandEmpty>No issues found.</CommandEmpty>
                <CommandGroup>
                  {ballastIssues.map((issue) => (
                    <CommandItem
                      key={issue.value}
                      value={issue.value}
                      onSelect={(value) => handleIssueSelect(value)}
                    >
                      {issue.label}
                      {selectedIssue === issue.value && (
                        <Check size={16} strokeWidth={2} className="ml-auto" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <FormField
          control={form.control}
          name="ballast_check_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ''} 
                  placeholder="Add any additional notes about the ballast issue..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
