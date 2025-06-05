Certainly! Here's a comprehensive and detailed documentation for the **Tech Selection Dashboard**, formatted in Markdown for clarity and ease of use.

---

# Tech Selection Dashboard

## Overview

The **Tech Selection Dashboard** is a robust web application designed to aggregate, analyze, and visualize hardware data across various categories, including processors, GPUs, laptops, memory modules, tablets, and desktops. By scraping data from multiple reputable sources, the application provides users with up-to-date information on pricing, specifications, and performance benchmarks for the year 2025.

* **Backend**: Utilizes Python scripts with Selenium and BeautifulSoup to scrape data, which is then stored in a TypeScript (`.ts`) file located in the `@/data` directory.
* **Frontend**: Built with Node.js and React.js, the frontend presents the scraped data through an intuitive dashboard featuring interactive graphs and tables.
* **Last Updated**: 05-06-2025

## Features

* **Comprehensive Data Collection**: Gathers detailed information on hardware components, including prices, benchmarks, and specifications.
* **Interactive Visualizations**: Displays price and performance trends for 2025 using dynamic charts.
* **Advanced Filtering and Search**: Allows users to filter and search hardware by category, brand, or specific names.
* **Value-Based Recommendations**: Highlights hardware options that offer the best value based on price-to-performance ratios.

## Prerequisites

* **Python 3.8+**: Required for running the backend scraping scripts.
* **Node.js 16+**: Necessary for developing and running the React.js frontend application.
* **ChromeDriver**: Must be compatible with the installed version of Chrome for Selenium to function correctly.

### Dependencies

* **Backend**: Install Python packages as specified in `requirements.txt`.
* **Frontend**: Install Node.js dependencies using `npm install`.

## Setup Instructions

### Backend (Python)

1. **Clone the Repository**:

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install Python Dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure ChromeDriver**:

   * Ensure ChromeDriver is installed and added to your system's PATH.
   * Download the appropriate version from [ChromeDriver Downloads](https://sites.google.com/a/chromium.org/chromedriver/downloads).

4. **Run the Scraper**:

   ```bash
   python scraper.py
   ```
### Frontend (Node.js/React.js)

1. **Navigate to the Frontend Directory**:

   ```bash
   cd frontend
   ```

2. **Install Node.js Dependencies**:

   ```bash
   npm install
   ```

3. **Start the Development Server**:

   ```bash
   npm run dev
   ```

   * The application will be accessible at `http://localhost:3000`.

## Project Structure

```
/scraper.py               # Python script for web scraping
/frontend/                # React.js frontend code
@/data/hardwareData.ts    # TypeScript file storing scraped hardware data
/logs/scraper.log         # Log file for backend scraping errors
```

## Pages Overview

The dashboard comprises six main pages, each dedicated to a specific hardware category. Below is a detailed description of each page, including the data displayed, visualizations, and user interactions.

### 1. Latest Processors List

**Data Displayed**:

* A table listing processors with columns for:

  * Name
  * CPU Class (e.g., Laptop, Desktop, Server)
  * Price (USD)
  * Price/Core (USD)
  * Benchmark (Single-Core)
  * Benchmark (Multi-Core)
* Example Entry:

  * *Intel Core Ultra 5 235U*, Laptop, \$332.00 USD, \$27.87 USD/core, 3907 (Single-Core), 18101 (Multi-Core)
* Suggested processors based on best value, e.g., *Intel Core Ultra 7 256V* at \$484.00 with a Multi-Core Benchmark of 40390.
  
  ![image](https://github.com/user-attachments/assets/d44b7be7-e952-4b3e-8b1e-af845e5a1595)


**Visualizations**:

* Combined chart displaying:

  * Benchmark (Single-Core) in red
  * Benchmark (Multi-Core) in green
  * Price (USD) in blue for 2025
* Secondary chart comparing price and benchmark trends across multiple years (2020–2025) for selected processors.

**User Interactions**:

* Search by processor name (e.g., "Intel Ultra").
* Filter by year (2020–2025) using tabs above the chart.
* Toggle between "Price & Benchmark" views using buttons.
* Compare processors by selecting them via the "Compare" button.
* Clear filters using the "Clear" button.
  
![image](https://github.com/user-attachments/assets/cdd47eda-aa75-4c7a-8d1c-2f7059c9ccbb)


### 2. GPUs

**Data Displayed**:

* A table listing GPUs with columns for:

  * Rank
  * GPU Name
  * Type
  * PassMark Score
  * Architecture
  * Release Date
  * TDP (W)
  * Interface
  * Width
  * Max RAM
  * Core Clock
  * Boost Clock (MHz)
  * Price (MSRP)
  * Display Connectors
  * Price/Score
* Example Entry:

  * *GeForce RTX 5090*, Desktop, PassMark Score 40342, Blackwell Architecture, Released 30 January 2025, Price \$1999.00 USD, Price/Score 0.0496
* Suggested GPUs for best value, e.g., *GeForce RTX 5070 Ti* at \$749.00 with a PassMark Score of 32875.

**Visualizations**:

* Line chart showing Launch Price (MSRP) in green and PassMark Score in blue for 2025.
* Multi-year chart (2020–2025) comparing price and PassMark trends for selected GPUs.
![image](https://github.com/user-attachments/assets/f83edfc6-d280-4544-9efd-63aa2e01d1f8)


**User Interactions**:

* Search by GPU name (e.g., "GeForce RTX 5090").
* Filter by year using the year tabs.
* Toggle "Price/PassMark Analysis" view.
* Clear filters with the "Clear" button.
![image](https://github.com/user-attachments/assets/7d3bfc78-6b62-42c3-b3eb-ff302063b656)

### 3. Memory

**Data Displayed**:

* A table with columns for:

  * S.No
  * Name
  * Type
  * Capacity
  * DB Ops
  * Read Cached
  * Read Uncached
  * Write
  * Latency
  * Threaded
  * Average Mark
  * Launch Date
  * Price
* Example Entry:

  * *Corsair CMR32GX4M2D3000C16*, DDR4, 16 GB, 6.196 KOps/Sec, 32.034 MBytes/Sec (Read Cached), 18.554 MBytes/Sec (Read Uncached), 14.238 MBytes/Sec (Write), 32 ns Latency, 36.146 MBytes/Sec (Threaded), Average Mark 3471, Launched 04-14-2025, Price \$235.99 USD
* Suggested memory modules for best value, e.g., *Corsair CMR32GX4M2D3000C16* at \$235.99 with an Average Mark of 3471.

**Visualizations**:

* Line chart showing Price in green and Average Mark in blue for 2025.
* Multi-year chart (2020–2025) comparing price and average mark trends.

**User Interactions**:

* Search by memory name (e.g., "Corsair").
* Filter by year using the year tabs.
* Toggle "Price & Average Mark Analysis" view.
* Clear filters with the "Clear" button.
  
![image](https://github.com/user-attachments/assets/0cc6b925-56da-4f33-ac8d-bddab2c96ce4)


### 4. Laptops

**Data Displayed**:

* A table with columns for:

  * S.No
  * Name
  * Processor
  * RAM
  * Storage
  * Graphics
  * Display
  * Operating System
  * Price
  * BUY 
* Example Entry:

  * *Latitude 3550 Laptop*, 13th Gen Intel Core i5-1235U, 8 GB DDR5, 512 GB M.2 PCIe Gen 4 NVMe, Intel Integrated Iris Xe, 15.6" FHD, Windows 11 Pro, ₹94,447.81
* Summary of brands with counts, e.g., HP: 53, Lenovo: 14, Dell: 15

**Visualizations**:

* None on this page (focus is on tabular data).

**User Interactions**:

* Search by name or processor (e.g., "Intel Core Ultra 5").
* Filter by brand (HP, Lenovo, Dell) using buttons.
* Clear filters with the "Clear" button.
* While you can click on BUY it will redirect to product page 

![image](https://github.com/user-attachments/assets/b6262a59-5928-40cc-8f44-1b13a58f22e2)


### 5. Desktops

**Data Displayed**:

* A table with columns for:

  * S.No
  * Name
  * Processor
  * RAM
  * Storage
  * Graphics
  * Operating System
  * Price
* Example Entry:

  * *HP 68.6 cm (27) All-in-One PC 27-cr1027in*, Intel Core Ultra 5 Processor, 16 GB DDR5-5600 RAM, 1 TB SSD, 68.6 cm FHD Display with Intel UHD Graphics, Windows 11 Home, ₹82,999
* Summary of brands with counts, e.g., HP: 79, Lenovo: 30, Dell: 38

**Visualizations**:

* None on this page (focus is on tabular data).

**User Interactions**:

* Search by name or processor (e.g., "Intel Core Ultra 7").
* Filter by brand (HP, Lenovo, Dell) using buttons.
* Clear filters with the "Clear" button.
* BUY link will redirect to product Page 

  
  ![image](https://github.com/user-attachments/assets/4a20bd39-d69e-4356-8812-1b00d1f166fd)


### 6. Tablets

**Data Displayed**:

* A table with columns for:

  * S.No
  * Name
  * Processor
  * Display
  * RAM
  * ROM
  * Camera
  * Operating System
  * Price
* Example Entry:

  * *Titan SHIELD Tab White*, MT6755 Octa-Core 2.0GHz, 25.65 cm (10.1 inch) Full HD Display, 6 GB RAM, 64 GB ROM, N/A Camera, Android 14, ₹8,699
* Summary of brands with counts, e.g., Apple: 74, Samsung: 30, Redmi: 11, Other: 91

**Visualizations**:

* None on this page (focus is on tabular data).

**User Interactions**:

* Search by name or processor (e.g., "Snapdragon 7").
* Filter by brand (Apple, Samsung, Redmi, Other) using buttons.
* using the BUY link it will redirect to the product page in the flipkart

  ![image](https://github.com/user-attachments/assets/d29afd75-d172-4636-895b-5a88d233f079)

  
