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

# Base URLs
baseURL = "https://www.memorybenchmark.net/ram.php?ram="
memory_list_url = "https://www.memorybenchmark.net/ram_list.php"
memory_list_ddr4_url = "https://www.memorybenchmark.net/ram_list-ddr4.php"

# Number of CPUs for multiprocessing
numCPUs = os.cpu_count()

# Define the output file path
output_dir = r"C:\Users\Mavee\Downloads\api new"
tsFileName = os.path.join(output_dir, "memoryData.ts")

# Ensure the output directory exists
if not os.path.exists(output_dir):
    os.makedirs(output_dir)


# Function to fetch all memory names
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


# Function to fetch DDR4-specific memory names
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


# Function to parse launch date dynamically
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


# Function to extract memory name
def getMemoryName(soup, memoryDict):
    header = soup.find('div', {"class": "desc-header"})
    if header and hasattr(header, 'text'):
        memoryDict["Name"] = header.text.strip()
    else:
        memoryDict["Name"] = "Unknown"
        print(f"Warning: Could not find memory name for {memoryDict.get('Name', 'Unknown')}")
    return memoryDict["Name"]


# Function to extract memory description and determine type
def getMemoryDescription(soup, memoryDict):
    desc_div = soup.find('div', {"class": "desc-body"})
    if desc_div:
        desc_p = desc_div.find('p', class_='alt')
        if desc_p:
            em_tag = desc_p.find('em')
            if em_tag and hasattr(em_tag, 'text'):
                description = em_tag.text.strip()
                memoryDict["Description"] = description
                # Determine memory type (e.g., DDR5, DDR4) from description
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


# Function to extract benchmark scores
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
        # Map the exact keys from the table to the required fields
        memoryDict["Database Operations"] = benchmark_data.get("Database Operations", "N/A")
        memoryDict["Memory Read Cached"] = benchmark_data.get("Memory Read Cached", "N/A")
        memoryDict["Memory Read Uncached"] = benchmark_data.get("Memory Read Uncached", "N/A")
        memoryDict["Memory Write"] = benchmark_data.get("Memory Write", "N/A")
        memoryDict["Latency"] = benchmark_data.get("Latency", "N/A")
        memoryDict["Memory Threaded"] = benchmark_data.get("Memory Threaded", "N/A")
    else:
        print(f"Benchmark table not found for {memoryDict.get('Name', 'Unknown')}")
        memoryDict.update({
            "Database Operations": "N/A",
            "Memory Read Cached": "N/A",
            "Memory Read Uncached": "N/A",
            "Memory Write": "N/A",
            "Latency": "N/A",
            "Memory Threaded": "N/A"
        })

    # Extract Average Mark from the right-desc div
    right_desc = soup.find('div', class_='right-desc')
    if right_desc:
        mark_tag = right_desc.find('span', style=re.compile(r'font-size: 44px'))
        if mark_tag and hasattr(mark_tag, 'text'):
            memoryDict["Average Mark"] = mark_tag.text.strip()
        else:
            memoryDict["Average Mark"] = "N/A"
    else:
        memoryDict["Average Mark"] = "N/A"


# Function to extract launch date
def getLaunchDate(soup, memoryDict):
    info_div = soup.find('div', {"class": "desc-body"})
    if info_div:
        paragraphs = info_div.find_all('p')
        for p in paragraphs:
            if p and hasattr(p, 'text') and "Memory First Benchmarked:" in p.text:
                date_str = p.text.split(":")[1].strip()
                parsed_date = parse_launch_date(date_str)
                if parsed_date:
                    memoryDict["Launch Date"] = date_str
                else:
                    memoryDict["Launch Date"] = "N/A"
                return
    memoryDict["Launch Date"] = "N/A"


# Function to extract last price change
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


# Function to gather results using multiprocessing
def gatherResults(mems, queue, missing_mems):
    memoryList = []
    total_mems = len(mems)
    for i, mem in enumerate(mems, 1):
        retries = 3
        while retries > 0:
            try:
                time.sleep(random.uniform(0.5, 1.5))
                response = get(f'{baseURL}{mem.replace(" ", "+")}', headers=headers, timeout=15)
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
                getMemoryName(soup, memoryDict)
                getMemoryDescription(soup, memoryDict)
                getBenchmarkScores(soup, memoryDict)
                getLaunchDate(soup, memoryDict)
                getLastPriceChange(soup, memoryDict)

                # Skip RAM entries with invalid launch dates
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
    queue.put(memoryList)


# Function to manage multiprocessing
def multiProcess(mems):
    processes = []
    queue = Queue(numCPUs)
    missing_mems = []
    chunk_size = max(1, len(mems) // numCPUs)
    for i in range(0, len(mems), chunk_size):
        chunk = mems[i:i + chunk_size]
        p = Process(target=gatherResults, args=(chunk, queue, missing_mems))
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


# Function to export data to TypeScript (.ts) format
def exportToTs(memoryList):
    print(f"Generating '{tsFileName}'...")
    try:
        # Get current date and time
        current_time = datetime.now()
        date_str = current_time.strftime("%d-%m-%Y")
        time_str = current_time.strftime("%I:%M %p")
        
        # Convert the list to a DataFrame for sorting
        df = pd.DataFrame(memoryList)
        
        # Define the sorting function for pandas with full date support
        def parse_launch_date_pandas(date_str):
            try:
                if pd.isna(date_str) or date_str in ["N/A", "NA"]:
                    return pd.Timestamp('1900-01-01')
                if "Q" in date_str:
                    quarter, year = date_str.split("'")
                    year = int("20" + year.strip())
                    quarter = int(quarter[1])
                    month = (quarter * 3) - 2
                    return pd.Timestamp(year, month, 1)
                if "-" in date_str:
                    return pd.to_datetime(date_str, format='%Y-%m-%d')
                return pd.to_datetime(date_str, format='%B %Y')
            except Exception as e:
                print(f"Error parsing date '{date_str}': {e}")
                return pd.Timestamp('1900-01-01')
        
        # Apply the parsing function to the "Launch Date" column
        df['SortKey'] = df['Launch Date'].apply(parse_launch_date_pandas)
        
        # Sort the DataFrame by the SortKey in descending order (latest launch first)
        df_sorted = df.sort_values(by='SortKey', ascending=False)
        
        # Drop the temporary SortKey column
        df_sorted.drop(columns=['SortKey'], inplace=True)
        
        # Add serial number to each memory (overwrite if needed)
        df_sorted['S.No'] = range(1, len(df_sorted) + 1)
        
        # Convert the sorted DataFrame back to a list of dictionaries
        sorted_memoryList = df_sorted.to_dict(orient='records')
        
        # Create the DateTime object
        date_time_obj = {
            "Date": date_str,
            "Time": time_str
        }
        
        # Combine DateTime object with memory data
        final_data = [date_time_obj] + sorted_memoryList
        
        # TypeScript interface definitions
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
        
        # Save to TypeScript file
        with open(tsFileName, 'w') as tsFile:
            # Write the TypeScript interface definitions
            tsFile.write(ts_interface_definitions)
            
            # Write the JSON data
            json.dump(final_data, tsFile, indent=4)
        
        print("TypeScript file generated successfully")
    except Exception as e:
        print(f"Error writing to TypeScript file: {e}")


# Main function to scrape and process data
if __name__ == "__main__":
    start_time = time.time()
    print("Fetching all memory data from Memory Benchmark...")

    # Fetch memory names from both URLs
    memory_names_general = get_all_memory_names()
    memory_names_ddr4 = get_ddr4_memory_names()

    # Combine the lists and remove duplicates
    memory_names = list(set(memory_names_general + memory_names_ddr4))

    print(f"Found {len(memory_names)} unique memories to process")
    if not memory_names:
        print("Failed to get memory list")
        exit()

    # Process the combined memory list
    memoryList = multiProcess(memory_names)

    # Export to TypeScript format
    exportToTs(memoryList)

    print(f"Completed in {time.time() - start_time:.2f} seconds")
    print(f"Total memories processed: {len(memoryList)}")