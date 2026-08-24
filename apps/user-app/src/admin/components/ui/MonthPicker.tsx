import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "../../../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(
    value?.getFullYear() ?? new Date().getFullYear()
  );

  const selectedMonth = value?.getMonth();
  const selectedYear = value?.getFullYear();

  const handleSelect = (monthIndex: number) => {
    onChange(new Date(viewYear, monthIndex, 1));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[220px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "MMMM yyyy") : <span>Select month</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[240px] p-3">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium">{viewYear}</span>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((label, index) => {
            const isSelected =
              selectedMonth === index && selectedYear === viewYear;

            return (
              <Button
                key={label}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className={cn("w-full", isSelected && "font-semibold")}
                onClick={() => handleSelect(index)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}