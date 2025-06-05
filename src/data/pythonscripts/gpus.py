import datetime
import requests
from bs4 import BeautifulSoup
import time

# Function to fetch the HTML content of a page
def fetch_page(url, retries=3, delay=1):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=headers, stream=True)
            if response.status_code == 200:
                return response.text
            else:
                print(f"Failed to retrieve the webpage. Status code: {response.status_code}")
        except requests.exceptions.ConnectionError as e:
            print(f"Connection error: {e}")
        except requests.exceptions.RequestException as e:
            print(f"Request exception: {e}")
        if attempt < retries - 1:
            print(f"Retrying in {delay} seconds...")
            time.sleep(delay)
    return None

# Function to extract the list of GPUs from the table
def extract_gpu_list(main_url):
    gpu_list = []
    page_number = 1

    while True:
        url = f"{main_url}?&pg={page_number}"
        html_content = fetch_page(url)
        if html_content:
            page_gpus = extract_gpu_list_from_page(html_content)
            if not page_gpus:
                break
            gpu_list.extend(page_gpus)
            page_number += 1
        else:
            break

    return gpu_list

# Helper function to extract GPUs from a single page
def extract_gpu_list_from_page(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    gpu_list = []

    # Find the table rows containing GPU data
    rows = soup.find_all('tr', id=lambda x: x and x.startswith("itemrow"))
    for row in rows:
        try:
            # Extract rank
            rank = row.find('td', class_='rating_list_position').get_text(strip=True)

            # Extract GPU name and URL
            gpu_link = row.find('a', href=True)
            gpu_name = gpu_link.get_text(strip=True)
            gpu_url = "https://technical.city" + gpu_link['href']

            # Extract type (desktop, workstation, etc.)
            gpu_type_tag = row.find('i', class_='icon-pc_2')
            gpu_type = gpu_type_tag['title'] if gpu_type_tag else "N/A"

            # Append the GPU details to the list
            gpu_list.append({
                "rank": rank,
                "name": gpu_name,
                "type": gpu_type,
                "url": gpu_url
            })
        except Exception as e:
            print(f"Error extracting GPU details: {e}")

    return gpu_list

# Function to parse detailed GPU information
def parse_gpu_details(html_content, rank, gpu_name, gpu_type):
    soup = BeautifulSoup(html_content, 'html.parser')

    # Initialize default values
    gpu_details = {
        "Rank": int(rank),
        "GPU Name": gpu_name,
        "Type": gpu_type,
        "PassMark Score": None,
        "Architecture": "N/A",
        "Release Date": "N/A",
        "TDP (W)": "N/A",
        "Interface": "N/A",
        "Width": "N/A",
        "Maximum RAM Amount": None,
        "Core Clock Speed": None,
        "Boost Clock Speed": None,
        "Launch Price (MSRP)": None,
        "Display Connectors": "N/A"  # New field for display connectors
    }

    # Extract PassMark Score
    passmark_section = soup.find('h4', string="Passmark")
    if passmark_section:
        passmark_score = passmark_section.find_next('div', class_='rating-block large')
        if passmark_score:
            score_element = passmark_score.find('em', class_='avarage')
            if score_element:
                try:
                    gpu_details["PassMark Score"] = int(score_element.get_text(strip=True).replace(',', ''))
                except ValueError:
                    gpu_details["PassMark Score"] = None

    # Extract Architecture
    architecture_tag = soup.find('td', string="Architecture")
    if architecture_tag:
        architecture_value = architecture_tag.find_next_sibling('td').get_text(strip=True)
        gpu_details["Architecture"] = architecture_value

    # Extract Release Date
    release_date_tag = soup.find('td', string="Release date")
    if release_date_tag:
        release_date_text = release_date_tag.find_next_sibling('td').get_text(strip=True)
        release_date_clean = release_date_text.split('(')[0].strip()
        gpu_details["Release Date"] = release_date_clean

    # Extract TDP (W)
    tdp_tag = soup.find('td', string="Power consumption (TDP)")
    if tdp_tag:
        tdp_value = tdp_tag.find_next_sibling('td').get_text(strip=True)
        gpu_details["TDP (W)"] = tdp_value

    # Extract Interface, Width, Core Clock Speed, Boost Clock Speed, and Maximum RAM Amount
    spec_tables = soup.find_all('table', class_='compare-table')
    for table in spec_tables:
        rows = table.find_all('tr')
        for row in rows:
            header = row.find('td')
            value = row.find_all('td')[1] if len(row.find_all('td')) > 1 else None

            if header and value:
                header_text = header.get_text(strip=True)
                value_text = value.get_text(strip=True)

                if "Interface" in header_text:
                    gpu_details["Interface"] = value_text
                elif "Width" in header_text:
                    # Handle width formatting
                    width_parts = value_text.split('(')
                    if len(width_parts) > 1:
                        width_clean = f"{width_parts[0].strip()} ({width_parts[1].strip()})"
                    else:
                        width_clean = value_text.strip()
                    gpu_details["Width"] = width_clean
                elif "Core clock speed" in header_text:
                    try:
                        core_clock_speed = value_text.replace(' MHz', '').strip()
                        gpu_details["Core Clock Speed"] = int(core_clock_speed) if core_clock_speed.isdigit() else None
                    except ValueError:
                        gpu_details["Core Clock Speed"] = None
                elif "Boost clock speed" in header_text:
                    try:
                        boost_clock_speed = value_text.replace(' MHz', '').strip()
                        gpu_details["Boost Clock Speed"] = int(boost_clock_speed) if boost_clock_speed.isdigit() else None
                    except ValueError:
                        gpu_details["Boost Clock Speed"] = None
                elif "Maximum RAM amount" in header_text:
                    try:
                        max_ram_amount = value_text.replace(' GB', '').strip()
                        gpu_details["Maximum RAM Amount"] = int(max_ram_amount) if max_ram_amount.isdigit() else None
                    except ValueError:
                        gpu_details["Maximum RAM Amount"] = None
                elif "Display Connectors" in header_text:  # Extract Display Connectors
                    gpu_details["Display Connectors"] = value_text

    # Extract Launch Price (MSRP)
    launch_price_tag = soup.find('td', string="Launch price (MSRP)")
    if launch_price_tag:
        launch_price_text = launch_price_tag.find_next_sibling('td').get_text(strip=True)
        try:
            launch_price_clean = launch_price_text.replace('$', '').replace(',', '').strip()
            gpu_details["Launch Price (MSRP)"] = int(launch_price_clean) if launch_price_clean.isdigit() else None
        except ValueError:
            gpu_details["Launch Price (MSRP)"] = None

    return gpu_details

# Function to save GPU details to a .ts file
def save_to_ts_file(gpu_details_list, filename='gpus.ts'):
    # Print the interface definitions before saving the data
    ts_content = "// Define the interface for a single GPU entry\n"
    ts_content += "interface GpuInfo {\n"
    ts_content += '  Rank: number;\n'
    ts_content += '  "GPU Name": string;\n'
    ts_content += '  Type: string;\n'
    ts_content += '  "PassMark Score": number | null;\n'
    ts_content += '  Architecture: string;\n'
    ts_content += '  "Release Date": string;\n'
    ts_content += '  "TDP (W)": string;\n'
    ts_content += '  Interface: string;\n'
    ts_content += '  Width: string;\n'
    ts_content += '  "Maximum RAM Amount": number | null;\n'
    ts_content += '  "Core Clock Speed": number | null;\n'
    ts_content += '  "Boost Clock Speed": number | null;\n'
    ts_content += '  "Launch Price (MSRP)": number | null;\n'
    ts_content += '  "Display Connectors": string;\n'  # Add Display Connectors to the interface
    ts_content += "}\n\n"

    ts_content += "// Define the interface for the date/time entry\n"
    ts_content += "interface DateTime {\n"
    ts_content += '  Date: string;\n'
    ts_content += '  Time: string;\n'
    ts_content += "}\n\n"

    ts_content += "// Union type for the overall data structure\n"
    ts_content += "type GpuData = (DateTime & { data: GpuInfo[] }) | GpuInfo;\n\n"

    ts_content += "// Export the GPU data as an array\n"
    ts_content += "export const gpus: GpuData[] = [\n"
    ts_content += f'  {{\n'
    ts_content += f'    "Date": "{datetime.datetime.now().strftime("%d-%m-%Y")}",\n'
    ts_content += f'    "Time": "{datetime.datetime.now().strftime("%I:%M %p")}",\n'
    ts_content += f'    "data": [\n'

    for gpu in gpu_details_list:
        ts_content += "      {\n"
        for key, value in gpu.items():
            if isinstance(value, str):
                # Escape double quotes in strings
                value = value.replace('"', '\\"')
                ts_content += f'        "{key}": "{value}",\n'
            elif value is None:
                # Replace Python's None with TypeScript's null
                ts_content += f'        "{key}": null,\n'
            else:
                # Handle numeric values
                ts_content += f'        "{key}": {value},\n'
        ts_content += "      },\n"

    # Remove the trailing comma and newline from the last GPU entry
    ts_content = ts_content[:-2] + "\n"
    ts_content += "    ],\n"  # Close the data array with ];
    ts_content += "  }\n"     # Close the outer object without a trailing semicolon
    ts_content += "];\n"      # Close the export array with ];

    with open(filename, 'w', encoding='utf-8') as ts_file:
        ts_file.write(ts_content)

    print(f"GPU details have been successfully saved to {filename}")

# Main execution
if __name__ == "__main__":
    # Step 1: Fetch the GPU list from all pages
    main_url = "https://technical.city/en/video/rating"
    gpu_list = extract_gpu_list(main_url)
    print(f"Found {len(gpu_list)} GPUs in total.")

    # Step 2: Scrape detailed information for each GPU
    gpu_details_list = []
    counter = 1
    for gpu in gpu_list:
        print(f"Fetching details for GPU: {gpu['name']} (#{counter})")
        html_content = fetch_page(gpu["url"])
        if html_content:
            gpu_details = parse_gpu_details(html_content, gpu["rank"], gpu["name"], gpu["type"])
            gpu_details_list.append(gpu_details)
        counter += 1

    # Step 3: Save the final output to a .ts file
    save_to_ts_file(gpu_details_list)