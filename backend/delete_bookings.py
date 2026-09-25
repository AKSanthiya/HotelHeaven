from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()
client = MongoClient(os.getenv("MONGO_URI"))
db = client.get_database()

result = db.bookings.delete_many({})
print(f"Deleted {result.deleted_count} bookings")