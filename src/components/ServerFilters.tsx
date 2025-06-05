import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface ServerFiltersProps {
  onFilterChange: (filters: { search: string; type: string[]; department: string[] }) => void;
  showBenchmarks: boolean;
  showPriceData: boolean;
  toggleBenchmarkMode: (deselect?: boolean) => void;
  togglePriceMode: (deselect?: boolean) => void;
  clearFilters: () => void;
}

const ServerFilters = ({
  onFilterChange,
  showBenchmarks,
  showPriceData,
  toggleBenchmarkMode,
  togglePriceMode,
  clearFilters,
}: ServerFiltersProps) => {
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true); // Changed to true to show filters by default

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onFilterChange({ search: value, type: types, department: departments });
  };

  const handleTypeChange = (value: string[]) => {
    setTypes(value);
    onFilterChange({ search, type: value, department: departments });
  };

  const handleDepartmentChange = (value: string[]) => {
    setDepartments(value);
    onFilterChange({ search, type: types, department: value });
  };

  const sortByValue = showBenchmarks
    ? "benchmark"
    : showPriceData
    ? "price"
    : "";

  const handleSortByChange = (value: string) => {
    if (value === "") return;

    if (value === "benchmark") {
      if (showBenchmarks) {
        toggleBenchmarkMode(true);
      } else {
        toggleBenchmarkMode();
      }
    } else if (value === "price") {
      if (showPriceData) {
        togglePriceMode(true);
      } else {
        togglePriceMode();
      }
    }
  };

  return (
    <div className="w-full mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search servers..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="sm:w-auto hover:!bg-transparent hover:!text-current"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {showFilters ? "Hide Filters" : "Filters"}
        </Button>
        {(search || types.length > 0 || departments.length > 0 || showBenchmarks || showPriceData) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="sm:w-auto hover:!bg-transparent hover:!text-current"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-md grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="type-filter" className="block mb-2 text-sm">
              Server Type
            </Label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={types}
              onValueChange={handleTypeChange}
              className="justify-start"
            >
              <ToggleGroupItem
                value="LIVE"
                aria-label="Filter by LIVE"
                className={types.includes("LIVE") ? "!bg-sky-500 !text-white hover:!bg-sky-500 hover:!text-white" : "hover:!bg-transparent hover:!text-current"}
              >
                LIVE
              </ToggleGroupItem>
              <ToggleGroupItem
                value="TEST"
                aria-label="Filter by TEST"
                className={types.includes("TEST") ? "!bg-sky-500 !text-white hover:!bg-sky-500 hover:!text-white" : "hover:!bg-transparent hover:!text-current"}
              >
                TEST
              </ToggleGroupItem>
              <ToggleGroupItem
                value="TEST-SPARE"
                aria-label="Filter by TEST-SPARE"
                className={types.includes("TEST-SPARE") ? "!bg-sky-500 !text-white hover:!bg-sky-500 hover:!text-white" : "hover:!bg-transparent hover:!text-current"}
              >
                SPARE
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <Label htmlFor="department-filter" className="block mb-2 text-sm">
              Department
            </Label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={departments}
              onValueChange={handleDepartmentChange}
              className="justify-start"
            >
              <ToggleGroupItem
                value="CS"
                aria-label="Filter by CS"
                className={departments.includes("CS") ? "!bg-sky-500 !text-white hover:!bg-sky-500 hover:!text-white" : "hover:!bg-transparent hover:!text-current"}
              >
                CS
              </ToggleGroupItem>
              <ToggleGroupItem
                value="ADMIN"
                aria-label="Filter by ADMIN"
                className={departments.includes("ADMIN") ? "!bg-sky-500 !text-white hover:!bg-sky-500 hover:!text-white" : "hover:!bg-transparent hover:!text-current"}
              >
                ADMIN
              </ToggleGroupItem>
              <ToggleGroupItem
                value="R&D"
                aria-label="Filter by R&D"
                className={departments.includes("R&D") ? "!bg-sky-500 !text-white hover:!bg-sky-500 hover:!text-white" : "hover:!bg-transparent hover:!text-current"}
              >
                R&D
              </ToggleGroupItem>
              <ToggleGroupItem
                value="PROD"
                aria-label="Filter by PROD"
                className={departments.includes("PROD") ? "!bg-sky-500 !text-white hover:!bg-sky-500 hover:!text-white" : "hover:!bg-transparent hover:!text-current"}
              >
                PROD
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <Label htmlFor="sort-filter" className="block mb-2 text-sm">
              Sort By
            </Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={sortByValue}
              onValueChange={handleSortByChange}
              className="justify-start"
            >
              <ToggleGroupItem
                value="benchmark"
                aria-label="Toggle Benchmark Mode"
                className={showBenchmarks ? "!bg-sky-500 !text-white hover:!bg-sky-500 hover:!text-white" : "hover:!bg-transparent hover:!text-current"}
              >
                Benchmark
              </ToggleGroupItem>
              <ToggleGroupItem
                value="price"
                aria-label="Toggle Price Mode"
                className={showPriceData ? "!bg-sky-500 !text-white hover:!bg-sky-500 hover:!text-white" : "hover:!bg-transparent hover:!text-current"}
              >
                Price / Core vs Price / Benchmark
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerFilters;