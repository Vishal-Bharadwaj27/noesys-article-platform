// components/MonthYearPicker.tsx
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface MonthYearPickerProps {
  label: string;
  value: string; // 'YYYY-MM'
  onChange: (value: string) => void;
  minValue?: string;
}

export function MonthYearPicker({
  label,
  value,
  onChange,
  minValue,
}: MonthYearPickerProps) {
  const [year, month] = value.split("-").map(Number);
  const [viewYear, setViewYear] = useState(year);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[150px] justify-start">
          {MONTHS[month - 1]} {year}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px]">
        <div className="mb-2 text-xs text-muted-foreground">{label}</div>
        <div className="mb-2 flex items-center justify-between">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setViewYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">{viewYear}</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setViewYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((m, i) => {
            const monthValue = `${viewYear}-${String(i + 1).padStart(2, "0")}`;
            const isDisabled = minValue ? monthValue < minValue : false;

            return (
              <Button
                key={m}
                size="sm"
                disabled={isDisabled}
                variant={
                  viewYear === year && i === month - 1 ? "default" : "ghost"
                }
                onClick={() => onChange(monthValue)}
              >
                {m}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
