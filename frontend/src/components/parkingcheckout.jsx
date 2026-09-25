import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import nandhiniQR from "../assets/nandhini-qr.jpeg";

// ---------- Razorpay public Key ID (safe to expose in frontend - NOT the secret) ----------
// Backend kudukkura keyId ye first use aagum; idhu just fallback.
const RAZORPAY_KEY_ID = "rzp_test_TeFdyXXi625Mk3";

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
        src={nandhiniQR}
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

function ParkingCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { vehicleType, slot, pricePerHour } = location.state || {};

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    vehicleNumber: "",
    hours: 1,
  });

  // ---------- Payment method: "hotel" | "razorpay" | "qr" ----------
  const [paymentMethod, setPaymentMethod] = React.useState("razorpay");
  const [utr, setUtr] = React.useState("");
  const [payingNow, setPayingNow] = React.useState(false); // Razorpay modal open aagum pothu
  const [placedPayment, setPlacedPayment] = React.useState(null); // { label, status }

  const [orderPlaced, setOrderPlaced] = React.useState(false); // false | true
  const [submitting, setSubmitting] = React.useState(false);

  const total = pricePerHour ? pricePerHour * form.hours : 0;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleHoursChange = (e) => {
    const hours = Math.max(1, parseInt(e.target.value) || 1);
    setForm({ ...form, hours });
  };

  // ---------- Actually save the booking to MongoDB ----------
  // paymentStatus: "Paid" (Razorpay) | "Pending Verification" (QR) | "Pay at Hotel"
  const placeBooking = async (paymentLabel, paymentStatus, utrValue = "") => {
    setSubmitting(true);
    try {
      await fetch("http://localhost:5000/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "parking",
          itemName: `${vehicleType} - Slot ${slot}`,
          userName: form.name,
          userEmail: form.email,
          price: total,
          details: {
            phone: form.phone,
            vehicleNumber: form.vehicleNumber,
            hours: form.hours,
            paymentMethod: paymentLabel,
            paymentStatus: paymentStatus,
            utr: utrValue,
          },
        }),
      });

      setPlacedPayment({ label: paymentLabel, status: paymentStatus });
      setOrderPlaced(true);
    } catch (err) {
      console.error("Booking save failed:", err);
      alert("Unable to save the booking. Please check whether the backend server is running.");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // ---------- RAZORPAY PAYMENT FLOW ----------
  // amount = rupees (not paise); onSuccess(paymentId) called after
  // backend verifies the payment signature.
  // ============================================================
  const startRazorpayPayment = async ({ amount, onSuccess }) => {
    setPayingNow(true);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        alert("Razorpay could not be loaded. Please check your internet connection and try again.");
        setPayingNow(false);
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
        alert("Unable to create the payment order. Please check whether the backend server is running.");
        setPayingNow(false);
        return;
      }

      // Step 2: Razorpay checkout popup open pannurom
      const options = {
        key: orderData.keyId || RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Hotel Heaven",
        description: "Parking Payment",
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
            setPayingNow(false);
          }
        },
        modal: {
          // User checkout popup ah close pannitanunu, busy state reset pannurom
          ondismiss: function () {
            setPayingNow(false);
          },
        },
        prefill: {
          name: form.name || "",
          email: form.email || "",
          contact: form.phone || "",
        },
        theme: { color: "#ffc107" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay payment failed:", err);
      alert("An error occurred while processing the payment. Please try again..");
      setPayingNow(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.vehicleNumber) {
      alert("Please fill all the details ! 📝");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      alert("Please enter a valid email address! 📧");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      alert("Phone number must be 10 digits!📱");
      return;
    }

    if (paymentMethod === "hotel") {
      // No payment now - pay at reception
      await placeBooking("Pay at Hotel", "Pay at Hotel");
    } else if (paymentMethod === "qr") {
      // QR payment - UTR kudutha aprom booking "Pending Verification" nu save aagum
      if (!/^\d{12}$/.test(utr)) {
        alert("Enter the 12-digit UTR / Reference No. from your UPI app 🔢");
        return;
      }
      await placeBooking(`UPI QR (UTR: ${utr})`, "Pending Verification", utr);
    } else {
      // Real Razorpay payment - popup open aagum, success aana booking save aagum
      startRazorpayPayment({
        amount: total,
        onSuccess: (paymentId) => {
          placeBooking(`Online Payment (Razorpay - ${paymentId})`, "Paid");
        },
      });
    }
  };

  // If someone lands here directly without slot info
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

  // Confirmation screen
  if (orderPlaced === true) {
    const isQrPending = placedPayment?.status === "Pending Verification";

    return (
      <div style={{ paddingTop: "120px" }}>
        <div className="container text-center">
          <div className="card shadow p-5 mx-auto" style={{ maxWidth: "500px" }}>
            <h2 className={`fw-bold mb-3 ${isQrPending ? "text-warning" : "text-success"}`}>
              {isQrPending ? "⏳ Parking Booking Received!" : "✅ Parking Confirmed!"}
            </h2>
            <p className="fs-5">
              {vehicleType} — Slot {slot}
            </p>
            <p className="text-muted">
              {isQrPending
                ? `${form.name}, Your parking slot has been booked. Our reception team will contact you soon.`
                : `${form.name}, Your parking slot has been booked successfully. Our reception team will contact you soon.`}
            </p>
            <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Payment: {placedPayment ? placedPayment.label : "-"}
            </p>
            {isQrPending && (
              <div className="alert alert-warning mt-3 mb-0" style={{ fontSize: "0.9rem" }}>
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

  // Checkout form
  return (
    <div style={{ paddingTop: "120px" }}>
      <div className="container">
        <h1 className="text-center fw-bold mb-5">🧾 Confirm Your Parking</h1>

        <div className="row g-4">
          {/* Order summary */}
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
                    onChange={handleChange}
                    placeholder="Your Email"
                  />
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
                  <QrPaymentBox amount={total} utr={utr} setUtr={setUtr} />
                )}
                {/* ---------- END PAYMENT METHOD SECTION ---------- */}

                <button
                  type="submit"
                  className="btn btn-warning fw-bold w-100 mt-2"
                  disabled={submitting || payingNow}
                >
                  {payingNow
                    ? "Opening Payment..."
                    : submitting
                    ? "Booking..."
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
          <Link to="/parking" className="btn btn-dark">
            ← Back to Parking
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ParkingCheckout;