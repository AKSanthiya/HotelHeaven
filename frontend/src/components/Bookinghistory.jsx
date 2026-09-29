import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

import nandhiniQR from "../assets/nandhini-qr.jpeg";

const API = "https://hotelheaven.onrender.com";

const QR_IMAGE = nandhiniQR;

const TYPE_TABS = [
  { key: "all", label: "All" },
  { key: "room", label: "Rooms" },
  { key: "food", label: "Food" },
  { key: "hall", label: "Halls" },
  { key: "parking", label: "Parking" },
];

const STATUS = {
  pending: { label: "Waiting for approval", cls: "bg-warning text-dark" },
  awaiting_payment: { label: "Payment pending", cls: "bg-info text-dark" },
  confirmed: { label: "Confirmed", cls: "bg-success" },
  rejected: { label: "Rejected", cls: "bg-danger" },
};

const getAmount = (price) => {
  const n = parseFloat(String(price ?? "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
};

const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDetails = (b) => {
  const d = b.details || {};
  const parts = [];
  if (d.roomNumber) parts.push(`Room ${d.roomNumber}`);
  if (d.linkedRoomNumber) parts.push(`Room ${d.linkedRoomNumber}`);
  if (d.slot) parts.push(`Slot ${d.slot}`);
  if (d.vehicleNumber) parts.push(d.vehicleNumber);
  if (d.days && b.type !== "food") parts.push(`${d.days} day(s)`);
  if (d.bookingDate) parts.push(`On ${String(d.bookingDate).replace("T", " ")}`);
  return parts.join(", ") || "-";
};

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function BookingHistory() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [payingBooking, setPayingBooking] = useState(null); // payment popup la irukkura booking
  const [showQR, setShowQR] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "danger", text }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const fetchBookings = async (email) => {
    try {
      const res = await fetch(`${API}/api/user-bookings/${encodeURIComponent(email)}`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Could not load bookings:", err);
      setMessage({ type: "danger", text: "Could not load your bookings. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchBookings(user.email);
    } else if (authChecked) {
      setLoading(false);
    }
  }, [user, authChecked]);

  const closePopup = () => {
    setPayingBooking(null);
    setShowQR(false);
  };

  // Payment mudinja apram backend la booking ah "confirmed" nu maathum
  const markPaid = async (booking, paymentMethod, orderId) => {
    const res = await fetch(`${API}/api/booking/mark-paid/${booking._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod, orderId: orderId || "" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not record payment");
    return data;
  };

  const handleOfflinePayment = async (method) => {
    setBusy(true);
    try {
      await markPaid(payingBooking, method);
      setMessage({ type: "success", text: "Booking confirmed! Confirmation email sent." });
      closePopup();
      await fetchBookings(user.email);
    } catch (err) {
      setMessage({ type: "danger", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleOnlinePayment = async () => {
    const booking = payingBooking;
    const amount = getAmount(booking.price);
    if (amount <= 0) {
      setMessage({ type: "danger", text: "Invalid booking amount." });
      return;
    }

    setBusy(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Could not load Razorpay. Check your internet.");

      const orderRes = await fetch(`${API}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Could not create payment order");

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Hotel Heaven",
        description: booking.itemName,
        prefill: { name: user.displayName || "", email: user.email || "" },
        theme: { color: "#0a3d62" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verify = await verifyRes.json();
            if (!verifyRes.ok || !verify.verified) throw new Error("Payment verification failed");

            await markPaid(booking, "Online", response.razorpay_order_id);
            setMessage({ type: "success", text: "Payment successful! Booking confirmed." });
            closePopup();
            await fetchBookings(user.email);
          } catch (err) {
            setMessage({ type: "danger", text: err.message });
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      setMessage({ type: "danger", text: err.message });
      setBusy(false);
    }
  };

  const visibleBookings =
    filter === "all" ? bookings : bookings.filter((b) => b.type === filter);

  // ---------- Not logged in ----------
  if (authChecked && !user) {
    return (
      <div className="container" style={{ paddingTop: "110px" }}>
        <div className="alert alert-warning">Please login to see your booking history.</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "110px", paddingBottom: "40px" }}>
      <h2 className="fw-bold mb-3" style={{ color: "#0a3d62" }}>My Booking History</h2>

      {message && (
        <div className={`alert alert-${message.type} d-flex justify-content-between`}>
          <span>{message.text}</span>
          <button className="btn-close" onClick={() => setMessage(null)} aria-label="Close" />
        </div>
      )}

      {/* Type filter */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {TYPE_TABS.map((t) => (
          <button
            key={t.key}
            className={`btn btn-sm ${filter === t.key ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading your bookings...</p>
      ) : visibleBookings.length === 0 ? (
        <div className="alert alert-secondary">No bookings found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Item</th>
                <th>Details</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.map((b) => {
                const st = STATUS[b.status] || { label: b.status, cls: "bg-secondary" };
                return (
                  <tr key={b._id}>
                    <td>{formatDate(b.createdAt)}</td>
                    <td className="text-capitalize">{b.type}</td>
                    <td>{b.itemName}</td>
                    <td>{getDetails(b)}</td>
                    <td>Rs.{getAmount(b.price)}</td>
                    <td>{b.paymentMethod || "-"}</td>
                    <td>
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                    </td>
                    <td>
                      {b.status === "awaiting_payment" ? (
                        <button
                          className="btn btn-sm btn-warning fw-bold"
                          onClick={() => setPayingBooking(b)}
                        >
                          Pay Now
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- Payment popup ---------- */}
      {payingBooking && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div className="card p-4" style={{ maxWidth: "420px", width: "100%" }}>
            <h5 className="fw-bold mb-1">Complete Payment</h5>
            <p className="text-muted mb-3">
              {payingBooking.itemName} - Rs.{getAmount(payingBooking.price)}
            </p>

            {showQR ? (
              <>
                {QR_IMAGE ? (
                  <img src={QR_IMAGE} alt="Payment QR" className="img-fluid mb-3" />
                ) : (
                  <p className="text-muted">Scan the QR at the front desk and pay.</p>
                )}
                <button
                  className="btn btn-success mb-2"
                  disabled={busy}
                  onClick={() => handleOfflinePayment("QR")}
                >
                  {busy ? "Please wait..." : "I have paid"}
                </button>
                <button className="btn btn-outline-secondary" onClick={() => setShowQR(false)}>
                  Back
                </button>
              </>
            ) : (
              <div className="d-grid gap-2">
                <button className="btn btn-dark" disabled={busy} onClick={handleOnlinePayment}>
                  {busy ? "Please wait..." : "Pay Online"}
                </button>
                <button className="btn btn-outline-dark" disabled={busy} onClick={() => setShowQR(true)}>
                  Pay by QR
                </button>
                <button
                  className="btn btn-outline-dark"
                  disabled={busy}
                  onClick={() => handleOfflinePayment("Cash on Delivery")}
                >
                  Cash on Delivery
                </button>
                <button className="btn btn-link text-muted" disabled={busy} onClick={closePopup}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingHistory;