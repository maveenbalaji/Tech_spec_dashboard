Sure! Here's **your complete project documentation** reformatted in a **clean, consistent markdown structure** exactly like the format you've requested:

---

# Efftronics Server Dashboard

## Overview

Efftronics Server Dashboard is a web application that scrapes hardware data (processors, GPUs, laptops, memory, tablets, desktops) from various websites, stores the data in a TypeScript (.ts) file, and displays it using a React.js frontend. The project provides price and benchmark analysis for 2025, helping users compare hardware options.

* **Backend**: Python script using Selenium and BeautifulSoup to scrape data and save it in a `.ts` file located in the `@/data` folder.
* **Frontend**: Node.js with React.js to render the scraped data in a user-friendly dashboard with graphs and tables.
* **Last Updated**: 04-06-2025

## Features

* Scrape hardware details (e.g., price, benchmarks, specs) for processors, GPUs, laptops, memory, tablets, and desktops.
* Visualize price and benchmark trends for 2025 using charts.
* Filter and search hardware by category, brand, or name.
* Display suggested hardware based on best value (low price, high benchmark).

## Prerequisites

* **Python 3.8+**: For the backend scraping script.
* **Node.js 16+**: For the frontend React.js application.
* **ChromeDriver**: Compatible with your installed Chrome version for Selenium.

### Dependencies

* **Backend**: Install Python packages listed in `requirements.txt`.
* **Frontend**: Install Node.js dependencies via `npm install`.

## Setup Instructions

### Backend (Python)

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Ensure ChromeDriver is installed and added to your system PATH. Download it from [https://chromedriver.chromium.org/](https://chromedriver.chromium.org/) if needed.

4. Run the Python script to scrape data:

   ```bash
   python scraper.py
   ```

* The script scrapes data and saves it to `@/data/hardwareData.ts`.
* Logs are generated for debugging (check `scraper.log`).

### Frontend (Node.js/React.js)

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

* The app will be available at `http://localhost:3000`.
* It reads data from `@/data/hardwareData.ts` to display the dashboard.

## Project Structure

* `/scraper.py`: Python script for web scraping.
* `/frontend/`: React.js frontend code.
* `@/data/hardwareData.ts`: TypeScript file storing scraped hardware data.
* `/logs/scraper.log`: Log file for backend scraping errors.

## Pages Overview

The dashboard consists of six main pages, each dedicated to a specific hardware category. Below is a detailed description of each page, including the data displayed, visualizations, and user interactions.

---

### Latest Processors List

#### Data Displayed

* Table columns: Name, CPU Class, Price (USD), Price/Core (USD), Benchmark (Single-Core), Benchmark (Multi-Core)
* Example: `Intel Core Ultra 5 235U`, Laptop, `$332.00 USD`, `$27.8667 USD/core`, `3907`, `18101`
* Suggested processors for best value: e.g., `Intel Core Ultra 7 256V`, `$484.00`, Benchmark `40390`

#### Visualizations

* Combined chart with:

  * Single-Core Benchmark: Red
  * Multi-Core Benchmark: Green
  * Price: Blue
* Secondary multi-year (2020–2025) price & benchmark trend chart

#### User Interactions

* Search by name
* Filter by year
* Toggle views: Price & Benchmark
* Compare processors
* Clear filters

---

### GPUs

#### Data Displayed

* Table columns: Rank, Name, Type, PassMark Score, Architecture, Release Date, TDP, Interface, Width, Max RAM, Core Clock, Boost Clock, Price (MSRP), Display Connectors, Price/Score
* Example: `GeForce RTX 5090`, Desktop, `40342`, `Blackwell`, `30 Jan 2025`, `$1999.00`, `0.0496`
* Suggested GPUs: `RTX 5070 Ti`, `$749.00`, Score `32875`

#### Visualizations

* Line chart for Launch Price vs PassMark Score (2025)
* Multi-year trend (2020–2025) for selected GPUs

#### User Interactions

* Search by name
* Filter by year
* Toggle: Price/PassMark Analysis
* Clear filters

---

### Laptops

#### Data Displayed

* Table columns: S.No, Name, Processor, RAM, Storage, Graphics, Display, OS, Price
* Example: `Latitude 3550`, `Intel Core i5-1235U`, `8 GB`, `512 GB SSD`, `Intel Iris Xe`, `15.6" FHD`, `Windows 11 Pro`, `₹94,447.81`
* Brand summary: HP: 53, Lenovo: 14, Dell: 15

#### Visualizations

* None (tabular focus)

#### User Interactions

* Search by name or processor
* Filter by brand
* Clear filters

---

### Memory

#### Data Displayed

* Table columns: S.No, Name, Type, Capacity, DB Ops, Read Cached, Read Uncached, Write, Latency, Threaded, Average Mark, Launch Date, Price
* Example: `Corsair CMR32GX4M2D3000C16`, DDR4, `16 GB`, `6.196 KOps/Sec`, `32.034 MB/s`, `18.554 MB/s`, `14.238 MB/s`, `32 ns`, `36.146 MB/s`, `3471`, `14-04-2025`, `$235.99`

#### Visualizations

* Line chart for Price (green) and Average Mark (blue) - 2025
* Multi-year (2020–2025) trend chart

#### User Interactions

* Search by memory name
* Filter by year
* Toggle: Price & Average Mark Analysis
* Clear filters

---

### Desktops

#### Data Displayed

* Table columns: S.No, Name, Processor, RAM, Storage, Graphics, OS, Price
* Example: `HP All-in-One PC 27-cr1027in`, `Intel Ultra 5`, `16 GB DDR5`, `1 TB SSD`, `Intel UHD`, `Windows 11`, `₹82,999`
* Brand summary: HP: 79, Lenovo: 30, Dell: 38

#### Visualizations

* None (tabular focus)

#### User Interactions

* Search by name or processor
* Filter by brand
* Clear filters

---

### Tabs

#### Data Displayed

* Table columns: S.No, Name, Processor, Display, RAM, ROM, Camera, OS, Price
* Example: `Titan SHIELD Tab`, `MT6755`, `10.1" FHD`, `6 GB`, `64 GB`, `N/A`, `Android 14`, `₹8,699`
* Brand summary: Apple: 74, Samsung: 30, Redmi: 11, Other: 91

#### Visualizations

* None (tabular focus)

#### User Interactions

* Search by name or processor
* Filter by brand
* Clear filters

---

## Usage

* Run the backend script (`scraper.py`) to scrape and update hardware data.
* Start the frontend server to view the dashboard.
* Use the tabs (Processors, GPUs, Laptops, etc.) to explore hardware categories.
* Analyze price and benchmark trends via provided graphs on applicable pages.

---

## Dependencies

### Backend (Python)

* `selenium`: For browser automation
* `beautifulsoup4`: For HTML parsing
* `urllib.parse`, `json`, `logging`, etc.: For data handling and logs

### Frontend (Node.js)

* `react`, `typescript`, `chart.js`, `axios`, `tailwindcss`, etc.

