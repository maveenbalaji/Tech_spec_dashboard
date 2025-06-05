import React, { useEffect, useState } from "react";
import { products as hpProducts } from "@/data/laptops/HP";
import { laptops as lenovoProducts } from "@/data/laptops/lenovo";
import { laptops as dellProducts } from "@/data/laptops/dell";
import { SiHp, SiDell, SiLenovo } from "react-icons/si";

interface LaptopInfo {
  "S.NO"?: string | number;
  Rating?: string;
  Reviews?: string;
  Name?: string;
  productName?: string;
  partNumber?: string;
  discount?: string;
  features?: string[];
  link: string;
  Description?: string;
  Specs?: {
    Processor?: string;
    "Operating System"?: string;
    RAM?: string;
    Storage?: string;
    Display?: string;
    Other?: string;
    Keyboard?: string;
  };
  specifications?: {
    "Processor :"?: string;
    "Operating System :"?: string;
    "Memory :"?: string;
    "Storage :"?: string;
    "Graphic Card :"?: string;
    "Display :"?: string;
    "Warranty :"?: string;
    "Weight :"?: string;
    Processor?: string;
    "Operating System"?: string;
    "Video Card"?: string;
    "Display"?: string;
    "Memory *"?: string;
    Storage?: string;
  };
  Price?: string;
  mrp?: string;
  currentPrice?: string;
  PriceValue?: number;
  "Launch Date"?: string;
  Brand?: string;
}

interface DateTime {
  Date: string;
  Time: string;
}

type LaptopData = LaptopInfo | DateTime;

// Helper function to format price to Indian number format (e.g., ₹2,26,991)
const formatPriceToIndian = (price: string | undefined): string => {
  if (!price || price === "N/A") return "N/A";
  // Remove any non-numeric characters except decimal point
  const numericPrice = price.replace(/[^0-9.]/g, "");
  const number = parseFloat(numericPrice);
  if (isNaN(number)) return "N/A";

  // Convert to Indian number format
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(number);
};

// Helper function to split Display into Display and Graphics
const splitDisplayAndGraphics = (display: string | undefined): { displayOnly: string; graphics: string } => {
  if (!display) {
    return { displayOnly: "N/A", graphics: "N/A" };
  }
  const regex = / with /gi;
  const matches = display.match(regex);
  if (matches) {
    const lastMatchIndex = display.lastIndexOf(matches[matches.length - 1]);
    const displayPart = display.substring(0, lastMatchIndex).trim();
    const graphicsPart = display.substring(lastMatchIndex + 6).trim();
    return {
      displayOnly: displayPart || "N/A",
      graphics: graphicsPart || "N/A",
    };
  }
  return {
    displayOnly: display,
    graphics: "N/A",
  };
};

// Helper function to get S.NO
const getSNO = (laptop: LaptopInfo): string => {
  return laptop["S.NO"] !== undefined ? String(laptop["S.NO"]) : "N/A";
};

// Helper function to get Name
const getName = (laptop: LaptopInfo): string => {
  return laptop.Name || laptop.productName || "N/A";
};

// Helper function to get Processor
const getProcessor = (laptop: LaptopInfo): string => {
  let processor = "N/A";
  if (laptop.Brand === "HP") {
    processor = laptop.Specs?.Processor || "N/A";
    processor = processor.replace(/processor/gi, "").trim();
  } else {
    processor =
      laptop.Specs?.Processor ||
      laptop.specifications?.["Processor :"] ||
      laptop.specifications?.Processor ||
      "N/A";
  }
  return processor
    .replace(/®|™/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Helper function to get RAM
const getRAM = (laptop: LaptopInfo): string => {
  if (laptop.Brand === "HP") {
    if (!laptop.Specs) return "N/A";
    if (laptop.Name === "HP Victus 39.6 cm (15.6) Gaming Laptop 15-fb3004AX, Blue") {
      return "upgradeable ram";
    }
    if (laptop.Specs.RAM) {
      const ramLower = laptop.Specs.RAM.toLowerCase();
      const upgradeableRamIndex = ramLower.indexOf("upgradeable ram");
      if (upgradeableRamIndex !== -1) {
        return laptop.Specs.RAM.substring(0, upgradeableRamIndex + "upgradeable ram".length);
      }
      const upgradeableM2Index = ramLower.indexOf("upgradeable m.2 slot and ram");
      if (upgradeableM2Index !== -1) {
        return laptop.Specs.RAM.substring(0, upgradeableM2Index + "upgradeable m.2 slot and ram".length);
      }
      return laptop.Specs.RAM;
    }
    if (laptop.Specs.Other && laptop.Specs.Other.toLowerCase().includes("ddr")) {
      return laptop.Specs.Other;
    }
    return "N/A";
  }

  let ram =
    laptop.Specs?.RAM ||
    laptop.specifications?.["Memory :"] ||
    laptop.specifications?.["Memory *"] ||
    "N/A";

  if (laptop.Brand === "Dell") {
    const ramMatch = ram.match(/(\d+\s*GB:\s*\d+\s*x\s*\d+\s*GB,\s*DDR[0-9]+)/i);
    if (ramMatch) {
      return ramMatch[0];
    }
  }

  return ram;
};

// Helper function to get Storage
const getStorage = (laptop: LaptopInfo): string => {
  return (
    laptop.Specs?.Storage || laptop.specifications?.["Storage :"] || laptop.specifications?.Storage || "N/A"
  );
};

// Helper function to get Graphics
const getGraphics = (laptop: LaptopInfo): string => {
  if (laptop.Brand === "HP") {
    if (!laptop.Specs) return "N/A";
    if (laptop.Specs.Other) {
      const otherLower = laptop.Specs.Other.toLowerCase();
      if (otherLower.includes("freedos") || otherLower.includes("ddr")) {
        const { graphics } = splitDisplayAndGraphics(laptop.Specs.Display);
        return graphics;
      }
      return laptop.Specs.Other;
    }
    const { graphics } = splitDisplayAndGraphics(laptop.Specs.Display);
    return graphics;
  }

  let graphics =
    laptop.Specs?.Other ||
    laptop.specifications?.["Graphic Card :"] ||
    laptop.specifications?.["Video Card"] ||
    "N/A";

  if (laptop.Brand === "Dell") {
    const amdRadeonMatch = graphics.match(/AMD Ryzen [0-9]+ [0-9]+ Processor with AMD Radeon [0-9]+M graphics/i);
    if (amdRadeonMatch) {
      const withIndex = graphics.toLowerCase().indexOf(" with ");
      if (withIndex !== -1) {
        return graphics.substring(withIndex + 6);
      }
    }

    const integratedIntelCommaMatch = graphics.match(/Integrated Intel graphics, Core Ultra [0-9]+ [0-9]+U vPRO Processor, 16GB LPDDR5x Memory/i);
    if (integratedIntelCommaMatch) {
      return "Integrated Intel graphics";
    }

    const irisXeOrUHDMatch = graphics.match(/Intel 13th Generation i[0-9]-[0-9]+U, Intel Integrated Iris Xe or UHD Graphics/i);
    if (irisXeOrUHDMatch) {
      return "Intel Integrated Iris Xe or UHD Graphics";
    }

    const integratedIntelMatch = graphics.match(/Integrated Intel graphics for Intel Core [0-9]+ [0-9]+U processor/i);
    if (integratedIntelMatch) {
      return "Integrated Intel graphics";
    }
  }

  return graphics;
};

// Helper function to get Display
const getDisplay = (laptop: LaptopInfo): string => {
  if (laptop.Brand === "HP") {
    if (!laptop.Specs || !laptop.Specs.Display) return "N/A";
    const { displayOnly } = splitDisplayAndGraphics(laptop.Specs.Display);
    return displayOnly;
  }
  return laptop.Specs?.Display || laptop.specifications?.["Display :"] || laptop.specifications?.Display || "N/A";
};

// Helper function to get Operating System
const getOperatingSystem = (laptop: LaptopInfo): string => {
  if (laptop.Brand === "HP") {
    if (!laptop.Specs) return "N/A";
    if (laptop.Specs.Other && laptop.Specs.Other.toLowerCase().includes("freedos")) {
      return "freedos";
    }
    return laptop.Specs["Operating System"] || "N/A";
  }
  return (
    laptop.Specs?.["Operating System"] ||
    laptop.specifications?.["Operating System :"] ||
    laptop.specifications?.["Operating System"] ||
    "N/A"
  );
};

// Helper function to get Price (Updated to use Indian number format for all brands)
const getPrice = (laptop: LaptopInfo): string => {
  const price = laptop.Price || laptop.currentPrice || laptop.mrp || "N/A";
  return formatPriceToIndian(price);
};

// Helper function to parse Price for sorting
const getPriceForSorting = (laptop: LaptopInfo): number => {
  const price = laptop.Price || laptop.currentPrice || laptop.mrp;
  if (!price || price === "N/A") return 0;
  const cleanedPrice = price.replace(/[^0-9.]/g, "");
  return parseFloat(cleanedPrice) || 0;
};

// Helper function to get Link
const getLink = (laptop: LaptopInfo): string => {
  return laptop.link || "#";
};

// Helper function to normalize text for search and matching
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();
};

// Helper function to validate a LaptopInfo entry
const isValidLaptopInfo = (item: LaptopData): item is LaptopInfo => {
  return (
    "link" in item &&
    (item.Name || item.productName) &&
    ("Price" in item || "currentPrice" in item || "mrp" in item) &&
    ("Specs" in item || "specifications" in item) &&
    typeof (item.Name || item.productName) === "string" &&
    typeof item.link === "string" &&
    (typeof item.Price === "string" || typeof item.currentPrice === "string" || typeof item.mrp === "string") &&
    (item.Specs !== null || item.specifications !== null) &&
    (typeof item.Specs === "object" || typeof item.specifications === "object")
  );
};

const Laptops = () => {
  const [laptopItems, setLaptopItems] = useState<LaptopInfo[]>([]);
  const [dateTime, setDateTime] = useState<DateTime | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [brandFilter, setBrandFilter] = useState<string>("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | "none" }>({
    key: "",
    direction: "none",
  });

  const [hpCount, setHpCount] = useState<number>(0);
  const [lenovoCount, setLenovoCount] = useState<number>(0);
  const [dellCount, setDellCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [intelProcessorCounts, setIntelProcessorCounts] = useState<{
    [processor: string]: { hp: number; lenovo: number; dell: number };
  }>({});

  const [amdProcessorCounts, setAmdProcessorCounts] = useState<{
    [processor: string]: { hp: number; lenovo: number; dell: number };
  }>({});

  const intelProcessors = [
    "Intel Core Ultra 5",
    "Intel Core Ultra 7",
    "Intel Core Ultra 9",
  ];

  const amdProcessors = [
    "AMD Ryzen AI 5",
    "AMD Ryzen AI 7",
    "AMD Ryzen AI 9",
  ];

  const allProcessors = [...intelProcessors, ...amdProcessors];

  useEffect(() => {
    // Extract date and time from hpProducts
    const dateTimeFromHP = hpProducts[0] as DateTime;
    if (dateTimeFromHP && "Date" in dateTimeFromHP && "Time" in dateTimeFromHP) {
      setDateTime({
        Date: dateTimeFromHP.Date, // "11-05-2025"
        Time: dateTimeFromHP.Time, // "05:54 PM"
      });
    } else {
      // Fallback in case the data isn't available
      setDateTime({ Date: "N/A", Time: "N/A" });
    }

    // Filter out Lenovo laptops with empty specifications
    const combinedProducts = [...hpProducts, ...lenovoProducts, ...dellProducts].filter((item) => {
      if (!isValidLaptopInfo(item)) return false;
      // For Lenovo, exclude items with empty specifications object
      if (item.Brand === "Lenovo" && item.specifications) {
        const specs = item.specifications;
        // Check if specifications object is empty (no key-value pairs)
        return Object.keys(specs).length > 0;
      }
      return true;
    }) as LaptopInfo[];

    setLaptopItems(combinedProducts);

    const intelCounts: { [processor: string]: { hp: number; lenovo: number; dell: number } } = {};
    intelProcessors.forEach((processor) => {
      intelCounts[processor] = {
        hp: 0,
        lenovo: 0,
        dell: 0,
      };
    });

    const amdCounts: { [processor: string]: { hp: number; lenovo: number; dell: number } } = {};
    amdProcessors.forEach((processor) => {
      amdCounts[processor] = {
        hp: 0,
        lenovo: 0,
        dell: 0,
      };
    });

    combinedProducts.forEach((laptop) => {
      const processor = getProcessor(laptop);
      const normalizedProcessor = normalizeText(processor);

      const matchedIntelProcessor = intelProcessors.find((p) =>
        normalizedProcessor.includes(normalizeText(p).replace(/\s+/g, " "))
      );
      if (matchedIntelProcessor) {
        if (laptop.Brand === "HP") {
          intelCounts[matchedIntelProcessor].hp += 1;
        } else if (laptop.Brand === "Lenovo") {
          intelCounts[matchedIntelProcessor].lenovo += 1;
        } else if (laptop.Brand === "Dell") {
          intelCounts[matchedIntelProcessor].dell += 1;
        }
      }

      const matchedAmdProcessor = amdProcessors.find((p) =>
        normalizedProcessor.includes(normalizeText(p).replace(/\s+/g, " "))
      );
      if (matchedAmdProcessor) {
        if (laptop.Brand === "HP") {
          amdCounts[matchedAmdProcessor].hp += 1;
        } else if (laptop.Brand === "Lenovo") {
          amdCounts[matchedAmdProcessor].lenovo += 1;
        } else if (laptop.Brand === "Dell") {
          amdCounts[matchedAmdProcessor].dell += 1;
        }
      }
    });

    setIntelProcessorCounts(intelCounts);
    setAmdProcessorCounts(amdCounts);
    setLoading(false);
  }, []);

  const filteredLaptopsBeforeSort = laptopItems.filter((item) => {
    const name = getName(item).toLowerCase();
    const processor = getProcessor(item);
    const normalizedProcessor = normalizeText(processor);
    const query = searchQuery.toLowerCase().trim();

    let matchesSearch = false;

    const processorSearchMatch = query.match(/^processor\s*:\s*(.+)$/i);
    if (processorSearchMatch) {
      const processorQuery = normalizeText(processorSearchMatch[1]);
      matchesSearch = normalizedProcessor.includes(processorQuery);
    } else {
      const normalizedQuery = normalizeText(query);
      matchesSearch = name.includes(normalizedQuery) || processor.toLowerCase().includes(normalizedQuery);
    }

    const matchesBrand =
      brandFilter === "ALL" ||
      (brandFilter === "HP" && item.Brand === "HP") ||
      (brandFilter === "Lenovo" && item.Brand === "Lenovo") ||
      (brandFilter === "Dell" && item.Brand === "Dell");
    return matchesSearch && matchesBrand;
  });

  useEffect(() => {
    const hpLaptops = filteredLaptopsBeforeSort.filter((item) => item.Brand === "HP").length;
    const lenovoLaptops = filteredLaptopsBeforeSort.filter((item) => item.Brand === "Lenovo").length;
    const dellLaptops = filteredLaptopsBeforeSort.filter((item) => item.Brand === "Dell").length;
    setHpCount(hpLaptops);
    setLenovoCount(lenovoLaptops);
    setDellCount(dellLaptops);
    setTotalCount(hpLaptops + lenovoLaptops + dellLaptops);
  }, [filteredLaptopsBeforeSort]);

  const filteredLaptops = [...filteredLaptopsBeforeSort].sort((a, b) => {
    if (!sortConfig.key || sortConfig.direction === "none") return 0;

    if (sortConfig.key === "price") {
      const valueA = getPriceForSorting(a);
      const valueB = getPriceForSorting(b);
      return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
    }

    return 0;
  });

  const handleSort = (key: string) => {
    if (key === "price") {
      if (sortConfig.key !== key || sortConfig.direction === "none") {
        setSortConfig({ key, direction: "asc" });
      } else if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else {
        setSortConfig({ key: "", direction: "none" });
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleProcessorClick = (processor: string) => {
    setSearchQuery(`Processor: ${processor}`);
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="container mx-auto px-4 pt-1 pb-8 max-w-screen-2xl">
      {dateTime && (
        <p className="text-red-500 font-bold mb-2 text-right">
          Updated: {dateTime.Date} at {dateTime.Time}
        </p>
      )}
      <header className="mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
          <h1 className="text-3xl font-bold">Laptops List</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="flex justify-start ml-4">
                <table className="w-full max-w-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-2 border">AMD Processor</th>
                      <th className="px-2 py-2 border text-right">HP</th>
                      <th className="px-2 py-2 border text-right">Lenovo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amdProcessors.map((processor, index) => (
                      <tr key={index} className="border-b">
                        <td
                          className="px-2 py-2 border cursor-pointer text-blue-500 hover:underline"
                          onClick={() => handleProcessorClick(processor)}
                        >
                          {processor}
                        </td>
                        <td className="px-2 py-2 border text-right">{amdProcessorCounts[processor]?.hp || 0}</td>
                        <td className="px-2 py-2 border text-right">{amdProcessorCounts[processor]?.lenovo || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-start">
                <table className="w-full max-w-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-2 border">Intel Processor</th>
                      <th className="px-2 py-2 border text-right">HP</th>
                      <th className="px-2 py-2 border text-right">Lenovo</th>
                      <th className="px-2 py-2 border text-right">Dell</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intelProcessors.map((processor, index) => (
                      <tr key={index} className="border-b">
                        <td
                          className="px-2 py-2 border cursor-pointer text-blue-500 hover:underline"
                          onClick={() => handleProcessorClick(processor)}
                        >
                          {processor}
                        </td>
                        <td className="px-2 py-2 border text-right">{intelProcessorCounts[processor]?.hp || 0}</td>
                        <td className="px-2 py-2 border text-right">{intelProcessorCounts[processor]?.lenovo || 0}</td>
                        <td className="px-2 py-2 border text-right">{intelProcessorCounts[processor]?.dell || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-start">
                <table className="w-full max-w-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-2 border">Brand</th>
                      <th className="px-2 py-2 border text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-2 py-2 border flex items-center gap-2">
                        <SiHp color="#0552f7" /> HP
                      </td>
                      <td className="px-2 py-2 border text-right">{hpCount}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-2 py-2 border flex items-center gap-2">
                        <SiLenovo color="#ee0808" /> Lenovo
                      </td>
                      <td className="px-2 py-2 border text-right">{lenovoCount}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-2 py-2 border flex items-center gap-2">
                        <SiDell color="#0131f8" /> Dell
                      </td>
                      <td className="px-2 py-2 border text-right">{dellCount}</td>
                    </tr>
                    <tr className="border-b font-bold">
                      <td className="px-2 py-2 border">Total</td>
                      <td className="px-2 py-2 border text-right">{totalCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setBrandFilter("ALL")}
                className={`px-3 py-1 border rounded-md ${
                  brandFilter === "ALL" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setBrandFilter("HP")}
                className={`px-3 py-1 border rounded-md ${
                  brandFilter === "HP" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                HP
              </button>
              <button
                onClick={() => setBrandFilter("Lenovo")}
                className={`px-3 py-1 border rounded-md ${
                  brandFilter === "Lenovo" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                Lenovo
              </button>
              <button
                onClick={() => setBrandFilter("Dell")}
                className={`px-3 py-1 border rounded-md ${
                  brandFilter === "Dell" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                Dell
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            placeholder="Search by Name or Processor (e.g., 'Processor: Intel Core Ultra 5' or 'ThinkPad')"
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

      {filteredLaptops.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">
            {searchQuery
              ? `No laptops match your search for "${searchQuery}". Try searching for "Processor: Intel Core Ultra 5" or 'ThinkPad".`
              : `No ${brandFilter === "ALL" ? "laptops" : brandFilter + " laptops"} available.`}
          </h3>
        </div>
      ) : (
        <>
          <table className="w-full table-auto text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-4 border">S.NO</th>
                <th className="px-2 py-4 border">Name</th>
                <th className="px-2 py-4 border">Processor</th>
                <th className="px-2 py-4 border">RAM</th>
                <th className="px-2 py-4 border">Storage</th>
                <th className="px-2 py-4 border">Graphics</th>
                <th className="px-2 py-4 border">Display</th>
                <th className="px-2 py-4 border">Operating System</th>
                <th
                  className="px-2 py-4 border cursor-pointer text-right"
                  onClick={() => handleSort("price")}
                >
                  Price {sortConfig.key === "price" && sortConfig.direction !== "none" && (sortConfig.direction === "desc" ? "↓" : "↑")}
                </th>
                <th className="px-2 py-4 border">BUY</th>
              </tr>
            </thead>
            <tbody>
              {filteredLaptops.map((item, index) => {
                const link = getLink(item);
                return (
                  <tr key={index} className="border-b hover:bg-gray-100">
                    <td className="px-2 py-2 border">{getSNO(item)}</td>
                    <td className="px-2 py-2 border">{getName(item)}</td>
                    <td className="px-2 py-2 border">{getProcessor(item)}</td>
                    <td className="px-2 py-2 border">{getRAM(item)}</td>
                    <td className="px-2 py-2 border">{getStorage(item)}</td>
                    <td className="px-2 py-4 border">{getGraphics(item)}</td>
                    <td className="px-2 py-4 border">{getDisplay(item)}</td>
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

          {brandFilter !== "ALL" && (
            <div className=" precautionary measure in case the user has a screen reader flex justify-center mt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setBrandFilter("HP")}
                  className={`px-3 py-1 border rounded-md ${
                    brandFilter === "HP" ? "bg-blue-500 text-white font-bold" : "bg-gray-200 text-black hover:bg-gray-300"
                  }`}
                >
                  Page 1
                </button>
                <button
                  onClick={() => setBrandFilter("Lenovo")}
                  className={`px-3 py-1 border rounded-md ${
                    brandFilter === "Lenovo" ? "bg-blue-500 text-white font-bold" : "bg-gray-200 text-black hover:bg-gray-300"
                  }`}
                >
                  Page 2
                </button>
                <button
                  onClick={() => setBrandFilter("Dell")}
                  className={`px-3 py-1 border rounded-md ${
                    brandFilter === "Dell" ? "bg-blue-500 text-white font-bold" : "bg-gray-200 text-black hover:bg-gray-300"
                  }`}
                >
                  Page 3
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Laptops;
// Note: Ensure that the data files (HP, Lenovo, Dell) are correctly structured and imported.