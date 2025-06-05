from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import re
from urllib.parse import urljoin
from datetime import datetime
import json
import logging

# ================== COMMON CONFIGURATION ==================
CHROME_DRIVER_PATH = r"C:\Users\Mavee\Downloads\chromedriver-win64\chromedriver.exe"
IMPLICIT_WAIT = 10
EXPLICIT_WAIT = 30

# Setup Chrome options
chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--headless=new')  # Modern headless mode

# Initialize driver
service = Service(CHROME_DRIVER_PATH)
driver = webdriver.Chrome(service=service, options=chrome_options)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ================== LENOVO SCRAPER FUNCTIONS ==================
def clean_display_spec(value):
    if value.startswith('15.6"'):
        value = '15.6' + value[4:]
    value = value.replace('\n', ' ').strip()
    return value

def scrape_lenovo_laptops():
    logger.info("Starting Lenovo laptop scraping...")
    lenovo_url = "https://www.lenovo.com/in/en/search?fq=&text=%20laptops&rows=20&sort=relevance&display_tab=Products"
    driver.get(lenovo_url)
    wait = WebDriverWait(driver, EXPLICIT_WAIT)
    wait.until(EC.presence_of_element_located((By.TAG_NAME, 'body')))

    def scroll_and_click_load_more():
        last_height = driver.execute_script("return document.body.scrollHeight")
        scroll_attempts = 0
        while scroll_attempts < 3:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3)
            load_more_buttons = driver.find_elements(By.CSS_SELECTOR, 'button.pc_more[data-tkey="loadMoreResults"]')
            results_text = driver.find_element(By.CSS_SELECTOR, 'p.show').text
            match = re.search(r'Showing 1 - (\d+) of (\d+) Results', results_text)
            if match and match.group(1) == match.group(2):
                logger.info("Reached the end of Lenovo results.")
                break
            for button in load_more_buttons:
                try:
                    driver.execute_script("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'end' });", button)
                    time.sleep(1)
                    driver.execute_script("arguments[0].click();", button)
                    logger.info("Clicked 'Load More Results' button (Lenovo)")
                    time.sleep(3)
                except Exception as e:
                    logger.error(f"Error clicking Lenovo 'Load More Results' button: {e}")
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                scroll_attempts += 1
            else:
                scroll_attempts = 0
            last_height = new_height
    scroll_and_click_load_more()

    html = driver.page_source
    soup = BeautifulSoup(html, 'html.parser')
    product_cards = soup.find_all('li', class_='product_item')
    logger.info(f"Found {len(product_cards)} Lenovo laptops.")

    laptops_data = []
    for idx, card in enumerate(product_cards, start=1):
        try:
            title_div = card.find('div', class_='product_title')
            a_tag = title_div.find('a') if title_div else None
            product_name = a_tag.text.strip() if a_tag else "N/A"
            link = urljoin(lenovo_url, a_tag['href'].strip()) if a_tag and a_tag.has_attr('href') else "N/A"
            part_number_div = card.find('div', class_='partNumber_show-content')
            part_number = "N/A"
            if part_number_div:
                part_span = part_number_div.find('span', {'data-tkey': 'partNumber'})
                if part_span and part_span.find_next('span'):
                    part_number = part_span.find_next('span').text.strip()
            mrp_div = card.find('div', class_='strike-through-price')
            mrp = "N/A"
            if mrp_div:
                mrp_price = mrp_div.find('span', class_='price')
                if mrp_price:
                    mrp = mrp_price.text.strip()
            price_div = card.find('div', class_='price-collapse-align-content')
            curr_price = "N/A"
            if price_div:
                price_span = price_div.find('span', class_='price-title')
                if price_span:
                    curr_price = price_span.text.strip()
            discount_span = card.find('span', class_='price-save-mt')
            discount = discount_span.text.strip() if discount_span else "N/A"
            rating_div = card.find('div', class_='bv_averageRating_component_container')
            rating = rating_div.text.strip() if rating_div else "N/A"
            feature_list = card.find('ul', {'style': 'list-style-type: disc;'})
            features = [li.text.strip().replace('"', '\\"') for li in feature_list.find_all('li')] if feature_list else []
            specs = {}
            key_details_section = card.find('ul', class_='hover_ul_keyDetails')
            if key_details_section:
                for item in key_details_section.find_all('li'):
                    key_elem = item.find('span', class_='keyDetailsKey')
                    value_elem = item.find_all('span')[-1]
                    if key_elem and value_elem:
                        key = key_elem.text.strip().replace('"', '\\"')
                        value = value_elem.text.strip().replace('"', '\\"')
                        if key == "Display :":
                            value = clean_display_spec(value)
                        specs[key] = value
            laptops_data.append({
                "S.NO": idx,
                "Brand": "Lenovo",
                "Product Name": product_name.replace('"', '\\"'),
                "Part Number": part_number.replace('"', '\\"'),
                "MRP": mrp.replace('"', '\\"'),
                "Current Price": curr_price.replace('"', '\\"'),
                "Discount": discount.replace('"', '\\"'),
                "Rating": rating.replace('"', '\\"'),
                "link": link,
                "Features": features,
                "Specifications": specs
            })
        except Exception as e:
            logger.error(f"Error parsing Lenovo card: {e}")
            continue

    ts_laptops = []
    for laptop in laptops_data:
        ts_features = ',\n      '.join([f'"{feature}"' for feature in laptop["Features"]])
        ts_specs = ',\n      '.join([f'"{key}": "{value}"' for key, value in laptop["Specifications"].items()])
        ts_entry = f'''  {{
    "S.NO": {laptop["S.NO"]},
    "Brand": "{laptop["Brand"]}",
    "productName": "{laptop["Product Name"]}",
    "partNumber": "{laptop["Part Number"]}",
    "mrp": "{laptop["MRP"]}",
    "currentPrice": "{laptop["Current Price"]}",
    "discount": "{laptop["Discount"]}",
    "rating": "{laptop["Rating"]}",
    "link": "{laptop["link"]}",
    "features": [
      {ts_features}
    ],
    "specifications": {{
      {ts_specs}
    }}
  }}'''
        ts_laptops.append(ts_entry)
    joined_laptops = ',\n'.join(ts_laptops)
    ts_output = f'''export const laptops = [
{joined_laptops}
];'''
    with open("lenovo_laptops.ts", "w", encoding='utf-8') as f:
        f.write(ts_output)
    logger.info("✅ Lenovo laptops data saved to lenovo_laptops.ts")

def scrape_lenovo_desktops():
    logger.info("Starting Lenovo desktop scraping...")
    lenovo_url = "https://www.lenovo.com/in/en/search?fq=&text=desktops&rows=20&sort=newest&display_tab=Products&sortBy=newest"
    driver.get(lenovo_url)

    wait = WebDriverWait(driver, EXPLICIT_WAIT)
    wait.until(EC.presence_of_element_located((By.TAG_NAME, 'body')))

    def scroll_and_click_load_more():
        last_height = driver.execute_script("return document.body.scrollHeight")
        scroll_attempts = 0
        while scroll_attempts < 3:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3)

            load_more_buttons = driver.find_elements(By.CSS_SELECTOR, 'button.pc_more[data-tkey="loadMoreResults"]')
            results_text = driver.find_element(By.CSS_SELECTOR, 'p.show').text
            match = re.search(r'Showing 1 - (\d+) of (\d+) Results', results_text)
            if match and match.group(1) == match.group(2):
                print("Reached the end of Lenovo results.")
                break

            for button in load_more_buttons:
                try:
                    driver.execute_script("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'end' });", button)
                    time.sleep(1)
                    driver.execute_script("arguments[0].click();", button)
                    print("Clicked 'Load More Results' button (Lenovo)")
                    time.sleep(3)
                except Exception as e:
                    print(f"Error clicking Lenovo 'Load More Results' button: {e}")

            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                scroll_attempts += 1
            else:
                scroll_attempts = 0
            last_height = new_height

    scroll_and_click_load_more()

    html = driver.page_source
    soup = BeautifulSoup(html, 'html.parser')
    product_cards = soup.find_all('li', class_='product_item')
    print(f"Found {len(product_cards)} Lenovo desktops.")

    desktops_data = []
    for idx, card in enumerate(product_cards, start=1):
        try:
            title_div = card.find('div', class_='product_title')
            a_tag = title_div.find('a') if title_div else None
            product_name = a_tag.text.strip() if a_tag else "N/A"
            link = urljoin(lenovo_url, a_tag['href'].strip()) if a_tag and a_tag.has_attr('href') else "N/A"

            part_number_div = card.find('div', class_='partNumber_show-content')
            part_number = "N/A"
            if part_number_div:
                part_span = part_number_div.find('span', {'data-tkey': 'partNumber'})
                if part_span and part_span.find_next('span'):
                    part_number = part_span.find_next('span').text.strip()

            mrp_div = card.find('div', class_='strike-through-price')
            mrp = "N/A"
            if mrp_div:
                mrp_price = mrp_div.find('span', class_='price')
                if mrp_price:
                    mrp = mrp_price.text.strip()

            price_div = card.find('div', class_='price-collapse-align-content')
            curr_price = "N/A"
            if price_div:
                price_span = price_div.find('span', class_='price-title')
                if price_span:
                    curr_price = price_span.text.strip()

            discount_span = card.find('span', class_='price-save-mt')
            discount = discount_span.text.strip() if discount_span else "N/A"

            rating_div = card.find('div', class_='bv_averageRating_component_container')
            rating = rating_div.text.strip() if rating_div else "N/A"

            feature_list = card.find('ul', {'style': 'list-style-type: disc;'})
            features = [li.text.strip().replace('"', '\\"') for li in feature_list.find_all('li')] if feature_list else []

            specs = {}
            key_details_section = card.find('ul', class_='hover_ul_keyDetails')
            if key_details_section:
                for item in key_details_section.find_all('li'):
                    key_elem = item.find('span', class_='keyDetailsKey')
                    value_elem = item.find_all('span')[-1]
                    if key_elem and value_elem:
                        key = key_elem.text.strip().replace('"', '\\"')
                        value = value_elem.text.strip().replace('"', '\\"')
                        if key == "Display :":
                            value = clean_display_spec(value)
                        specs[key] = value

            desktops_data.append({
                "S.NO": idx,
                "Brand": "Lenovo",
                "Product Name": product_name.replace('"', '\\"'),
                "Part Number": part_number.replace('"', '\\"'),
                "MRP": mrp.replace('"', '\\"'),
                "Current Price": curr_price.replace('"', '\\"'),
                "Discount": discount.replace('"', '\\"'),
                "Rating": rating.replace('"', '\\"'),
                "link": link,
                "Features": features,
                "Specifications": specs
            })
        except Exception as e:
            print(f"Error parsing Lenovo card: {e}")
            continue

    # Generate TypeScript-compatible output
    ts_desktops = []
    for desktop in desktops_data:
        ts_features = ',\n      '.join([f'"{feature}"' for feature in desktop["Features"]])
        ts_specs = ',\n      '.join([f'"{key}": "{value}"' for key, value in desktop["Specifications"].items()])
        ts_entry = f'''  {{
    "S.NO": {desktop["S.NO"]},
    "Brand": "{desktop["Brand"]}",
    "productName": "{desktop["Product Name"]}",
    "partNumber": "{desktop["Part Number"]}",
    "mrp": "{desktop["MRP"]}",
    "currentPrice": "{desktop["Current Price"]}",
    "discount": "{desktop["Discount"]}",
    "rating": "{desktop["Rating"]}",
    "link": "{desktop["link"]}",
    "features": [
      {ts_features}
    ],
    "specifications": {{
      {ts_specs}
    }}
  }}'''
        ts_desktops.append(ts_entry)
    joined_desktops = ',\n'.join(ts_desktops)
    ts_output = f'''export const desktops = [
{joined_desktops}
];'''

    with open("lenovo_desktops.ts", "w", encoding='utf-8') as f:
        f.write(ts_output)
    print("✅ Lenovo desktops data saved to lenovo_desktops.ts")

# ================== HP SCRAPER FUNCTIONS ==================
def scrape_hp_laptops():
    logger.info("Starting HP laptop scraping...")
    BASE_URL = "http://hp.com/in-en/shop/laptops-tablets.html"
    PARAMETERS = "?product_list_limit=30&product_list_order=new_arrival"
    PAGES = 8
    all_laptops = []
    laptops_details_previous = []

    for page in range(1, PAGES + 1):
        URL = f"{BASE_URL}{PARAMETERS}&p={page}"
        driver.get(URL)
        time.sleep(2)
        # Accept cookies
        try:
            close_button = driver.find_element(By.CSS_SELECTOR, "button.onetrust-close-btn-handler")
            close_button.click()
            logger.info("Close button clicked (HP).")
        except:
            logger.warning("No close button found or unable to click (HP).")
        # Accept popups
        try:
            pop_up_ok = driver.find_element(By.XPATH, "//*[text()='OK' or text()='Accept' or text()='Agree']")
            pop_up_ok.click()
            logger.info("Pop-up accepted (HP).")
        except:
            logger.warning("No pop-up found or unable to accept (HP).")
        # Wait for products
        product_list_selector = "div.product-item-info.simple"
        WebDriverWait(driver, EXPLICIT_WAIT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, product_list_selector))
        )
        # Parse HTML
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        # Extract details
        def extract_laptop_details(soup, start_index):
            laptops = []
            index = start_index
            for product in soup.select("div.product-item-info.simple"):
                laptop = {}
                laptop['S.NO'] = index
                try:
                    rating_div = product.find('div', class_='bv_averageRating_component_container')
                    laptop['Rating'] = rating_div.find('div', class_='bv_text').text.strip() if rating_div else "N/A"
                except:
                    laptop['Rating'] = "N/A"
                try:
                    reviews_div = product.find('div', class_='bv_numReviews_component_container')
                    laptop['Reviews'] = reviews_div.find('div', class_='bv_text').text.strip() if reviews_div else "N/A"
                except:
                    laptop['Reviews'] = "N/A"
                laptop['Name'] = product.find('h2', class_='plp-h2-title stellar-title__small').text.strip()
                laptop['link'] = product.find('a', class_='product-item-link')['href']
                description_element = product.find('div', class_='short_desc stellar-body__small')
                if description_element:
                    raw_description = description_element.text.strip()
                    cleaned_description = raw_description.replace(" Laptop", "").rstrip('"').strip()
                    laptop['Description'] = cleaned_description
                else:
                    laptop['Description'] = ""
                specs = {}
                spec_list = product.select("div.product-desc-features.stellar-body__small ul li")
                spec_mapping = {
                    "processor": "Processor",
                    "windows": "Operating System",
                    "diagonal": "Display",
                    "ram": "RAM",
                    "ssd": "Storage",
                    "keyboard": "Keyboard",
                    "camera": "Camera",
                    "speakers": "Speakers"
                }
                for spec in spec_list:
                    spec_text = spec.text.strip().lower()
                    for key, value in spec_mapping.items():
                        if key in spec_text:
                            if value == "Display":
                                spec_text = spec_text.replace('"', '')
                            specs[value] = spec_text
                            break
                    else:
                        specs["Other"] = spec_text
                laptop['Specs'] = specs
                price_tag = product.find('span', class_='price-wrapper price-including-tax')
                if price_tag:
                    laptop['Price'] = price_tag.find('span', class_='price').text.strip()
                else:
                    laptop['Price'] = ""
                laptop['Brand'] = 'HP'
                laptops.append(laptop)
                index += 1
            logger.info(f"Extracted {len(laptops)} HP laptops for this page.")
            return laptops

        if page == 1:
            start_index = 1
        else:
            start_index = (page - 1) * 30 + 1 - (30 - len(laptops_details_previous))
        laptops_details_previous = extract_laptop_details(soup, start_index)
        all_laptops.extend(laptops_details_previous)
        logger.info(f"Page {page} processed. Total HP laptops: {len(all_laptops)}")

    now = datetime.now()
    date_str = now.strftime("%d-%m-%Y")
    time_str = now.strftime("%I:%M %p")
    output = "export const products = [\n"
    output += f"""  {{
    Date: "{date_str}",
    Time: "{time_str}"
  }},
"""
    for laptop in all_laptops:
        output += "  {\n"
        output += f'    "S.NO": "{laptop["S.NO"]}",\n'
        output += f'    "Rating": "{laptop["Rating"]}",\n'
        output += f'    "Reviews": "{laptop["Reviews"]}",\n'
        output += f'    "Name": "{laptop["Name"]}",\n'
        output += f'    "link": "{laptop["link"].strip()}",\n'
        output += f'    "Description": "{laptop["Description"]}",\n'
        output += '    "Specs": {\n'
        specs = laptop['Specs']
        spec_items = list(specs.items())
        for i, (key, value) in enumerate(spec_items):
            if i < len(spec_items) - 1:
                output += f'      "{key}": "{value}",\n'
            else:
                output += f'      "{key}": "{value}"\n'
        output += "    },\n"
        output += f'    "Price": "{laptop["Price"]}",\n'
        output += f'    "Brand": "{laptop["Brand"]}"\n'
        output += "  },\n"
    output += "];"

    with open('hp_laptops.ts', 'w', encoding='utf-8') as file:
        file.write(output)
    logger.info("✅ HP laptops data saved to hp_laptops.ts")

def scrape_hp_desktops():
    print("Starting HP desktop scraping...")
    BASE_URL = "https://www.hp.com/in-en/shop/desktops.html"
    PARAMETERS = "?product_list_limit=30&product_list_order=new_arrival"
    PAGES = 3  # Based on HTML snippet showing up to page 3

    all_desktops = []
    desktops_details_previous = []

    for page in range(1, PAGES + 1):
        URL = f"{BASE_URL}{PARAMETERS}&p={page}"
        driver.get(URL)

        # Allow time for JavaScript rendering
        time.sleep(2)

        # Close cookie banner if present
        try:
            close_button = driver.find_element(By.CSS_SELECTOR, "button.onetrust-close-btn-handler")
            close_button.click()
            print("Cookie banner closed.")
        except:
            print("No cookie banner found.")

        # Wait for products to load
        product_list_selector = "div.product-item-info"
        WebDriverWait(driver, EXPLICIT_WAIT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, product_list_selector))
        )

        # Parse HTML
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        def extract_desktop_details(soup, start_index):
            desktops = []
            index = start_index
            product_cards = soup.select("div.product-item-info")
            for product in product_cards:
                desktop = {
                    "S.NO": index,
                    "Name": "",
                    "link": "",
                    "Description": "",
                    "Price": "",
                    "Rating": "",
                    "Reviews": "",
                    "Specs": {},
                    "Brand": "HP"
                }

                try:
                    name_tag = product.find('h2', class_='plp-h2-title stellar-title__small')
                    desktop['Name'] = name_tag.text.strip() if name_tag else ""
                    link_tag = product.find('a', class_='product-item-link')
                    desktop['link'] = link_tag['href'].strip() if link_tag else ""

                    description_tag = product.find('div', class_='short_desc stellar-body__small')
                    desktop['Description'] = description_tag.text.strip() if description_tag else ""

                    price_tag = product.find('span', class_='price-wrapper price-including-tax')
                    desktop['Price'] = price_tag.find('span', class_='price').text.strip() if price_tag else ""

                    rating_tag = product.find('div', class_='bv_averageRating_component_container')
                    desktop['Rating'] = rating_tag.find('div', class_='bv_text').text.strip() if rating_tag else ""

                    reviews_tag = product.find('div', class_='bv_numReviews_component_container')
                    desktop['Reviews'] = reviews_tag.find('div', class_='bv_text').text.strip() if reviews_tag else ""

                    spec_list = product.select("div.product-desc-features.stellar-body__small ul li")
                    spec_mapping = {
                        "processor": "Processor",
                        "windows": "Operating System",
                        "diagonal": "Display",
                        "ram": "RAM",
                        "ssd": "Storage",
                        "keyboard": "Keyboard",
                        "camera": "Camera",
                        "graphics": "Graphics Card"
                    }
                    specs = {}
                    for spec in spec_list:
                        spec_text = spec.text.strip().lower()
                        for key, value in spec_mapping.items():
                            if key in spec_text:
                                if value == "Display":
                                    spec_text = spec_text.replace('"', '')
                                specs[value] = spec_text
                                break
                        else:
                            specs["Other"] = spec_text
                    desktop['Specs'] = specs

                except Exception as e:
                    print(f"Error extracting product: {e}")

                desktops.append(desktop)
                index += 1

            print(f"Extracted {len(desktops)} desktops from page {page}.")
            return desktops

        if page == 1:
            start_index = 1
        else:
            start_index = (page - 1) * 30 + 1 - (30 - len(desktops_details_previous))

        desktops_details_previous = extract_desktop_details(soup, start_index)
        all_desktops.extend(desktops_details_previous)

        print(f"Page {page} processed. Total desktops: {len(all_desktops)}")

    # Get current date and time
    now = datetime.now()
    date_str = now.strftime("%d-%m-%Y")
    time_str = now.strftime("%I:%M %p")

    # Format TypeScript Output
    output = "export const products = [\n"
    output += f"  {{\n    Date: \"{date_str}\",\n    Time: \"{time_str}\"\n  }},\n"

    for desktop in all_desktops:
        output += "  {\n"
        output += f'    "S.NO": "{desktop["S.NO"]}",\n'
        output += f'    "Name": "{desktop["Name"]}",\n'
        output += f'    "link": "{desktop["link"]}",\n'
        output += f'    "Description": "{desktop["Description"]}",\n'
        output += f'    "Price": "{desktop["Price"]}",\n'
        output += f'    "Rating": "{desktop["Rating"]}",\n'
        output += f'    "Reviews": "{desktop["Reviews"]}",\n'
        output += '    "Specs": {\n'

        specs = desktop['Specs']
        spec_items = list(specs.items())
        for i, (key, value) in enumerate(spec_items):
            if i < len(spec_items) - 1:
                output += f'      "{key}": "{value}",\n'
            else:
                output += f'      "{key}": "{value}"\n'

        output += "    },\n"
        output += f'    "Brand": "{desktop["Brand"]}"\n'
        output += "  },\n"

    output += "];"

    # Save to TypeScript file
    with open('hp_desktops.ts', 'w', encoding='utf-8') as file:
        file.write(output)

    print("Data successfully written to hp_desktops.ts")

# ================== DELL SCRAPER FUNCTIONS ==================
def setup_driver():
    service = Service(CHROME_DRIVER_PATH)
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-gpu")
    options.add_argument('--ignore-certificate-errors')
    options.add_argument('--ignore-ssl-errors')
    options.add_argument('--log-level=3')
    options.add_argument('--headless=new')  # Ensure headless mode is used

    return webdriver.Chrome(service=service, options=options)

def navigate_to_url(driver, url):
    driver.get(url)
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "ps-top"))
        )
    except Exception as e:
        logger.error("Timeout waiting for page to load:", e)

def scroll_page(driver):
    last_height = driver.execute_script("return document.body.scrollHeight")
    while True:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height

def extract_product_info(soup):
    products = soup.find_all("section", class_="ps-top")
    desktop_data = []
    for idx, product in enumerate(products):
        try:
            title_tag = product.find("h3", class_="ps-title")
            title = title_tag.text.strip() if title_tag else "Unknown Product"
            price_tag = product.find("span", class_="price")
            price = price_tag.text.strip() if price_tag else "N/A"
            rating_tag = product.find("span", class_="rating-number")
            rating = rating_tag.text.strip() if rating_tag else "N/A"
            media_div = product.find("div", class_="ps-media-gallery-mfe")
            product_url = media_div["data-mediamfe-pd-url"] if media_div else ""
            full_url = urljoin("https://www.dell.com", product_url)
            desktop_data.append({
                "S.NO": idx + 1,
                "Brand": "Dell",
                "productName": title,
                "partNumber": product_url.split("/")[-1],
                "mrp": "",
                "currentPrice": price,
                "discount": "",
                "rating": rating,
                "link": full_url,
                "features": [],
                "specifications": {}
            })
        except Exception as e:
            print(f"Error extracting product: {e}")
    return desktop_data

def extract_detailed_info(driver, desktop_data):
    desktop_links = [d["link"] for d in desktop_data]
    unique_desktops = []
    for link in desktop_links:
        try:
            matching_desktops = [d for d in desktop_data if d["link"] == link]
            base_desktop = matching_desktops[0] if matching_desktops else {}
            product_name = base_desktop.get('productName', 'Unknown Desktop')
            print(f"\nNavigating to: {product_name}")
            driver.get(link)
            try:
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            except:
                print(f"Timeout waiting for page to load for {product_name}")

            detail_html = driver.page_source
            detail_soup = BeautifulSoup(detail_html, "html.parser")

            # Update Product Name
            desktop_name_tag = detail_soup.find("h1", class_="mb-md-0 mr-4 d-inline title-tech-specs")
            desktop_name = desktop_name_tag.text.strip() if desktop_name_tag else product_name
            base_desktop["productName"] = desktop_name

            # Dismiss popup if present
            try:
                popup_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'No, thanks')]"))
                )
                print(f"Popup detected for {product_name}. Dismissing...")
                popup_button.click()
            except:
                print(f"No popup detected for {product_name}.")

            # Count Configurations
            config_buttons = driver.find_elements(By.CSS_SELECTOR, ".offer-select.btn.btn-outline-primary")
            config_count = len(config_buttons)
            print(f"{product_name} has {config_count} configurations.")
            if config_count == 0:
                print(f"⚠️ No configurations found for {product_name}. Skipping.")
                continue

            # Now iterate through other configurations (skip base config)
            for i, config_button in enumerate(config_buttons):
                try:
                    print(f"Selecting configuration {i+1} for {product_name}")
                    driver.execute_script("arguments[0].scrollIntoView(true); arguments[0].click();", config_button)
                    time.sleep(2)
                    detail_html = driver.page_source
                    detail_soup = BeautifulSoup(detail_html, "html.parser")

                    # Re-extract price
                    price_div = detail_soup.find("div", class_="mr-5")
                    if price_div:
                        price_tag = price_div.find("span", class_="h3 font-weight-bold mb-1 text-nowrap sale-price")
                        if price_tag:
                            config_current_price = price_tag.text.strip().replace("₹", "").replace(",", "")
                    else:
                        config_current_price = ""

                    # Create a new entry for this configuration
                    config_entry = {
                        "S.NO": len(unique_desktops) + 1,
                        "Brand": "Dell",
                        "productName": base_desktop["productName"],
                        "partNumber": f"{base_desktop['partNumber']}_config{i+2}",
                        "mrp": "",
                        "currentPrice": config_current_price,
                        "discount": "",
                        "rating": base_desktop["rating"],
                        "link": base_desktop["link"],
                        "features": base_desktop["features"],
                        "specifications": {}
                    }

                    # Re-extract specs again for this configuration
                    spec_table = detail_soup.find("div", class_="col", attrs={"data-bind": "html: techSpecs"})
                    specs = {}
                    if spec_table:
                        rows = spec_table.find_all("li", class_="mb-2")
                        for row in rows:
                            key_tag = row.find("div", class_="h5 font-weight-bold mb-0")
                            value_tag = row.find("p")
                            if key_tag and value_tag:
                                key = key_tag.text.strip()
                                value = value_tag.text.strip()

                                # Remove unnecessary characters (\u2122, \u00ae)
                                key = re.sub(r'[\u2122\u00ae]', '', key)
                                value = re.sub(r'[\u2122\u00ae]', '', value)

                                specs[key] = value
                    config_entry["specifications"] = specs

                    # Append only if not duplicate
                    if config_entry not in unique_desktops:
                        unique_desktops.append(config_entry)
                except Exception as e:
                    print(f"Error processing configuration {i+1} for {product_name}: {e}")
        except Exception as e:
            print(f"Error processing desktop {product_name}: {e}")

    return unique_desktops

def save_data(desktop_data, filename="desktops.ts"):
    seen = set()
    unique_desktops = []

    for desktop in desktop_data:
        part_number = desktop.get("partNumber", "")
        if part_number and part_number not in seen:
            seen.add(part_number)
            unique_desktops.append(desktop)

    with open(filename, "w", encoding="utf-8") as f:
        f.write("export const desktops = [\n")
        for i, desktop in enumerate(unique_desktops):
            # Remove unnecessary characters from specifications
            for key, value in desktop["specifications"].items():
                desktop["specifications"][key] = re.sub(r'[\u2122\u00ae]', '', value)

            json_str = json.dumps(desktop, indent=2)
            formatted = json_str
            if i < len(unique_desktops) - 1:
                formatted += ","
            f.write(formatted + "\n")
        f.write("];\n")
    print(f"✅ Saved {len(unique_desktops)} unique desktop configurations to {filename}")

def get_current_page(driver):
    try:
        current_page_element = driver.find_element(By.CSS_SELECTOR, ".dds__pagination__page-range-current")
        current_page = current_page_element.get_attribute("value")
        return int(current_page)
    except Exception as e:
        print("Error getting current page:", e)
        return 1

def get_total_pages(driver):
    try:
        total_pages_element = driver.find_element(By.CSS_SELECTOR, ".dds__pagination__page-range-total")
        total_pages = total_pages_element.text
        return int(total_pages)
    except Exception as e:
        print("Error getting total pages:", e)
        return 1

def scrape_dell_laptops():
    logger.info("Starting Dell laptop scraping...")
    URL = "https://www.dell.com/en-in/shop/scc/scr/laptops"
    driver = setup_driver()
    navigate_to_url(driver, URL)
    all_laptops = []
    while True:
        scroll_page(driver)
        html = driver.page_source
        soup = BeautifulSoup(html, "html.parser")
        laptop_data = extract_product_info(soup)
        all_laptops.extend(laptop_data)
        current_page = get_current_page(driver)
        total_pages = get_total_pages(driver)
        logger.info(f"Current page: {current_page} of {total_pages}")
        if current_page >= total_pages:
            logger.info("Reached the last page.")
            break
        try:
            next_button = driver.find_element(By.CSS_SELECTOR, ".dds__pagination__next-page")
            if next_button.is_enabled():
                logger.info("Clicking the 'Next' button...")
                driver.execute_script("arguments[0].scrollIntoView(true); arguments[0].click();", next_button)
                time.sleep(5)
            else:
                logger.info("No more pages to navigate.")
                break
        except Exception as e:
            logger.error("No more pages or error navigating to next page:", e)
            break
    logger.info("Gathering detailed information for all Dell laptops...")
    laptop_data = extract_detailed_info(driver, all_laptops)
    save_data(laptop_data, "dell_laptops.ts")
    driver.quit()
    logger.info("✅ Dell laptops data saved to dell_laptops.ts")

def scrape_dell_desktops():
    print("Starting Dell desktop scraping...")
    URL = "https://www.dell.com/en-in/shop/scc/scr/desktops"

    navigate_to_url(driver, URL)

    all_desktops = []

    while True:
        scroll_page(driver)
        html = driver.page_source
        soup = BeautifulSoup(html, "html.parser")
        desktop_data = extract_product_info(soup)
        all_desktops.extend(desktop_data)

        current_page = get_current_page(driver)
        total_pages = get_total_pages(driver)

        print(f"Current page: {current_page} of {total_pages}")

        if current_page >= total_pages:
            print("Reached the last page.")
            break

        try:
            next_button = driver.find_element(By.CSS_SELECTOR, ".dds__pagination__next-page")
            if next_button.is_enabled():
                print("Clicking the 'Next' button...")
                driver.execute_script("arguments[0].scrollIntoView(true); arguments[0].click();", next_button)
                time.sleep(5)  # Wait for the next page to load
            else:
                print("No more pages to navigate.")
                break
        except Exception as e:
            print("No more pages or error navigating to next page:", e)
            break

    print("Gathering detailed information for all desktops...")
    desktop_data = extract_detailed_info(driver, all_desktops)
    save_data(desktop_data, "dell_desktops.ts")
    print("✅ Dell desktops data saved to dell_desktops.ts")

# ================== MAIN EXECUTION ==================
try:
    # Lenovo scraping
    logger.info("Starting Lenovo scraping...")
    scrape_lenovo_laptops()
    scrape_lenovo_desktops()

    # HP scraping
    logger.info("Starting HP scraping...")
    scrape_hp_laptops()
    scrape_hp_desktops()

    # Dell scraping
    logger.info("Starting Dell scraping...")
    scrape_dell_laptops()
    scrape_dell_desktops()

except Exception as e:
    logger.error(f"Script error: {str(e)}")

finally:
    time.sleep(5)
    driver.quit()
    logger.info("Script execution completed.")
