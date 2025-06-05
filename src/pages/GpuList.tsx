import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
} from "chart.js";
import { gpus } from "@/data/gpus";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface GpuInfo {
  Rank: number;
  "GPU Name": string;
  Type: string;
  "PassMark Score": number | null;
  Architecture: string;
  "Release Date": string;
  "TDP (W)": string;
  Interface: string;
  Width: string;
  "Maximum RAM Amount": number | null;
  "Core Clock Speed": number | null;
  "Boost Clock Speed": number | null;
  "Launch Price (MSRP)": number | null;
  "Display Connectors": string;
}

interface DateTime {
  Date: string;
  Time: string;
  data: GpuInfo[];
}

type GpuData = DateTime | GpuInfo;

const getPrice = (gpu: GpuInfo) => gpu["Launch Price (MSRP)"] || null;
const calculatePricePerScore = (gpu: GpuInfo) => {
  const price = getPrice(gpu);
  if (!price || !gpu["PassMark Score"]) return "N/A";
  return (price / gpu["PassMark Score"]).toFixed(4);
};

function getLatestYear(uniqueYears: string[]) {
  return uniqueYears[0] || null;
}

const GpuList = () => {
  const [gpuItems, setGpuItems] = useState<GpuInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("All");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "",
    direction: "asc",
  });
  const [showPriceAnalysis, setShowPriceAnalysis] = useState(false);
  const [dateTime, setDateTime] = useState<DateTime | null>(null);
  const [hidePriceNA, setHidePriceNA] = useState(true);
  const [isHoveringHideArea, setIsHoveringHideArea] = useState(false);
  const [showHiddenYears, setShowHiddenYears] = useState(false);
  const [selectedGpu, setSelectedGpu] = useState<string | null>(null);
  const chartRef = useRef<ChartJS<"line">>(null);

  const getUniqueYears = useMemo(() => {
    const years = new Set(
      gpuItems
        .map((item) => item["Release Date"].split(" ")[2])
        .filter((year): year is string => !!year)
    );
    return Array.from(years).sort((a, b) => (b > a ? 1 : -1));
  }, [gpuItems]);

  const getUniqueTypes = useMemo(() => {
    const types = new Set(gpuItems.map((item) => item.Type));
    return ["All", ...Array.from(types).sort()];
  }, [gpuItems]);

  const mainYears = useMemo(() => {
    const latestYear = getLatestYear(getUniqueYears);
    return latestYear
      ? getUniqueYears.filter(
          (year) =>
            parseInt(year) >= 2020 && parseInt(year) <= parseInt(latestYear)
        )
      : [];
  }, [getUniqueYears]);
  const hiddenYears = useMemo(
    () => getUniqueYears.filter((year) => parseInt(year) < 2020),
    [getUniqueYears]
  );

  useEffect(() => {
    const dateTimeEntry = gpus.find(
      (item): item is DateTime =>
        "Date" in item && "Time" in item && "data" in item
    ) as DateTime | undefined;
    if (dateTimeEntry) {
      setDateTime(dateTimeEntry);
      setGpuItems(dateTimeEntry.data);
    } else {
      const gpuInfoItems = gpus.filter(
        (item): item is GpuInfo =>
          !("Date" in item && "Time" in item && "data" in item)
      );
      setGpuItems(gpuInfoItems);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedYear && getUniqueYears.length > 0) {
      const latestYear = getLatestYear(getUniqueYears);
      setSelectedYear(latestYear);
    }
  }, [getUniqueYears, selectedYear]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredGpus = useMemo(() => {
    let result = [...gpuItems];

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item["GPU Name"].toLowerCase().includes(searchLower) ||
          item.Type.toLowerCase().includes(searchLower)
      );
    }

    if (selectedYear && selectedYear !== "All Years") {
      result = result.filter((item) => item["Release Date"].includes(selectedYear));
    }

    if (selectedType !== "All") {
      result = result.filter((item) => item.Type === selectedType);
    }

    if (hidePriceNA) {
      result = result.filter((item) => getPrice(item) !== null);
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        let valueA = a[sortConfig.key as keyof GpuInfo];
        let valueB = b[sortConfig.key as keyof GpuInfo];

        if (sortConfig.key === "Price / PassMark Score") {
          const pricePerScoreA = calculatePricePerScore(a);
          const pricePerScoreB = calculatePricePerScore(b);
          if (pricePerScoreA === "N/A" && pricePerScoreB === "N/A") return 0;
          if (pricePerScoreA === "N/A") return 1;
          if (pricePerScoreB === "N/A") return -1;
          return sortConfig.direction === "asc"
            ? parseFloat(pricePerScoreA) - parseFloat(pricePerScoreB)
            : parseFloat(pricePerScoreB) - parseFloat(pricePerScoreA);
        }

        if (sortConfig.key === "Release Date") {
          const yearA = valueA.toString().split(" ")[2];
          const yearB = valueB.toString().split(" ")[2];
          return sortConfig.direction === "asc"
            ? yearA.localeCompare(yearB)
            : yearB.localeCompare(yearA);
        } else if (sortConfig.key === "Type") {
          return sortConfig.direction === "asc"
            ? valueA.toString().localeCompare(valueB.toString())
            : valueB.toString().localeCompare(valueA.toString());
        }

        valueA = typeof valueA === "number" ? valueA : parseFloat(valueA?.toString()) || 0;
        valueB = typeof valueB === "number" ? valueB : parseFloat(valueB?.toString()) || 0;

        return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
      });
    }

    return result.map((gpu, index) => ({
      ...gpu,
      displayRank: index + 1,
    }));
  }, [
    gpuItems,
    debouncedSearchTerm,
    selectedYear,
    selectedType,
    sortConfig,
    hidePriceNA,
  ]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const handleYearClick = (year: string) => {
    setSelectedYear(year === selectedYear ? getLatestYear(getUniqueYears) : year);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
  };

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedYear(getLatestYear(getUniqueYears));
    setSelectedType("All");
    setSortConfig({ key: "", direction: "asc" });
    setShowPriceAnalysis(false);
    setHidePriceNA(true);
    setSelectedGpu(null);
  };

  const handleHideClick = () => {
    setHidePriceNA(!hidePriceNA);
    setShowHiddenYears(!showHiddenYears);
  };

  const handleRevertHide = () => {
    setHidePriceNA(true);
    setShowHiddenYears(false);
  };

  const handleChartClick = (event: ChartEvent, chartElements: ActiveElement[]) => {
    const chart = chartRef.current;
    if (chart && chartElements.length > 0) {
      const clickedIndex = chartElements[0].index;
      const gpuName = filteredGpus[clickedIndex]["GPU Name"];
      setSelectedGpu(selectedGpu === gpuName ? null : gpuName);
    }
  };

  // Suggest best GPUs based on the largest difference between scaled PassMark Score and Launch Price
  const suggestedGpus = useMemo(() => {
    const validGpus = filteredGpus.filter(
      (gpu) => gpu["PassMark Score"] !== null && getPrice(gpu) !== null
    );
    if (validGpus.length === 0) return [];

    // Find min and max for scaling
    const prices = validGpus.map((gpu) => getPrice(gpu)!);
    const scores = validGpus.map((gpu) => gpu["PassMark Score"]!);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Scale the values to [0, 1] and calculate the difference
    const gpusWithDifference = validGpus.map((gpu) => {
      const price = getPrice(gpu)!;
      const score = gpu["PassMark Score"]!;
      const scaledPrice = (price - minPrice) / (maxPrice - minPrice || 1); // Avoid division by zero
      const scaledScore = (score - minScore) / (maxScore - minScore || 1);
      const difference = scaledScore - scaledPrice; // Higher score relative to price
      return { gpu, difference };
    });

    // Sort by difference (descending) to get GPUs with the largest gap
    gpusWithDifference.sort((a, b) => b.difference - a.difference);

    // Return top 3 GPUs
    return gpusWithDifference.slice(0, 3).map((item) => item.gpu);
  }, [filteredGpus]);

  // Create an array of colors for the points based on whether the GPU is in suggestedGpus
  const pointColorsPrice = filteredGpus.map((gpu) =>
    suggestedGpus.some((suggested) => suggested["GPU Name"] === gpu["GPU Name"])
      ? "red"
      : "green"
  );
  const pointColorsScore = filteredGpus.map((gpu) =>
    suggestedGpus.some((suggested) => suggested["GPU Name"] === gpu["GPU Name"])
      ? "red"
      : "blue"
  );

  // Create an array of radii for the points based on whether the GPU is in suggestedGpus
  const pointRadii = filteredGpus.map((gpu) =>
    suggestedGpus.some((suggested) => suggested["GPU Name"] === gpu["GPU Name"])
      ? 5
      : 2
  );

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
          <h1 className="text-3xl font-bold mb-2">GPUs List</h1>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex flex-wrap gap-2">
            {mainYears.map((year) => (
              <button
                key={year}
                onClick={() => handleYearClick(year)}
                className={`px-3 py-1 border rounded-md ${
                  selectedYear === year
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-black hover:bg-gray-300"
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
                  selectedYear === "All Years"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-black hover:bg-gray-300"
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
                {isHoveringHideArea && (
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
            {hidePriceNA && showHiddenYears && (
              <button
                onClick={handleRevertHide}
                className="px-3 py-1 border rounded-md bg-gray-200 text-black hover:bg-gray-300 ml-2"
              >
                Show Original
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search GPUs (e.g., GeForce RTX 5090)..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-lg p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedType}
          onChange={handleTypeChange}
          className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {getUniqueTypes.map((type) => (
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
          Price / PassMark Analysis
        </button>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleClearFilters();
          }}
          className="text-black hover:text-gray-800 flex items-center gap-1 ml-auto"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="inline-block"
          >
            <path
              d="M1 1L11 11M11 1L1 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Clear
        </a>
      </div>

      {showPriceAnalysis && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">
            Price and PassMark Score Analysis for{" "}
            {selectedYear === "All Years" ? "All Years" : selectedYear}
          </h2>
          <div style={{ height: "300px" }}>
            <Chart
              ref={chartRef}
              type="line"
              data={{
                labels: filteredGpus.map((item) => item["GPU Name"]),
                datasets: [
                  {
                    label: "Launch Price (MSRP)",
                    data: filteredGpus.map((item) => getPrice(item) || 0),
                    borderColor: "green",
                    backgroundColor: "rgba(0, 255, 0, 0.1)",
                    fill: false,
                    pointRadius: pointRadii,
                    pointBackgroundColor: pointColorsPrice,
                    yAxisID: "y-price",
                  },
                  {
                    label: "PassMark Score",
                    data: filteredGpus.map((item) => item["PassMark Score"] || 0),
                    borderColor: "blue",
                    backgroundColor: "rgba(54, 162, 235, 0.1)",
                    fill: false,
                    pointRadius: pointRadii,
                    pointBackgroundColor: pointColorsScore,
                    yAxisID: "y-score",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top" },
                  title: {
                    display: true,
                    text: `Price and PassMark Score Analysis - ${
                      selectedYear === "All Years" ? "All Years" : selectedYear
                    }`,
                  },
                },
                scales: {
                  "y-price": {
                    type: "linear",
                    position: "left",
                    title: { display: true, text: "Price (USD)" },
                    beginAtZero: true,
                  },
                  "y-score": {
                    type: "linear",
                    position: "right",
                    title: { display: true, text: "PassMark Score" },
                    beginAtZero: true,
                    grid: { drawOnChartArea: false },
                  },
                },
                onClick: handleChartClick,
              }}
            />
          </div>
          {suggestedGpus.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
              <h3 className="text-lg font-bold mb-2 text-teal-600">
                Suggested GPUs (Best Value: Low Lunch Price, High PassMark Score)
              </h3>
              <ul className="list-disc pl-5">
                {suggestedGpus.map((gpu, index) => (
                  <li key={index}>
                    {gpu["GPU Name"]} - Price: ${getPrice(gpu)?.toFixed(2)}, PassMark Score: {gpu["PassMark Score"]}, Price/Score: {calculatePricePerScore(gpu)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {filteredGpus.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">
            No GPU data available
          </h3>
          <p className="mt-2 text-gray-500">
            No results found for "{searchTerm}" or selected filters.
          </p>
        </div>
      ) : (
        <table className="w-full table-auto text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-4 border">Rank</th>
              <th className="px-2 py-4 border">GPU Name</th>
              <th className="px-2 py-4 border">Type</th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("PassMark Score")}
              >
                PassMark Score{" "}
                {sortConfig.key === "PassMark Score" &&
                  (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th className="px-2 py-4 border">Architecture</th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Release Date")}
              >
                Release Date{" "}
                {sortConfig.key === "Release Date" &&
                  (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th className="px-2 py-4 border">TDP (W)</th>
              <th className="px-2 py-4 border">Interface</th>
              <th className="px-2 py-4 border">Width</th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Maximum RAM Amount")}
              >
                Max RAM (GB){" "}
                {sortConfig.key === "Maximum RAM Amount" &&
                  (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Core Clock Speed")}
              >
                Core Clock (MHz){" "}
                {sortConfig.key === "Core Clock Speed" &&
                  (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Boost Clock Speed")}
              >
                Boost Clock (MHz){" "}
                {sortConfig.key === "Boost Clock Speed" &&
                  (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Launch Price (MSRP)")}
              >
                Price (MSRP){" "}
                {sortConfig.key === "Launch Price (MSRP)" &&
                  (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th className="px-2 py-4 border">Display Connectors</th>
              {showPriceAnalysis && (
                <th
                  className="px-2 py-4 border cursor-pointer text-right"
                  onClick={() => handleSort("Price / PassMark Score")}
                >
                  Price / Score{" "}
                  {sortConfig.key === "Price / PassMark Score" &&
                    (sortConfig.direction === "desc" ? "↓" : "↑")}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {selectedGpu
              ? filteredGpus
                  .filter((item) => item["GPU Name"] === selectedGpu)
                  .map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-100">
                      <td className="px-2 py-2 border">
                        {item.displayRank || item.Rank}
                      </td>
                      <td className="px-2 py-2 border">{item["GPU Name"]}</td>
                      <td className="px-2 py-2 border">{item.Type}</td>
                      <td className="px-2 py-2 border text-right">
                        {item["PassMark Score"] || "N/A"}
                      </td>
                      <td className="px-2 py-2 border">{item.Architecture}</td>
                      <td className="px-2 py-2 border text-right">
                        {item["Release Date"]}
                      </td>
                      <td className="px-2 py-2 border text-right">
                        {item["TDP (W)"]}
                      </td>
                      <td className="px-2 py-2 border">{item.Interface}</td>
                      <td className="px-2 py-2 border">{item.Width}</td>
                      <td className="px-2 py-2 border text-right">
                        {item["Maximum RAM Amount"] || "N/A"}
                      </td>
                      <td className="px-2 py-2 border text-right">
                        {item["Core Clock Speed"] || "N/A"}
                      </td>
                      <td className="px-2 py-2 border text-right">
                        {item["Boost Clock Speed"] || "N/A"}
                      </td>
                      <td className="px-2 py-2 border text-right">
                        {item["Launch Price (MSRP)"]
                          ? `$${item["Launch Price (MSRP)"].toFixed(2)}`
                          : "N/A"}
                      </td>
                      <td className="px-2 py-2 border">
                        {item["Display Connectors"]}
                      </td>
                      {showPriceAnalysis && (
                        <td className="px-2 py-2 border text-right">
                          {calculatePricePerScore(item)}
                        </td>
                      )}
                    </tr>
                  ))
              : filteredGpus.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-100">
                    <td className="px-2 py-2 border">
                      {item.displayRank || item.Rank}
                    </td>
                    <td className="px-2 py-2 border">{item["GPU Name"]}</td>
                    <td className="px-2 py-2 border">{item.Type}</td>
                    <td className="px-2 py-2 border text-right">
                      {item["PassMark Score"] || "N/A"}
                    </td>
                    <td className="px-2 py-2 border">{item.Architecture}</td>
                    <td className="px-2 py-2 border text-right">
                      {item["Release Date"]}
                    </td>
                    <td className="px-2 py-2 border text-right">
                      {item["TDP (W)"]}
                    </td>
                    <td className="px-2 py-2 border">{item.Interface}</td>
                    <td className="px-2 py-2 border">{item.Width}</td>
                    <td className="px-2 py-2 border text-right">
                      {item["Maximum RAM Amount"] || "N/A"}
                    </td>
                    <td className="px-2 py-2 border text-right">
                      {item["Core Clock Speed"] || "N/A"}
                    </td>
                    <td className="px-2 py-2 border text-right">
                      {item["Boost Clock Speed"] || "N/A"}
                    </td>
                    <td className="px-2 py-2 border text-right">
                      {item["Launch Price (MSRP)"]
                        ? `$${item["Launch Price (MSRP)"].toFixed(2)}`
                        : "N/A"}
                    </td>
                    <td className="px-2 py-2 border">
                      {item["Display Connectors"]}
                    </td>
                    {showPriceAnalysis && (
                      <td className="px-2 py-2 border text-right">
                        {calculatePricePerScore(item)}
                      </td>
                    )}
                  </tr>
                ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
export default GpuList;