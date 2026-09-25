"""
clear_data.py

Idha unga app.py irukura ORE folder la vachi run pannunga.
Idhu bookings, vouchers, voucher_cycles - moonu collections-um
completely empty pannidum (indexes/collection structure ah
touch pannadhu, documents mattum delete pannum).

Run pannuradhuku:
    python clear_data.py

app.py running ah irukkanum idhu run panra podhu venaam,
aana MongoDB service (mongod) run aagirukkanum.
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("ERROR: MONGO_URI kedaikala. .env file idhே folder la irukka nu check pannunga.")
    exit(1)

client = MongoClient(MONGO_URI)
db = client.get_default_database()

collections_to_clear = ["bookings", "vouchers", "voucher_cycles"]

print("Clearing collections...")
for name in collections_to_clear:
    result = db[name].delete_many({})
    print(f"  {name}: {result.deleted_count} documents deleted")

print("\nDone! Ella bookings, vouchers, voucher cycles-um fresh ah irukku ippo.")