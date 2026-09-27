from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import requests
import base64
import os
import re
import calendar
import hmac
import hashlib
from datetime import datetime, timedelta
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
import google.generativeai as genai
import razorpay
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from io import BytesIO

load_dotenv()  # .env file la irukura values load pannum

app = Flask(__name__)
CORS(app)  # React frontend (different port) backend ku call panna anumathikkum

# India Standard Time = UTC + 5:30.
# Customer type panra check-in time IST la irukkum; DB la & scheduler la UTC use pannurom.
IST_OFFSET = timedelta(hours=5, minutes=30)

# Hotel logo used on the PDF bill (copy hotel_logo.jpg into backend/assets/)
LOGO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "hotel_logo.jpg")

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")

# ---------- Brevo Setup (HTTP API - works on Render free plan, unlike SMTP) ----------
BREVO_API_KEY = os.getenv("BREVO_API_KEY")

# ---------- Gemini Setup ----------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-3.1-flash-lite")

# ---------- Razorpay Setup ----------
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# ---------- MongoDB Setup ----------
# Local MongoDB - no SSL/TLS needed
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
mongo = PyMongo(app)
bookings_collection = mongo.db.bookings
vouchers_collection = mongo.db.vouchers          # stores issued vouchers per customer
voucher_cycles_collection = mongo.db.voucher_cycles  # stores each customer's current cycle "baseline"


# ---------- Reusable Email Helper ----------
def send_email(to_email, subject, body, attachment_bytes=None, attachment_filename=None):
    """
    Common function to send any email (welcome mail, booking confirmation, etc.)
    Sends via the Brevo HTTP API (not SMTP), since Render's free plan
    blocks outbound SMTP ports (25/465/587).
    Optionally attaches a PDF (attachment_bytes = raw PDF bytes, attachment_filename = e.g. "bill.pdf").
    Returns True if sent, False if failed (never raises - caller decides what to do).
    """
    if not to_email:
        print("send_email skipped: no recipient email provided")
        return False

    try:
        payload = {
            "sender": {"name": "Hotel Heaven", "email": EMAIL_ADDRESS},
            "to": [{"email": to_email}],
            "subject": subject,
            "textContent": body
        }

        if attachment_bytes and attachment_filename:
            payload["attachment"] = [{
                "content": base64.b64encode(attachment_bytes).decode("utf-8"),
                "name": attachment_filename
            }]

        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            json=payload,
            headers={
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=15
        )

        if response.status_code in (200, 201):
            return True
        else:
            print("Brevo email sending failed:", response.status_code, response.text)
            return False

    except Exception as e:
        print("Email sending failed:", e)
        return False


# ---------- PDF Bill Generator (styled: navy + gold, table layout) ----------
def generate_bill_pdf(order_id, order_time, customer, cart_items, total, payment_method, voucher_discount=0, final_amount=None):
    """
    Builds a styled one-page PDF bill and returns it as raw bytes.
    customer = {"name", "email", "phone", "address", "city"}
    cart_items = [{"name", "price", "quantity"}, ...]
    """
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # ---- Theme colours (matches the peacock blue & gold presentation theme) ----
    NAVY = HexColor("#0a3d62")
    GOLD = HexColor("#c9a227")
    LIGHT_GRAY = HexColor("#f2f2f2")
    BORDER_GRAY = HexColor("#cccccc")
    DARK_GRAY = HexColor("#333333")
    WHITE = HexColor("#ffffff")
    RED = HexColor("#b00020")

    # ---------- Header Banner ----------
    header_height = 32 * mm
    c.setFillColor(NAVY)
    c.rect(0, height - header_height, width, header_height, fill=1, stroke=0)

    # Logo on the left of the banner (falls back gracefully if the file is missing)
    text_x = 20 * mm
    logo_size = 20 * mm
    if os.path.exists(LOGO_PATH):
        try:
            logo_y = height - header_height + (header_height - logo_size) / 2
            c.drawImage(LOGO_PATH, 20 * mm, logo_y, width=logo_size, height=logo_size,
                        preserveAspectRatio=True, mask='auto')
            text_x = 20 * mm + logo_size + 6 * mm
        except Exception as e:
            print("Logo could not be drawn on bill:", e)

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(text_x, height - 16 * mm, "HOTEL HEAVEN")

    c.setFillColor(WHITE)
    c.setFont("Helvetica", 10)
    c.drawString(text_x, height - 24 * mm, "Your Comfort, Our Priority")

    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, height - 14 * mm, f"Order ID: {order_id}")
    c.drawRightString(width - 20 * mm, height - 20 * mm, f"Date: {order_time}")

    y = height - header_height - 12 * mm

    # ---------- Bill To box ----------
    box_top = y
    box_height = 28 * mm
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.5)
    c.roundRect(20 * mm, box_top - box_height, width - 40 * mm, box_height, 3, fill=0, stroke=1)

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(25 * mm, box_top - 7 * mm, "BILL TO")

    c.setFillColor(DARK_GRAY)
    c.setFont("Helvetica", 10)
    ty = box_top - 13 * mm
    for label, value in [
        ("Name", customer.get("name", "")),
        ("Email", customer.get("email", "")),
        ("Phone", customer.get("phone", "")),
        ("Address", f'{customer.get("address", "")}, {customer.get("city", "")}'),
    ]:
        c.drawString(25 * mm, ty, f"{label}: {value}")
        ty -= 5 * mm

    y = box_top - box_height - 10 * mm

    # ---------- Items table ----------
    table_left = 20 * mm
    table_right = width - 20 * mm
    col_qty_x = table_right - 45 * mm
    col_price_x = table_right - 5 * mm

    # header row
    c.setFillColor(NAVY)
    c.rect(table_left, y - 7 * mm, table_right - table_left, 7 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(table_left + 3 * mm, y - 5 * mm, "ITEM")
    c.drawCentredString(col_qty_x, y - 5 * mm, "QTY")
    c.drawRightString(col_price_x, y - 5 * mm, "AMOUNT")

    y -= 7 * mm
    c.setFont("Helvetica", 10)
    row_height = 7 * mm
    for i, item in enumerate(cart_items):
        # alternate row shading for readability
        if i % 2 == 1:
            c.setFillColor(LIGHT_GRAY)
            c.rect(table_left, y - row_height, table_right - table_left, row_height, fill=1, stroke=0)
        c.setFillColor(DARK_GRAY)
        c.drawString(table_left + 3 * mm, y - 5 * mm, str(item.get("name", "")))
        c.drawCentredString(col_qty_x, y - 5 * mm, str(item.get("quantity", 1)))
        c.drawRightString(col_price_x, y - 5 * mm, f'Rs.{item.get("price", "")}')
        y -= row_height

    c.setStrokeColor(BORDER_GRAY)
    c.line(table_left, y, table_right, y)
    y -= 10 * mm

    # ---------- Totals box ----------
    totals_width = 70 * mm
    totals_left = table_right - totals_width
    line_gap = 6 * mm

    c.setFont("Helvetica", 10)
    c.setFillColor(DARK_GRAY)
    c.drawString(totals_left, y, "Subtotal")
    c.drawRightString(table_right, y, f"Rs.{total}")
    y -= line_gap

    if voucher_discount:
        c.setFillColor(RED)
        c.drawString(totals_left, y, "Voucher Discount")
        c.drawRightString(table_right, y, f"- Rs.{voucher_discount}")
        y -= line_gap

    y -= 2 * mm
    c.setFillColor(NAVY)
    c.rect(totals_left - 3 * mm, y - 8 * mm, totals_width + 3 * mm, 10 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(totals_left, y - 5 * mm, "Total Payable")
    c.drawRightString(table_right, y - 5 * mm, f'Rs.{final_amount if final_amount is not None else total}')
    y -= 14 * mm

    c.setFillColor(DARK_GRAY)
    c.setFont("Helvetica", 10)
    c.drawString(totals_left, y, f"Payment Method: {payment_method}")

    # ---------- Footer ----------
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(20 * mm, 20 * mm, width - 20 * mm, 20 * mm)
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(DARK_GRAY)
    c.drawCentredString(width / 2, 14 * mm, "Thank you for choosing Hotel Heaven! We look forward to serving you again.")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()


@app.route('/')
def home():
    return "Hotel Heaven Backend Running!"


@app.route('/send-welcome-email', methods=['POST'])
def send_welcome_email():
    data = request.get_json()
    user_email = data.get('email')
    user_name = data.get('name', 'Guest')

    if not user_email:
        return jsonify({"error": "Email is required"}), 400

    subject = "Welcome to Hotel Heaven!"
    body = f"""Hi {user_name},

Welcome to Hotel Heaven! You have successfully logged in.

We're excited to have you with us. Explore our food menu, book rooms,
halls, and more!

Warm regards,
Hotel Heaven Team
"""

    sent = send_email(user_email, subject, body)
    if sent:
        return jsonify({"message": "Welcome email sent successfully!"}), 200
    else:
        return jsonify({"error": "Failed to send email"}), 500


# ---------- Booking Email Templates ----------
def build_booking_email(booking):
    """Builds a subject + body based on booking type (food / hall / room / parking).
    Parking bookings that are linked to a room booking (details.linkedRoomNumber
    present) get a combined "Room + Parking" confirmation email instead of a
    parking-only one."""
    b_type = booking.get("type", "")
    item_name = booking.get("itemName", "")
    user_name = booking.get("userName", "Guest")
    price = booking.get("price", "")
    details = booking.get("details", {}) or {}

    is_combined_room_parking = (b_type == "parking" and details.get("linkedRoomNumber"))

    titles = {
        "food": "Your Food Order is Confirmed!",
        "hall": "Your Hall Booking is Confirmed!",
        "room": "Your Room Booking is Confirmed!",
        "parking": "Your Parking Slot is Confirmed!",
    }

    if is_combined_room_parking:
        subject = "Your Room and Parking Booking is Confirmed!"
    else:
        subject = titles.get(b_type, "Your Booking is Confirmed!")

    # Extra lines only if present in details
    extra_lines = ""
    if details.get("roomNumber"):
        extra_lines += f"Room Number     : {details.get('roomNumber')}\n"
    if details.get("linkedRoomNumber"):
        extra_lines += f"Room Number     : {details.get('linkedRoomNumber')}\n"
    if details.get("bookingDate"):
        extra_lines += f"Booking Date    : {details.get('bookingDate')}\n"
    if details.get("phone"):
        extra_lines += f"Phone           : {details.get('phone')}\n"
    if details.get("address"):
        extra_lines += f"Address         : {details.get('address')}\n"
    if details.get("slot"):
        extra_lines += f"Parking Slot    : {details.get('slot')}\n"
    if details.get("vehicleNumber"):
        extra_lines += f"Vehicle Number  : {details.get('vehicleNumber')}\n"
    if details.get("vehicleType"):
        extra_lines += f"Vehicle Type    : {details.get('vehicleType')}\n"
    if details.get("ratePerDay"):
        extra_lines += f"Parking Rate    : Rs.{details.get('ratePerDay')} / day\n"
    if details.get("days") and b_type == "parking":
        extra_lines += f"Parking Days    : {details.get('days')}\n"

    if is_combined_room_parking:
        body = f"""Hi {user_name},

Thank you for booking your room and parking slot with us! Here are your details:

{extra_lines}Parking Charge  : Rs.{details.get('ratePerDay', 150)} per day
Parking Total   : Rs.{price}

We look forward to serving you.

Warm regards,
Hotel Heaven Team
"""
    else:
        body = f"""Hi {user_name},

Thank you for choosing Hotel Heaven! Here are your booking details:

Booking Type    : {b_type.capitalize()}
Item            : {item_name}
{extra_lines}Price           : {price}

We look forward to serving you.

Warm regards,
Hotel Heaven Team
"""
    return subject, body


def build_checkout_reminder_email(booking):
    """Subject + body for the checkout reminder mail (room bookings only)."""
    user_name = booking.get("userName", "Guest")
    item_name = booking.get("itemName", "")
    details = booking.get("details", {}) or {}
    checkout_time = details.get("checkoutTime", "")

    # DB la checkoutTime UTC la irukkum; customer ku IST la kaatturom
    try:
        checkout_dt_utc = datetime.fromisoformat(checkout_time.replace("Z", ""))
        checkout_time = (checkout_dt_utc + IST_OFFSET).strftime("%d %b %Y, %I:%M %p") + " (IST)"
    except ValueError:
        pass

    subject = "Checkout Reminder - Hotel Heaven"
    body = f"""Hi {user_name},

This is a friendly reminder that your checkout time is approaching.

Room          : {item_name}
Checkout Time : {checkout_time}

Kindly complete your checkout at the reception before the above time.
We hope you had a comfortable stay with us!

Warm regards,
Hotel Heaven Team
"""
    return subject, body


# ---------- Razorpay Routes (NEW) ----------

@app.route('/api/create-order', methods=['POST'])
def create_order():
    """
    Frontend calls this BEFORE opening the Razorpay checkout popup.
    Body: { "amount": 410 }   (amount in normal rupees, NOT paise)
    Returns a Razorpay order_id which the frontend passes into the checkout popup.
    """
    data = request.get_json()
    amount = data.get("amount")

    if not amount or float(amount) <= 0:
        return jsonify({"error": "A valid amount is required"}), 400

    try:
        order = razorpay_client.order.create({
            "amount": int(float(amount) * 100),  # Razorpay expects paise (₹1 = 100 paise)
            "currency": "INR",
            "payment_capture": 1  # auto-capture payment after success
        })
        return jsonify({
            "orderId": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "keyId": RAZORPAY_KEY_ID  # frontend needs this to open the checkout popup
        }), 200
    except Exception as e:
        print("Razorpay order creation failed:", e)
        return jsonify({"error": "Could not create payment order"}), 500


@app.route('/api/verify-payment', methods=['POST'])
def verify_payment():
    """
    Frontend calls this AFTER the Razorpay checkout popup succeeds.
    Body: { "razorpay_order_id", "razorpay_payment_id", "razorpay_signature" }
    Verifies the signature so no one can fake a "successful payment" from the browser.
    """
    data = request.get_json()
    order_id = data.get("razorpay_order_id")
    payment_id = data.get("razorpay_payment_id")
    signature = data.get("razorpay_signature")

    if not (order_id and payment_id and signature):
        return jsonify({"error": "Missing payment verification fields"}), 400

    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        })
        return jsonify({"verified": True}), 200
    except razorpay.errors.SignatureVerificationError:
        return jsonify({"verified": False, "error": "Payment verification failed"}), 400


# ---------- NEW: Consolidated Bill Email (PDF attached) ----------
@app.route('/api/send-bill-email', methods=['POST'])
def send_bill_email():
    """
    Frontend calls this ONCE after all cart items are booked successfully.
    Sends one email with a PDF bill attached (instead of one email per item).
    Body: {
      "email", "customer": {name, email, phone, address, city},
      "cartItems": [{name, price, quantity}],
      "total", "voucherDiscount", "finalAmount", "paymentMethod", "orderId", "orderTime"
    }
    """
    data = request.get_json()
    to_email = data.get("email")
    if not to_email:
        return jsonify({"error": "email is required"}), 400

    pdf_bytes = generate_bill_pdf(
        order_id=data.get("orderId", ""),
        order_time=data.get("orderTime", ""),
        customer=data.get("customer", {}),
        cart_items=data.get("cartItems", []),
        total=data.get("total", 0),
        payment_method=data.get("paymentMethod", ""),
        voucher_discount=data.get("voucherDiscount", 0),
        final_amount=data.get("finalAmount"),
    )

    subject = "Your Hotel Heaven Bill"
    body = f"""Hi {data.get("customer", {}).get("name", "Guest")},

Thank you for choosing Hotel Heaven! Please find your bill attached as a PDF.

Warm regards,
Hotel Heaven Team
"""
    sent = send_email(to_email, subject, body, attachment_bytes=pdf_bytes, attachment_filename="Hotel_Heaven_Bill.pdf")

    if sent:
        return jsonify({"message": "Bill email sent!"}), 200
    else:
        return jsonify({"error": "Failed to send bill email"}), 500


# ---------- Room Auto-Release (NEW) ----------
def release_expired_rooms():
    """
    Checkout time mudinja room bookings ah "released" nu mark pannum,
    so andha room ah next customer book panna mudiyum.
    - Booking record delete aagadhu (admin history, analytics, vouchers ellam apdiye irukkum).
    - Just "roomReleased": True nu set aagum; booked-rooms list la irundhu remove aagum.
    Returns how many rooms were released in this run.
    """
    try:
        now = datetime.utcnow()
        released_count = 0

        # roomReleased field illaadha old bookings um include aagum ($ne True)
        active_rooms = bookings_collection.find({
            "type": "room",
            "roomReleased": {"$ne": True}
        })

        for booking in active_rooms:
            details = booking.get("details", {}) or {}
            checkout_str = details.get("checkoutTime")
            if not checkout_str:
                continue

            try:
                checkout_dt = datetime.fromisoformat(checkout_str.replace("Z", ""))
            except ValueError:
                continue

            if now >= checkout_dt:
                bookings_collection.update_one(
                    {"_id": booking["_id"]},
                    {"$set": {
                        "roomReleased": True,
                        "roomReleasedAt": now.isoformat() + "Z"
                    }}
                )
                released_count += 1
                print(f"Room released after checkout: {booking.get('itemName')}")

        return released_count

    except Exception as e:
        print("Room auto-release failed:", e)
        return 0


# ---------- Booking Routes ----------
# type: "room" | "hall" | "parking" | "food"

@app.route('/api/book', methods=['POST'])
def create_booking():
    data = request.get_json()

    required_fields = ["type", "itemName"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    created_at = datetime.utcnow()
    details = data.get("details", {}) or {}

    # For room bookings, calculate the checkout time from the customer's
    # chosen check-in date+time (bookingDate field) + number of days.
    if data.get("type") == "room":
        days = details.get("days", 1) or 1
        try:
            days = int(days)
        except (ValueError, TypeError):
            days = 1

        check_in_str = details.get("bookingDate")
        if check_in_str:
            try:
                # Customer type panna time IST (datetime-local, timezone illa).
                # UTC ku maathi vaikkurom, appo dhaan scheduler (utcnow) correct ah compare pannum.
                check_in_datetime = datetime.fromisoformat(check_in_str) - IST_OFFSET
            except ValueError:
                check_in_datetime = created_at
        else:
            check_in_datetime = created_at

        checkout_datetime = check_in_datetime + timedelta(days=days)
        details["checkInTime"] = check_in_datetime.isoformat() + "Z"
        details["checkoutTime"] = checkout_datetime.isoformat() + "Z"

    booking = {
        "type": data.get("type"),          # room / hall / parking / food
        "itemName": data.get("itemName"),  # e.g. "Standard Room 102"
        "userName": data.get("userName", "Guest"),
        "userEmail": data.get("userEmail", ""),
        "price": data.get("price", ""),
        # Bill la varra same Order ID - frontend "orderId" ah top-level la illa details la anuppinaalum edukkum.
        # Admin la "Search Order ID" ku idhu dhaan use aagum.
        "orderId": data.get("orderId") or details.get("orderId") or "",
        "details": details,  # any extra info (dates, qty, checkoutTime, slot, vehicleType etc.)
        "status": "confirmed",
        "checkoutReminderSent": False,   # used by the reminder scheduler below
        "roomReleased": False,           # room bookings: checkout mudinja aprm True aagum (auto-release)
        "createdAt": created_at.isoformat() + "Z"
    }

    result = bookings_collection.insert_one(booking)
    booking["_id"] = str(result.inserted_id)

    # Send confirmation email (booking still succeeds even if email fails)
    email_sent = False
    if booking.get("userEmail"):
        subject, body = build_booking_email(booking)
        email_sent = send_email(booking["userEmail"], subject, body)

    # After a room/food booking, check if this customer just crossed
    # a voucher threshold (within their current cycle), and issue one if so.
    voucher_issued = None
    if booking.get("userEmail") and data.get("type") in ("room", "food"):
        voucher_issued = check_and_issue_voucher(booking["userEmail"], booking.get("userName", "Guest"))

    return jsonify({
        "message": "Booking successful!",
        "booking": booking,
        "emailSent": email_sent,
        "voucherIssued": voucher_issued   # None, or the new voucher dict if one was just unlocked
    }), 201


@app.route('/api/bookings', methods=['GET'])
def get_all_bookings():
    """Admin - full booking history.
    Optional filters:
      /api/bookings?type=room            -> only that booking type
      /api/bookings?orderId=order_Nxyz   -> bookings whose Order ID matches (case-insensitive, partial match ok)
    """
    booking_type = request.args.get('type')
    order_id = (request.args.get('orderId') or "").strip()

    query = {"type": booking_type} if booking_type else {}
    if order_id:
        query["orderId"] = {"$regex": re.escape(order_id), "$options": "i"}

    bookings = list(bookings_collection.find(query).sort("createdAt", -1))
    for b in bookings:
        b["_id"] = str(b["_id"])

    return jsonify(bookings), 200


@app.route('/api/booked-rooms', methods=['GET'])
def get_booked_rooms():
    """Returns just the itemName list of CURRENTLY booked rooms, so Room page can mark them as Booked.
    Checkout time mudinja rooms ah first release pannitu, apram thaan list tharum -
    so scheduler-ku wait pannaama udane free aagum."""
    release_expired_rooms()

    rooms = bookings_collection.find(
        {"type": "room", "roomReleased": {"$ne": True}},
        {"itemName": 1}
    )
    booked_names = [r["itemName"] for r in rooms]
    return jsonify(booked_names), 200


@app.route('/api/booked-halls', methods=['GET'])
def get_booked_halls():
    """Returns itemName list of booked halls, so Hall page can mark them as Booked"""
    halls = bookings_collection.find({"type": "hall"}, {"itemName": 1})
    booked_names = [h["itemName"] for h in halls]
    return jsonify(booked_names), 200


@app.route('/api/booked-parking', methods=['GET'])
def get_booked_parking():
    """Returns list of slot codes (e.g. B1, C5, O10) that are already booked,
    so Parking page can mark them Red (booked) vs Green (available)."""
    parking_bookings = bookings_collection.find({"type": "parking"}, {"details.slot": 1})
    booked_slots = []
    for b in parking_bookings:
        slot = b.get("details", {}).get("slot")
        if slot:
            booked_slots.append(slot)
    return jsonify(booked_slots), 200


# ---------- Voucher Logic ----------
# Thresholds checked against the CYCLE total (total_purchase - baseline), not
# the lifetime total. Highest checked first so a big jump straight past 10000
# in one booking gets the bigger voucher, not both.
VOUCHER_THRESHOLDS = [
    (10000, 1000),
    (5000, 500),
]
ALL_THRESHOLDS = set(t for t, _ in VOUCHER_THRESHOLDS)  # {10000, 5000} - used for cycle-reset check
VOUCHER_VALID_DAYS = 1


def parse_price_to_number(price_value):
    """
    price field DB la string ah irukalam ("1500", "₹1500", "1,500" etc).
    Idhu andha string la irundhu numbers mattum edunthu float ah convert pannum.
    Onnum kedaikama irundha 0 return pannum (crash agaadhu).
    """
    if price_value is None:
        return 0.0
    if isinstance(price_value, (int, float)):
        return float(price_value)

    cleaned = re.sub(r"[^\d.]", "", str(price_value))
    if cleaned == "" or cleaned == ".":
        return 0.0
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def calculate_purchase_total(email):
    """Sums price of this customer's room + food bookings only (not hall/parking).
    This is the LIFETIME total, never resets."""
    total = 0.0
    cursor = bookings_collection.find(
        {"userEmail": email, "type": {"$in": ["room", "food"]}},
        {"price": 1}
    )
    for b in cursor:
        total += parse_price_to_number(b.get("price"))
    return total


def get_cycle_baseline(email):
    """The lifetime-total value at which the customer's current voucher cycle started.
    Starts at 0 for a brand new customer."""
    doc = voucher_cycles_collection.find_one({"userEmail": email})
    return doc["baseline"] if doc else 0.0


def set_cycle_baseline(email, new_baseline):
    voucher_cycles_collection.update_one(
        {"userEmail": email},
        {"$set": {"baseline": new_baseline}},
        upsert=True
    )


def check_and_issue_voucher(email, user_name="Guest"):
    """
    Call this right after a room or food booking is created.
    Checks (total_purchase - current cycle baseline) against the thresholds;
    if the customer crossed one they haven't claimed yet THIS CYCLE, issues a voucher.
    Returns the new voucher dict if one was issued, else None.
    """
    total = calculate_purchase_total(email)
    baseline = get_cycle_baseline(email)
    cycle_total = total - baseline

    # thresholds already claimed within the CURRENT cycle only (baseline must match)
    claimed_this_cycle = set(
        v["threshold"] for v in vouchers_collection.find(
            {"userEmail": email, "baseline": baseline}, {"threshold": 1}
        )
    )

    for threshold, amount in VOUCHER_THRESHOLDS:
        if cycle_total >= threshold and threshold not in claimed_this_cycle:
            now = datetime.utcnow()
            voucher = {
                "userEmail": email,
                "userName": user_name,
                "threshold": threshold,
                "amount": amount,
                "remainingAmount": amount,
                "baseline": baseline,       # ties this voucher to its cycle
                "status": "active",          # active | used | expired
                "createdAt": now.isoformat() + "Z",
                "expiresAt": (now + timedelta(days=VOUCHER_VALID_DAYS)).isoformat() + "Z"
            }
            result = vouchers_collection.insert_one(voucher)
            voucher["_id"] = str(result.inserted_id)
            return voucher

    return None


def maybe_reset_cycle(email):
    """
    After a voucher is used (fully or partially - no carry-forward, so any use
    closes it), check whether BOTH thresholds for the current cycle have been
    used. If so, start a new cycle: baseline becomes the current lifetime total,
    so the customer needs a fresh 5000/10000 from this point to unlock again.
    """
    baseline = get_cycle_baseline(email)
    used_thresholds = set(
        v["threshold"] for v in vouchers_collection.find(
            {"userEmail": email, "baseline": baseline, "status": "used"}
        )
    )
    if ALL_THRESHOLDS.issubset(used_thresholds):
        new_baseline = calculate_purchase_total(email)
        set_cycle_baseline(email, new_baseline)


def expire_old_vouchers(email):
    """Marks any of this customer's active vouchers as expired if past expiresAt."""
    now = datetime.utcnow()
    active_vouchers = vouchers_collection.find({"userEmail": email, "status": "active"})
    for v in active_vouchers:
        try:
            expires_at = datetime.fromisoformat(v["expiresAt"].replace("Z", ""))
        except (ValueError, KeyError):
            continue
        if now > expires_at:
            vouchers_collection.update_one(
                {"_id": v["_id"]},
                {"$set": {"status": "expired"}}
            )


@app.route('/api/voucher-status/<email>', methods=['GET'])
def voucher_status(email):
    """
    Frontend calls this on page load (customer logged in) to check:
    - their current lifetime total purchase
    - whether they have an active, unexpired voucher to show as a notification
    """
    expire_old_vouchers(email)  # clean up first, so we never return a stale one

    total = calculate_purchase_total(email)

    active_voucher = vouchers_collection.find_one({"userEmail": email, "status": "active"})
    if active_voucher:
        active_voucher["_id"] = str(active_voucher["_id"])

    return jsonify({
        "totalPurchase": round(total, 2),
        "activeVoucher": active_voucher
    }), 200


@app.route('/api/voucher/redeem', methods=['POST'])
def redeem_voucher():
    """
    Called when a customer places a food order using their voucher.
    Body: { "voucherId": "...", "orderAmount": 300 }

    NO CARRY-FORWARD: the moment a voucher is used (for any amount), it closes
    completely - status becomes "used" and any leftover balance is forfeited.
    """
    data = request.get_json()
    voucher_id = data.get("voucherId")
    order_amount = float(data.get("orderAmount", 0))

    if not voucher_id:
        return jsonify({"error": "voucherId is required"}), 400

    voucher = vouchers_collection.find_one({"_id": ObjectId(voucher_id)})
    if not voucher:
        return jsonify({"error": "Voucher not found"}), 404
    if voucher.get("status") != "active":
        return jsonify({"error": "Voucher is not active (used or expired)"}), 400

    # expiry check at redeem time too
    now = datetime.utcnow()
    expires_at = datetime.fromisoformat(voucher["expiresAt"].replace("Z", ""))
    if now > expires_at:
        vouchers_collection.update_one({"_id": voucher["_id"]}, {"$set": {"status": "expired"}})
        return jsonify({"error": "Voucher has expired"}), 400

    remaining = voucher.get("remainingAmount", 0)
    covered_by_voucher = min(order_amount, remaining)
    customer_pays = order_amount - covered_by_voucher

    # No carry-forward: voucher closes completely on use, regardless of leftover
    vouchers_collection.update_one(
        {"_id": voucher["_id"]},
        {"$set": {"remainingAmount": 0, "status": "used"}}
    )

    # Check if this closes out the whole cycle (both thresholds used) -> reset
    maybe_reset_cycle(voucher["userEmail"])

    return jsonify({
        "coveredByVoucher": covered_by_voucher,
        "customerPays": customer_pays,
        "remainingVoucherBalance": 0,
        "voucherStatus": "used"
    }), 200


# ---------- Analytics Route ----------
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """
    Sales data grouped by daily / weekly / monthly - admin choose panra range ku match aagum.
    Query params:
      - type: optional, filter by booking type (room/hall/food/parking)
      - range: "daily" | "weekly" | "monthly" (default "monthly")
    Returns: [{"month": "09 Sep", "totalSales": 410, "totalBookings": 1}, ...]
    """
    booking_type = request.args.get('type')
    range_type = request.args.get('range', 'monthly')  # daily | weekly | monthly

    query = {"type": booking_type} if booking_type else {}
    bookings = bookings_collection.find(query, {"createdAt": 1, "price": 1})

    grouped = {}

    for b in bookings:
        created_str = b.get("createdAt", "")
        try:
            dt = datetime.fromisoformat(created_str.replace("Z", ""))
        except (ValueError, TypeError):
            continue  # skip bad/missing dates instead of crashing

        amount = parse_price_to_number(b.get("price"))

        if range_type == "daily":
            key = dt.strftime("%Y-%m-%d")
            label = dt.strftime("%d %b")           # e.g. "09 Sep"
        elif range_type == "weekly":
            year, week_num, _ = dt.isocalendar()
            key = f"{year}-W{week_num:02d}"
            label = f"Week {week_num}, {year}"      # e.g. "Week 36, 2026"
        else:  # monthly (default)
            key = f"{dt.year}-{dt.month:02d}"
            label = f"{calendar.month_abbr[dt.month]} {dt.year}"  # e.g. "Sep 2026"

        if key not in grouped:
            grouped[key] = {
                "label": label,
                "totalSales": 0.0,
                "totalBookings": 0
            }

        grouped[key]["totalSales"] += amount
        grouped[key]["totalBookings"] += 1

    # keys sort chronologically naturally (YYYY-MM-DD, YYYY-Wnn, YYYY-MM all sort correctly as strings)
    sorted_keys = sorted(grouped.keys())
    result = []
    for key in sorted_keys:
        entry = grouped[key]
        result.append({
            "month": entry["label"],
            "totalSales": round(entry["totalSales"], 2),
            "totalBookings": entry["totalBookings"]
        })

    return jsonify(result), 200


# ---------- AI Chatbot ----------

HOTEL_CONTEXT = """
Nee "Hotel Heaven" hotel-oda friendly AI assistant. Customer kேட்கும் questions ku,
kீzhа irukura hotel details vечhu mattum answer pannu. Chinna-ah, friendly-ah,
2-4 lines-la reply pannu. Theriyaadha kேள்வி na, "Please contact our front desk for more details" nu solu.

===== ROOMS (per night) =====
- Standard - Rs.2000 (AC, TV, Wi-Fi, Queen Bed, Bathroom) - Rooms: 101-108
- Deluxe - Rs.2800 (AC, Smart TV, Wi-Fi, King Bed, Mini Fridge) - Rooms: 201-204
- Premium - Rs.3500 (AC, Smart TV, King Bed, Sofa, City View) - Rooms: 301-303
- Family - Rs.4200 (AC, Smart TV, 1 King + 2 Single Beds, Large Space) - Rooms: 401-402
- Executive Suite - Rs.5000 (AC, Smart TV, King Bed, Sofa, Separate Living Room) - Rooms: 501-502
- Luxury Suite - Rs.7000 (AC, Smart TV, King Bed, Balcony, Bathtub, Living Room) - Room: 601
- Check-in: Anytime you arrive (no fixed clock time) | Check-out: Exactly N days after your booking time (e.g. booked 3 PM for 1 day → checkout by next day 3 PM). A reminder email is auto-sent 1 hour before checkout.

===== HALLS (per event) =====
- Conference Hall - Rs.20,000 - Capacity 100 guests - for meetings, seminars, workshops
- Royal Party Hall - Rs.40,000 - Capacity 80-120 guests - for birthdays, anniversaries, get-togethers
- Grand Celebration Hall - Rs.75,000 - Capacity 200-250 guests - for weddings, receptions, cultural events
- All halls are fully air-conditioned with sound system, seating and decoration support

===== PARKING =====
- Rs.150 per slot, 30 total slots (10 Bike, 10 Car, 10 Other)

===== FOOD MENU =====
Wide menu available covering South Indian (Rs.25-300), Combo Meals (Rs.200-730),
Fast Food - pizza/burgers/pasta (Rs.70-300), Veg Specials (Rs.120-190),
Non-Veg - Chicken/Mutton/Fish/Egg/Prawns/Crab (Rs.60-500), Desserts - cakes/pies/pastries/ice-cream (Rs.60-1150),
Drinks (Rs.70-170). Full menu with photos is on the Food page of the website.

===== GENERAL =====
- Modules available: Room Booking, Hall Booking, Food Ordering, Parking Booking
- Booking confirmation is sent via email automatically
"""


def get_live_availability():
    """Live booking status from MongoDB, appended to every chatbot prompt."""
    # Checkout mudinja rooms ah first release pannidrom, so chatbot correct availability solum
    release_expired_rooms()

    booked_rooms = [
        b["itemName"] for b in bookings_collection.find(
            {"type": "room", "roomReleased": {"$ne": True}}, {"itemName": 1}
        )
    ]
    booked_halls = [b["itemName"] for b in bookings_collection.find({"type": "hall"}, {"itemName": 1})]
    booked_slots = []
    for b in bookings_collection.find({"type": "parking"}, {"details.slot": 1}):
        slot = b.get("details", {}).get("slot")
        if slot:
            booked_slots.append(slot)

    return f"""
===== CURRENT LIVE AVAILABILITY =====
- Booked Rooms (unavailable): {', '.join(booked_rooms) if booked_rooms else 'None - all rooms available'}
- Booked Halls (unavailable): {', '.join(booked_halls) if booked_halls else 'None - all halls available'}
- Booked Parking Slots (unavailable): {', '.join(booked_slots) if booked_slots else 'None - all 30 slots available'} (out of 30 total)
"""


@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.get_json()
    user_message = (data or {}).get('message', '').strip()

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    try:
        live_info = get_live_availability()
        full_prompt = f"{HOTEL_CONTEXT}\n{live_info}\n\nCustomer: {user_message}\nAssistant:"

        response = gemini_model.generate_content(full_prompt)
        reply_text = response.text

        return jsonify({"reply": reply_text}), 200

    except Exception as e:
        print("Chatbot error:", e)
        return jsonify({"reply": "Sorry, chatbot ippo konjam busy iruku. Please try again illa front desk-a contact pannunga."}), 200


# ---------- Checkout Reminder Scheduler ----------
def send_checkout_reminders():
    """
    Runs automatically every 5 minutes in the background.
    Sends a reminder email to guests whose checkout time is within
    the next 1 hour, and haven't been reminded already.
    Simple version: doesn't check whether the guest has actually
    checked out - it's a courtesy reminder, sent once per booking.
    """
    now = datetime.utcnow()
    reminder_window_end = now + timedelta(hours=1)

    # Only room bookings that haven't been reminded yet
    pending = bookings_collection.find({
        "type": "room",
        "checkoutReminderSent": False
    })

    for booking in pending:
        details = booking.get("details", {}) or {}
        checkout_str = details.get("checkoutTime")
        if not checkout_str:
            continue

        try:
            checkout_dt = datetime.fromisoformat(checkout_str.replace("Z", ""))
        except ValueError:
            continue

        # Send if checkout time falls within the next 1 hour window
        if now <= checkout_dt <= reminder_window_end:
            user_email = booking.get("userEmail")
            if user_email:
                subject, body = build_checkout_reminder_email(booking)
                sent = send_email(user_email, subject, body)
                if sent:
                    print(f"Checkout reminder sent to {user_email} for {booking.get('itemName')}")

            # Mark as sent regardless, so we don't retry endlessly if email fails
            bookings_collection.update_one(
                {"_id": booking["_id"]},
                {"$set": {"checkoutReminderSent": True}}
            )


scheduler = BackgroundScheduler()
scheduler.add_job(func=send_checkout_reminders, trigger="interval", minutes=5)
# NEW: every 1 minute checkout mudinja rooms ah automatic ah free pannum
scheduler.add_job(func=release_expired_rooms, trigger="interval", minutes=1)
scheduler.start()


if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)