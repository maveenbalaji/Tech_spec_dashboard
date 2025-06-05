import json
from requests import get
from bs4 import BeautifulSoup as bs
from multiprocessing import Process, Queue
import os
import time
from datetime import datetime
import random
import pandas as pd  # For sorting
import re

# Headers for HTTP requests
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0'
}

# Base URLs for Memory
baseURL_memory = "https://www.memorybenchmark.net/ram.php?ram="
memory_list_url = "https://www.memorybenchmark.net/ram_list.php"
memory_list_ddr4_url = "https://www.memorybenchmark.net/ram_list-ddr4.php"

# Base URLs for CPU
baseURL_cpu = "https://www.cpubenchmark.net/cpu.php?cpu="
cpu_list_url = "https://www.cpubenchmark.net/cpu_list.php"

# Number of CPUs for multiprocessing
numCPUs = os.cpu_count()

# Define the output directories and file paths
output_dir = r"C:\Users\Mavee\Downloads\intership\server-dashboard-collector-main\src\data"
tsFileName_memory = os.path.join(output_dir, "memoryData.ts")
tsFileName_cpu = os.path.join(output_dir, "cpuData_complete_sorted_by_launch.ts")

# Ensure the output directory exists
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# =========================== MEMORY FUNCTIONS ===========================

def get_all_memory_names():
    try:
        response = get(memory_list_url, headers=headers, timeout=15)
        soup = bs(response.text, 'html.parser')
        memory_table = soup.find('table', {'id': 'cputable'})
        if not memory_table:
            print("Could not find memory table")
            return []
        memory_rows = memory_table.find_all('tr')[1:]
        return [row.find('a').text.strip() for row in memory_rows if row.find('a')]
    except Exception as e:
        print(f"Error getting memory list: {e}")
        return []

def get_ddr4_memory_names():
    try:
        response = get(memory_list_ddr4_url, headers=headers, timeout=15)
        soup = bs(response.text, 'html.parser')
        memory_table = soup.find('table', {'id': 'cputable'})
        if not memory_table:
            print("Could not find DDR4 memory table")
            return []
        memory_rows = memory_table.find_all('tr')[1:]
        return [row.find('a').text.strip() for row in memory_rows if row.find('a')]
    except Exception as e:
        print(f"Error getting DDR4 memory list: {e}")
        return []

def parse_launch_date(date_str):
    try:
        if date_str in ["N/A", "NA"] or "PerformanceTest" in date_str:
            return None
        if "Q" in date_str:
            quarter, year = date_str.split("'")
            year = int("20" + year.strip())
            quarter = int(quarter[1])
            month = (quarter * 3) - 2
            return datetime(year, month, 1)
        if "-" in date_str:
            return datetime.strptime(date_str, '%Y-%m-%d')
        return datetime.strptime(date_str, '%B %Y')
    except Exception as e:
        print(f"Error parsing date '{date_str}': {e}")
        return None

def getMemoryName(soup, memoryDict):
    header = soup.find('div', {"class": "desc-header"})
    if header and hasattr(header, 'text'):
        memoryDict["Name"] = header.text.strip()
    else:
        memoryDict["Name"] = "Unknown"
        print(f"Warning: Could not find memory name for {memoryDict.get('Name', 'Unknown')}")
    return memoryDict["Name"]

def getMemoryDescription(soup, memoryDict):
    desc_div = soup.find('div', {"class": "desc-body"})
    if desc_div:
        desc_p = desc_div.find('p', class_='alt')
        if desc_p:
            em_tag = desc_p.find('em')
            if em_tag and hasattr(em_tag, 'text'):
                description = em_tag.text.strip()
                memoryDict["Description"] = description
                if "PC5" in description or "DDR5" in description:
                    memoryDict["Memory Type"] = "DDR5"
                elif "PC4" in description or "DDR4" in description:
                    memoryDict["Memory Type"] = "DDR4"
                elif "DDR3" in description:
                    memoryDict["Memory Type"] = "DDR3"
                else:
                    memoryDict["Memory Type"] = "Unknown"
            else:
                memoryDict["Description"] = "N/A"
                memoryDict["Memory Type"] = "Unknown"
        else:
            memoryDict["Description"] = "N/A"
            memoryDict["Memory Type"] = "Unknown"
    else:
        memoryDict["Description"] = "N/A"
        memoryDict["Memory Type"] = "Unknown"

def getBenchmarkScores(soup, memoryDict):
    table = soup.find('table', id='test-suite-results')
    if table:
        rows = table.find_all('tr')
        benchmark_data = {}
        for row in rows:
            cells = row.find_all(['th', 'td'])
            if len(cells) >= 2:
                key = cells[0].text.strip()
                value = cells[1].text.strip()
                benchmark_data[key] = value
        memoryDict["Database Operations"] = benchmark_data.get("Database Operations", "N/A")
        memoryDict["Memory Read Cached"] = benchmark_data.get("Memory Read Cached", "N/A")
        memoryDict["Memory Read Uncached"] = benchmark_data.get("Memory Read Uncached", "N/A")
        memoryDict["Memory Write"] = benchmark_data.get("Memory Write", "N/A")
        memoryDict["Latency"] = benchmark_data.get("Latency", "N/A")
        memoryDict["Memory Threaded"] = benchmark_data.get("Memory Threaded", "N/A")
        # Calculate Average Mark as a simple average of numeric benchmark scores
        scores = []
        for key in ["Database Operations", "Memory Read Cached", "Memory Read Uncached", 
                    "Memory Write", "Memory Threaded"]:
            value = benchmark_data.get(key, "N/A")
            if value != "N/A":
                try:
                    # Remove commas and convert to float
                    num = float(value.replace(",", "").split()[0])
                    scores.append(num)
                except (ValueError, IndexError):
                    continue
        memoryDict["Average Mark"] = str(int(sum(scores) / len(scores))) if scores else "N/A"
    else:
        print(f"Benchmark table not found for {memoryDict.get('Name', 'Unknown')}")
        memoryDict.update({
            "Database Operations": "N/A",
            "Memory Read Cached": "N/A",
            "Memory Read Uncached": "N/A",
            "Memory Write": "N/A",
            "Latency": "N/A",
            "Memory Threaded": "N/A",
            "Average Mark": "N/A"
        })

def getLaunchDate(soup, memoryDict):
    info_div = soup.find('div', {"class": "desc-body"})
    if info_div:
        paragraphs = info_div.find_all('p')
        for p in paragraphs:
            if p and hasattr(p, 'text') and "Memory First Benchmarked:" in p.text:
                date_str = p.text.split(":")[1].strip()
                parsed_date = parse_launch_date(date_str)
                if parsed_date:
                    # Format as YYYY-MM-DD to match the provided output
                    memoryDict["Launch Date"] = parsed_date.strftime('%Y-%m-%d')
                else:
                    memoryDict["Launch Date"] = "N/A"
                return
    memoryDict["Launch Date"] = "N/A"

def getLastPriceChange(soup, memoryDict):
    info_div = soup.find('div', {"class": "desc-body"})
    if info_div:
        paragraphs = info_div.find_all('p')
        for p in paragraphs:
            if p and hasattr(p, 'text') and "Last Price Change" in p.text:
                price_part = p.text.split(":")[1].strip()
                price_str = price_part.split("(")[0].strip()
                try:
                    price_num = float(price_str.replace("$", "").replace(" USD", ""))
                    memoryDict["Last Price Change"] = price_num
                except ValueError:
                    memoryDict["Last Price Change"] = None
                return
    memoryDict["Last Price Change"] = None

def gatherResults_memory(mems, queue, missing_mems):
    memoryList = []
    total_mems = len(mems)
    for i, mem in enumerate(mems, 1):
        retries = 3
        benchmark_table_missing = False
        memory_name_unknown = False
        while retries > 0:
            try:
                time.sleep(random.uniform(0.5, 1.5))
                response = get(f'{baseURL_memory}{mem.replace(" ", "+")}', headers=headers, timeout=15)
                if response.status_code == 404:
                    print(f"[{i}/{total_mems}] Error processing {mem}: {response.status_code}")
                    missing_mems.append(mem)
                    break
                if response.status_code != 200:
                    raise Exception(f"Failed to fetch {mem}: Status code {response.status_code}")
                soup = bs(response.content, "html.parser")
                if not soup:
                    raise Exception(f"Failed to parse HTML for {mem}")
                sup = soup.find_all('sup')
                for x in sup:
                    x.replaceWith('')
                memoryDict = {}
                memory_name = getMemoryName(soup, memoryDict)
                if memory_name == "Unknown":
                    memory_name_unknown = True
                    print(f"[{i}/{total_mems}] Skipping {mem}: Memory name is Unknown")
                    break
                getMemoryDescription(soup, memoryDict)
                getBenchmarkScores(soup, memoryDict)
                if memoryDict.get("Database Operations") == "N/A" and memoryDict.get("Average Mark") == "N/A":
                    benchmark_table_missing = True
                    print(f"[{i}/{total_mems}] Skipping {mem}: Benchmark table not found")
                    break
                getLaunchDate(soup, memoryDict)
                getLastPriceChange(soup, memoryDict)
                if memoryDict.get("Launch Date", "N/A") in ["N/A", "NA"]:
                    print(f"[{i}/{total_mems}] Skipping {mem}: Invalid launch date")
                    break
                memoryDict["S.No"] = i
                memoryList.append(memoryDict)
                print(f"[{i}/{total_mems}] Processed {mem}")
                break
            except Exception as e:
                print(f"[{i}/{total_mems}] Error processing {mem}: {e}")
                retries -= 1
                if retries == 0:
                    print(f"[{i}/{total_mems}] Skipping {mem}: Max retries exceeded")
                time.sleep(random.uniform(2, 5))
        if memory_name_unknown or benchmark_table_missing:
            continue
    queue.put(memoryList)

def multiProcess_memory(mems):
    processes = []
    queue = Queue(numCPUs)
    missing_mems = []
    chunk_size = max(1, len(mems) // numCPUs)
    for i in range(0, len(mems), chunk_size):
        chunk = mems[i:i + chunk_size]
        p = Process(target=gatherResults_memory, args=(chunk, queue, missing_mems))
        processes.append(p)
        p.start()
    results = []
    for _ in range(len(processes)):
        result = queue.get()
        if result:
            results.extend(result)
    for p in processes:
        p.join()
    if missing_mems:
        print(f"Missing Memories: {missing_mems}")
    return results

def exportToTs_memory(memoryList):
    print(f"Generating '{tsFileName_memory}'...")
    try:
        current_time = datetime.now()
        date_str = current_time.strftime("%d-%m-%Y")
        time_str = current_time.strftime("%I:%M %p")
        df = pd.DataFrame(memoryList)
        def parse_launch_date_pandas(date_str):
            try:
                if pd.isna(date_str) or date_str in ["N/A", "NA"]:
                    return pd.Timestamp('1900-01-01')
                return pd.to_datetime(date_str, format='%Y-%m-%d')
            except Exception as e:
                print(f"Error parsing date '{date_str}': {e}")
                return pd.Timestamp('1900-01-01')
        df['SortKey'] = df['Launch Date'].apply(parse_launch_date_pandas)
        df_sorted = df.sort_values(by='SortKey', ascending=False)
        df_sorted.drop(columns=['SortKey'], inplace=True)
        df_sorted['S.No'] = range(1, len(df_sorted) + 1)
        sorted_memoryList = df_sorted.to_dict(orient='records')
        date_time_obj = {
            "Date": date_str,
            "Time": time_str
        }
        final_data = [date_time_obj] + sorted_memoryList
        ts_interface_definitions = """export interface MemoryInfo {
    Name: string;
    Description: string;
    "Memory Type": string;
    "Database Operations": string; // KOps/Sec
    "Memory Read Cached": string; // MBytes/Sec
    "Memory Read Uncached": string; // MBytes/Sec
    "Memory Write": string; // MBytes/Sec
    Latency: string; // ns (lower is better)
    "Memory Threaded": string; // MBytes/Sec
    "Average Mark": string;
    "Launch Date": string;
    "Last Price Change": number | null; // NaN should be handled as null
    "S.No": number;
}
export interface DateTime {
    Date: string;
    Time: string;
}
export type MemoryData = MemoryInfo | DateTime;
// Export the memory data array
export const memoryData: MemoryData[] = 
"""
        with open(tsFileName_memory, 'w') as tsFile:
            tsFile.write(ts_interface_definitions)
            json.dump(final_data, tsFile, indent=4)
        print("TypeScript file for memory generated successfully")
    except Exception as e:
        print(f"Error writing to TypeScript file: {e}")

# =========================== CPU FUNCTIONS ===========================

def get_all_cpu_names():
    try:
        response = get(cpu_list_url, headers=headers, timeout=15)
        soup = bs(response.text, 'html.parser')
        cpu_table = soup.find('table', {'id': 'cputable'})
        if not cpu_table:
            print("Could not find CPU table")
            return []
        cpu_rows = cpu_table.find_all('tr')[1:]
        return [row.find('a').text.strip() for row in cpu_rows if row.find('a')]
    except Exception as e:
        print(f"Error getting CPU list: {e}")
        return []

def getCPUName(soup, cpuDict):
    header = soup.find('div', {"class": "desc-header"})
    name = header.text.strip() if header else cpuDict.get("Name", ["Unknown"])[-1]
    cpuDict["Name"] = name
    return 2 if "[Dual CPU]" in name else 4 if "[Quad CPU]" in name else 1

def getSingleThreadedScore(soup, cpuDict):
    right_desc = soup.find("div", {"class": "right-desc"})
    if not right_desc:
        cpuDict["Benchmark (Single core)"] = None
        return
    data = right_desc.text
    isNext = False
    for item in data.strip().split("\n"):
        if isNext:
            try:
                cpuDict["Benchmark (Single core)"] = int(item.strip())
            except ValueError:
                cpuDict["Benchmark (Single core)"] = None
            return
        if "Single Thread Rating" in item:
            isNext = True
    cpuDict["Benchmark (Single core)"] = None

def getChipType(soup, cpuDict):
    left_desc = soup.find("div", {"class": "left-desc-cpu"})
    if not left_desc:
        cpuDict["CPU Class"] = "N/A"
        return
    data = left_desc.text
    for item in data.strip().split("\n"):
        if item.split(":")[0] == "Class" and len(item.split(":")) > 1 and item.split(":")[1].strip():
            cpuDict["CPU Class"] = item.split(":")[1].strip()
            return
    cpuDict["CPU Class"] = "N/A"

def getSocketType(soup, cpuDict):
    left_desc = soup.find("div", {"class": "left-desc-cpu"})
    if not left_desc:
        cpuDict["Socket"] = "N/A"
        return
    data = left_desc.text
    for item in data.strip().split("\n"):
        if item.split(":")[0] == "Socket" and len(item.split(":")) > 1 and item.split(":")[1].strip():
            cpuDict["Socket"] = item.split(":")[1].strip()
            return
    cpuDict["Socket"] = "N/A"

def getTimeOfRelease(soup, cpuDict):
    alt_paragraphs = soup.find_all('p', {'class': 'alt'})
    for item in alt_paragraphs:
        if item and "CPU First Seen on Charts:" in item.text:
            cpuDict["Launched"] = item.text.split(":")[1].strip()
            return
    cpuDict["Launched"] = "N/A"

def getOverallScore(soup, cpuDict):
    right_desc = soup.find("div", {"class": "right-desc"})
    if not right_desc:
        cpuDict["Benchmark (Multi core)"] = None
        return
    data = right_desc.text
    isNext = False
    for item in data.strip().split("\n"):
        if isNext:
            try:
                cpuDict["Benchmark (Multi core)"] = int(item.split()[0].strip())
            except ValueError:
                cpuDict["Benchmark (Multi core)"] = None
            return
        if "Multithread Rating" in item:
            isNext = True
    cpuDict["Benchmark (Multi core)"] = None

def getTDP(data, numPhysicalCPUs):
    for item in data:
        if item and "Typical TDP" in item.text:
            try:
                tdp = int(round(float(item.text.split(":")[1].strip().split(" ")[0]))) * numPhysicalCPUs
                if tdp < 0:
                    tdp = "N/A"
                unit = item.text.split(":")[1].strip().split(" ")[1]
                return f"{tdp} {unit}"
            except:
                return "N/A"
    return "N/A"

def getCoresAndThreads(data, numPhysicalCPUs, cpuDict):
    if not data or not data.text:
        cpuDict["Cores"] = None
        cpuDict["Threads"] = None
        return
    threadsPresent = ("Threads" in data.text)
    if data.text.split(":")[0] == "Cores":
        coresAndThreads = data.text.replace(":", "").split(" ")
        cpuDict["Cores"] = int(coresAndThreads[1]) * numPhysicalCPUs
        cpuDict["Threads"] = int(coresAndThreads[3] if threadsPresent else coresAndThreads[1]) * numPhysicalCPUs
    else:
        try:
            coresAndThreads = data.text.split(":")[1].split(",")
            cores = coresAndThreads[0].strip().split(" ")
            threads = coresAndThreads[1].strip().split(" ")
            cpuDict["Cores"] = int(cores[0]) * numPhysicalCPUs
            cpuDict["Threads"] = int(threads[0]) * numPhysicalCPUs
        except:
            cpuDict["Cores"] = None
            cpuDict["Threads"] = None

def getClockspeedAndTurbo(data, cpuDict):
    if not data or not data.text:
        cpuDict["Clockspeed"] = "N/A"
        cpuDict["Turbo Speed"] = "N/A"
        return
    component = data.text.split(":")[0]
    if component in ["Clockspeed", "Turbo Speed"]:
        try:
            speed = data.text.split(":")[1].strip().split()[0]
            if "," in speed:
                speed = round(float(speed.replace(".", "").replace(",", ".")), 1)
            cpuDict[component] = f"{speed} GHz"
        except:
            cpuDict[component] = "N/A"
    else:
        try:
            pivot = data.text.find("Threads")
            pivot += data.text[pivot:].find(",") + 1
            base = data.text[pivot:].split(",")[0].strip()
            turbo = data.text[pivot:].split(",")[1].strip()
            baseComponents = base.split(" ")
            turboComponents = turbo.split(" ")
            baseSpeed = baseComponents[0]
            turboSpeed = turboComponents[0]
            if "," in baseSpeed:
                baseSpeed = round(float(baseSpeed.replace(".", "").replace(",", ".")), 1)
            if "," in turboSpeed:
                turboSpeed = round(float(turboSpeed.replace(".", "").replace(",", ".")), 1)
            cpuDict["Clockspeed"] = f"{baseSpeed} {baseComponents[1]}" if baseSpeed != 'NA' else "N/A"
            cpuDict["Turbo Speed"] = f"{turboSpeed} {turboComponents[1]}" if turboSpeed != 'NA' else "N/A"
        except:
            cpuDict["Clockspeed"] = "N/A"
            cpuDict["Turbo Speed"] = "N/A"

def getDetails(soup, numPhysicalCPUs, cpuDict):
    desc_body = soup.find('div', {'class': 'desc-body'})
    data = desc_body.find_all('p') if desc_body else []
    cpuDict["TDP"] = getTDP(data, numPhysicalCPUs)
    for item in data:
        if item and item.text:
            component = item.text.split(":")[0]
            if component in ["Cores", "Total Cores"]:
                getCoresAndThreads(item, numPhysicalCPUs, cpuDict)
            if component in ["Performance Cores", "Primary Cores", "Clockspeed", "Turbo Speed"]:
                getClockspeedAndTurbo(item, cpuDict)
    if "Turbo Speed" not in cpuDict:
        cpuDict["Turbo Speed"] = "N/A"
    if "Clockspeed" not in cpuDict:
        cpuDict["Clockspeed"] = "N/A"

def getLastPriceChange(soup, cpuDict):
    price_found = False
    paragraphs = soup.find_all('p')
    for item in paragraphs:
        text = item.text.strip()
        if "Last Price Change" in text:
            price_part = text.split(":")[1].strip()
            price_str = price_part.split("(")[0].strip()
            try:
                price_num = float(price_str.replace("$", "").replace(" USD", ""))
                cpuDict["Last Price Change"] = price_num
            except ValueError:
                cpuDict["Last Price Change"] = None
            price_found = True
            break
    if not price_found:
        cpuDict["Last Price Change"] = None

def rankCPUs(cpuList):
    cpuList.sort(key=lambda x: x["Benchmark (Multi core)"] if x["Benchmark (Multi core)"] is not None else 0, reverse=True)
    for i, cpu in enumerate(cpuList, 1):
        cpu["Overall Rank"] = i
    cpuList.sort(key=lambda x: x["Benchmark (Single core)"] if x["Benchmark (Single core)"] is not None else 0, reverse=True)
    for i, cpu in enumerate(cpuList, 1):
        cpu["Single Threaded Rank"] = i

def gatherResults_cpu(cpus, queue, missing_cpus):
    cpuList = []
    total_cpus = len(cpus)
    for i, cpu in enumerate(cpus, 1):
        retries = 3
        while retries > 0:
            try:
                time.sleep(random.uniform(0.5, 1.5))
                response = get(f'{baseURL_cpu}{cpu}', headers=headers, timeout=15)
                if response.status_code == 404:
                    print(f"[{i}/{total_cpus}] Error processing {cpu}: {response.status_code}")
                    missing_cpus.append(cpu)
                    break
                if response.status_code != 200:
                    raise Exception(f"Failed to fetch {cpu}: Status code {response.status_code}")
                soup = bs(response.content, "html.parser")
                if not soup:
                    raise Exception(f"Failed to parse HTML for {cpu}")
                sup = soup.find_all('sup')
                for x in sup:
                    x.replaceWith('')
                cpuDict = {}
                numPhysicalCPUs = getCPUName(soup, cpuDict)
                getChipType(soup, cpuDict)
                getSocketType(soup, cpuDict)
                getTimeOfRelease(soup, cpuDict)
                getOverallScore(soup, cpuDict)
                getSingleThreadedScore(soup, cpuDict)
                getDetails(soup, numPhysicalCPUs, cpuDict)
                getLastPriceChange(soup, cpuDict)
                cpuList.append(cpuDict)
                print(f"[{i}/{total_cpus}] Processed {cpu}")
                break
            except Exception as e:
                print(f"[{i}/{total_cpus}] Error processing {cpu}: {e}")
                retries -= 1
                if retries == 0:
                    cpuList.append({
                        "Name": cpu,
                        "CPU Class": "N/A",
                        "Socket": "N/A",
                        "Launched": "N/A",
                        "Benchmark (Multi core)": None,
                        "Benchmark (Single core)": None,
                        "Clockspeed": "N/A",
                        "Turbo Speed": "N/A",
                        "TDP": "N/A",
                        "Cores": None,
                        "Threads": None,
                        "Last Price Change": None,
                        "Overall Rank": "N/A",
                        "Single Threaded Rank": "N/A"
                    })
                time.sleep(random.uniform(2, 5))
    queue.put(cpuList)

def multiProcess_cpu(cpus):
    processes = []
    queue = Queue(numCPUs)
    missing_cpus = []
    chunk_size = max(1, len(cpus) // numCPUs)
    for i in range(0, len(cpus), chunk_size):
        chunk = cpus[i:i + chunk_size]
        p = Process(target=gatherResults_cpu, args=(chunk, queue, missing_cpus))
        processes.append(p)
        p.start()
    results = []
    for _ in range(len(processes)):
        result = queue.get()
        if result:
            results.extend(result)
    for p in processes:
        p.join()
    if missing_cpus:
        print(f"Missing CPUs: {missing_cpus}")
    rankCPUs(results)
    return results

def exportToTs_cpu(cpuList):
    print(f"Generating '{tsFileName_cpu}'...")
    try:
        current_time = datetime.now()
        date_str = current_time.strftime("%d-%m-%Y")
        time_str = current_time.strftime("%I:%M %p")
        df = pd.DataFrame(cpuList)
        def parse_launch_date_pandas(date_str):
            try:
                if pd.isna(date_str) or date_str in ["N/A", "NA"]:
                    return (0, 0)
                if "Q" in date_str:
                    quarter, year = date_str.split()
                    return int(year), int(quarter[1])
                parsed_date = datetime.strptime(date_str, '%B %Y')
                return (parsed_date.year, parsed_date.month)
            except Exception as e:
                print(f"Error parsing date '{date_str}': {e}")
                return (0, 0)
        df['SortKey'] = df['Launched'].apply(parse_launch_date_pandas)
        df_sorted = df.sort_values(by='SortKey', ascending=False)
        df_sorted.drop(columns=['SortKey'], inplace=True)
        df_sorted['S.No'] = range(1, len(df_sorted) + 1)
        sorted_cpuList = df_sorted.to_dict(orient='records')
        date_time_obj = {
            "Date": date_str,
            "Time": time_str
        }
        final_data = [date_time_obj] + sorted_cpuList
        with open(tsFileName_cpu, 'w') as tsFile:
            tsFile.write("export interface CpuInfo {\n")
            tsFile.write("  Name: string;\n")
            tsFile.write('  "CPU Class": string;\n')
            tsFile.write("  Socket: string;\n")
            tsFile.write("  Launched: string;\n")
            tsFile.write('  "Benchmark (Multi core)": number | null;\n')
            tsFile.write('  "Benchmark (Single core)": number | null;\n')
            tsFile.write("  TDP: string;\n")
            tsFile.write("  Cores: number | null;\n")
            tsFile.write("  Threads: number | null;\n")
            tsFile.write("  Clockspeed: string;\n")
            tsFile.write('  "Turbo Speed": string;\n')
            tsFile.write('  "Overall Rank": number;\n')
            tsFile.write('  "Single Threaded Rank": number;\n')
            tsFile.write('  "Last Price Change": number | null;\n')
            tsFile.write('  "S.No": number;\n')
            tsFile.write("}\n")
            tsFile.write("export interface DateTime {\n")
            tsFile.write("  Date: string;\n")
            tsFile.write("  Time: string;\n")
            tsFile.write("}\n")
            tsFile.write("export type CpuData = CpuInfo | DateTime;\n")
            tsFile.write("export const cpuData: CpuData[] = ")
            json.dump(final_data, tsFile, indent=4)
            tsFile.write(";")
        print("TypeScript file for CPU generated successfully")
    except Exception as e:
        print(f"Error writing to TypeScript file: {e}")

# =========================== MAIN FUNCTION ===========================

if __name__ == "__main__":
    start_time = time.time()

    # Fetch and process memory data
    print("Fetching all memory data from Memory Benchmark...")
    memory_names_general = get_all_memory_names()
    memory_names_ddr4 = get_ddr4_memory_names()
    memory_names = list(set(memory_names_general + memory_names_ddr4))
    print(f"Found {len(memory_names)} unique memories to process")
    if not memory_names:
        print("Failed to get memory list")
    else:
        memoryList = multiProcess_memory(memory_names)
        exportToTs_memory(memoryList)

    # Fetch and process CPU data
    print("Fetching all CPU data from CPU Benchmark...")
    cpu_names = get_all_cpu_names()
    print(f"Found {len(cpu_names)} CPUs to process")
    if not cpu_names:
        print("Failed to get CPU list")
    else:
        cpuList = multiProcess_cpu(cpu_names)
        exportToTs_cpu(cpuList)

    print(f"Completed in {time.time() - start_time:.2f} seconds")