import React, { useEffect, useState } from "react";
import { tablets } from "@/data/Tabs"; // Import using 'tablets'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import { SiSamsung, SiXiaomi } from "react-icons/si";

interface TabInfo {
  "S.No": string | number;
  Name: string;
  Price: string;
  "Image URL": string;
  "Buy Link": string;
  Specifications: string[];
}

interface DateTime {
  Date: string;
  Time: string;
}

type TabData = TabInfo | DateTime;

// Helper functions (adapted for tablets)
const formatPriceToIndian = (price: string | undefined): string => {
  if (!price || price === "N/A" || price === "") return "N/A";
  const numericPrice = price.replace(/[^0-9.]/g, "");
  const number = parseFloat(numericPrice);
  if (isNaN(number)) return "N/A";
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(number);
};

const getSNO = (tab: TabInfo): string => {
  return tab["S.No"] !== undefined ? String(tab["S.No"]) : "N/A";
};

const getName = (tab: TabInfo): string => {
  return tab.Name || "N/A";
};

const getBrand = (tab: TabInfo): string => {
  const name = getName(tab).toLowerCase();
  if (name.includes("apple") || name.includes("ipad")) return "Apple";
  if (name.includes("samsung") || name.includes("galaxy")) return "Samsung";
  if (name.includes("redmi")) return "Redmi";
  return "Other"; // Default for unrecognized brands
};

const getProcessor = (tab: TabInfo): string => {
  const spec = tab.Specifications.find((s) => s.startsWith("Processor:"));
  return spec ? spec.replace("Processor: ", "").replace(/®|™/g, "").replace(/\s+/g, " ").trim() : "N/A";
};

const getDisplay = (tab: TabInfo): string => {
  const spec = tab.Specifications.find((s) => s.includes("cm") && s.includes("Display"));
  return spec || "N/A";
};

const getRAM = (tab: TabInfo): string => {
  const spec = tab.Specifications.find((s) => s.includes("RAM"));
  if (!spec) return "N/A";
  const match = spec.match(/(\d+\.?\d*\s*GB)\s*RAM/);
  return match ? match[1] : "N/A";
};

const getROM = (tab: TabInfo): string => {
  const spec = tab.Specifications.find((s) => s.includes("ROM"));
  if (!spec) return "N/A";
  const match = spec.match(/(\d+\s*GB)\s*ROM/);
  return match ? match[1] : "N/A";
};

const getCamera = (tab: TabInfo): string => {
  const spec = tab.Specifications.find((spec) => spec.includes("Primary Camera"));
  if (!spec) return "N/A";

  // First, check for the full format: "X MP Primary Camera | Y MP Front"
  const fullFormatMatch = spec.match(
    /(\d+(\.\d+)?\s*MP\s*Primary\s*Camera)\s*\|\s*(\d+(\.\d+)?\s*MP\s*Front)/
  );
  if (fullFormatMatch) {
    return `${fullFormatMatch[1]} | ${fullFormatMatch[3]}`;
  }

  // If the full format isn't found, check for "X MP Primary Camera" alone
  const primaryCameraMatch = spec.match(/(\d+(\.\d+)?\s*MP\s*Primary\s*Camera)/);
  if (primaryCameraMatch) {
    return `${primaryCameraMatch[1]} | N/A`;
  }

  return "N/A";
};

const getOperatingSystem = (tab: TabInfo): string => {
  const osKeywords = ["ipados", "android", "windows", "harmonyos", "ios"];
  let spec = tab.Specifications.find((s) => s.toLowerCase().startsWith("os:"));
  if (spec) {
    const osPart = spec.replace(/^OS:\s*/i, "").split("|")[0].trim();
    return osPart ? osPart.replace(/[^a-zA-Z0-9\s.]/g, "").trim() : "N/A";
  }
  spec = tab.Specifications.find((s) =>
    osKeywords.some((keyword) => s.toLowerCase().includes(keyword))
  );
  if (!spec) return "N/A";
  const osMatch = spec.match(/(iPadOS|Android|Windows|HarmonyOS|iOS)\s*[\d.]*/i);
  if (osMatch) {
    const osPart = spec
      .substring(
        osMatch.index!,
        spec.indexOf("|") !== -1 ? spec.indexOf("|") : undefined
      )
      .trim();
    return osPart ? osPart.replace(/[^a-zA-Z0-9\s.]/g, "").trim() : "N/A";
  }
  return "N/A";
};

const getPrice = (tab: TabInfo): string => {
  return formatPriceToIndian(tab.Price);
};

// Helper function to extract numeric value from RAM for sorting
const getRAMForSorting = (tab: TabInfo): number => {
  const ram = getRAM(tab);
  if (ram === "N/A") return 0;
  const match = ram.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
};

// Helper function to extract numeric value from ROM for sorting
const getROMForSorting = (tab: TabInfo): number => {
  const rom = getROM(tab);
  if (rom === "N/A") return 0;
  const match = rom.match(/(\d+)/);
  return match ? parseFloat(match[1]) : 0;
};

// Helper function to extract numeric value from Price for sorting
const getPriceForSorting = (tab: TabInfo): number => {
  const price = tab.Price;
  if (!price || price === "N/A" || price === "") return 0;
  const cleanedPrice = price.replace(/[^0-9.]/g, "");
  return parseFloat(cleanedPrice) || 0;
};

// Helper function to check if a tablet has a valid price
const hasValidPrice = (tab: TabInfo): boolean => {
  const price = tab.Price;
  if (!price || price === "N/A" || price === "") return false;
  const cleanedPrice = price.replace(/[^0-9.]/g, "");
  return !isNaN(parseFloat(cleanedPrice)) && parseFloat(cleanedPrice) > 0;
};

// Helper function to check if a Buy Link should be hidden
const hasValidBuyLink = (tab: TabInfo): boolean => {
  const buyLink = tab["Buy Link"];
  return !buyLink.startsWith("https://www.gadgets360.com");
};

// Helper function to check if a tablet should be hidden based on Windows, Tempered Glass, Screen Guard, or Chromebook
const shouldDisplayTablet = (tab: TabInfo): boolean => {
  const hasWindows = tab.Specifications.some((spec) =>
    spec.toLowerCase().includes("windows")
  );
  const hasTemperedGlass = tab.Specifications.some((spec) =>
    spec.toLowerCase().includes("tempered glass")
  );
  const hasScreenGuard = tab.Specifications.some((spec) =>
    spec.toLowerCase().includes("screen guard")
  );
  const hasChromeOS = tab.Specifications.some((spec) =>
    spec.toLowerCase().includes("chrome os")
  );
  const isChromebook =
    tab.Name.toLowerCase().includes("chromebook") || hasChromeOS;
  return (
    !hasWindows &&
    !hasTemperedGlass &&
    !hasScreenGuard &&
    !isChromebook
  );
};

// Helper function to check if a tablet has at least one detail
const hasAtLeastOneDetail = (tab: TabInfo): boolean => {
  const details = [
    getProcessor(tab),
    getDisplay(tab),
    getRAM(tab),
    getROM(tab),
    getCamera(tab),
    getOperatingSystem(tab),
  ];
  return details.some((detail) => detail !== "N/A");
};

const getLink = (tab: TabInfo): string => {
  return tab["Buy Link"] || "#";
};

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();
};

const isValidTabInfo = (item: TabData): item is TabInfo => {
  return (
    "Buy Link" in item &&
    "Name" in item &&
    "Price" in item &&
    "Specifications" in item &&
    typeof item.Name === "string" &&
    typeof item["Buy Link"] === "string" &&
    typeof item.Price === "string" &&
    Array.isArray(item.Specifications)
  );
};

// Improved duplicate removal function
const removeDuplicates = (tabs: TabInfo[]): TabInfo[] => {
  const seen = new Set<string>();
  return tabs.filter((tab) => {
    const identifier = [
      getName(tab).toLowerCase().trim(),
      getProcessor(tab).toLowerCase().trim(),
      getDisplay(tab).toLowerCase().trim(),
      getRAM(tab).toLowerCase().trim(),
      getROM(tab).toLowerCase().trim(),
      getCamera(tab).toLowerCase().trim(),
      getOperatingSystem(tab).toLowerCase().trim(),
    ].join("||");

    if (seen.has(identifier)) {
      return false;
    }
    seen.add(identifier);
    return true;
  });
};

const Tabs = () => {
  const [tabItems, setTabItems] = useState<TabInfo[]>([]);
  const [dateTime, setDateTime] = useState<DateTime>({ Date: "N/A", Time: "N/A" });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | "none";
  }>({
    key: "",
    direction: "none",
  });
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [brandCounts, setBrandCounts] = useState<{ [key: string]: number }>({
    Apple: 0,
    Samsung: 0,
    Redmi: 0,
    Other: 0,
  });
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const validTabs = tablets.filter(isValidTabInfo) as TabInfo[];

    const filteredTabs = validTabs.filter(
      (tab) =>
        hasValidPrice(tab) &&
        hasValidBuyLink(tab) &&
        shouldDisplayTablet(tab) &&
        hasAtLeastOneDetail(tab)
    );

    const uniqueTabs = removeDuplicates(filteredTabs);

    const dateTimeEntry = tablets.find(
      (item) => "Date" in item && "Time" in item
    ) as DateTime | undefined;

    if (dateTimeEntry) {
      setDateTime({ Date: dateTimeEntry.Date, Time: dateTimeEntry.Time });
    } else {
      setDateTime({ Date: "30-05-2025", Time: "09:49 AM" });
    }

    setTabItems(uniqueTabs);
    setLoading(false);
  }, []);

  const filteredTabsBeforeSort = tabItems.filter((item) => {
    const name = getName(item).toLowerCase();
    const processor = getProcessor(item);
    const normalizedProcessor = normalizeText(processor);
    const query = searchQuery.toLowerCase().trim();
    const brand = getBrand(item);
    let matchesSearch = false;

    const processorSearchMatch = query.match(/^processor\s*:\s*(.+)$/i);
    if (processorSearchMatch) {
      const processorQuery = normalizeText(processorSearchMatch[1]);
      matchesSearch = normalizedProcessor.includes(processorQuery);
    } else {
      const normalizedQuery = normalizeText(query);
      matchesSearch = name.includes(normalizedQuery) || processor.toLowerCase().includes(normalizedQuery);
    }

    const matchesBrand = selectedBrand === "ALL" || brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  useEffect(() => {
    const counts = filteredTabsBeforeSort.reduce(
      (acc: { [key: string]: number }, tab) => {
        const brand = getBrand(tab);
        acc[brand] = (acc[brand] || 0) + 1;
        return acc;
      },
      { Apple: 0, Samsung: 0, Redmi: 0, Other: 0 }
    );
    setBrandCounts(counts);
    setTotalCount(filteredTabsBeforeSort.length);
  }, [filteredTabsBeforeSort]);

  const filteredTabs = [...filteredTabsBeforeSort].sort((a, b) => {
    if (!sortConfig.key || sortConfig.direction === "none") return 0;
    if (sortConfig.key === "Price") {
      const valueA = getPriceForSorting(a);
      const valueB = getPriceForSorting(b);
      return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
    }
    if (sortConfig.key === "RAM") {
      const valueA = getRAMForSorting(a);
      const valueB = getRAMForSorting(b);
      return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
    }
    if (sortConfig.key === "ROM") {
      const valueA = getROMForSorting(a);
      const valueB = getROMForSorting(b);
      return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
    }
    return 0;
  });

  const handleSort = (key: string) => {
    if (key === "Price" || key === "RAM" || key === "ROM") {
      if (sortConfig.key !== key || sortConfig.direction === "none") {
        setSortConfig({ key, direction: "asc" });
      } else if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else {
        setSortConfig({ key: "", direction: "none" });
      }
    }
  };

  const handleBrandFilter = (brand: string) => {
    setSelectedBrand(brand);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  if (loading)
    return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="container mx-auto px-4 pt-0 pb-8 max-w-screen-2xl mt-0">
      {dateTime && (
        <p className="text-red-500 font-bold mb-2 text-right">
          Updated: {dateTime.Date} at {dateTime.Time}
        </p>
      )}
      <header className="mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
          <h1 className="text-3xl font-bold">Tablets List</h1>
          {/* Brand Filter Buttons Aligned to the Right */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              {/* Brand Count Table - Two Rows: Brands on Top, Counts Below */}
              <div className="flex justify-start">
                <table className="border-collapse">
                  <tbody>
                    {/* Row 1: Brand Names with Icons */}
                    <tr>
                      <td className="px-4 py-2 border">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faApple} className="w-5 h-5" />
                          <span>Apple</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 border">
                        <div className="flex items-center gap-2">
                          <SiSamsung style={{ fontSize: "20px", color: "#0604ac" }} />
                          <span>Samsung</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 border">
                        <div className="flex items-center gap-2">
                          <SiXiaomi style={{ fontSize: "20px", color: "#eb1604" }} />
                          <span>Redmi</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 border">
                        <div className="flex items-center gap-2">
                          <span>Other</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 border font-bold">
                        <div className="flex items-center gap-2">
                          <span>Total</span>
                        </div>
                      </td>
                    </tr>
                    {/* Row 2: Counts */}
                    <tr>
                      <td className="px-4 py-2 border text-center">{brandCounts.Apple}</td>
                      <td className="px-4 py-2 border text-center">{brandCounts.Samsung}</td>
                      <td className="px-4 py-2 border text-center">{brandCounts.Redmi}</td>
                      <td className="px-4 py-2 border text-center">{brandCounts.Other}</td>
                      <td className="px-4 py-2 border text-center font-bold">{totalCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBrandFilter("ALL")}
                className={`px-3 py-1 border rounded-md ${
                  selectedBrand === "ALL"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => handleBrandFilter("Apple")}
                className={`px-3 py-1 border rounded-md ${
                  selectedBrand === "Apple"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                Apple
              </button>
              <button
                onClick={() => handleBrandFilter("Samsung")}
                className={`px-3 py-1 border rounded-md ${
                  selectedBrand === "Samsung"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                Samsung
              </button>
              <button
                onClick={() => handleBrandFilter("Redmi")}
                className={`px-3 py-1 border rounded-md ${
                  selectedBrand === "Redmi"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                Redmi
              </button>
              <button
                onClick={() => handleBrandFilter("Other")}
                className={`px-3 py-1 border rounded-md ${
                  selectedBrand === "Other"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                Other
              </button>
            </div>
          </div>
        </div>
        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            placeholder="Search by Name or Processor (e.g., 'Processor: Apple M3' or 'iPad')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-lg p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleClearSearch();
            }}
            className="text-black hover:text-gray-800 flex items-center gap-1 ml-auto"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Clear
          </a>
        </div>
      </header>

      {filteredTabs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">
            {searchQuery
              ? `No tablets match your search for "${searchQuery}". Try searching for "Processor: Apple M3" or 'iPad'.`
              : `No tablets available.`}
          </h3>
        </div>
      ) : (
        <table className="w-full table-auto text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-4 border">S.No</th>
              <th className="px-2 py-4 border">Name</th>
              <th className="px-1 py-4 border">Processor</th>
              <th className="px-2 py-4 border">Display</th>
              <th
                className="px-2 py-4 border w-24 cursor-pointer"
                onClick={() => handleSort("RAM")}
              >
                RAM{" "}
                {sortConfig.key === "RAM" && sortConfig.direction !== "none" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th
                className="px-2 py-4 border w-24 cursor-pointer"
                onClick={() => handleSort("ROM")}
              >
                ROM{" "}
                {sortConfig.key === "ROM" && sortConfig.direction !== "none" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th className="px-2 py-4 border">Camera</th>
              <th className="px-2 py-4 border">Operating System</th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Price")}
              >
                Price{" "}
                {sortConfig.key === "Price" && sortConfig.direction !== "none" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th className="px-2 py-4 border">BUY</th>
            </tr>
          </thead>
          <tbody>
            {filteredTabs.map((item, index) => {
              const link = getLink(item);
              return (
                <tr key={index} className="border-b hover:bg-gray-100">
                  <td className="px-2 py-2 border">{getSNO(item)}</td>
                  <td className="px-2 py-2 border">{getName(item)}</td>
                  <td className="px-1 py-2 border">{getProcessor(item)}</td>
                  <td className="px-2 py-2 border">{getDisplay(item)}</td>
                  <td className="px-2 py-2 border w-24">{getRAM(item)}</td>
                  <td className="px-2 py-2 border w-24">{getROM(item)}</td>
                  <td className="px-2 py-2 border">{getCamera(item)}</td>
                  <td className="px-2 py-2 border">{getOperatingSystem(item)}</td>
                  <td className="px-2 py-2 border text-right">{getPrice(item)}</td>
                  <td className="px-2 py-2 border">
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      BUY
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Tabs;
