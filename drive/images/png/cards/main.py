import os
import requests

# Create folder
OUTPUT_DIR = "png"

# Card values and suits
values = ["2", "3", "4", "5", "6", "7", "8", "9", "0", "J", "Q", "K", "A"]
suits = ["C", "D", "H", "S"]  # Clubs, Diamonds, Hearts, Spades

BASE_URL = "https://deckofcardsapi.com/static/img"

for suit in suits:
    os.makedirs(f"{OUTPUT_DIR}/{suit}", exist_ok=True)
    for value in values:
        card_code = f"{value}{suit}"
        url = f"{BASE_URL}/{card_code}.png"
        filename = os.path.join(OUTPUT_DIR, f"{suit}/{card_code}.png")

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()

            with open(filename, "wb") as f:
                f.write(response.content)

            print(f"✅ Downloaded {card_code}")

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed {card_code}: {e}")
