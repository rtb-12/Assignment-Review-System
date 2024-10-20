// frontend/Assignment-Review-System/src/components/AssignmentCreationPage/ComboBox.tsx
import React, { useState } from "react";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";

interface ComboboxDemoProps {
  options: any[];
  selectedOptions: any[];
  handleMemberSelect: (member) => void;
  handleMemberRemove: (member) => void;
}

export function ComboboxDemo({
  options,
  selectedOptions,
  handleMemberSelect,
  handleMemberRemove,
}: ComboboxDemoProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const handleSelect = (selectedPerson) => {
    handleMemberSelect(selectedPerson);
    setValue(selectedPerson.name);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between"
        >
          {value || "Select person..."}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search person..." className="h-9" />
          <CommandList>
            <CommandEmpty>No person found.</CommandEmpty>
            <CommandGroup>
              {options.map((person) => (
                <CommandItem
                  key={person.user_id}
                  onSelect={() => handleSelect(person)}
                  disabled={selectedOptions.some(
                    (selectedPerson) =>
                      selectedPerson.user_id === person.user_id
                  )}
                >
                  {person.name}
                  {selectedOptions.some(
                    (selectedPerson) =>
                      selectedPerson.user_id === person.user_id
                  ) && (
                    <CheckIcon
                      className="ml-2 h-4 w-4 text-gray-500"
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
