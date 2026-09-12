import { CalendarIcon, Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/crm";
import {
  ANY,
  ARCHIVE_VIEWS,
  DATE_FIELDS,
  DATE_PRESETS,
  activeFilterCount,
  defaultFilters,
  toISODate,
  type LeadFilters,
} from "@/lib/crm-filters";

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start font-normal">
            <CalendarIcon className="size-4" />
            {value ? formatDate(value) : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            {...(value ? { selected: new Date(`${value}T00:00:00`) } : {})}
            onSelect={(d) => onChange(d ? toISODate(d) : "")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function LeadFilterBar({
  filters,
  onChange,
  industries,
  interns,
  sources,
  statuses,
  qualities,
}: {
  filters: LeadFilters;
  onChange: (f: LeadFilters) => void;
  industries: readonly string[];
  interns: readonly string[];
  sources: readonly string[];
  statuses: readonly string[];
  qualities: readonly string[];
}) {
  const set = <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) =>
    onChange({ ...filters, [key]: value });
  const count = activeFilterCount(filters);

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <Filter className="size-4" />
            Filters{count ? ` (${count})` : ""}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-h-[70vh] w-80 space-y-3 overflow-y-auto" align="end">
          <div className="space-y-1.5">
            <Label>Lead view</Label>
            <Select
              value={filters.archive ?? "active"}
              onValueChange={(v) => set("archive", v as LeadFilters["archive"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ARCHIVE_VIEWS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FilterSelect
            label="Status"
            value={filters.status}
            options={statuses}
            onChange={(v) => set("status", v)}
          />
          <FilterSelect
            label="Lead quality"
            value={filters.quality}
            options={qualities}
            onChange={(v) => set("quality", v)}
          />
          <FilterSelect
            label="Lead source"
            value={filters.source}
            options={sources}
            onChange={(v) => set("source", v)}
          />
          <FilterSelect
            label="Industry"
            value={filters.industry}
            options={industries}
            onChange={(v) => set("industry", v)}
          />
          <FilterSelect
            label="Assigned intern"
            value={filters.intern}
            options={interns}
            onChange={(v) => set("intern", v)}
          />

          <div className="border-t border-border pt-3 space-y-3">
            <div className="space-y-1.5">
              <Label>Date field</Label>
              <Select
                value={filters.dateField}
                onValueChange={(v) => set("dateField", v as LeadFilters["dateField"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FIELDS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Date range</Label>
              <Select
                value={filters.datePreset}
                onValueChange={(v) => set("datePreset", v as LeadFilters["datePreset"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filters.datePreset === "custom" && (
              <>
                <DatePickerField
                  label="From date"
                  value={filters.from}
                  onChange={(v) => set("from", v)}
                />
                <DatePickerField label="To date" value={filters.to} onChange={(v) => set("to", v)} />
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="from-time">From time</Label>
                <Input
                  id="from-time"
                  type="time"
                  value={filters.fromTime}
                  onChange={(e) => set("fromTime", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to-time">To time</Label>
                <Input
                  id="to-time"
                  type="time"
                  value={filters.toTime}
                  onChange={(e) => set("toTime", e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Time filtering applies to Created Date and Last Updated.
            </p>
          </div>

          <Button variant="ghost" className="w-full" onClick={() => onChange({ ...defaultFilters })}>
            <X className="size-4" />
            Clear Filters
          </Button>
        </PopoverContent>
      </Popover>

      {count > 0 && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ ...defaultFilters })}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}
