import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import "./Rooms.css";

// ============================================================
// This page closes the loop started in RoomCheckout.jsx:
//
//   pending  -> (admin approves)      -> awaiting_payment
//   awaiting_payment -> (customer picks a method here) -> confirmed
//
// Backend routes used (see app.py):
//   GET  /api/bookings/my/<email>              -> this customer's bookings
//   POST /api/bookings/<id>/payment-method      -> { method: "online" | "pay_on_arrival" }
//   POST /api/verify-payment                    -> { ...razorpay fields, bookingId }
// ============================================================

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

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return value;
  }
}

const STATUS_BADGES = {
  pending: { label: "Waiting for admin approval", className: "bg-warning text-dark" },
  awaiting_payment: { label: "Approved — choose payment", className: "bg-info text-dark" },
  confirmed: { label: "Confirmed", className: "bg-success" },
  rejected: { label: "Rejected", className: "bg-danger" },
};

function StatusBadge({ status }) {
  const info = STATUS_BADGES[status] || { label: status || "Unknown", className: "bg-secondary" };
  return <span className={`badge ${info.className}`}>{info.label}</span>;
}

function BookingCard({ booking, onPayOnArrival, onPayOnline, busyId }) {
  const details = booking.details || {};
  const isBusy = busyId === booking._id;

  return (
    <div className="card shadow-sm p-3 mb-3">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <h5 className="fw-bold mb-1">
            {booking.type === "room" ? "🛏️ " : booking.type === "parking" ? "🅿️ " : booking.type === "hall" ? "🎉 " : "🍽️ "}
            {booking.itemName}
          </h5>
          <p className="text-muted mb-1" style={{ fontSize: "0.85rem" }}>
            Booked on {formatDateTime(booking.createdAt)}
          </p>
          {details.bookingDate && (
            <p className="text-muted mb-1" style={{ fontSize: "0.85rem" }}>
              Check-in: {formatDateTime(details.bookingDate)}
            </p>
          )}
          <p className="fw-semibold mb-0">₹{booking.price}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {booking.type === "room" && booking.status === "awaiting_payment" && (
        <div className="mt-3 pt-3 border-top">
          <p className="fw-semibold mb-2" style={{ fontSize: "0.9rem" }}>
            Your room is confirmed by our team — how would you like to pay?
          </p>
          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-outline-dark fw-bold"
              disabled={isBusy}
              onClick={() => onPayOnArrival(booking)}
            >
              {isBusy ? "Please wait..." : "Pay on Arrival"}
            </button>
            <button
              className="btn btn-success fw-bold"
              disabled={isBusy}
              onClick={() => onPayOnline(booking)}
            >
              {isBusy ? "Opening Payment..." : `Pay ₹${booking.price} Online`}
            </button>
          </div>
        </div>
      )}

      {booking.type === "room" && booking.status === "pending" && (
        <div className="alert alert-warning mt-3 mb-0" style={{ fontSize: "0.85rem" }}>
          Namma team unga request-ah review pannitu irukku. Approve aana udane, payment
          option ithe page-ல தோன்றும், அது பத்தி மெயில் தனியா வரும்.
        </div>
      )}

      {booking.status === "confirmed" && details.paymentMethod && (
        <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.85rem" }}>
          Payment: {details.paymentMethod}
        </p>
      )}

      {booking.status === "rejected" && (
        <div className="alert alert-danger mt-3 mb-0" style={{ fontSize: "0.85rem" }}>
          Sorry, this request could not be confirmed. Please try booking another room.
        </div>
      )}
    </div>
  );
}

function BookingHistory() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState(null);
  const [bookings, setBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState(null);
  const [errorMsg, setErrorMsg] = React.useState("");

  const fetchBookings = React.useCallback((email) => {
    setLoading(true);
    fetch(`https://hotelheaven.onrender.com/api/bookings/my/${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        setBookings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch booking history:", err);
        setErrorMsg("Booking history load aagala. Please check whether the backend is running.");
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAuthChecked(true);
      if (!currentUser) {
        navigate("/login");
        return;
      }
      setUserEmail(currentUser.email);
      fetchBookings(currentUser.email);
    });
    return () => unsubscribe();
  }, [navigate, fetchBookings]);

  // ---------- Pay on Arrival: one call, backend confirms + emails immediately ----------
  const handlePayOnArrival = async (booking) => {
    setBusyId(booking._id);
    try {
      const res = await fetch(
        `https://hotelheaven.onrender.com/api/bookings/${booking._id}/payment-method`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "pay_on_arrival" }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not confirm the booking. Please try again.");
        return;
      }
      fetchBookings(userEmail);
    } catch (err) {
      console.error("Pay on arrival failed:", err);
      alert("Something went wrong. Please check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  };

  // ---------- Pay Online: get a Razorpay order tied to this bookingId, then verify ----------
  const handlePayOnline = async (booking) => {
    setBusyId(booking._id);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        alert("Razorpay could not be loaded. Please check your internet connection and try again.");
        setBusyId(null);
        return;
      }

      const orderRes = await fetch(
        `https://hotelheaven.onrender.com/api/bookings/${booking._id}/payment-method`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "online" }),
        }
      );
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.orderId) {
        alert(orderData.error || "Unable to create the payment order. Please try again.");
        setBusyId(null);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Hotel Heaven",
        description: `Payment for ${booking.itemName}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("https://hotelheaven.onrender.com/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: orderData.bookingId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              fetchBookings(userEmail);
            } else {
              alert("Payment could not be verified. If the amount was debited, please contact support.");
            }
          } catch (err) {
            console.error("Verification call failed:", err);
            alert("An error occurred while verifying the payment. Please contact support.");
          } finally {
            setBusyId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setBusyId(null);
          },
        },
        prefill: {
          name: booking.userName || "",
          email: userEmail || "",
        },
        theme: { color: "#ffc107" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Online payment failed:", err);
      alert("An error occurred while processing the payment. Please try again.");
      setBusyId(null);
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="rooms-page-wrapper" style={{ paddingTop: "120px" }}>
        <div className="container text-center">
          <p className="text-muted">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rooms-page-wrapper" style={{ paddingTop: "120px" }}>
      <div className="container">
        <h1 className="text-center fw-bold mb-4">📖 Booking History</h1>

        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

        {bookings.length === 0 ? (
          <div className="text-center">
            <p className="text-muted">You don't have any bookings yet.</p>
            <Link to="/rooms" className="btn btn-warning fw-bold">
              🛏️ Book a Room
            </Link>
          </div>
        ) : (
          <div className="row justify-content-center">
            <div className="col-md-8">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onPayOnArrival={handlePayOnArrival}
                  onPayOnline={handlePayOnline}
                  busyId={busyId}
                />
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-4">
          <Link to="/" className="btn btn-dark">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BookingHistory;