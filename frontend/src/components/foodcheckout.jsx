import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
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

// ---------- 3 payment options: cod | razorpay | qr ----------
const PAYMENT_OPTIONS = [
  { value: "cod", icon: "💵", title: "Cash on Delivery", sub: "Pay at delivery" },
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
        Order is confirmed only after our team verifies your payment.
      </small>
    </div>
  );
}

function FoodCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const cart = location.state?.cart || [];

  // Voucher info passed from Home.jsx "Order Free Food Now" link (if any)
  const [voucherId, setVoucherId] = React.useState(location.state?.voucherId || null);
  const [voucherBalance, setVoucherBalance] = React.useState(
    location.state?.voucherBalance ?? null
  );
  // Customer must explicitly opt in to use the voucher (not auto-applied).
  // If they clicked "Order Free Food Now" from Home.jsx, that's an explicit
  // intent already, so default it ON in that case; otherwise default OFF.
  const [useVoucher, setUseVoucher] = React.useState(!!location.state?.voucherId);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    address: "",
    city: "",
    roomNumber: "", // optional
    tableNumber: "", // optional
    phone: "",
  });

  // ---------- Payment method: "cod" | "razorpay" | "qr" ----------
  const [paymentMethod, setPaymentMethod] = React.useState("razorpay");
  const [utr, setUtr] = React.useState("");
  const [payingNow, setPayingNow] = React.useState(false); // Razorpay modal open aagum pothu

  // What was actually used for the placed order (label + status) - shown on the bill screen
  const [placedPayment, setPlacedPayment] = React.useState(null);

  // orderPlaced: false | true
  const [orderPlaced, setOrderPlaced] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [bookedTables, setBookedTables] = React.useState([]);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [redeemResult, setRedeemResult] = React.useState(null); // set after order placed, if voucher used

  // ---------- Bill / receipt info (filled right before order confirms) ----------
  const [orderId, setOrderId] = React.useState(null);
  const [orderTime, setOrderTime] = React.useState(null);

  // ---------- Toggle for the pre-order "View Detailed Bill" preview ----------
  const [showBillPreview, setShowBillPreview] = React.useState(false);

  // 2-chair tables: 6 tables | 4-chair tables: 10 tables
  const twoChairTables = Array.from({ length: 6 }, (_, i) => i + 1);
  const fourChairTables = Array.from({ length: 10 }, (_, i) => i + 1);

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

  // If voucher info wasn't passed via navigation state (e.g. page refreshed),
  // re-fetch it fresh from the backend once we know who's logged in.
  React.useEffect(() => {
    if (voucherId) return; // already have it from navigation state
    if (!auth.currentUser?.email) return;

    fetch(`https://hotelheaven.onrender.com/api/voucher-status/${encodeURIComponent(auth.currentUser.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.activeVoucher) {
          setVoucherId(data.activeVoucher._id);
          setVoucherBalance(data.activeVoucher.remainingAmount);
        }
      })
      .catch((err) => console.error("Voucher re-check failed:", err));
  }, [authChecked, voucherId]);

  // Fetch already-booked tables from existing food bookings
  React.useEffect(() => {
    const fetchBookedTables = async () => {
      try {
        const res = await fetch(
          "https://hotelheaven.onrender.com/api/bookings?type=food"
        );
        const data = await res.json();
        const booked = data
          .map((b) => b.details?.tableNumber)
          .filter(
            (t) => t && t !== "Not dining in" // ignore delivery/pickup orders
          );
        setBookedTables(booked);
      } catch (err) {
        console.error("Failed to fetch booked tables:", err);
      }
    };

    fetchBookedTables();
  }, []);

  const total = cart.reduce(
    (sum, item) => sum + (item.finalPrice || item.price || 0),
    0
  );

  const hasVoucher = voucherId && voucherBalance > 0 && useVoucher;
  const voucherCovered = hasVoucher ? Math.min(total, voucherBalance) : 0;
  const payableAmount = total - voucherCovered;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // When a table box is clicked, fill the tableNumber field
  // chairType = "2" or "4"
  const handleTableSelect = (num, chairType) => {
    const label = `Table ${num} (${chairType} Chairs)`;

    if (bookedTables.includes(label)) {
      alert("This table is Already Booked! 🚫 Please select another table.");
      return;
    }

    setForm({
      ...form,
      tableNumber: label,
    });
  };

  // ---------- Send the PDF bill email ----------
  // Takes orderIdVal/orderTimeVal explicitly (not from state) since React state
  // updates are async and we call this right before setOrderPlaced(true).
  const sendBillEmail = async (orderIdVal, orderTimeVal, voucherDiscount = 0, finalAmount, paymentLabel) => {
    try {
      const cartItems = cart.map((item) => ({
        name: `${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ""}`,
        price: item.finalPrice || item.price,
        quantity: item.quantity || 1,
      }));

      await fetch("https://hotelheaven.onrender.com/api/send-bill-email", {
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
          total,
          voucherDiscount,
          finalAmount,
          paymentMethod: paymentLabel,
          orderId: orderIdVal,
          orderTime: orderTimeVal.toLocaleString(),
        }),
      });
    } catch (err) {
      // Bill email fail aana kooda order already save aayiduchu, so just log pannurom
      console.error("Bill email failed:", err);
    }
  };

  // ---------- Actually save the order to MongoDB ----------
  // paymentStatus: "Paid" (Razorpay / fully voucher-covered) | "Pending Verification" (QR) | "Cash on Delivery"
  const placeOrder = async (paymentLabel, paymentStatus, utrValue = "") => {
    setSubmitting(true);
    try {
      // ---------- Order ID + time ippo ye create pannurom (booking save aaga munnaadi) ----------
      // Idhe ID thaan bill la varum, adhe ID thaan Admin la kaattum.
      const now = new Date();
      const newOrderId = `HH-FOOD-${now.getTime()}`;

      // Save the booking with the ORIGINAL price (for accurate sales records),
      // but note the voucher discount and payment method in details for admin visibility.
      await Promise.all(
        cart.map((item) =>
          fetch("https://hotelheaven.onrender.com/api/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "food",
              itemName: `${item.name}${
                item.selectedSize ? ` (${item.selectedSize})` : ""
              }`,
              userName: form.name,
              userEmail: auth.currentUser.email, // always the logged-in email
              price: item.finalPrice || item.price,
              details: {
                orderId: newOrderId, // <-- Admin.jsx la b.details?.orderId nu edukalaam
                address: form.address,
                city: form.city,
                phone: form.phone,
                roomNumber: form.roomNumber || "Not from room",
                tableNumber: form.tableNumber || "Not dining in",
                paymentMethod: paymentLabel,
                paymentStatus: paymentStatus,
                utr: utrValue,
              },
            }),
          })
        )
      );

      // If a voucher is active, redeem it against this order's total
      let localRedeemResult = null;
      if (hasVoucher) {
        const res = await fetch("https://hotelheaven.onrender.com/api/voucher/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voucherId, orderAmount: total }),
        });
        const data = await res.json();
        setRedeemResult(data);
        localRedeemResult = data;
      }

      // Bill screen ku order reference + timestamp
      setOrderId(newOrderId);
      setOrderTime(now);
      setPlacedPayment({ label: paymentLabel, status: paymentStatus });

      // ---------- Send the PDF bill email (QR pending ku payment verify aana aprom) ----------
      if (paymentStatus !== "Pending Verification") {
        const billVoucherDiscount = localRedeemResult ? localRedeemResult.coveredByVoucher : 0;
        const billFinalAmount = localRedeemResult ? localRedeemResult.customerPays : total;
        await sendBillEmail(newOrderId, now, billVoucherDiscount, billFinalAmount, paymentLabel);
      }

      setOrderPlaced(true);
    } catch (err) {
      console.error("Food order save failed:", err);
      alert("Order could not be saved. Please check whether the backend is running!");
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
        alert("Razorpay load aagala. Internet connection check pannunga.");
        setPayingNow(false);
        return;
      }

      // Step 1: Backend la order create pannurom
      const orderRes = await fetch("https://hotelheaven.onrender.com/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const orderData = await orderRes.json();

      if (!orderData.orderId) {
        console.error("Create order response:", orderData);
        alert("Payment order create panna mudiyala. Backend server run aaguthaa nu check pannunga.");
        setPayingNow(false);
        return;
      }

      // Step 2: Razorpay checkout popup open pannurom
      const options = {
        key: orderData.keyId || RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Hotel Heaven",
        description: "Food Order Payment",
        order_id: orderData.orderId,
        handler: async function (response) {
          // Step 3: Payment success aana, backend la signature verify pannurom
          try {
            const verifyRes = await fetch("https://hotelheaven.onrender.com/api/verify-payment", {
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
              alert("Payment verify aagala! Amount debit aayirundhaalum order confirm aagala - support ah contact pannunga.");
            }
          } catch (err) {
            console.error("Verification call failed:", err);
            alert("Payment verify pannum pothu error. Support ah contact pannunga.");
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
      alert("Payment process pannum pothu error vandhuchu. Try again pannunga.");
      setPayingNow(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Please login first to place an order! 🔐");
      navigate("/login");
      return;
    }

    // Room number and Table number are OPTIONAL - everything else required
    if (!form.name || !form.email || !form.address || !form.city || !form.phone) {
      alert("Please fill in all fields! (Room number & Table number are optional.)📝");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      alert("Phone number must be exactly 10 digits! 📱");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      alert("Please enter a valid email address! 📧");
      return;
    }

    if (payableAmount <= 0) {
      // Fully voucher-covered order - payment onnum thevai illa
      await placeOrder("Voucher (Fully Covered)", "Paid");
    } else if (paymentMethod === "cod") {
      // No payment gateway involved at all
      await placeOrder("Cash on Delivery", "Cash on Delivery");
    } else if (paymentMethod === "qr") {
      // QR payment - UTR kudutha aprom order "Pending Verification" nu save aagum
      if (!/^\d{12}$/.test(utr)) {
        alert("Enter the 12-digit UTR / Reference No. from your UPI app 🔢");
        return;
      }
      await placeOrder(`UPI QR (UTR: ${utr})`, "Pending Verification", utr);
    } else {
      // Real Razorpay payment - popup open aagum, success aana order save aagum
      startRazorpayPayment({
        amount: payableAmount,
        onSuccess: (paymentId) => {
          placeOrder(`Online Payment (Razorpay - ${paymentId})`, "Paid");
        },
      });
    }
  };

  const handlePrintBill = () => {
    window.print();
  };

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div style={{ paddingTop: "120px" }}>
        <div className="container text-center">
          <h2 className="fw-bold mb-4">Your cart is empty! 🍽️</h2>
          <Link to="/food" className="btn btn-warning fw-bold">
            ← Food Menu ku Poo
          </Link>
        </div>
      </div>
    );
  }

  if (orderPlaced === true) {
    const isQrPending = placedPayment?.status === "Pending Verification";
    const isCod = placedPayment?.status === "Cash on Delivery";
    const cashDue = redeemResult ? redeemResult.customerPays : total;

    return (
      <div style={{ paddingTop: "120px" }}>
        <div className="container text-center">
          <div className="card shadow p-5 mx-auto" style={{ maxWidth: "500px" }}>
            <h2 className={`fw-bold mb-3 ${isQrPending ? "text-warning" : "text-success"}`}>
              {isQrPending ? "⏳ Order Received!" : "✅ Order Confirmed!"}
            </h2>
            <p className="fs-5">
              {isQrPending ? (
                <>
                  Your order will be delivered within <strong>30 minutes</strong> after your
                  payment is verified! 🎉
                </>
              ) : (
                <>
                  Your order will be delivered within <strong>30 minutes</strong>! 🎉
                </>
              )}
            </p>
            {isQrPending && (
              <div className="alert alert-warning" style={{ fontSize: "0.9rem" }}>
                Your QR payment is being verified by our team. Order will be confirmed once
                the payment is received.
              </div>
            )}
            {redeemResult && (
              <div
                style={{
                  background: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "8px",
                  padding: "12px",
                  margin: "16px 0",
                }}
              >
                🎟️ Voucher covered: <strong>₹{redeemResult.coveredByVoucher}</strong>
                <br />
                {redeemResult.customerPays > 0 ? (
                  <>
                    Remaining amount: <strong>₹{redeemResult.customerPays}</strong>
                  </>
                ) : (
                  <>This order was <strong>fully free</strong>! 🎉</>
                )}
              </div>
            )}
            {isCod && cashDue > 0 && (
              <div
                style={{
                  background: "#e7f1ff",
                  border: "1px solid #0d6efd",
                  borderRadius: "8px",
                  padding: "12px",
                  margin: "16px 0",
                }}
              >
                💵 Please keep <strong>₹{cashDue}</strong> ready in cash at delivery.
              </div>
            )}
            <p className="text-muted">
              {isQrPending
                ? `${form.name}, Your order has been received.`
                : `${form.name}, Your order has confirmed.`}
            </p>
          </div>

          {/* ---------- DETAILED BILL / RECEIPT (post-order) ---------- */}
          <div
            className="card shadow p-4 mx-auto mt-4"
            style={{ maxWidth: "500px", textAlign: "left" }}
            id="food-bill"
          >
            <div className="text-center mb-3">
              <h4 className="fw-bold mb-0">🧾 Hotel Heaven — Bill</h4>
              <small className="text-muted">Order Receipt</small>
            </div>

            <div className="d-flex justify-content-between" style={{ fontSize: "0.9rem" }}>
              <span className="text-muted">Order ID</span>
              <span className="fw-semibold">{orderId}</span>
            </div>
            <div className="d-flex justify-content-between mb-3" style={{ fontSize: "0.9rem" }}>
              <span className="text-muted">Date & Time</span>
              <span className="fw-semibold">
                {orderTime ? orderTime.toLocaleString() : "-"}
              </span>
            </div>

            <hr />

            <h6 className="fw-bold mb-2">Customer Details</h6>
            <div style={{ fontSize: "0.9rem" }}>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Name</span>
                <span>{form.name}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Email</span>
                <span>{form.email}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Phone</span>
                <span>{form.phone}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Address</span>
                <span style={{ textAlign: "right", maxWidth: "60%" }}>
                  {form.address}, {form.city}
                </span>
              </div>
              {form.roomNumber && (
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Room Number</span>
                  <span>{form.roomNumber}</span>
                </div>
              )}
              {form.tableNumber && (
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Table</span>
                  <span>{form.tableNumber}</span>
                </div>
              )}
              <div className="d-flex justify-content-between">
                <span className="text-muted">Payment Method</span>
                <span style={{ textAlign: "right", maxWidth: "60%" }}>
                  {placedPayment ? placedPayment.label : "-"}
                </span>
              </div>
            </div>

            <hr />

            <h6 className="fw-bold mb-2">Items Ordered</h6>
            <table className="table table-sm mb-2" style={{ fontSize: "0.9rem" }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-end">Price</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={index}>
                    <td>
                      {item.name}
                      {item.selectedSize ? ` (${item.selectedSize})` : ""}
                    </td>
                    <td className="text-center">{item.quantity || 1}</td>
                    <td className="text-end">₹{item.finalPrice || item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr />

            <div className="d-flex justify-content-between" style={{ fontSize: "0.95rem" }}>
              <span>Subtotal</span>
              <span>₹{total}</span>
            </div>

            {redeemResult && (
              <div
                className="d-flex justify-content-between"
                style={{ fontSize: "0.95rem", color: "#c78e00", fontWeight: 600 }}
              >
                <span>🎟️ Voucher Discount</span>
                <span>- ₹{redeemResult.coveredByVoucher}</span>
              </div>
            )}

            <div className="d-flex justify-content-between fw-bold fs-5 mt-2 pt-2 border-top">
              <span>Total {placedPayment?.status === "Paid" ? "Paid" : "Payable"}</span>
              <span style={{ color: redeemResult && redeemResult.customerPays === 0 ? "#198754" : "inherit" }}>
                {redeemResult
                  ? redeemResult.customerPays === 0
                    ? "FREE 🎉"
                    : `₹${redeemResult.customerPays}`
                  : `₹${total}`}
              </span>
            </div>

            {isQrPending && (
              <p className="text-center text-warning fw-semibold mt-3 mb-0" style={{ fontSize: "0.85rem" }}>
                ⏳ Payment verification pending
              </p>
            )}

            <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: "0.8rem" }}>
              Thank you for choosing Hotel Heaven! 🙏
            </p>
          </div>

          <div className="d-flex justify-content-center gap-2 mt-4">
            <button className="btn btn-outline-dark fw-bold" onClick={handlePrintBill}>
              🖨️ Print Bill
            </button>
            <Link to="/" className="btn btn-dark fw-bold">
              ← Back to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "120px" }}>
      <div className="container">
        <h1 className="text-center fw-bold mb-5">🧾 Confirm Your Food Order</h1>

        <div className="row g-4">
          <div className="col-md-5">
            <div className="card shadow p-4">
              <h4 className="fw-bold mb-3">Order Summary</h4>
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="d-flex justify-content-between border-bottom py-2"
                >
                  <span>
                    {item.name}
                    {item.selectedSize ? ` (${item.selectedSize})` : ""}
                  </span>
                  <span>₹{item.finalPrice || item.price}</span>
                </div>
              ))}
              <div className="d-flex justify-content-between py-2">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>

              {voucherId && voucherBalance > 0 && (
                <div className="form-check mt-2 mb-1">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="useVoucherCheck"
                    checked={useVoucher}
                    onChange={(e) => setUseVoucher(e.target.checked)}
                  />
                  <label
                    className="form-check-label fw-semibold"
                    htmlFor="useVoucherCheck"
                    style={{ fontSize: "0.9rem" }}
                  >
                    🎟️ Use my ₹{voucherBalance} voucher for this order
                  </label>
                </div>
              )}

              {hasVoucher && (
                <div
                  className="d-flex justify-content-between py-2"
                  style={{ color: "#c78e00", fontWeight: 600 }}
                >
                  <span>🎟️ Voucher Applied</span>
                  <span>- ₹{voucherCovered}</span>
                </div>
              )}

              <div className="d-flex justify-content-between fw-bold fs-5 mt-3 pt-2 border-top">
                <span>{hasVoucher ? "You Pay" : "Total"}</span>
                <span style={{ color: hasVoucher && payableAmount === 0 ? "#198754" : "inherit" }}>
                  {hasVoucher && payableAmount === 0 ? "FREE 🎉" : `₹${payableAmount}`}
                </span>
              </div>

              {voucherId && voucherBalance > 0 && !useVoucher && (
                <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.85rem" }}>
                  🎟️ You have an unused ₹{voucherBalance} voucher — tick the box above to apply it.
                </p>
              )}

              {/* ---------- VIEW DETAILED BILL TOGGLE ---------- */}
              <button
                type="button"
                className="btn btn-outline-dark btn-sm fw-bold w-100 mt-3"
                onClick={() => setShowBillPreview((prev) => !prev)}
              >
                {showBillPreview ? "▲ Hide Detailed Bill" : "🧾 View Detailed Bill"}
              </button>

              {showBillPreview && (
                <div
                  className="mt-3 p-3"
                  style={{
                    border: "1px dashed #ccc",
                    borderRadius: "8px",
                    fontSize: "0.88rem",
                  }}
                >
                  <h6 className="fw-bold mb-2 text-center">🧾 Bill Preview</h6>

                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Date & Time</span>
                    <span>{new Date().toLocaleString()}</span>
                  </div>

                  <hr className="my-2" />

                  <h6 className="fw-bold mb-1" style={{ fontSize: "0.85rem" }}>
                    Customer Details
                  </h6>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Name</span>
                    <span>{form.name || "-"}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Email</span>
                    <span>{form.email || "-"}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Phone</span>
                    <span>{form.phone || "-"}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Address</span>
                    <span style={{ textAlign: "right", maxWidth: "60%" }}>
                      {form.address || form.city ? `${form.address}, ${form.city}` : "-"}
                    </span>
                  </div>
                  {form.roomNumber && (
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Room Number</span>
                      <span>{form.roomNumber}</span>
                    </div>
                  )}
                  {form.tableNumber && (
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Table</span>
                      <span>{form.tableNumber}</span>
                    </div>
                  )}

                  <hr className="my-2" />

                  <h6 className="fw-bold mb-1" style={{ fontSize: "0.85rem" }}>
                    Items
                  </h6>
                  <table className="table table-sm mb-2" style={{ fontSize: "0.85rem" }}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, index) => (
                        <tr key={index}>
                          <td>
                            {item.name}
                            {item.selectedSize ? ` (${item.selectedSize})` : ""}
                          </td>
                          <td className="text-center">{item.quantity || 1}</td>
                          <td className="text-end">₹{item.finalPrice || item.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <hr className="my-2" />

                  <div className="d-flex justify-content-between">
                    <span>Subtotal</span>
                    <span>₹{total}</span>
                  </div>
                  {hasVoucher && (
                    <div
                      className="d-flex justify-content-between"
                      style={{ color: "#c78e00", fontWeight: 600 }}
                    >
                      <span>🎟️ Voucher Discount</span>
                      <span>- ₹{voucherCovered}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between fw-bold pt-2 mt-1 border-top">
                    <span>{hasVoucher ? "You Pay" : "Total"}</span>
                    <span style={{ color: hasVoucher && payableAmount === 0 ? "#198754" : "inherit" }}>
                      {hasVoucher && payableAmount === 0 ? "FREE 🎉" : `₹${payableAmount}`}
                    </span>
                  </div>

                  <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.75rem" }}>
                    * Fill your details on the right to complete the bill before placing the order.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="col-md-7">
            <div className="card shadow p-4">
              <h4 className="fw-bold mb-3">Delivery Details</h4>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter Your Name"
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
                    placeholder="Enter Your Address"
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
                    placeholder="Enter Your City "
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Room Number{" "}
                    <span className="text-muted fw-normal">
                      (Please fill this only if you are ordering from your hotel room (Optional).)
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="roomNumber"
                    value={form.roomNumber}
                    onChange={handleChange}
                    placeholder="Optional - e.g. 102"
                  />
                </div>

                {/* ---------- TABLE NUMBER SECTION ---------- */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Table Number{" "}
                    <span className="text-muted fw-normal">
                      (Please fill this only if you are dining in at a table (Optional).)
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    name="tableNumber"
                    value={form.tableNumber}
                    onChange={handleChange}
                    placeholder="Optional - e.g. 5"
                  />

                  {/* 2-Chair Tables */}
                  <p className="fw-semibold text-secondary mb-1 mt-2" style={{ fontSize: "0.9rem" }}>
                    🪑 2-Chair Tables
                  </p>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {twoChairTables.map((num) => {
                      const label = `Table ${num} (2 Chairs)`;
                      const isSelected = form.tableNumber === label;
                      const isBooked = bookedTables.includes(label);
                      return (
                        <div
                          key={`2c-${num}`}
                          onClick={() => handleTableSelect(num, "2")}
                          style={{
                            width: "55px",
                            height: "55px",
                            border: isSelected
                              ? "2px solid #ffc107"
                              : "2px dotted #6c757d",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontWeight: "bold",
                            backgroundColor: isSelected
                              ? "#ffc107"
                              : isBooked
                              ? "#dc3545"
                              : "#28a745",
                            color: isSelected ? "#000" : "#fff",
                            transition: "all 0.2s ease-in-out",
                          }}
                        >
                          {num}
                        </div>
                      );
                    })}
                  </div>

                  {/* 4-Chair Tables */}
                  <p className="fw-semibold text-secondary mb-1" style={{ fontSize: "0.9rem" }}>
                    🪑🪑 4-Chair Tables
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    {fourChairTables.map((num) => {
                      const label = `Table ${num} (4 Chairs)`;
                      const isSelected = form.tableNumber === label;
                      const isBooked = bookedTables.includes(label);
                      return (
                        <div
                          key={`4c-${num}`}
                          onClick={() => handleTableSelect(num, "4")}
                          style={{
                            width: "55px",
                            height: "55px",
                            border: isSelected
                              ? "2px solid #ffc107"
                              : "2px dotted #6c757d",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontWeight: "bold",
                            backgroundColor: isSelected
                              ? "#ffc107"
                              : isBooked
                              ? "#dc3545"
                              : "#28a745",
                            color: isSelected ? "#000" : "#fff",
                            transition: "all 0.2s ease-in-out",
                          }}
                        >
                          {num}
                        </div>
                      );
                    })}
                  </div>
                  <div className="d-flex gap-3 mt-2" style={{ fontSize: "0.8rem" }}>
                    <span><span style={{ display: "inline-block", width: "12px", height: "12px", backgroundColor: "#28a745", borderRadius: "3px", marginRight: "4px" }}></span>Free</span>
                    <span><span style={{ display: "inline-block", width: "12px", height: "12px", backgroundColor: "#dc3545", borderRadius: "3px", marginRight: "4px" }}></span>Booked</span>
                    <span><span style={{ display: "inline-block", width: "12px", height: "12px", backgroundColor: "#ffc107", borderRadius: "3px", marginRight: "4px" }}></span>Selected</span>
                  </div>
                </div>
                {/* ---------- END TABLE NUMBER SECTION ---------- */}

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

                {paymentMethod === "qr" && payableAmount > 0 && (
                  <QrPaymentBox amount={payableAmount} utr={utr} setUtr={setUtr} />
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
                    ? "Processing..."
                    : hasVoucher && payableAmount === 0
                    ? "Place Order (FREE 🎉)"
                    : paymentMethod === "cod"
                    ? "Place Order (Pay on Delivery)"
                    : paymentMethod === "qr"
                    ? "Submit Payment Details"
                    : `Pay ₹${payableAmount} Online`}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/food" className="btn btn-dark">
            ← Back to Food Menu
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FoodCheckout;