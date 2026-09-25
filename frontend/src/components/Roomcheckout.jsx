import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import "./Rooms.css";

// ---------- Razorpay public Key ID (safe to expose in frontend - NOT the secret) ----------
// Backend kudukkura keyId ye first use aagum; idhu just fallback.
const RAZORPAY_KEY_ID = "rzp_test_TeFdyXXi625Mk3";

// Nandhini QR image -> frontend/public/nandhini-qr.jpeg
const QR_IMAGE_SRC = "/nandhini-qr.jpeg";

// Same slot ranges as Parking.jsx
const BIKE_SLOTS = Array.from({ length: 10 }, (_, i) => i + 1);    // 1-10
const CAR_SLOTS = Array.from({ length: 10 }, (_, i) => i + 11);    // 11-20
const OTHER_SLOTS = Array.from({ length: 10 }, (_, i) => i + 21);  // 21-30

function getSlotsForType(vehicleType) {
  if (vehicleType === "Bike") return BIKE_SLOTS;
  if (vehicleType === "Car") return CAR_SLOTS;
  return OTHER_SLOTS;
}

// ---------- Check-in date & time ah always 12-hour AM/PM la kaatta ----------
function formatCheckIn(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Date + Hour + Minute + AM/PM ah serthu "YYYY-MM-DDTHH:MM" (24h) string aakkum.
// Backend idhaiye expect pannum, so backend maatha vendaam.
function buildBookingDate({ date, hour, minute, ampm }) {
  if (!date || !hour) return "";
  let h = parseInt(hour, 10) % 12;
  if (ampm === "PM") h += 12;
  return `${date}T${String(h).padStart(2, "0")}:${minute}`;
}

// ---------- Load the Razorpay Checkout.js script only once ----------
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ---------- 3 payment options: hotel | razorpay | qr ----------
const PAYMENT_OPTIONS = [
  { value: "hotel", icon: "🏨", title: "Cash at Hotel", sub: "Pay at reception" },
  { value: "razorpay", icon: "💳", title: "Online Payment", sub: "Card / Netbanking" },
  { value: "qr", icon: "📱", title: "Pay with QR", sub: "Scan & pay via UPI" },
];

function PaymentMethodSelector({ value, onChange, groupName }) {
  return (
    <div className="d-flex gap-2 flex-wrap">
      {PAYMENT_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <div
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: "1 1 30%",
              minWidth: "120px",
              border: selected ? "2px solid #ffc107" : "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px 12px",
              cursor: "pointer",
              backgroundColor: selected ? "#fff8e1" : "#fff",
              fontWeight: selected ? "bold" : "normal",
              fontSize: "0.9rem",
            }}
          >
            <input
              type="radio"
              name={groupName}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="me-2"
            />
            {opt.icon} {opt.title}
            <div className="text-muted" style={{ fontSize: "0.75rem", fontWeight: "normal" }}>
              {opt.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- QR box: shows Nandhini QR + UTR input ----------
function QrPaymentBox({ amount, utr, setUtr }) {
  return (
    <div
      className="border rounded p-3 mb-3 text-center"
      style={{ backgroundColor: "#fffdf5" }}
    >
      <p className="fw-semibold mb-2">Scan & pay ₹{amount}</p>
      <img
        src={QR_IMAGE_SRC}
        alt="UPI QR Code"
        style={{
          maxWidth: "220px",
          width: "100%",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      />
      <p className="text-muted mt-2 mb-3" style={{ fontSize: "0.85rem" }}>
        Pay the exact amount, then enter the 12-digit UTR / Reference No. from your UPI app below.
      </p>
      <input
        type="text"
        className="form-control text-center"
        placeholder="12-digit UTR / Reference No."
        value={utr}
        maxLength={12}
        inputMode="numeric"
        onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
      />
      <small className="text-muted d-block mt-2">
        Booking is confirmed only after our team verifies your payment.
      </small>
    </div>
  );
}

function RoomCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const cart = location.state?.cart || [];

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    address: "",
    city: "",
    roomNumber: cart.map((item) => item.roomNumber).join(", "),
    phone: "",
    bookingDate: "", // now holds check-in DATE + TIME (datetime-local value)
  });

  // ---------- Check-in: date + hour + minute + AM/PM (separate boxes) ----------
  const [checkIn, setCheckIn] = React.useState({
    date: "",
    hour: "",
    minute: "00",
    ampm: "AM",
  });

  // ---------- Payment method: "hotel" | "razorpay" | "qr" ----------
  const [paymentMethod, setPaymentMethod] = React.useState("razorpay");
  const [roomUtr, setRoomUtr] = React.useState("");
  const [roomQrPending, setRoomQrPending] = React.useState(false);

  const [orderPlaced, setOrderPlaced] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [payingNow, setPayingNow] = React.useState(false); // Razorpay modal open aagum pothu

  // ---- Parking flow states ----
  const PARKING_RATE_PER_DAY = 150;
  const [parkingChoice, setParkingChoice] = React.useState(null); // null | "yes" | "no"
  const [parkingPaymentMethod, setParkingPaymentMethod] = React.useState("razorpay");
  const [parkingUtr, setParkingUtr] = React.useState("");
  const [parkingQrPending, setParkingQrPending] = React.useState(false);
  const [parkingForm, setParkingForm] = React.useState({
    name: "",
    email: "",
    vehicleNumber: "",
    vehicleCategory: "Bike", // Bike | Car | Other -> decides which slot range to show
    vehicleType: "Bike",     // actual type sent to backend (Bike, Car, Van, Bus)
    slot: null,
  });
  const [parkingSubmitting, setParkingSubmitting] = React.useState(false);
  const [parkingBooked, setParkingBooked] = React.useState(false);
  const [parkingPayingNow, setParkingPayingNow] = React.useState(false);

  // Live booked-slot list, fetched from backend
  const [parkingBookedSlots, setParkingBookedSlots] = React.useState([]);
  const [parkingSlotsLoading, setParkingSlotsLoading] = React.useState(true);

  // ---------- Lock the email to the logged-in Google account ----------
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setForm((prev) => ({
          ...prev,
          email: currentUser.email || "",
          name: prev.name || currentUser.displayName || "",
        }));
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    fetch("http://localhost:5000/api/booked-parking")
      .then((res) => res.json())
      .then((data) => {
        setParkingBookedSlots(data.map((s) => Number(s)));
        setParkingSlotsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch booked parking slots:", err);
        setParkingSlotsLoading(false);
      });
  }, []);

  const roomDays = cart.length > 0 ? cart[0].days || 1 : 1;
  const parkingTotal = PARKING_RATE_PER_DAY * roomDays;

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckInChange = (field, value) => {
    const next = { ...checkIn, [field]: value };
    setCheckIn(next);
    // form.bookingDate la "YYYY-MM-DDTHH:MM" ah save aagum (backend format)
    setForm((prev) => ({ ...prev, bookingDate: buildBookingDate(next) }));
  };

  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const handleParkingChange = (e) => {
    const { name, value } = e.target;
    setParkingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setParkingForm((prev) => ({
      ...prev,
      vehicleCategory: category,
      // Bike/Car: vehicleType = category itself. Other: default to "Van" until user picks.
      vehicleType: category === "Other" ? "Van" : category,
      slot: null, // category maarina, already select pannirundha slot reset pannurom
    }));
  };

  const handleOtherTypeChange = (e) => {
    setParkingForm((prev) => ({ ...prev, vehicleType: e.target.value }));
  };

  const handleSlotClick = (slotNum) => {
    if (parkingBookedSlots.includes(slotNum)) return;
    setParkingForm((prev) => ({ ...prev, slot: slotNum }));
  };

  // ---------- Send the consolidated PDF bill email ----------
  // includeParking = true -> room + parking dhaan onnu serthu oru bill;
  // false -> room mattum (parking vendam nu customer sonna pothu)
  const sendBillEmail = async (includeParking, paymentLabel) => {
    try {
      const cartItems = cart.map((item) => ({
        name: `${item.roomType} - Room ${item.roomNumber}`,
        price: item.price,
        quantity: 1,
      }));

      let billTotal = total;

      if (includeParking) {
        cartItems.push({
          name: `Parking Slot ${parkingForm.slot} (${parkingForm.vehicleType} - ${parkingForm.vehicleNumber})`,
          price: parkingTotal,
          quantity: 1,
        });
        billTotal += parkingTotal;
      }

      await fetch("http://localhost:5000/api/send-bill-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: auth.currentUser.email,
          customer: {
            name: form.name,
            email: auth.currentUser.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
          },
          cartItems,
          total: billTotal,
          finalAmount: billTotal,
          paymentMethod: paymentLabel,
          orderId: `ROOM-${Date.now()}`,
          orderTime: new Date().toLocaleString(),
        }),
      });
    } catch (err) {
      // Bill email fail aana kooda booking already save aayiduchu, so just log pannurom
      console.error("Bill email failed:", err);
    }
  };

  // ---------- Actually save the ROOM booking to MongoDB ----------
  // paymentStatus: "Paid" (Razorpay) | "Pending Verification" (QR) | "Pay at Hotel"
  const placeRoomBooking = async (paidNowLabel, paymentStatus, utr = "") => {
    setSubmitting(true);
    try {
      const loggedInEmail = auth.currentUser.email;

      // Ovvoru room-um separate booking-ah backend ku anupurom
      await Promise.all(
        cart.map((item) =>
          fetch("http://localhost:5000/api/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "room",
              itemName: `${item.roomType} - Room ${item.roomNumber}`,
              userName: form.name,
              userEmail: loggedInEmail, // always the logged-in email, not the typed one
              price: item.price,
              details: {
                roomNumber: item.roomNumber,
                address: form.address,
                city: form.city,
                phone: form.phone,
                days: item.days || 1,
                bookingDate: form.bookingDate, // check-in date + time (datetime-local string)
                paymentMethod: paidNowLabel,
                paymentStatus: paymentStatus,
                utr: utr,
              },
            }),
          })
        )
      );

      // Bill email only when payment is actually completed online
      if (paymentStatus === "Paid") {
        sendBillEmail(false, paidNowLabel);
      }

      setRoomQrPending(paymentStatus === "Pending Verification");

      // Parking form la name/email room form la irundhu pre-fill pannurom
      setParkingForm((prev) => ({
        ...prev,
        name: form.name,
        email: loggedInEmail,
      }));

      setOrderPlaced(true);
    } catch (err) {
      console.error("Booking save failed:", err);
      alert("Booking was not saved. Please check whether the backend is running!");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Actually save the PARKING booking to MongoDB ----------
  const placeParkingBooking = async (paidNowLabel, paymentStatus, utr = "") => {
    setParkingSubmitting(true);
    try {
      await fetch("http://localhost:5000/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "parking",
          itemName: `Parking Slot ${parkingForm.slot}`,
          userName: parkingForm.name,
          userEmail: auth.currentUser.email, // always the logged-in email
          price: parkingTotal,
          details: {
            slot: String(parkingForm.slot),
            vehicleNumber: parkingForm.vehicleNumber,
            vehicleType: parkingForm.vehicleType,
            ratePerDay: PARKING_RATE_PER_DAY,
            days: roomDays,
            linkedRoomNumber: form.roomNumber,
            bookingDate: form.bookingDate,
            paymentMethod: paidNowLabel,
            paymentStatus: paymentStatus,
            utr: utr,
          },
        }),
      });

      setParkingBookedSlots((prev) => [...prev, parkingForm.slot]);
      setParkingQrPending(paymentStatus === "Pending Verification");
      setParkingBooked(true);

      // Room + Parking serthu oru consolidated bill email anupurom
      sendBillEmail(true, paidNowLabel);
    } catch (err) {
      console.error("Parking booking save failed:", err);
      alert("Parking Booking could not be saved. Please check wheather the backend server is running...");
    } finally {
      setParkingSubmitting(false);
    }
  };

  // ============================================================
  // ---------- RAZORPAY PAYMENT FLOW (shared helper) ----------
  // amount = rupees (not paise); onSuccess(paymentId) called after
  // backend verifies the payment signature.
  // ============================================================
  const startRazorpayPayment = async ({ amount, customerName, customerEmail, customerPhone, onSuccess, setBusy }) => {
    setBusy(true);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        alert("Razorpay could not be loaded. Please check your internet connection and try again.");
        setBusy(false);
        return;
      }

      // Step 1: Backend la order create pannurom
      const orderRes = await fetch("http://localhost:5000/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const orderData = await orderRes.json();

      if (!orderData.orderId) {
        console.error("Create order response:", orderData);
        alert("Unable to create the payment order. Please check whether the backend server is running..");
        setBusy(false);
        return;
      }

      // Step 2: Razorpay checkout popup open pannurom
      const options = {
        key: orderData.keyId || RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Hotel Heaven",
        description: "Booking Payment",
        order_id: orderData.orderId,
        handler: async function (response) {
          // Step 3: Payment success aana, backend la signature verify pannurom
          try {
            const verifyRes = await fetch("http://localhost:5000/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.verified) {
              onSuccess(response.razorpay_payment_id);
            } else {
              alert("Payment could not be verified. Even if the amount has been debited, the booking has not been confirmed. Please contact support.");
            }
          } catch (err) {
            console.error("Verification call failed:", err);
            alert("An error occurred while verifying the payment. Please contact support..");
          } finally {
            setBusy(false);
          }
        },
        modal: {
          // User checkout popup ah close pannitanunu, busy state reset pannurom
          ondismiss: function () {
            setBusy(false);
          },
        },
        prefill: {
          name: customerName || "",
          email: customerEmail || "",
          contact: customerPhone || "",
        },
        theme: { color: "#ffc107" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay payment failed:", err);
      alert("An error occurred while processing the payment. Please try again.");
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Please login first to book a room! 🔐");
      navigate("/login");
      return;
    }

    if (
      !form.name ||
      !form.email ||
      !form.address ||
      !form.city ||
      !form.roomNumber ||
      !form.phone ||
      !form.bookingDate
    ) {
      alert("FILL ALL THE DETAILS 📝");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      alert("ENTER YOUR CORRECT MAIL ID 📧");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      alert("PHONE NUMBER MUST BE 10 DIGITS 📱");
      return;
    }

    // Check-in time past-ah irukama check pannurom
    const now = new Date();
    const selectedDateTime = new Date(form.bookingDate);
    if (selectedDateTime < now) {
      alert("Check-in time cannot be in the past. 📅");
      return;
    }

    if (paymentMethod === "hotel") {
      // No payment now - pay at reception during check-in
      await placeRoomBooking("Pay at Hotel", "Pay at Hotel");
    } else if (paymentMethod === "qr") {
      // QR payment - UTR kudutha aprom booking "Pending Verification" nu save aagum
      if (!/^\d{12}$/.test(roomUtr)) {
        alert("Enter the 12-digit UTR / Reference No. from your UPI app 🔢");
        return;
      }
      await placeRoomBooking(`UPI QR (UTR: ${roomUtr})`, "Pending Verification", roomUtr);
    } else {
      // Real Razorpay payment - popup open aagum, success aana booking save aagum
      startRazorpayPayment({
        amount: total,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        onSuccess: (paymentId) => {
          placeRoomBooking(`Online Payment (Razorpay - ${paymentId})`, "Paid");
        },
        setBusy: setPayingNow,
      });
    }
  };

  const handleParkingSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Please login first! 🔐");
      navigate("/login");
      return;
    }

    if (
      !parkingForm.name ||
      !parkingForm.email ||
      !parkingForm.vehicleNumber ||
      !parkingForm.vehicleCategory ||
      !parkingForm.vehicleType
    ) {
      alert("Please fill in all the parking details.📝");
      return;
    }

    if (!parkingForm.slot) {
      alert("Please select a parking slot. 🅿️");
      return;
    }

    if (parkingPaymentMethod === "hotel") {
      await placeParkingBooking("Pay at Hotel", "Pay at Hotel");
    } else if (parkingPaymentMethod === "qr") {
      if (!/^\d{12}$/.test(parkingUtr)) {
        alert("Enter the 12-digit UTR / Reference No. from your UPI app 🔢");
        return;
      }
      await placeParkingBooking(`UPI QR (UTR: ${parkingUtr})`, "Pending Verification", parkingUtr);
    } else {
      startRazorpayPayment({
        amount: parkingTotal,
        customerName: parkingForm.name,
        customerEmail: parkingForm.email,
        customerPhone: parkingForm.vehicleNumber,
        onSuccess: (paymentId) => {
          placeParkingBooking(`Online Payment (Razorpay - ${paymentId})`, "Paid");
        },
        setBusy: setParkingPayingNow,
      });
    }
  };

  // ---------- Parking "No" - room-only bill anupitu, "no" screen ku poidalam ----------
  const handleSkipParking = () => {
    setParkingChoice("no");
  };

  // If someone lands here directly without a cart
  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="rooms-page-wrapper" style={{ paddingTop: "120px" }}>
        <div className="container text-center">
          <h2 className="fw-bold mb-4">Your cart is empty 🛏️</h2>
          <Link to="/rooms" className="btn btn-warning fw-bold">
            ← Rooms ku Poo
          </Link>
        </div>
      </div>
    );
  }

  // Final confirmation screen — room + parking (or room only if parking said No)
  if (orderPlaced === true && (parkingBooked || parkingChoice === "no")) {
    const anyQrPending = roomQrPending || parkingQrPending;
    return (
      <div className="rooms-page-wrapper" style={{ paddingTop: "120px" }}>
        <div className="container text-center">
          <div className="card shadow p-5 mx-auto" style={{ maxWidth: "500px" }}>
            <h2 className={`fw-bold mb-3 ${anyQrPending ? "text-warning" : "text-success"}`}>
              {anyQrPending
                ? "⏳ Booking Received!"
                : `✅ ${
                    parkingBooked
                      ? "Thanks for booking room and parking slot!"
                      : "Booking Confirmed!"
                  }`}
            </h2>
            <p className="fs-5">
              Thank you for booking a room with us! 🛏️
            </p>
            <p className="text-muted">
              {form.name}, unga room check-in {formatCheckIn(form.bookingDate)} ku
              {anyQrPending ? " book aayiduchu." : " confirm aayiduchu."} Our reception team will
              contact you shortly.
            </p>

            {parkingBooked && (
              <p className="text-muted">
                🅿️ Parking Slot {parkingForm.slot} ({parkingForm.vehicleType} —{" "}
                {parkingForm.vehicleNumber}) book aayiduchu. Parking charge:
                ₹{PARKING_RATE_PER_DAY} per day (Total: ₹{parkingTotal} for{" "}
                {roomDays} day{roomDays > 1 ? "s" : ""}).
              </p>
            )}

            {anyQrPending && (
              <div className="alert alert-warning mt-2 mb-0" style={{ fontSize: "0.9rem" }}>
                Your QR payment is being verified by our team. Booking will be confirmed once
                the payment is received.
              </div>
            )}

            <Link to="/" className="btn btn-dark fw-bold mt-3">
              ← Back to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Parking mini-form (shown after room booking, when user says Yes)
  if (orderPlaced === true && parkingChoice === "yes") {
    const slotsToShow = getSlotsForType(parkingForm.vehicleCategory);

    return (
      <div className="rooms-page-wrapper" style={{ paddingTop: "120px" }}>
        <div className="container d-flex justify-content-center">
          <div className="card shadow p-4" style={{ maxWidth: "520px", width: "100%" }}>
            <h4 className="fw-bold mb-3">Book Parking Slot</h4>
            <p className="text-muted" style={{ fontSize: "0.9rem" }}>
              Rate: ₹{PARKING_RATE_PER_DAY} / day
            </p>

            <form onSubmit={handleParkingSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={parkingForm.name}
                  onChange={handleParkingChange}
                  placeholder="Your name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={parkingForm.email}
                  readOnly
                  style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
                  title="This is your logged-in account email and cannot be changed"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Vehicle Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="vehicleNumber"
                  value={parkingForm.vehicleNumber}
                  onChange={handleParkingChange}
                  placeholder="TN 12 AB 1234"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Vehicle Type</label>
                <select
                  className="form-select"
                  name="vehicleCategory"
                  value={parkingForm.vehicleCategory}
                  onChange={handleCategoryChange}
                >
                  <option value="Bike">Bike</option>
                  <option value="Car">Car</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {parkingForm.vehicleCategory === "Other" && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Select Vehicle</label>
                  <select
                    className="form-select"
                    name="vehicleType"
                    value={parkingForm.vehicleType}
                    onChange={handleOtherTypeChange}
                  >
                    <option value="Van">Van</option>
                    <option value="Bus">Bus</option>
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold d-block">
                  Select Slot{" "}
                  {parkingForm.slot && (
                    <span className="text-success">— Slot {parkingForm.slot} selected</span>
                  )}
                </label>

                {parkingSlotsLoading ? (
                  <p className="text-muted">Loading slots...</p>
                ) : (
                  <>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {slotsToShow.map((num) => {
                        const isBooked = parkingBookedSlots.includes(num);
                        const isSelected = parkingForm.slot === num;
                        return (
                          <button
                            type="button"
                            key={num}
                            onClick={() => handleSlotClick(num)}
                            disabled={isBooked}
                            title={isBooked ? `Slot ${num} - Booked` : `Slot ${num} - Available`}
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "6px",
                              border: isSelected ? "2px solid #198754" : "1px solid #ccc",
                              fontWeight: "bold",
                              cursor: isBooked ? "not-allowed" : "pointer",
                              backgroundColor: isBooked
                                ? "#e0e0e0"
                                : isSelected
                                ? "#198754"
                                : "#d1f7dd",
                              color: isBooked ? "#999" : isSelected ? "#fff" : "#222",
                            }}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    <div className="d-flex gap-3" style={{ fontSize: "0.8rem" }}>
                      <span>
                        <span
                          style={{
                            display: "inline-block",
                            width: "12px",
                            height: "12px",
                            backgroundColor: "#d1f7dd",
                            marginRight: "4px",
                          }}
                        ></span>
                        Available
                      </span>
                      <span>
                        <span
                          style={{
                            display: "inline-block",
                            width: "12px",
                            height: "12px",
                            backgroundColor: "#198754",
                            marginRight: "4px",
                          }}
                        ></span>
                        Selected
                      </span>
                      <span>
                        <span
                          style={{
                            display: "inline-block",
                            width: "12px",
                            height: "12px",
                            backgroundColor: "#e0e0e0",
                            marginRight: "4px",
                          }}
                        ></span>
                        Booked
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* ---------- PARKING PAYMENT METHOD ---------- */}
              <div className="mb-3">
                <label className="form-label fw-semibold d-block">Payment Method</label>
                <PaymentMethodSelector
                  value={parkingPaymentMethod}
                  onChange={setParkingPaymentMethod}
                  groupName="parkingPaymentMethod"
                />
              </div>

              {parkingPaymentMethod === "qr" && (
                <QrPaymentBox
                  amount={parkingTotal}
                  utr={parkingUtr}
                  setUtr={setParkingUtr}
                />
              )}
              {/* ---------- END PARKING PAYMENT METHOD ---------- */}

              <div className="d-flex gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-light border fw-bold flex-fill"
                  onClick={() => setParkingChoice("no")}
                  disabled={parkingSubmitting || parkingPayingNow}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success fw-bold flex-fill"
                  disabled={parkingSubmitting || parkingPayingNow || !parkingForm.slot}
                >
                  {parkingPayingNow
                    ? "Opening Payment..."
                    : parkingSubmitting
                    ? "Confirming..."
                    : parkingPaymentMethod === "hotel"
                    ? "Confirm Booking (Cash at Hotel)"
                    : parkingPaymentMethod === "qr"
                    ? "Submit Payment Details"
                    : `Pay ₹${parkingTotal} Online`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Parking prompt screen (Yes / No) — shown right after room booking success
  if (orderPlaced === true && parkingChoice === null) {
    return (
      <div className="rooms-page-wrapper" style={{ paddingTop: "120px" }}>
        <div className="container text-center">
          <div className="card shadow p-5 mx-auto" style={{ maxWidth: "500px" }}>
            <h2 className={`fw-bold mb-3 ${roomQrPending ? "text-warning" : "text-success"}`}>
              {roomQrPending ? "⏳ Room Booking Received!" : "✅ Room Booking Confirmed!"}
            </h2>
            <p className="fs-5">
              {form.name}, unga room check-in {formatCheckIn(form.bookingDate)} ku
              {roomQrPending ? " book aayiduchu. 🛏️" : " Booking confirmed successfully.  🛏️"}
            </p>
            {roomQrPending && (
              <div className="alert alert-warning" style={{ fontSize: "0.9rem" }}>
                Your QR payment is being verified by our team. Booking will be confirmed once
                the payment is received.
              </div>
            )}
            <hr />
            <p className="fw-semibold fs-5 mb-3">
              Do you need a parking slot for your vehicle? 🅿️
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button
                className="btn btn-outline-dark fw-bold px-4"
                onClick={handleSkipParking}
              >
                No
              </button>
              <button
                className="btn btn-success fw-bold px-4"
                onClick={() => setParkingChoice("yes")}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Checkout form
  return (
    <div className="rooms-page-wrapper" style={{ paddingTop: "120px" }}>
      <div className="container">
        <h1 className="text-center fw-bold mb-5">🧾 Confirm Your Booking</h1>

        <div className="row g-4">
          {/* Order summary */}
          <div className="col-md-5">
            <div className="card shadow p-4">
              <h4 className="fw-bold mb-3">Order Summary</h4>
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="d-flex justify-content-between border-bottom py-2"
                >
                  <span>
                    {item.roomType} — Room {item.roomNumber}
                    {item.days ? ` (${item.days} day${item.days > 1 ? "s" : ""})` : ""}
                  </span>
                  <span>₹{item.price}</span>
                </div>
              ))}
              <div className="d-flex justify-content-between fw-bold fs-5 mt-3">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>

          {/* Guest details form */}
          <div className="col-md-7">
            <div className="card shadow p-4">
              <h4 className="fw-bold mb-3">Guest Details</h4>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your Name"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    readOnly
                    style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
                    title="This is your logged-in account email and cannot be changed"
                  />
                  <small className="text-muted">
                    This is your logged-in email — bookings are tracked against it for offers & vouchers.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter your Address"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">City</label>
                  <input
                    type="text"
                    className="form-control"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Enter Your city"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Room Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="roomNumber"
                    value={form.roomNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Check-in Date & Time</label>
                  <input
                    type="date"
                    className="form-control mb-2"
                    value={checkIn.date}
                    min={todayStr}
                    onChange={(e) => handleCheckInChange("date", e.target.value)}
                  />
                  <div className="d-flex gap-2">
                    <select
                      className="form-select"
                      value={checkIn.hour}
                      onChange={(e) => handleCheckInChange("hour", e.target.value)}
                    >
                      <option value="">Hour</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={String(h)}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <select
                      className="form-select"
                      value={checkIn.minute}
                      onChange={(e) => handleCheckInChange("minute", e.target.value)}
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      className="form-select"
                      value={checkIn.ampm}
                      onChange={(e) => handleCheckInChange("ampm", e.target.value)}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>

                {/* ---------- PAYMENT METHOD SECTION ---------- */}
                <div className="mb-3">
                  <label className="form-label fw-semibold d-block">Payment Method</label>
                  <PaymentMethodSelector
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    groupName="paymentMethod"
                  />
                </div>

                {paymentMethod === "qr" && (
                  <QrPaymentBox amount={total} utr={roomUtr} setUtr={setRoomUtr} />
                )}
                {/* ---------- END PAYMENT METHOD SECTION ---------- */}

                <button
                  type="submit"
                  className="btn btn-warning fw-bold w-100 mt-2"
                  disabled={submitting || payingNow || !authChecked}
                >
                  {payingNow
                    ? "Opening Payment..."
                    : submitting
                    ? "Confirming..."
                    : paymentMethod === "hotel"
                    ? "Confirm Booking (Cash at Hotel)"
                    : paymentMethod === "qr"
                    ? "Submit Payment Details"
                    : `Pay ₹${total} Online`}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/rooms" className="btn btn-dark">
            ← Back to Rooms
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RoomCheckout;