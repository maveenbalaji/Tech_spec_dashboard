import React, { useEffect, useState } from "react";
import { desktops as dellDesktops } from "@/data/Desktop/dellDesktop";
import { products as hpDesktops } from "@/data/Desktop/HPDesktop";
import { desktops as lenovoDesktops } from "@/data/Desktop/LenovoDesktop";
import { SiHp, SiDell, SiLenovo } from "react-icons/si";

interface DesktopInfo {
  "S.NO": string | number;
  Brand: string;
  productName?: string;
  Name?: string;
  partNumber?: string;
  mrp?: string;
  currentPrice?: string;
  Price?: string;
  discount?: string;
  rating?: string;
  Rating?: string;
  link: string;
  features?: string[];
  specifications?: {
    Processor?: string;
    "Processor :"?: string;
    "Operating System"?: string;
    "Operating System :"?: string;
    "Memory *"?: string;
    "Memory :"?: string;
    Storage?: string;
    "Storage :"?: string;
    "Video Card"?: string;
    "Graphic Card :"?: string;
    Display?: string;
    "Display :"?: string;
    [key: string]: string | undefined;
  };
  Specs?: {
    Processor?: string;
    "Operating System"?: string;
    Display?: string;
    RAM?: string;
    Storage?: string;
    "Graphics Card"?: string;
    Keyboard?: string;
    [key: string]: string | undefined;
  };
}

interface DateTime {
  Date: string;
  Time: string;
}

type DesktopData = DesktopInfo | DateTime;

// Helper functions (unchanged)
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

const getSNO = (desktop: DesktopInfo): string => {
  return desktop["S.NO"] !== undefined ? String(desktop["S.NO"]) : "N/A";
};

const getName = (desktop: DesktopInfo): string => {
  return desktop.Name || desktop.productName || "N/A";
};

const getProcessor = (desktop: DesktopInfo): string => {
  const processor = desktop.specifications?.Processor || desktop.specifications?.["Processor :"] || desktop.Specs?.Processor || "N/A";
  return processor
    .replace(/®|™/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const getRAM = (desktop: DesktopInfo): string => {
  return desktop.specifications?.["Memory *"] || desktop.specifications?.["Memory :"] || desktop.Specs?.RAM || "N/A";
};

const getStorage = (desktop: DesktopInfo): string => {
  return (
    desktop.specifications?.Storage || desktop.specifications?.["Storage :"] || desktop.Specs?.Storage || "N/A"
  );
};

const getGraphics = (desktop: DesktopInfo): string => {
  return desktop.specifications?.["Video Card"] || desktop.specifications?.["Graphic Card :"] || desktop.Specs?.["Graphics Card"] || desktop.Specs?.Display || desktop.specifications?.Display || desktop.specifications?.["Display :"] || "N/A";
};

const getOperatingSystem = (desktop: DesktopInfo): string => {
  return (
    desktop.specifications?.["Operating System"] || desktop.specifications?.["Operating System :"] || desktop.Specs?.["Operating System"] || "N/A"
  );
};

const getPrice = (desktop: DesktopInfo): string => {
  const price = desktop.currentPrice || desktop.mrp || desktop.Price || "N/A";
  return formatPriceToIndian(price);
};

const getPriceForSorting = (desktop: DesktopInfo): number => {
  const price = desktop.currentPrice || desktop.mrp || desktop.Price;
  if (!price || price === "N/A" || price === "") return 0;
  const cleanedPrice = price.replace(/[^0-9.]/g, "");
  return parseFloat(cleanedPrice) || 0;
};

const getLink = (desktop: DesktopInfo): string => {
  return desktop.link || "#";
};

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();
};

const isValidDesktopInfo = (item: DesktopData): item is DesktopInfo => {
  return (
    "link" in item &&
    ("productName" in item || "Name" in item) &&
    ("currentPrice" in item || "mrp" in item || "Price" in item) &&
    ("specifications" in item || "Specs" in item) &&
    (typeof item.productName === "string" || typeof item.Name === "string") &&
    typeof item.link === "string" &&
    (typeof item.currentPrice === "string" || typeof item.mrp === "string" || typeof item.Price === "string") &&
    (typeof item.specifications === "object" || typeof item.Specs === "object") &&
    (item.specifications !== null || item.Specs !== null)
  );
};

const Desktops = () => {
  const [desktopItems, setDesktopItems] = useState<DesktopInfo[]>([]);
  const [dateTime, setDateTime] = useState<DateTime>({ Date: "N/A", Time: "N/A" });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | "none" }>({
    key: "",
    direction: "none",
  });
  const [currentPage, setCurrentPage] = useState<string>("ALL");
  const [dellCount, setDellCount] = useState<number>(0);
  const [hpCount, setHpCount] = useState<number>(0);
  const [lenovoCount, setLenovoCount] = useState<number>(0);
  const [intelProcessorCounts, setIntelProcessorCounts] = useState<{
    [processor: string]: { hp: number; dell: number; lenovo: number };
  }>({});

  const intelProcessors = [
    "Intel Core Ultra 5",
    "Intel Core Ultra 7",
    "Intel Core Ultra 9",
  ];

  const pages = [
    { name: "ALL" },
    { name: "HP" },
    { name: "Lenovo" },
    { name: "Dell" },
  ];

  useEffect(() => {
    const validDellDesktops = dellDesktops.filter(isValidDesktopInfo) as DesktopInfo[];
    const validHpDesktops = hpDesktops.filter(isValidDesktopInfo) as DesktopInfo[];
    const validLenovoDesktops = lenovoDesktops.filter(isValidDesktopInfo) as DesktopInfo[];

    const dateTimeEntry = hpDesktops.find((item) => "Date" in item && "Time" in item) as DateTime | undefined;
    if (dateTimeEntry) {
      setDateTime({ Date: dateTimeEntry.Date, Time: dateTimeEntry.Time });
    }

    const allDesktops = [...validHpDesktops, ...validDellDesktops, ...validLenovoDesktops];

    const intelCounts: { [processor: string]: { hp: number; dell: number; lenovo: number } } = {};
    intelProcessors.forEach((processor) => {
      intelCounts[processor] = { hp: 0, dell: 0, lenovo: 0 };
    });

    const hpItems: DesktopInfo[] = [];
    const dellItems: DesktopInfo[] = [];
    const lenovoItems: DesktopInfo[] = [];

    allDesktops.forEach((desktop) => {
      const processor = getProcessor(desktop);
      const normalizedProcessor = normalizeText(processor);
      const matchedIntelProcessor = intelProcessors.find((p) =>
        normalizedProcessor.includes(normalizeText(p).replace(/\s+/g, " "))
      );

      if (desktop.Brand === "HP") {
        hpItems.push(desktop);
        if (matchedIntelProcessor) {
          intelCounts[matchedIntelProcessor].hp += 1;
        }
      } else if (desktop.Brand === "Dell") {
        dellItems.push(desktop);
        if (matchedIntelProcessor) {
          intelCounts[matchedIntelProcessor].dell += 1;
        }
      } else if (desktop.Brand === "Lenovo") {
        lenovoItems.push(desktop);
        if (matchedIntelProcessor) {
          intelCounts[matchedIntelProcessor].lenovo += 1;
        }
      }
    });

    setDesktopItems(allDesktops);
    setIntelProcessorCounts(intelCounts);
    setHpCount(hpItems.length);
    setDellCount(dellItems.length);
    setLenovoCount(lenovoItems.length);
    setLoading(false);
  }, []);

  const filteredDesktopsBeforeSort = desktopItems.filter((item) => {
    const name = getName(item).toLowerCase();
    const processor = getProcessor(item);
    const normalizedProcessor = normalizeText(processor);
    const query = searchQuery.toLowerCase().trim();
    const matchesBrand = currentPage === "ALL" || currentPage === item.Brand;

    let matchesSearch = false;
    const processorSearchMatch = query.match(/^processor\s*:\s*(.+)$/i);
    if (processorSearchMatch) {
      const processorQuery = normalizeText(processorSearchMatch[1]);
      matchesSearch = normalizedProcessor.includes(processorQuery);
    } else {
      const normalizedQuery = normalizeText(query);
      matchesSearch = name.includes(normalizedQuery) || processor.toLowerCase().includes(normalizedQuery);
    }

    return matchesSearch && matchesBrand;
  });

  useEffect(() => {
    const hpLaptops = filteredDesktopsBeforeSort.filter((item) => item.Brand === "HP").length;
    const lenovoLaptops = filteredDesktopsBeforeSort.filter((item) => item.Brand === "Lenovo").length;
    const dellLaptops = filteredDesktopsBeforeSort.filter((item) => item.Brand === "Dell").length;
    setHpCount(hpLaptops);
    setLenovoCount(lenovoLaptops);
    setDellCount(dellLaptops);
  }, [filteredDesktopsBeforeSort]);

  const filteredDesktops = [...filteredDesktopsBeforeSort].sort((a, b) => {
    if (!sortConfig.key || sortConfig.direction === "none") return 0;
    if (sortConfig.key === "Price") {
      const valueA = getPriceForSorting(a);
      const valueB = getPriceForSorting(b);
      return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
    }
    return 0;
  });

  const handleSort = (key: string) => {
    if (key === "Price") {
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
          <h1 className="text-3xl font-bold">Desktops List</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
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
                      <td className="px-2 py-2 border text-right">{hpCount + dellCount + lenovoCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-row gap-2">
              {pages.map((page) => (
                <button
                  key={page.name}
                  onClick={() => setCurrentPage(page.name)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === page.name
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {page.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            placeholder="Search by Name or Processor (e.g., 'Processor: Intel Core Ultra 7' or 'Alienware')"
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

      {filteredDesktops.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">
            {searchQuery
              ? `No desktops match your search for "${searchQuery}". Try searching for "Processor: Intel Core Ultra 7" or 'Alienware'.`
              : `No ${currentPage} desktops available.`}
          </h3>
        </div>
      ) : (
        <table className="w-full table-auto text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-4 border">S.NO</th>
              <th className="px-2 py-4 border">Name</th>
              <th className="px-2 py-4 border">Processor</th>
              <th className="px-2 py-4 border">RAM</th>
              <th className="px-2 py-4 border">Storage</th>
              <th className="px-2 py-4 border">Graphics</th>
              <th className="px-2 py-4 border">Operating System</th>
              <th
                className="px-2 py-4 border cursor-pointer text-right"
                onClick={() => handleSort("Price")}
              >
                Price {sortConfig.key === "Price" && sortConfig.direction !== "none" && (sortConfig.direction === "desc" ? "↓" : "↑")}
              </th>
              <th className="px-2 py-4 border">BUY</th>
            </tr>
          </thead>
          <tbody>
            {filteredDesktops.map((item, index) => {
              const link = getLink(item);
              return (
                <tr key={index} className="border-b hover:bg-gray-100">
                  <td className="px-2 py-2 border">{getSNO(item)}</td>
                  <td className="px-2 py-2 border">{getName(item)}</td>
                  <td className="px-2 py-2 border">{getProcessor(item)}</td>
                  <td className="px-2 py-2 border">{getRAM(item)}</td>
                  <td className="px-2 py-2 border">{getStorage(item)}</td>
                  <td className="px-2 py-2 border">{getGraphics(item)}</td>
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
export default Desktops;