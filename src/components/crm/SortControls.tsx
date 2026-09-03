import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_FIELDS, type SortField, type SortOrder } from "@/lib/crm-filters";

export function SortControls({
  field,
  order,
  onFieldChange,
  onOrderChange,
  fields = SORT_FIELDS.map((f) => f.value),
  className,
}: {
  field: SortField;
  order: SortOrder;
  onFieldChange: (f: SortField) => void;
  onOrderChange: (o: SortOrder) => void;
  fields?: SortField[];
  className?: string;
}) {
  const options = SORT_FIELDS.filter((f) => fields.includes(f.value));
  const isDate = options.find((f) => f.value === field)?.type === "date";

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Select value={field} onValueChange={(v) => onFieldChange(v as SortField)}>
        <SelectTrigger className="w-44" aria-label="Sort by">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              Sort: {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        aria-label="Toggle sort order"
        onClick={() => onOrderChange(order === "asc" ? "desc" : "asc")}
      >
        {order === "asc" ? (
          <ArrowUpAZ className="size-4" />
        ) : (
          <ArrowDownAZ className="size-4" />
        )}
        {isDate
          ? order === "asc"
            ? "Oldest first"
            : "Newest first"
          : order === "asc"
            ? "A → Z"
            : "Z → A"}
      </Button>
    </div>
  );
}
