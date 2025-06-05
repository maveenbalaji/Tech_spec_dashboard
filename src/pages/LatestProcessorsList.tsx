import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { cpuData } from "@/data/cpuData_complete_sorted_by_launch";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartEvent,
  ActiveElement,
  ChartData,
  ChartOptions,
} from "chart.js";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, BarElement, Title, Tooltip, Legend);

// Define interfaces locally
export interface CpuInfo {
  Name: string;
  "CPU Class": string;
  Socket: string;
  Launched: string;
  "Benchmark (Multi core)": number | null;
  "Benchmark (Single core)": number | null;
  TDP: string;
  Cores: number | null;
  Threads: number | null;
  Clockspeed: string;
  "Turbo Speed": string;
  "Overall Rank": number;
  "Single Threaded Rank": number;
  "Last Price Change": number | null;
  "S.No": number;
}

export interface DateTime {
  Date: string;
  Time: string;
}

export type CpuData = CpuInfo | DateTime;

// Define helper functions
const getPrice = (processor: CpuInfo) => {
  return processor["Last Price Change"] || null;
};

const calculatePricePerCore = (processor: CpuInfo) => {
  const price = getPrice(processor);
  if (!price) return "N/A";
  const cores = processor.Cores || 1;
  const result = price / cores;
  return Number.isInteger(result) ? `${result} USD` : `${result.toFixed(4)} USD`;
};

const calculatePricePerSingleBenchmark = (processor: CpuInfo) => {
  const price = getPrice(processor);
  if (!price) return "N/A";
  const singleBenchmark = processor["Benchmark (Single core)"] || 1;
  return `${(price / singleBenchmark).toFixed(4)} USD`;
};

const calculatePricePerMultiBenchmark = (processor: CpuInfo) => {
  const price = getPrice(processor);
  if (!price) return "N/A";
  const multiBenchmark = processor["Benchmark (Multi core)"] || 1;
  return `${(price / multiBenchmark).toFixed(4)} USD`;
};

// Declare getLatestYear function
function getLatestYear(uniqueYears: string[]) {
  const latest = uniqueYears[0];
  console.log("Latest year:", latest);
  return latest || null;
}

const LatestProcessorsList = () => {
  const [processors, setProcessors] = useState<CpuInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCpuClass, setSelectedCpuClass] = useState<string | null>("All");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "",
    direction: "asc",
  });
  const [showPriceAnalysis, setShowPriceAnalysis] = useState(false);
  const [showBenchmarkAnalysis, setShowBenchmarkAnalysis] = useState(false);
  const [isHoveringHideArea, setIsHoveringHideArea] = useState(false);
  const [showAllClasses, setShowAllClasses] = useState(false);
  const [hidePriceNA, setHidePriceNA] = useState(true);
  const [hoveredProcessor, setHoveredProcessor] = useState<string | null>(null);
  const [selectedProcessor, setSelectedProcessor] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState<DateTime | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedProcessors, setSelectedProcessors] = useState<Set<string>>(new Set());

  // Dynamically compute unique years
  const getUniqueYears = useMemo(() => {
    const years = new Set(
      processors
        .map((proc) => {
          const [_, year] = proc.Launched.split(" ").filter(Boolean);
          return year && !isNaN(Number(year)) ? year.trim() : null;
        })
        .filter((year): year is string => year !== null)
    );
    return Array.from(years).sort((a, b) => (b > a ? 1 : -1));
  }, [processors]);

  const [selectedYear, setSelectedYear] = useState<string | null>(() => getLatestYear(getUniqueYears));
  const [showHiddenYears, setShowHiddenYears] = useState(false);

  // Filter years: show 2020 to latest year by default, rest in hidden section
  const mainYears = useMemo(() => {
    const latestYear = getLatestYear(getUniqueYears);
    return latestYear ? getUniqueYears.filter((year) => parseInt(year) >= 2020 && parseInt(year) <= parseInt(latestYear)) : [];
  }, [getUniqueYears]);
  const hiddenYears = useMemo(() => getUniqueYears.filter((year) => parseInt(year) < 2020), [getUniqueYears]);

  const priceCoreChartRef = useRef<ChartJS<"line"> | null>(null);

  useEffect(() => {
    const dateTimeEntry = cpuData.find((item): item is DateTime => "Date" in item) as DateTime | undefined;
    if (dateTimeEntry) setDateTime(dateTimeEntry);

    const cpuInfoData = cpuData.filter((item): item is CpuInfo => "Name" in item);
    console.log("Loaded processors:", cpuInfoData);
    setProcessors(cpuInfoData);
    setLoading(false);

    if (!selectedYear && cpuInfoData.length > 0) {
      const uniqueYears = Array.from(
        new Set(
          cpuInfoData
            .map((proc) => {
              const [_, year] = proc.Launched.split(" ").filter(Boolean);
              return year && !isNaN(Number(year)) ? year.trim() : null;
            })
            .filter((year): year is string => year !== null)
        )
      ).sort((a, b) => (b > a ? 1 : -1));
      const latestYear = getLatestYear(uniqueYears);
      if (latestYear) setSelectedYear(latestYear);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const formatCpuClass = (cpuClass: string): string | string[] => {
    if (cpuClass === "Mobile/Embedded") return ["Mobile/", "Embedded"];
    return cpuClass.includes(",") ? cpuClass.split(",").map((part) => part.trim()) : cpuClass;
  };

  const getUniqueCpuClasses = useMemo(() => {
    const allClasses = new Set(processors.map((proc) => proc["CPU Class"]));
    const allowedClasses = showAllClasses ? Array.from(allClasses) : ["Desktop", "Server", "Laptop"];
    return ["All", ...allowedClasses.sort()];
  }, [processors, showAllClasses]);

  const baseFilteredProcessors = useMemo(() => {
    let result = [...processors];

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      result = result.filter((processor) => {
        const nameLower = processor.Name.toLowerCase();
        if (nameLower.includes(searchLower)) return true;
        return Object.values(processor)
          .filter((value) => value !== processor.Name)
          .some((value) => value?.toString().toLowerCase().includes(searchLower));
      });
    }

    if (selectedYear && selectedYear !== "All Years") {
      result = result.filter((processor) => {
        const [, year] = processor.Launched.split(" ");
        return year === selectedYear;
      });
    }

    if (selectedCpuClass && selectedCpuClass !== "All") {
      result = result.filter((processor) => processor["CPU Class"] === selectedCpuClass);
    } else if (!showAllClasses) {
      result = result.filter((processor) =>
        ["Desktop", "Server", "Laptop"].includes(processor["CPU Class"])
      );
    }

    if (hidePriceNA) {
      result = result.filter((processor) => getPrice(processor) !== null);
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        let valueA = a[sortConfig.key as keyof CpuInfo];
        let valueB = b[sortConfig.key as keyof CpuInfo];

        if (showPriceAnalysis) {
          switch (sortConfig.key) {
            case "Last Price Change":
              valueA = getPrice(a) || 0;
              valueB = getPrice(b) || 0;
              break;
            case "Price / Core (USD)":
              valueA = getPrice(a) ? parseFloat(calculatePricePerCore(a).replace(" USD", "")) || 0 : 0;
              valueB = getPrice(b) ? parseFloat(calculatePricePerCore(b).replace(" USD", "")) || 0 : 0;
              break;
            case "Benchmark (Single core)":
              valueA = a["Benchmark (Single core)"] || 0;
              valueB = b["Benchmark (Single core)"] || 0;
              break;
            case "Benchmark (Multi core)":
              valueA = a["Benchmark (Multi core)"] || 0;
              valueB = b["Benchmark (Multi core)"] || 0;
              break;
            default:
              valueA = typeof a[sortConfig.key as keyof CpuInfo] === "number" ? a[sortConfig.key as keyof CpuInfo] || 0 : 0;
              valueB = typeof b[sortConfig.key as keyof CpuInfo] === "number" ? b[sortConfig.key as keyof CpuInfo] || 0 : 0;
          }
        } else {
          if (sortConfig.key === "Benchmark (Single core)" || sortConfig.key === "Benchmark (Multi core)" || sortConfig.key === "Cores" || sortConfig.key === "Threads") {
            valueA = (typeof valueA === "number" ? valueA : 0) || 0;
            valueB = (typeof valueB === "number" ? valueB : 0) || 0;
          } else if (sortConfig.key === "Launched") {
            const [quarterA, yearA] = (valueA as string).split(" ");
            const [quarterB, yearB] = (valueB as string).split(" ");
            const quarterOrder = { Q4: 4, Q3: 3, Q2: 2, Q1: 1 };
            const yearDiff = (yearB || "0").localeCompare(yearA || "0");
            if (yearDiff !== 0) return sortConfig.direction === "asc" ? yearDiff : -yearDiff;
            return sortConfig.direction === "asc" ? quarterOrder[quarterA] - quarterOrder[quarterB] : quarterOrder[quarterB] - quarterOrder[quarterA];
          } else {
            valueA = valueA?.toString() || "";
            valueB = valueB?.toString() || "";
          }
        }

        if (typeof valueA === "number" && typeof valueB === "number") {
          return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
        } else {
          return sortConfig.direction === "asc"
            ? (valueA as string).localeCompare(valueB as string)
            : (valueB as string).localeCompare(valueA as string);
        }
      });
    }

    if (selectedYear && selectedYear !== "All Years") {
      result.sort((a, b) => {
        const [quarterA] = a.Launched.split(" ");
        const [quarterB] = b.Launched.split(" ");
        const quarterOrder = { Q4: 4, Q3: 3, Q2: 2, Q1: 1 };
        return quarterOrder[quarterA] - quarterOrder[quarterB];
      });
    }

    return result;
  }, [
    processors,
    debouncedSearchTerm,
    selectedYear,
    selectedCpuClass,
    sortConfig,
    showPriceAnalysis,
    showAllClasses,
    hidePriceNA,
  ]);

  const uniqueProcessors = useMemo(() => {
    const seen = new Map<string, CpuInfo>();
    for (const processor of baseFilteredProcessors) {
      if (!seen.has(processor.Name)) {
        seen.set(processor.Name, processor);
      }
    }
    return Array.from(seen.values());
  }, [baseFilteredProcessors]);

  const tableProcessors = useMemo(() => {
    let result = [...uniqueProcessors];

    if (!compareMode && selectedProcessor) {
      const selectedProc = uniqueProcessors.find((processor) => processor.Name === selectedProcessor);
      return selectedProc ? [{
        ...selectedProc,
        displaySNo: uniqueProcessors.findIndex((p) => p.Name === selectedProcessor) + 1,
      }] : [];
    }

    if (selectedYear && selectedYear !== "All Years") {
      result = result.filter((processor) => {
        const [, year] = processor.Launched.split(" ");
        return year === selectedYear;
      });
    }

    return result.map((processor, index) => ({
      ...processor,
      displaySNo: index + 1,
    }));
  }, [uniqueProcessors, selectedProcessor, selectedYear, compareMode]);

  const sortedProcessorsForPricePerCore = useMemo(() => {
    if (!showPriceAnalysis && !showBenchmarkAnalysis || !selectedYear || selectedYear === "All Years" || !uniqueProcessors) return null;

    const filteredProcessors = uniqueProcessors.filter((processor) => {
      const price = getPrice(processor);
      return price !== null && calculatePricePerCore(processor) !== "N/A";
    });

    return [...filteredProcessors].sort((a, b) => {
      const pricePerCoreA = parseFloat(calculatePricePerCore(a).replace(" USD", "")) || 0;
      const pricePerCoreB = parseFloat(calculatePricePerCore(b).replace(" USD", "")) || 0;
      return pricePerCoreA - pricePerCoreB;
    });
  }, [uniqueProcessors, showPriceAnalysis, showBenchmarkAnalysis, selectedYear]);

  const suggestedProcessors = useMemo(() => {
    if (!sortedProcessorsForPricePerCore) return [];

    const validProcessors = sortedProcessorsForPricePerCore.filter(
      (processor) => getPrice(processor) !== null && processor["Benchmark (Multi core)"] !== null
    );
    if (validProcessors.length === 0) return [];

    const prices = validProcessors.map((processor) => getPrice(processor) || 0);
    const multiBenchmarks = validProcessors.map((processor) => processor["Benchmark (Multi core)"] || 0);
    const pricePerCores = validProcessors.map((processor) =>
      parseFloat(calculatePricePerCore(processor).replace(" USD", "")) || 0
    );

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minMultiBenchmark = Math.min(...multiBenchmarks);
    const maxMultiBenchmark = Math.max(...multiBenchmarks);
    const minPricePerCore = Math.min(...pricePerCores);
    const maxPricePerCore = Math.max(...pricePerCores);

    if (validProcessors.length === 1) {
      const processor = validProcessors[0];
      const price = getPrice(processor) || 0;
      const multiBenchmark = processor["Benchmark (Multi core)"] || 0;
      const scaledPrice = (price - minPrice) / (maxPrice - minPrice || 1);
      const scaledMultiBenchmark = (multiBenchmark - minMultiBenchmark) / (maxMultiBenchmark - minMultiBenchmark || 1);
      return scaledPrice < scaledMultiBenchmark ? [processor] : [];
    } else if (validProcessors.length === 2) {
      let processorsWithDifference = validProcessors.map((processor) => {
        const price = getPrice(processor) || 0;
        const multiBenchmark = processor["Benchmark (Multi core)"] || 0;
        const pricePerCore = parseFloat(calculatePricePerCore(processor).replace(" USD", "")) || 0;

        const scaledPrice = (price - minPrice) / (maxPrice - minPrice || 1);
        const scaledMultiBenchmark = (multiBenchmark - minMultiBenchmark) / (maxMultiBenchmark - minMultiBenchmark || 1);
        const scaledPricePerCore = (pricePerCore - minPricePerCore) / (maxPricePerCore - minPricePerCore || 1);

        const difference = scaledMultiBenchmark - scaledPricePerCore;

        return { processor, difference };
      });

      processorsWithDifference.sort((a, b) => b.difference - a.difference);

      return processorsWithDifference.slice(0, 1).map((item) => item.processor);
    } else {
      let MIN_DIFFERENCE_THRESHOLD = 0.3;

      let processorsWithDifference = validProcessors
        .map((processor) => {
          const price = getPrice(processor) || 0;
          const multiBenchmark = processor["Benchmark (Multi core)"] || 0;
          const pricePerCore = parseFloat(calculatePricePerCore(processor).replace(" USD", "")) || 0;

          const scaledPrice = (price - minPrice) / (maxPrice - minPrice || 1);
          const scaledMultiBenchmark = (multiBenchmark - minMultiBenchmark) / (maxMultiBenchmark - minMultiBenchmark || 1);
          const scaledPricePerCore = (pricePerCore - minPricePerCore) / (maxPricePerCore - minPricePerCore || 1);

          const isPriceBelowBenchmark = scaledPrice < scaledMultiBenchmark;

          const difference = isPriceBelowBenchmark ? (scaledMultiBenchmark - scaledPricePerCore) : -Infinity;

          return { processor, difference };
        })
        .filter((item) => item.difference !== -Infinity && item.difference >= MIN_DIFFERENCE_THRESHOLD);

      if (processorsWithDifference.length < 3 && validProcessors.length >= 3) {
        MIN_DIFFERENCE_THRESHOLD = Math.max(
          0.1,
          Math.min(...validProcessors
            .map((processor) => {
              const price = getPrice(processor) || 0;
              const multiBenchmark = processor["Benchmark (Multi core)"] || 0;
              const pricePerCore = parseFloat(calculatePricePerCore(processor).replace(" USD", "")) || 0;

              const scaledPrice = (price - minPrice) / (maxPrice - minPrice || 1);
              const scaledMultiBenchmark = (multiBenchmark - minMultiBenchmark) / (maxMultiBenchmark - minMultiBenchmark || 1);
              const scaledPricePerCore = (pricePerCore - minPricePerCore) / (maxPricePerCore - minPricePerCore || 1);

              return scaledPrice < scaledMultiBenchmark ? (scaledMultiBenchmark - scaledPricePerCore) : -Infinity;
            })
            .filter((diff) => diff !== -Infinity))
        );

        processorsWithDifference = validProcessors
          .map((processor) => {
            const price = getPrice(processor) || 0;
            const multiBenchmark = processor["Benchmark (Multi core)"] || 0;
            const pricePerCore = parseFloat(calculatePricePerCore(processor).replace(" USD", "")) || 0;

            const scaledPrice = (price - minPrice) / (maxPrice - minPrice || 1);
            const scaledMultiBenchmark = (multiBenchmark - minMultiBenchmark) / (maxMultiBenchmark - minMultiBenchmark || 1);
            const scaledPricePerCore = (pricePerCore - minPricePerCore) / (maxPricePerCore - minPricePerCore || 1);

            const isPriceBelowBenchmark = scaledPrice < scaledMultiBenchmark;
            const difference = isPriceBelowBenchmark ? (scaledMultiBenchmark - scaledPricePerCore) : -Infinity;

            return { processor, difference };
          })
          .filter((item) => item.difference !== -Infinity && item.difference >= MIN_DIFFERENCE_THRESHOLD);
      }

      processorsWithDifference.sort((a, b) => b.difference - a.difference);

      return processorsWithDifference.slice(0, 3).map((item) => item.processor);
    }
  }, [sortedProcessorsForPricePerCore]);

  const pointColorsPrice = sortedProcessorsForPricePerCore?.map((processor) =>
    suggestedProcessors.some((suggested) => suggested.Name === processor.Name)
      ? "red"
      : "blue"
  ) || [];
  const pointColorsSingleBenchmark = sortedProcessorsForPricePerCore?.map((processor) =>
    suggestedProcessors.some((suggested) => suggested.Name === processor.Name)
      ? "red"
      : "red"
  ) || [];
  const pointColorsMultiBenchmark = sortedProcessorsForPricePerCore?.map((processor) =>
    suggestedProcessors.some((suggested) => suggested.Name === processor.Name)
      ? "red"
      : "green"
  ) || [];
  const pointRadii = sortedProcessorsForPricePerCore?.map((processor) =>
    suggestedProcessors.some((suggested) => suggested.Name === processor.Name)
      ? 5
      : 2
  ) || [];

  const prepareCombinedGraphData = useMemo(() => {
    if (!showPriceAnalysis || !selectedYear || selectedYear === "All Years" || !sortedProcessorsForPricePerCore) return null;

    return {
      labels: sortedProcessorsForPricePerCore.map((processor) => processor.Name),
      datasets: [
        {
          label: "Price (USD)",
          data: sortedProcessorsForPricePerCore.map((processor) => getPrice(processor) || 0),
          borderColor: "blue",
          backgroundColor: "rgba(54, 162, 235, 0.1)",
          fill: false,
          pointRadius: pointRadii,
          pointBackgroundColor: pointColorsPrice,
          pointHoverRadius: 4,
          yAxisID: "y1",
        },
        {
          label: "Single Core Benchmark",
          data: sortedProcessorsForPricePerCore.map((processor) => processor["Benchmark (Single core)"] || 0),
          borderColor: "red",
          backgroundColor: "rgba(255, 99, 132, 0.1)",
          fill: false,
          pointRadius: pointRadii,
          pointBackgroundColor: pointColorsSingleBenchmark,
          pointHoverRadius: 4,
          yAxisID: "y2",
        },
        {
          label: "Multi Core Benchmark",
          data: sortedProcessorsForPricePerCore.map((processor) => processor["Benchmark (Multi core)"] || 0),
          borderColor: "green",
          backgroundColor: "rgba(75, 192, 192, 0.1)",
          fill: false,
          pointRadius: pointRadii,
          pointBackgroundColor: pointColorsMultiBenchmark,
          pointHoverRadius: 4,
          yAxisID: "y2",
        },
      ],
    } as ChartData<"line", number[], string>;
  }, [sortedProcessorsForPricePerCore, showPriceAnalysis, selectedYear, pointRadii, pointColorsPrice, pointColorsSingleBenchmark, pointColorsMultiBenchmark]);

  const prepareBenchmarkGraphData = useMemo(() => {
    if (!showBenchmarkAnalysis || !selectedYear || selectedYear === "All Years" || !sortedProcessorsForPricePerCore) return null;

    const filteredProcessors = sortedProcessorsForPricePerCore.filter((processor) => {
      const price = getPrice(processor);
      return price !== null && calculatePricePerCore(processor) !== "N/A" && processor["Benchmark (Single core)"] !== null && processor["Benchmark (Multi core)"] !== null;
    });

    return {
      labels: filteredProcessors.map((processor) => processor.Name),
      datasets: [
        {
          type: "bar" as const,
          label: "Price / Core (USD)",
          data: filteredProcessors.map((processor) =>
            parseFloat(calculatePricePerCore(processor).replace(" USD", "")) || 0
          ),
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 0.2)",
          borderWidth: 1,
          yAxisID: "y1",
          order: 2,
        },
        {
          type: "line" as const,
          label: "Benchmark (Single Core)",
          data: filteredProcessors.map((processor) => processor["Benchmark (Single core)"] || 0),
          borderColor: "red",
          backgroundColor: "rgba(255, 99, 132, 0.1)",
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: "y2",
          order: 1,
        },
        {
          type: "line" as const,
          label: "Benchmark (Multi Core)",
          data: filteredProcessors.map((processor) => processor["Benchmark (Multi core)"] || 0),
          borderColor: "green",
          backgroundColor: "rgba(75, 192, 192, 0.1)",
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: "y2",
          order: 1,
        },
      ],
    } as ChartData<"bar", number[], string>;
  }, [sortedProcessorsForPricePerCore, showBenchmarkAnalysis, selectedYear]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleYearClick = (year: string) => {
    setSelectedYear(year === selectedYear ? getLatestYear(getUniqueYears) : year);
  };

  const handleCpuClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCpuClass(e.target.value);
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    setSortConfig({ key, direction });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedYear(getLatestYear(getUniqueYears));
    setSelectedCpuClass("All");
    setSortConfig({ key: "", direction: "asc" });
    setShowPriceAnalysis(false);
    setShowBenchmarkAnalysis(false);
    setShowAllClasses(false);
    setHidePriceNA(true);
    setIsHoveringHideArea(false);
    setSelectedProcessor(null);
    setCompareMode(false);
    setSelectedProcessors(new Set());
  };

  const handleHideClick = () => {
    setShowAllClasses(true);
    setHidePriceNA(!hidePriceNA);
    setShowHiddenYears(!showHiddenYears);
  };

  const handleRevertHide = () => {
    setShowAllClasses(false);
    setHidePriceNA(true);
    setShowHiddenYears(false);
  };

  const handleGraphClick = (event: ChartEvent, chartElement: ActiveElement[], chartType: 'price' | 'benchmark') => {
    if (chartElement.length > 0) {
      const labels = chartType === 'price' ? prepareCombinedGraphData?.labels : prepareBenchmarkGraphData?.labels;
      const processorName = labels?.[chartElement[0].index];
      const newSelectedProcessor = selectedProcessor === processorName ? null : processorName;
      setSelectedProcessor(newSelectedProcessor);
    }
  };

  const handleCompareClick = (processorName: string) => {
    const newSelectedProcessors = new Set(selectedProcessors);
    if (newSelectedProcessors.has(processorName)) {
      newSelectedProcessors.delete(processorName);
    } else {
      newSelectedProcessors.add(processorName);
    }
    setSelectedProcessors(newSelectedProcessors);
  };

  const comparedProcessors = useMemo(() => {
    return Array.from(selectedProcessors)
      .map((name) => processors.find((processor) => processor.Name === name))
      .filter(Boolean) as CpuInfo[];
  }, [selectedProcessors, processors]);

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="container mx-auto px-4 pt-2 pb-8 max-w-screen-2xl">
      {dateTime && (
        <p className="text-red-500 font-bold mb-4 text-right">
          Updated: {dateTime.Date} at {dateTime.Time}
        </p>
      )}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-start">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold mb-2">Latest Processors List</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {mainYears.map((year) => (
            <button
              key={year}
              onClick={() => handleYearClick(year)}
              className={`px-3 py-1 border rounded-md ${selectedYear === year ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-black hover:bg-gray-300"}`}
            >
              {year}
            </button>
          ))}
          <div className="relative inline-block">
            <button
              key="All Years"
              onClick={() => handleYearClick("All Years")}
              className={`px-3 py-1 border rounded-md ${selectedYear === "All Years" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-black hover:bg-gray-300"}`}
            >
              All Years
            </button>
            <div
              className="absolute inline-block"
              style={{ top: "0", left: "100%", width: "2.5rem", height: "2rem" }}
              onMouseEnter={() => setIsHoveringHideArea(true)}
              onMouseLeave={() => setIsHoveringHideArea(false)}
            >
              {isHoveringHideArea && !showAllClasses && (
                <button
                  onClick={handleHideClick}
                  className="px-3 py-1 border rounded-md bg-red-500 text-white hover:bg-red-600"
                  style={{ position: "absolute", top: "0", left: "0" }}
                >
                  Hide
                </button>
              )}
            </div>
            {showHiddenYears && (
              <div className="absolute top-full left-0 mt-2 bg-white border rounded-md shadow-lg z-10">
                {hiddenYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearClick(year)}
                    className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
          {showAllClasses && (
            <button
              onClick={handleRevertHide}
              className="px-3 py-1 border rounded-md bg-gray-200 text-black hover:bg-gray-300 ml-2"
            >
              Show Original
            </button>
          )}
        </div>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search processors (e.g., Intel Ultra)..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-lg p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedCpuClass || "All"}
          onChange={handleCpuClassChange}
          className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {getUniqueCpuClasses.map((cpuClass) => (
            <option key={cpuClass} value={cpuClass}>
              {cpuClass}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowPriceAnalysis(!showPriceAnalysis)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-md shadow-md transition-all duration-200 ${
            showPriceAnalysis
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-black hover:bg-gray-300"
          }`}
        >
          <img
            src="/graph-icon.png"
            alt="Graph Icon"
            className="w-5 h-5"
          />
          Price and Benchmark
        </button>
        <button
          onClick={() => setShowBenchmarkAnalysis(!showBenchmarkAnalysis)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-md shadow-md transition-all duration-200 ${
            showBenchmarkAnalysis
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-black hover:bg-gray-300"
          }`}
        >
          <img
            src="/graph-icon.png"
            alt="Graph Icon"
            className="w-5 h-5"
          />
          Benchmark
        </button>
        <button
          onClick={() => setCompareMode(!compareMode)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-md shadow-md transition-all duration-200 ${
            compareMode
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-black hover:bg-gray-300"
          }`}
        >
          Compare
        </button>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); handleClearFilters(); }}
          className="text-black hover:text-gray-800 flex items-center gap-1 ml-auto"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Clear
        </a>
      </div>

      {showBenchmarkAnalysis && selectedYear && selectedYear !== "All Years" && prepareBenchmarkGraphData && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Benchmark Analysis for {selectedYear}</h2>
          <div id="benchmarkChart">
            <Chart
              type="bar"
              data={prepareBenchmarkGraphData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: `Benchmark Analysis - ${selectedYear}` },
                  tooltip: { mode: "index", intersect: false },
                },
                scales: {
                  y1: {
                    type: "linear",
                    position: "left",
                    beginAtZero: true,
                    title: { display: true, text: "Price / Core (USD)" },
                    ticks: { callback: (value) => `$${value}` },
                  },
                  y2: {
                    type: "linear",
                    position: "right",
                    beginAtZero: true,
                    title: { display: true, text: "Benchmark Score" },
                    grid: { drawOnChartArea: false },
                  },
                  x: { title: { display: true, text: "Processors" } },
                },
                onClick: (event: ChartEvent, chartElement: ActiveElement[]) => handleGraphClick(event, chartElement, 'benchmark'),
              }}
            />
          </div>
        </div>
      )}

      {showPriceAnalysis && selectedYear && selectedYear !== "All Years" && prepareCombinedGraphData && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Price and Benchmark Analysis for {selectedYear}</h2>
          <div id="combinedChart">
            <Chart
              type="line"
              ref={(chart) => { if (chart) priceCoreChartRef.current = chart; }}
              data={prepareCombinedGraphData}
              options={{
                responsive: true,
                aspectRatio: 2.5,
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: `Price and Benchmark Analysis - ${selectedYear}` },
                  tooltip: {
                    enabled: true,
                    mode: "index",
                    intersect: false,
                    callbacks: {
                      label: (context) => {
                        const processorName = context.label || "";
                        const processor = sortedProcessorsForPricePerCore?.find((p) => p.Name === processorName);
                        if (processor) {
                          if (context.datasetIndex === 0) return `Price: $${(getPrice(processor) || 0).toFixed(2)}`;
                          else if (context.datasetIndex === 1) return `Single Core Benchmark: ${processor["Benchmark (Single core)"] || 0}`;
                          else if (context.datasetIndex === 2) return `Multi Core Benchmark: ${processor["Benchmark (Multi core)"] || 0}`;
                        }
                        return "";
                      },
                    },
                  },
                },
                scales: {
                  y1: {
                    type: "linear",
                    position: "left",
                    beginAtZero: true,
                    title: { display: true, text: "Price (USD)" },
                  },
                  y2: {
                    type: "linear",
                    position: "right",
                    beginAtZero: true,
                    title: { display: true, text: "Benchmark Score" },
                    grid: { drawOnChartArea: false },
                  },
                  x: { title: { display: true, text: "Processors" } },
                },
                onHover: (event: ChartEvent, chartElement: ActiveElement[]) => {
                  if (chartElement.length > 0) {
                    const processorName = prepareCombinedGraphData.labels[chartElement[0].index];
                    setHoveredProcessor(processorName);
                  } else setHoveredProcessor(null);
                },
                onClick: (event: ChartEvent, chartElement: ActiveElement[]) => handleGraphClick(event, chartElement, 'price'),
              }}
            />
          </div>
          {suggestedProcessors.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
              <h3 className="text-lg font-bold mb-2 text-teal-600">
                Suggested Processors for {selectedYear} (Best Value: Low Price, High Benchmark Score)
              </h3>
              <ul className="list-disc pl-5">
                {suggestedProcessors.map((processor, index) => (
                  <li key={index}>
                    {processor.Name} - Price: ${getPrice(processor)?.toFixed(2)}, Price/Core: ${parseFloat(calculatePricePerCore(processor).replace(" USD", "")).toFixed(2)}, Multi Core Benchmark: ${processor["Benchmark (Multi core)"]}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {compareMode && comparedProcessors.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Comparison</h2>
          <table className="w-full table-auto text-left border-collapse mb-4">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-4 border min-w-[50px] w-[5%]">S.No</th>
                <th className="px-2 py-4 border min-w-[150px] w-[20%]">Name</th>
                <th className="px-2 py-4 border min-w-[120px] w-[15%]">CPU Class</th>
                <th className="px-2 py-4 border min-w-[100px] w-[10%]">Socket</th>
                <th className="px-2 py-4 border min-w-[100px] w-[8%]">Launched</th>
                <th className="px-2 py-4 border min-w-[120px] w-[8%]">Benchmark (Single Core)</th>
                <th className="px-2 py-4 border min-w-[120px] w-[8%]">Benchmark (Multi Core)</th>
                <th className="px-2 py-4 border min-w-[80px] w-[6%]">TDP</th>
                <th className="px-2 py-4 border min-w-[80px] w-[6%]">Cores</th>
                <th className="px-2 py-4 border min-w-[80px] w-[6%]">Threads</th>
                <th className="px-2 py-4 border min-w-[100px] w-[8%]">Clockspeed</th>
                <th className="px-2 py-4 border min-w-[100px] w-[8%]">Turbo Speed</th>
                <th className="px-2 py-4 border min-w-[100px] w-[8%]">Price</th>
              </tr>
            </thead>
            <tbody>
              {comparedProcessors.map((processor, index) => {
                const cpuClass = formatCpuClass(processor["CPU Class"]);
                return (
                  <tr key={index} className="border-b hover:bg-gray-100">
                    <td className="px-2 py-2 border whitespace-normal">{index + 1}</td>
                    <td className="px-2 py-2 border whitespace-normal">{processor.Name}</td>
                    <td className="px-4 py-4 border whitespace-normal" style={{ lineHeight: "1.5", minHeight: "60px" }}>
                      {Array.isArray(cpuClass) ? cpuClass.map((line, idx) => <div key={idx} className="break-words">{line}</div>) : <span className="inline-block">{cpuClass}</span>}
                    </td>
                    <td className="px-2 py-2 border whitespace-normal">{processor.Socket}</td>
                    <td className="px-2 py-2 border whitespace-normal">{processor.Launched}</td>
                    <td className="px-2 py-2 border whitespace-normal text-right">
                      {processor["Benchmark (Single core)"]}
                    </td>
                    <td className="px-2 py-2 border whitespace-normal text-right">
                      {processor["Benchmark (Multi core)"]}
                    </td>
                    <td className="px-2 py-2 border whitespace-normal text-right">{processor.TDP}</td>
                    <td className="px-2 py-2 border whitespace-normal text-right">{processor.Cores}</td>
                    <td className="px-2 py-2 border whitespace-normal text-right">{processor.Threads}</td>
                    <td className="px-2 py-2 border whitespace-normal text-right">{processor.Clockspeed}</td>
                    <td className="px-2 py-2 border whitespace-normal text-right">{processor["Turbo Speed"]}</td>
                    <td className="px-2 py-2 border whitespace-normal text-right">
                      {processor["Last Price Change"] === null || isNaN(processor["Last Price Change"]) ? "N/A" : `$${processor["Last Price Change"].toFixed(2)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tableProcessors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No processor data available</h3>
          <p className="mt-2 text-gray-500">No results found for "{searchTerm}" or selected filters. Try adjusting your search term or filters.</p>
        </div>
      ) : (
        <div className="w-full">
          <table className="w-full table-auto text-left border-collapse">
            <thead>
              {showBenchmarkAnalysis ? (
                <tr className="bg-gray-50">
                  {compareMode && <th className="px-2 py-4 border min-w-[50px] w-[5%]">Compare</th>}
                  <th className="px-2 py-4 border min-w-[50px] w-[5%]">S.No</th>
                  <th className="px-2 py-4 border min-w-[150px] w-[20%]">Name</th>
                  <th className="px-2 py-4 border min-w-[120px] w-[15%]">CPU Class</th>
                  <th className="px-2 py-4 border min-w-[100px] w-[10%] cursor-pointer text-right" onClick={() => handleSort("Last Price Change")}>
                    Price (USD)
                    {sortConfig.key === "Last Price Change" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                  <th className="px-2 py-4 border min-w-[100px] w-[10%] cursor-pointer text-right" onClick={() => handleSort("Price / Core (USD)")}>
                    Price / Core (USD)
                    {sortConfig.key === "Price / Core (USD)" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                  <th className="px-2 py-4 border min-w-[120px] w-[10%] cursor-pointer text-right" onClick={() => handleSort("Benchmark (Single core)")}>
                    Benchmark (Single Core)
                    {sortConfig.key === "Benchmark (Single core)" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                  <th className="px-2 py-4 border min-w-[120px] w-[10%] cursor-pointer text-right" onClick={() => handleSort("Benchmark (Multi core)")}>
                    Benchmark (Multi Core)
                    {sortConfig.key === "Benchmark (Multi core)" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                </tr>
              ) : showPriceAnalysis ? (
                <tr className="bg-gray-50">
                  {compareMode && <th className="px-2 py-4 border min-w-[50px] w-[5%]">Compare</th>}
                  <th className="px-2 py-4 border min-w-[50px] w-[5%]">S.No</th>
                  <th className="px-2 py-4 border min-w-[150px] w-[20%]">Name</th>
                  <th className="px-2 py-4 border min-w-[120px] w-[15%]">CPU Class</th>
                  <th className="px-2 py-4 border min-w-[100px] w-[10%] cursor-pointer text-right" onClick={() => handleSort("Last Price Change")}>
                    Price (USD)
                    {sortConfig.key === "Last Price Change" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                  <th className="px-2 py-4 border min-w-[100px] w-[10%] cursor-pointer text-right" onClick={() => handleSort("Price / Core (USD)")}>
                    Price / Core (USD)
                    {sortConfig.key === "Price / Core (USD)" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                  <th className="px-2 py-4 border min-w-[150px] w-[20%] cursor-pointer text-right" onClick={() => handleSort("Benchmark (Single core)")}>
                    Benchmark (Single Core)
                    {sortConfig.key === "Benchmark (Single core)" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                  <th className="px-2 py-4 border min-w-[150px] w-[20%] cursor-pointer text-right" onClick={() => handleSort("Benchmark (Multi core)")}>
                    Benchmark (Multi Core)
                    {sortConfig.key === "Benchmark (Multi core)" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                </tr>
              ) : (
                <tr className="bg-gray-50">
                  {compareMode && <th className="px-2 py-4 border min-w-[50px] w-[5%]">Compare</th>}
                  <th className="px-2 py-4 border min-w-[50px] w-[5%]">S.No</th>
                  <th className="px-2 py-4 border min-w-[150px] w-[15%]">Name</th>
                  <th className="px-2 py-4 border min-w-[120px] w-[10%]">CPU Class</th>
                  <th className="px-2 py-4 border min-w-[100px] w-[8%]">Socket</th>
                  <th className="px-2 py-4 border min-w-[100px] w-[8%]">Launched</th>
                  <th className="px-2 py-4 border min-w-[120px] w-[8%] cursor-pointer text-right" onClick={() => handleSort("Benchmark (Single core)")}>
                    Benchmark (Single Core)
                    {sortConfig.key === "Benchmark (Single core)" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                  <th className="px-2 py-4 border min-w-[120px] w-[8%] cursor-pointer text-right" onClick={() => handleSort("Benchmark (Multi core)")}>
                    Benchmark (Multi Core)
                    {sortConfig.key === "Benchmark (Multi core)" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                  <th className="px-2 py-4 border min-w-[80px] w-[6%]">TDP</th>
                  <th className="px-2 py-4 border min-w-[80px] w-[6%] cursor-pointer text-right" onClick={() => handleSort("Cores")}>
                    Cores
                    {sortConfig.key === "Cores" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                  <th className="px-2 py-4 border min-w-[80px] w-[6%] cursor-pointer text-right" onClick={() => handleSort("Threads")}>
                    Threads
                    {sortConfig.key === "Threads" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                  <th className="px-2 py-4 border min-w-[100px] w-[8%]">Clockspeed</th>
                  <th className="px-2 py-4 border min-w-[100px] w-[8%]">Turbo Speed</th>
                  <th className="px-2 py-4 border min-w-[100px] w-[8%] cursor-pointer text-right" onClick={() => handleSort("Last Price Change")}>
                    Price
                    {sortConfig.key === "Last Price Change" ? (
                      <span className="ml-1 text-lg text-blue-600">{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                    ) : (
                      <span className="ml-1 text-lg text-gray-400">↑↓</span>
                    )}
                  </th>
                </tr>
              )}
            </thead>
            <tbody>
              {tableProcessors.map((processor: CpuInfo & { displaySNo?: number }, index: number) => {
                const cpuClass = formatCpuClass(processor["CPU Class"]);
                return (
                  <tr key={index} className="border-b hover:bg-gray-100">
                    {compareMode && (
                      <td className="px-2 py-2 border whitespace-normal text-center">
                        <input
                          type="checkbox"
                          checked={selectedProcessors.has(processor.Name)}
                          onChange={() => handleCompareClick(processor.Name)}
                        />
                      </td>
                    )}
                    {showBenchmarkAnalysis ? (
                      <>
                        <td className="px-2 py-2 border whitespace-normal">{processor.displaySNo}</td>
                        <td className="px-2 py-2 border whitespace-normal">{processor.Name}</td>
                        <td className="px-4 py-4 border whitespace-normal" style={{ lineHeight: "1.5", minHeight: "60px" }}>
                          {Array.isArray(cpuClass) ? cpuClass.map((line, idx) => <div key={idx} className="break-words">{line}</div>) : <span className="inline-block">{cpuClass}</span>}
                        </td>
                        <td className="px-2 py-2 border whitespace-normal text-right">
                          {getPrice(processor) ? `${getPrice(processor).toFixed(2)} USD` : "N/A"}
                        </td>
                        <td className="px-2 py-2 border whitespace-normal text-right">
                          {calculatePricePerCore(processor)}
                        </td>
                        <td className="px-2 py-2 border whitespace-normal text-right">
                          {processor["Benchmark (Single core)"]}
                        </td>
                        <td className="px-2 py-2 border whitespace-normal text-right">
                          {processor["Benchmark (Multi core)"]}
                        </td>
                      </>
                    ) : showPriceAnalysis ? (
                      <>
                        <td className="px-2 py-2 border whitespace-normal">{processor.displaySNo}</td>
                        <td className="px-2 py-2 border whitespace-normal">{processor.Name}</td>
                        <td className="px-4 py-4 border whitespace-normal" style={{ lineHeight: "1.5", minHeight: "60px" }}>
                          {Array.isArray(cpuClass) ? cpuClass.map((line, idx) => <div key={idx} className="break-words">{line}</div>) : <span className="inline-block">{cpuClass}</span>}
                        </td>
                        <td className="px-2 py-2 border whitespace-normal text-right">
                          {getPrice(processor) ? `${getPrice(processor).toFixed(2)} USD` : "N/A"}
                        </td>
                        <td className="px-2 py-2 border whitespace-normal text-right">
                          {getPrice(processor) ? calculatePricePerCore(processor) : "N/A"}
                        </td>
                        <td className="px-2 py-2 border whitespace-normal text-right">
                          {processor["Benchmark (Single core)"]}
                        </td>
                        <td className="px-2 py-2 border whitespace-normal text-right">
                          {processor["Benchmark (Multi core)"]}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-2 border whitespace-normal">{processor.displaySNo || processor["S.No"]}</td>
                        <td className="px-2 py-2 border whitespace-normal">{processor.Name}</td>
                        <td className="px-4 py-4 border whitespace-normal" style={{ lineHeight: "1.5", minHeight: "60px" }}>
                          {Array.isArray(cpuClass) ? cpuClass.map((line, idx) => <div key={idx} className="break-words">{line}</div>) : <span className="inline-block">{cpuClass}</span>}
                        </td>
                        <td className="px-2 py-2 border whitespace-normal">{processor.Socket}</td>
                        <td className="px-2 py-2 border whitespace-normal">{processor.Launched}</td>
                        <td className="px-2 py-2 border whitespace-normal text-right">
                          {processor["Benchmark (Single core)"]}
                        </td>
                        <td className="px-2 py-2 border whitespace-normal text-right">
                          {processor["Benchmark (Multi core)"]}
                        </td>
                        <td className="px-2 py-2 border whitespace-normal text-right">{processor.TDP}</td>
                        <td className="px-2 py-2 border whitespace-normal text-right">{processor.Cores}</td>
                        <td className="px-2 py-2 border whitespace-normal text-right">{processor.Threads}</td>
                        <td className="px-2 py-2 border whitespace-normal text-right">{processor.Clockspeed}</td>
                        <td className="px-2 py-2 border whitespace-normal text-right">{processor["Turbo Speed"]}</td>
                        <td className="px-2 py-2 border whitespace-normal text-right">
                          {processor["Last Price Change"] === null || isNaN(processor["Last Price Change"]) ? "N/A" : `$${processor["Last Price Change"].toFixed(2)}`}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LatestProcessorsList;
