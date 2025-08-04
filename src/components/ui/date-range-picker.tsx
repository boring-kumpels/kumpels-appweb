"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "Selecciona rango de fechas",
  className,
  disabled = false,
}: DateRangePickerProps) {
  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) {
      return placeholder;
    }

    if (range.to) {
      return `${format(range.from, "dd 'de' MMMM 'de' yyyy", { locale: es })} - ${format(range.to, "dd 'de' MMMM 'de' yyyy", { locale: es })}`;
    }

    return format(range.from, "dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(dateRange)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
