
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { ISSUE_TYPES } from "../constants/issueTypes";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { getIssueTypeIcon } from "../wizard/IssueWizard";

interface IssueTypeFieldProps {
  form: UseFormReturn<FormData>;
}

export function IssueTypeField({ form }: IssueTypeFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={form.control}
      name="issue_type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Issue Type</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  "w-full justify-between",
                  !field.value && "text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  {field.value ? (
                    <>
                      {getIssueTypeIcon(field.value)}
                      <span>{field.value}</span>
                    </>
                  ) : (
                    <span>Select issue type</span>
                  )}
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search issue type..." />
                <CommandList>
                  <CommandEmpty>No issue type found.</CommandEmpty>
                  <CommandGroup>
                    {ISSUE_TYPES.map((type) => (
                      <CommandItem
                        key={type}
                        value={type}
                        onSelect={() => {
                          form.setValue("issue_type", type);
                          form.setValue("problem_type", "");
                          setOpen(false);
                        }}
                        className="flex items-center gap-2"
                      >
                        {getIssueTypeIcon(type)}
                        {type}
                        {field.value === type && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

