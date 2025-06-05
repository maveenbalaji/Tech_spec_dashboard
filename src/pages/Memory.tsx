import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  ChartData,
  ChartOptions,
} from "chart.js";
import { memoryData } from "@/data/memory";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, BarElement, Title, Tooltip, Legend);

interface MemoryInfo {
  Name: string;
  Description: string;
  "Memory Type": string;
  "Database Operations": string;
  "Memory Read Cached": string;
  "Memory Read Uncached": string;
  "Memory Write": string;
  Latency: string;
  "Memory Threaded": string;
  "Average Mark": string;
  "Launch Date": string;
  "Last Price Change": number | null;
  "S.No": number;
}

interface DateTime {
  Date: string;
  Time: string;
}

type MemoryData = MemoryInfo | DateTime;

// Helper function to extract capacity from Name
const getCapacity = (name: string): string => {
  const match = name.match(/(\d+\s*GB)/i);
  return match ? match[0].trim() : "N/A";
};

// Helper function to get cleaned name without capacity
const getCleanedName = (name: string): string => {
  const match = name.match(/(\d+\s*GB)/i);
  if (match) {
    return name.replace(match[0], "").trim();
  }
  return name;
};

const getPrice = (memory: MemoryInfo) => memory["Last Price Change"] || null;
const calculatePricePerMark = (memory: MemoryInfo) => {
  const price = getPrice(memory);
  if (!price) return "N/A";
  const mark = parseFloat(memory["Average Mark"]) || 1;
  return `${(price / mark).toFixed(4)} USD`;
};

function getLatestYear(uniqueYears: string[]) {
  return uniqueYears[0] || null;
}

const Memory = () => {
  const [memoryItems, setMemoryItems] = useState<MemoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "",
    direction: "asc",
  });
  const [showPriceAnalysis, setShowPriceAnalysis] = useState(false);
  const [dateTime, setDateTime] = useState<DateTime | null>(null);
  const [hidePriceNA, setHidePriceNA] = useState(true);
  const [isHoveringHideArea, setIsHoveringHideArea] = useState(false);
  const [selectedMemoryType, setSelectedMemoryType] = useState<string>("ALL");
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const getUniqueYears = useMemo(() => {
    const years = new Set(
      memoryItems
        .filter((item) => item["Last Price Change"] !== null && item["Launch Date"] !== "N/A")
        .map((item) => item["Launch Date"].split("-")[0])
        .filter((year): year is string => !!year && !isNaN(parseInt(year)))
    );
    return Array.from(years).sort((a, b) => (b > a ? 1 : -1));
  }, [memoryItems]);

  const getUniqueMemoryTypes = useMemo(() => {
    const types = new Set(
      memoryItems
        .map((item) => item["Memory Type"])
        .filter((type) => type.toLowerCase() !== "unknown")
    );
    return ["ALL", ...Array.from(types).sort()];
  }, [memoryItems]);

  // Data for the graph (unchanged by point selection)
  const graphData = useMemo(() => {
    let result = [...memoryItems];

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      result = result.filter(
        (item) =>
          getCleanedName(item.Name).toLowerCase().includes(searchLower) ||
          item["Memory Type"].toLowerCase().includes(searchLower) ||
          item["Database Operations"].toLowerCase().includes(searchLower) ||
          item["Memory Read Cached"].toLowerCase().includes(searchLower) ||
          item["Memory Read Uncached"].toLowerCase().includes(searchLower) ||
          item["Memory Write"].toLowerCase().includes(searchLower) ||
          item.Latency.toLowerCase().includes(searchLower) ||
          item["Memory Threaded"].toLowerCase().includes(searchLower) ||
          getCapacity(item.Name).toLowerCase().includes(searchLower)
      );
    }

    if (selectedYear && selectedYear !== "All Years") {
      result = result.filter((item) => item["Launch Date"].startsWith(selectedYear));
    }

    if (selectedMemoryType && selectedMemoryType !== "ALL") {
      result = result.filter((item) => item["Memory Type"] === selectedMemoryType);
    }

    if (hidePriceNA) {
      result = result.filter((item) => getPrice(item) !== null);
    }

    return result;
  }, [memoryItems, debouncedSearchTerm, selectedYear, selectedMemoryType, hidePriceNA]);

  // Suggest best memory modules based on the largest difference between scaled Average Mark and Last Price Change
  const suggestedMemory = useMemo(() => {
    const validMemory = graphData.filter(
      (memory) => getPrice(memory) !== null && parseFloat(memory["Average Mark"]) > 0
    );
    if (validMemory.length === 0) return [];

    // Find min and max for scaling
    const prices = validMemory.map((memory) => getPrice(memory)!);
    const marks = validMemory.map((memory) => parseFloat(memory["Average Mark"])!);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minMark = Math.min(...marks);
    const maxMark = Math.max(...marks);

    // Scale the values to [0, 1] and calculate the difference
    const memoryWithDifference = validMemory.map((memory) => {
      const price = getPrice(memory)!;
      const mark = parseFloat(memory["Average Mark"])!;
      const scaledPrice = (price - minPrice) / (maxPrice - minPrice || 1); // Avoid division by zero
      const scaledMark = (mark - minMark) / (maxMark - minMark || 1);
      const difference = scaledMark - scaledPrice; // Higher mark relative to price
      return { memory, difference };
    });

    // Sort by difference (descending) to get memory with the largest gap
    memoryWithDifference.sort((a, b) => b.difference - a.difference);

    // Return top 3 memory modules
    return memoryWithDifference.slice(0, 3).map((item) => item.memory);
  }, [graphData]);

  // Create arrays for point colors and radii based on suggested memory modules
  const pointColorsPrice = graphData.map((memory) =>
    suggestedMemory.some((suggested) => suggested.Name === memory.Name)
      ? "red"
      : "blue"
  );
  const pointColorsMark = graphData.map((memory) =>
    suggestedMemory.some((suggested) => suggested.Name === memory.Name)
      ? "red"
      : "green"
  );
  const pointRadii = graphData.map((memory) =>
    suggestedMemory.some((suggested) => suggested.Name === memory.Name)
      ? 5
      : 2
  );

  // Data for the table (filtered by point selection)
  const filteredMemory = useMemo(() => {
    let result = [...graphData];

    if (selectedPointIndex !== null) {
      result = result.filter((_, index) => index === selectedPointIndex);
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        let valueA: string | number = a[sortConfig.key as keyof MemoryInfo];
        let valueB: string | number = b[sortConfig.key as keyof MemoryInfo];

        if (sortConfig.key === "Name") {
          valueA = getCleanedName(a.Name);
          valueB = getCleanedName(b.Name);
          return sortConfig.direction === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        if (sortConfig.key === "Launch Date") {
          const yearA = valueA.toString().split("-")[0];
          const yearB = valueB.toString().split("-")[0];
          return sortConfig.direction === "asc" ? yearA.localeCompare(yearB) : yearB.localeCompare(yearA);
        }

        if (sortConfig.key === "Capacity") {
          valueA = getCapacity(a.Name);
          valueB = getCapacity(b.Name);
          const numA = parseInt(valueA) || 0;
          const numB = parseInt(valueB) || 0;
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }

        if (sortConfig.key === "Last Price Change") {
          valueA = getPrice(a) || 0;
          valueB = getPrice(b) || 0;
        } else if (sortConfig.key === "Price / Average Mark") {
          valueA = getPrice(a) ? parseFloat(calculatePricePerMark(a).replace(" USD", "")) || 0 : 0;
          valueB = getPrice(b) ? parseFloat(calculatePricePerMark(b).replace(" USD", "")) || 0 : 0;
        } else if (["Average Mark", "Database Operations", "Memory Read Cached", "Memory Read Uncached", "Memory Write", "Memory Threaded"].includes(sortConfig.key)) {
          const numA = parseFloat(valueA.toString().replace(/[^0-9.]/g, "")) || 0;
          const numB = parseFloat(valueB.toString().replace(/[^0-9.]/g, "")) || 0;
          valueA = numA;
          valueB = numB;
        } else if (sortConfig.key === "Latency") {
          const numA = parseFloat(valueA.toString().replace(/[^0-9.]/g, "")) || 0;
          const numB = parseFloat(valueB.toString().replace(/[^0-9.]/g, "")) || 0;
          valueA = numA;
          valueB = numB;
          return sortConfig.direction === "asc" ? numA - numB : numB - numA; // Lower latency is better
        } else if (sortConfig.key === "Memory Type") {
          valueA = valueA.toString();
          valueB = valueB.toString();
          return sortConfig.direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }

        // Ensure valueA and valueB are numbers for arithmetic operations
        const numericA = typeof valueA === "number" ? valueA : 0;
        const numericB = typeof valueB === "number" ? valueB : 0;
        return sortConfig.direction === "asc" ? numericA - numericB : numericB - numericA;
      });
    }

    return result;
  }, [graphData, sortConfig, selectedPointIndex]);

  useEffect(() => {
    const dateTimeEntry = memoryData.find((item): item is DateTime => "Date" in item) as DateTime | undefined;
    if (dateTimeEntry) setDateTime(dateTimeEntry);

    const memoryInfoData = memoryData.filter((item): item is MemoryInfo => "Name" in item);
    setMemoryItems(memoryInfoData);
    setLoading(false);

    // Calculate unique years from memoryItems
    const uniqueYears = Array.from(
      new Set(
        memoryInfoData
          .filter((item) => item["Last Price Change"] !== null && item["Launch Date"] !== "N/A")
          .map((item) => item["Launch Date"].split("-")[0])
          .filter((year): year is string => !!year && !isNaN(parseInt(year)))
      )
    ).sort((a, b) => (b > a ? 1 : -1));

    // Set the latest year as the selected year
    const latestYear = uniqueYears[0] || null;
    setSelectedYear(latestYear);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleYearClick = (year: string) => {
    setSelectedYear(year === selectedYear ? getLatestYear(getUniqueYears) : year);
  };

  const handleSort = (key: string) => {
    setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc" });
  };

  const handleMemoryTypeChange = (type: string) => {
    setSelectedMemoryType(type);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedYear(getLatestYear(getUniqueYears));
    setSortConfig({ key: "", direction: "asc" });
    setShowPriceAnalysis(false);
    setHidePriceNA(true);
    setIsHoveringHideArea(false);
    setSelectedMemoryType("ALL");
    setSelectedPointIndex(null);
  };

  const handleHideClick = () => {
    setHidePriceNA(!hidePriceNA);
  };

  const handleRevertHide = () => {
    setHidePriceNA(true);
  };

  const handleChartClick = (event: any, elements: any[]) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      // Toggle selection: if the same point is clicked again, deselect it
      setSelectedPointIndex(selectedPointIndex === index ? null : index);
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">Memory List</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {getUniqueYears
            .filter(year => parseInt(year) >= 2020) // Filter years from 2020 onwards
            .map((year) => (
              <button
                key={year}
                onClick={() => handleYearClick(year)}
                className={`px-3 py-1 border rounded-md ${
                  selectedYear === year ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                {year}
              </button>
            ))}
          <div className="relative inline-block">
            <button
              key="All Years"
              onClick={() => handleYearClick("All Years")}
              className={`px-3 py-1 border rounded-md ${
                selectedYear === "All Years" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              All Years
            </button>
            <div
              className="absolute inline-block"
              style={{ top: "0", left: "100%", width: "2.5rem", height: "2rem" }}
              onMouseEnter={() => setIsHoveringHideArea(true)}
              onMouseLeave={() => setIsHoveringHideArea(false)}
            >
              {isHoveringHideArea && hidePriceNA && (
                <button
                  onClick={handleHideClick}
                  className="px-3 py-1 border rounded-md bg-red-500 text-white hover:bg-red-600"
                  style={{ position: "absolute", top: "0", left: "0" }}
                >
                  Hide
                </button>
              )}
            </div>
          </div>
          {!hidePriceNA && (
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
          placeholder="Search memory (e.g., G Skill Intl F5-6000U4040E16G or 16GB)..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-lg p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedMemoryType}
          onChange={(e) => handleMemoryTypeChange(e.target.value)}
          className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {getUniqueMemoryTypes.map((type) => (
            <option key={type} value={type}>
              {type}
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
          Price and Average Mark Analysis
        </button>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleClearFilters();
          }}
          className="text-black hover:text-gray-800 flex items-center gap-1 ml-auto"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Clear
        </a>
      </div>

      {showPriceAnalysis && selectedYear && selectedYear !== "All Years" && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Price and Average Mark Analysis for {selectedYear}</h2>
          <div style={{ height: "300px", width: "100%", maxWidth: "2000px", marginRight: "auto", marginLeft: "-16px" }}>
            <Chart
              type="line"
              data={{
                labels: graphData.map((item) => getCleanedName(item.Name)),
                datasets: [
                  {
                    label: "Price",
                    data: graphData.map((item) => getPrice(item) || 0),
                    borderColor: "blue",
                    backgroundColor: "rgba(54, 162, 235, 0.1)",
                    fill: false,
                    pointRadius: pointRadii,
                    pointBackgroundColor: pointColorsPrice,
                    yAxisID: "y-price",
                  },
                  {
                    label: "Average Mark",
                    data: graphData.map((item) => parseFloat(item["Average Mark"]) || 0),
                    borderColor: "green",
                    backgroundColor: "rgba(0, 255, 0, 0.1)",
                    fill: false,
                    pointRadius: pointRadii,
                    pointBackgroundColor: pointColorsMark,
                    yAxisID: "y-mark",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                  legend: { position: "top" }, 
                  title: { display: true, text: `Price and Average Mark Analysis - ${selectedYear}` } 
                },
                scales: {
                  "y-price": {
                    type: "linear",
                    position: "left",
                    beginAtZero: true,
                    title: { display: true, text: "Price (USD)" },
                  },
                  "y-mark": {
                    type: "linear",
                    position: "right",
                    beginAtZero: true,
                    title: { display: true, text: "Average Mark" },
                    grid: { drawOnChartArea: false }, // Avoid overlapping grid lines
                  },
                },
                onClick: handleChartClick,
              }}
            />
          </div>
          {suggestedMemory.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
              <h3 className="text-lg font-bold mb-2 text-teal-600">
                Suggested Memory Modules (Best Value: Low Price, High Average Mark)
              </h3>
              <ul className="list-disc pl-5">
                {suggestedMemory.map((memory, index) => (
                  <li key={index}>
                    {getCleanedName(memory.Name)} - Price: ${getPrice(memory)?.toFixed(2)}, Average Mark: {memory["Average Mark"]}, Price/Mark: {calculatePricePerMark(memory)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {filteredMemory.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No memory data available</h3>
          <p className="mt-2 text-gray-500">No results found for "{searchTerm}" or selected filters.</p>
        </div>
      ) : (
        <table className="w-full table-auto text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-4 border">S.No</th>
              <th
                className="px-2 py-4 border cursor-pointer"
                onClick={() => handleSort("Name")}
              >
                Name {sortConfig.key === "Name" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer"
                onClick={() => handleSort("Memory Type")}
              >
                Memory Type {sortConfig.key === "Memory Type" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Capacity")}
              >
                Capacity {sortConfig.key === "Capacity" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Database Operations")}
              >
                DB Ops {sortConfig.key === "Database Operations" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Memory Read Cached")}
              >
                Read Cached {sortConfig.key === "Memory Read Cached" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Memory Read Uncached")}
              >
                Read Uncached {sortConfig.key === "Memory Read Uncached" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Memory Write")}
              >
                Write {sortConfig.key === "Memory Write" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Latency")}
              >
                Latency {sortConfig.key === "Latency" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Memory Threaded")}
              >
                Threaded {sortConfig.key === "Memory Threaded" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Average Mark")}
              >
                Average Mark {sortConfig.key === "Average Mark" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Launch Date")}
              >
                Launch Date {sortConfig.key === "Launch Date" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Last Price Change")}
              >
                Price {sortConfig.key === "Last Price Change" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMemory.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-100">
                <td className="px-2 py-2 border">{index + 1}</td>
                <td className="px-2 py-2 border">{getCleanedName(item.Name)}</td>
                <td className="px-2 py-2 border">{item["Memory Type"]}</td>
                <td className="px-2 py-2 border text-right">{getCapacity(item.Name)}</td>
                <td className="px-2 py-2 border text-right">{item["Database Operations"]}</td>
                <td className="px-2 py-2 border text-right">{item["Memory Read Cached"]}</td>
                <td className="px-2 py-2 border text-right">{item["Memory Read Uncached"]}</td>
                <td className="px-2 py-2 border text-right">{item["Memory Write"]}</td>
                <td className="px-2 py-2 border text-right">{item.Latency}</td>
                <td className="px-2 py-2 border text-right">{item["Memory Threaded"]}</td>
                <td className="px-2 py-2 border text-right">{item["Average Mark"]}</td>
                <td className="px-2 py-2 border text-right">{item["Launch Date"]}</td>
                <td className="px-2 py-2 border text-right">
                  {getPrice(item) ? `$${getPrice(item).toFixed(2)}` : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Memory;