
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { PROBLEM_TYPES } from "../constants/issueTypes";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ProblemTypeFieldProps {
  form: UseFormReturn<FormData>;
}

export function ProblemTypeField({ form }: ProblemTypeFieldProps) {
  const [open, setOpen] = useState(false);
  const issueType = form.watch('issue_type');

  if (!issueType) return null;

  const problemTypes = PROBLEM_TYPES[issueType] || [];

  return (
    <FormField
      control={form.control}
      name="problem_type"
      render={({ field }) => (
        <FormItem className="relative">
          <FormLabel>Problem Type</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                <span className={cn("truncate", !field.value && "text-muted-foreground")}>
                  {field.value || "Select problem type"}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-popover z-[110]">
              <Command>
                <CommandInput placeholder="Search problem type..." />
                <CommandList>
                  <CommandEmpty>No problem type found.</CommandEmpty>
                  <CommandGroup>
                    {problemTypes.map((type) => (
                      <CommandItem
                        key={type}
                        value={type}
                        onSelect={() => {
                          form.setValue("problem_type", type);
                          setOpen(false);
                        }}
                      >
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
