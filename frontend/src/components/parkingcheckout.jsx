import React from "react";
import { useLocation, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const API = "https://hotelheaven.onrender.com";

function ParkingCheckout() {
  const location = useLocation();
  const { vehicleType, slot, pricePerHour } = location.state || {};

  const [user, setUser] = React.useState(null);
  const [authChecked, setAuthChecked] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    vehicleNumber: "",
    hours: 1,
  });

  const [orderPlaced, setOrderPlaced] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const total = pricePerHour ? pricePerHour * form.hours : 0;

  // Login pannina user oda Google email ah eduthukurom.
  // Appo dhaan Booking History la indha parking booking varum.
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
      if (currentUser) {
        setForm((prev) => ({
          ...prev,
          email: currentUser.email || "",
          name: prev.name || currentUser.displayName || "",
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleHoursChange = (e) => {
    const hours = Math.max(1, parseInt(e.target.value) || 1);
    setForm({ ...form, hours });
  };

  // Booking request ah backend ku anuppurom.
  // Backend la status "pending" nu save aagum; admin approve panna apram
  // customer Booking History la payment pannalam.
  const placeBooking = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "parking",
          itemName: `${vehicleType} - Slot ${slot}`,
          userName: form.name,
          userEmail: form.email,
          price: total,
          details: {
            slot: slot, // Parking page la booked slot ah red ah kaata idhu venum
            vehicleType: vehicleType,
            phone: form.phone,
            vehicleNumber: form.vehicleNumber,
            hours: form.hours,
            ratePerHour: pricePerHour,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Booking failed");
      }

      setOrderPlaced(true);
    } catch (err) {
      console.error("Booking save failed:", err);
      alert("Unable to save the booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.vehicleNumber) {
      alert("Please fill all the details ! 📝");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      alert("Phone number must be 10 digits!📱");
      return;
    }

    await placeBooking();
  };

  // Slot info illama direct ah vandha
  if (!vehicleType && !orderPlaced) {
    return (
      <div style={{ paddingTop: "120px" }}>
        <div className="container text-center">
          <h2 className="fw-bold mb-4">Slot select pannala pa 🅿️</h2>
          <Link to="/parking" className="btn btn-warning fw-bold">
            ← Parking ku Poo
          </Link>
        </div>
      </div>
    );
  }

  // Login pannala na booking panna mudiyaadhu
  if (authChecked && !user && !orderPlaced) {
    return (
      <div style={{ paddingTop: "120px" }}>
        <div className="container text-center">
          <h2 className="fw-bold mb-4">Please login to book parking</h2>
          <Link to="/login" className="btn btn-warning fw-bold">
            Login
          </Link>
        </div>
      </div>
    );
  }

  // Confirmation screen
  if (orderPlaced) {
    return (
      <div style={{ paddingTop: "120px" }}>
        <div className="container text-center">
          <div className="card shadow p-5 mx-auto" style={{ maxWidth: "500px" }}>
            <h2 className="fw-bold mb-3 text-warning">⏳ Parking Request Received!</h2>
            <p className="fs-5">
              {vehicleType} — Slot {slot}
            </p>
            <p className="text-muted">
              {form.name}, your parking request is under review. Once our admin approves it,
              you will get an email. Then you can complete the payment from the Booking History
              page.
            </p>
            <Link to="/booking-history" className="btn btn-warning fw-bold mt-3">
              View Booking History
            </Link>
            <Link to="/home" className="btn btn-dark fw-bold mt-2">
              ← Back to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Checkout form
  return (
    <div style={{ paddingTop: "120px" }}>
      <div className="container">
        <h1 className="text-center fw-bold mb-5">🧾 Confirm Your Parking</h1>

        <div className="row g-4">
          {/* Booking summary */}
          <div className="col-md-5">
            <div className="card shadow p-4">
              <h4 className="fw-bold mb-3">Booking Summary</h4>
              <div className="d-flex justify-content-between border-bottom py-2">
                <span>
                  {vehicleType} — Slot {slot}
                </span>
              </div>
              <div className="d-flex justify-content-between border-bottom py-2">
                <span>Rate</span>
                <span>₹{pricePerHour} / hour</span>
              </div>
              <div className="d-flex justify-content-between fw-bold fs-5 mt-3">
                <span>Total ({form.hours} hr)</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>

          {/* Guest details form */}
          <div className="col-md-7">
            <div className="card shadow p-4">
              <h4 className="fw-bold mb-3">Your Details</h4>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your Name"
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
                  />
                  <small className="text-muted">
                    Your login email is used, so this booking shows in your Booking History.
                  </small>
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

                <div className="mb-3">
                  <label className="form-label fw-semibold">Vehicle Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="vehicleNumber"
                    value={form.vehicleNumber}
                    onChange={handleChange}
                    placeholder="e.g. TN 58 AB 1234"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">How many hours?</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    style={{ width: "120px" }}
                    value={form.hours}
                    onChange={handleHoursChange}
                  />
                </div>

                <div className="alert alert-info" style={{ fontSize: "0.9rem" }}>
                  No payment now. After admin approval, pay from the Booking History page.
                </div>

                <button
                  type="submit"
                  className="btn btn-warning fw-bold w-100 mt-2"
                  disabled={submitting}
                >
                  {submitting ? "Sending request..." : "Send Booking Request"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/parking" className="btn btn-dark">
            ← Back to Parking
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ParkingCheckout;