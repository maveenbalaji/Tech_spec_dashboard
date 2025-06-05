from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup as bs
import json
import re
import time

# Configuration
chrome_driver_path = r"C:\Users\Mavee\Downloads\chromedriver-win64\chromedriver.exe"
output_file = "flipkart_tablets.ts"

# Initialize WebDriver
service = Service(chrome_driver_path)
options = webdriver.ChromeOptions()
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(service=service, options=options)

def extract_tablet_details(card):
    try:
        # Skip if currently unavailable
        if card.find('span', class_='vfSpSs'):
            print("[!] Skipped 'Currently unavailable' product.")
            return None

        # Extract product name
        name_div = card.find('div', class_='KzDlHZ')
        if not name_div:
            print("[!] Skipped invalid entry: Missing product name.")
            return None

        raw_name = name_div.text.strip()

        # Clean and truncate name at first spec
        cleaned_name = re.sub(r'^(Add to Compare|Sponsored)?\s*', '', raw_name).strip()
        cleaned_name = re.split(r'\s+(\d+\s*GB\s*(RAM|ROM)|\d+\.?\d*\s*inch)', cleaned_name)[0].strip()

        if not cleaned_name:
            print("[!] Skipped invalid entry: Invalid product name.")
            return None

        # Extract buy link
        product_link = card.find('a', class_='CGtC98')
        if not product_link:
            print("[!] Skipped invalid entry: Missing product link.")
            return None

        buy_link = "https://www.flipkart.com" + product_link['href']

        # Extract price
        price_tag = card.find('div', class_='Nx9bqj _4b5DiR')  # Discounted price
        original_price_tag = card.find('div', class_='yRaY8j ZYYwLA')  # Original price

        price = original_price_tag.text.strip() if original_price_tag else (
            price_tag.text.strip() if price_tag else "N/A"
        )

        price = price.replace('₹', '').replace(',', '')

        # Extract image URL
        img_tag = card.find('img', class_='DByuf4')
        image_url = img_tag['src'] if img_tag and 'src' in img_tag.attrs else "N/A"

        # Extract specifications
        spec_div = card.find('div', class_='_6NESgJ')
        specs = []
        if spec_div:
            spec_list = spec_div.find('ul', class_='G4BRas')
            if spec_list:
                specs = [item.text.strip() for item in spec_list.find_all('li', class_='J+igdf')]

        return {
            "Name": cleaned_name,
            "Price": price,
            "Image URL": image_url,
            "Buy Link": buy_link,
            "Specifications": specs
        }
    except Exception as e:
        print(f"[!] Error extracting tablet details: {str(e)}")
        return None

try:
    main_url = "https://www.flipkart.com/search?q=tabs&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off&as-pos=1&as-type=HISTORY&sort=recency_desc&page=1"
    print("[+] Loading Flipkart tablets page...")
    driver.get(main_url)

    # Wait for products to load
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'cPHDOP'))
    )
    time.sleep(3)

    # Close popups if present
    try:
        close_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button._2KpZ6l._3dESVI"))
        )
        close_btn.click()
        print("[+] Closed popup")
    except Exception as e:
        print(f"[!] No popup found or error closing popup: {str(e)}")

    tablet_data = []
    current_page = 1
    total_pages = 50 # Adjust this number to scrape more or fewer pages

    while current_page <= total_pages:
        print(f"\n[+] Scraping Page {current_page} of {total_pages}")

        # Scroll to bottom to load all products
        last_height = driver.execute_script("return document.body.scrollHeight")
        while True:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

        # Parse page
        soup = bs(driver.page_source, 'html.parser')
        tablet_cards = soup.find_all('div', class_='cPHDOP col-12-12')

        for idx, card in enumerate(tablet_cards):
            details = extract_tablet_details(card)
            if details:
                tablet_data.append(details)
                print(f"[+] Processed {len(tablet_data)}: {details['Name']} - ₹{details['Price']}")
            else:
                print(f"[!] Skipped invalid entry at index {idx + 1}")

        # Navigate to next page
        try:
            next_button = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.XPATH, "//a[@class='_9QVEpD' and contains(., 'Next')]"))
            )
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", next_button)
            time.sleep(2)
            driver.execute_script("arguments[0].click();", next_button)
            print("[+] Navigating to next page...")

            # Wait for new page to load
            WebDriverWait(driver, 40).until(
                EC.presence_of_element_located((By.CLASS_NAME, 'cPHDOP'))
            )
            time.sleep(5)
            current_page += 1
        except Exception as e:
            print(f"[!] Error navigating to next page: {str(e)}")
            break

    # Add serial numbers
    for i, tablet in enumerate(tablet_data):
        tablet["S.No"] = i + 1

    # Save to .ts file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("export const tablets = ")
        json.dump(tablet_data, f, indent=4, ensure_ascii=False)
        f.write(";")

    print(f"\n✅ Successfully scraped {len(tablet_data)} tablets.")
    print(f"📁 Data saved to '{output_file}'")

except Exception as e:
    print(f"[!] Error: {str(e)}")

finally:
    driver.quit()
