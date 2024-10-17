"use client";

import * as React from "react";
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

interface Person {
  name: string;
  username: string;
}

interface ComboboxDemoProps {
  options: Person[];
  selectedOptions: Person[];
  setSelectedOptions: (options: Person[]) => void;
}

export function ComboboxDemo({
  options,
  selectedOptions,
  setSelectedOptions,
}: ComboboxDemoProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const handleSelect = (currentValue: string) => {
    const selectedPerson = options.find(
      (person) => person.username === currentValue
    );
    if (selectedPerson) {
      const isSelected = selectedOptions.some(
        (person) => person.username === currentValue
      );
      const newSelectedOptions = isSelected
        ? selectedOptions.filter((person) => person.username !== currentValue)
        : [...selectedOptions, selectedPerson];
      setSelectedOptions(newSelectedOptions);
    }
    setValue(currentValue === value ? "" : currentValue);
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
          {value
            ? options.find((person) => person.username === value)?.name
            : "Select person..."}
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
                  key={person.username}
                  value={person.username}
                  onSelect={handleSelect}
                >
                  <div className="flex flex-col">
                    <span>{person.name}</span>
                    <span className="text-sm text-gray-500">
                      @{person.username}
                    </span>
                  </div>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedOptions.some(
                        (selectedPerson) =>
                          selectedPerson.username === person.username
                      )
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
