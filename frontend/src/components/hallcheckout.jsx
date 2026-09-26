import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './HallCheckout.css';

// ---------- Razorpay public Key ID (safe to expose in frontend - NOT the secret) ----------
// Backend kudukkura keyId ye first use aagum; idhu just fallback.
const RAZORPAY_KEY_ID = 'rzp_test_TeFdyXXi625Mk3';

// Nandhini QR image -> frontend/public/nandhini-qr.jpeg
const QR_IMAGE_SRC = '/nandhini-qr.jpeg';

// ---------- Load the Razorpay Checkout.js script only once ----------
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-checkout-js')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ---------- 3 payment options: hotel | razorpay | qr ----------
const PAYMENT_OPTIONS = [
  { value: 'hotel', icon: '🏨', title: 'Cash at Hotel', sub: 'Pay at reception' },
  { value: 'razorpay', icon: '💳', title: 'Online Payment', sub: 'Card / Netbanking' },
  { value: 'qr', icon: '📱', title: 'Pay with QR', sub: 'Scan & pay via UPI' },
];

function PaymentMethodSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
      {PAYMENT_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <div
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: '1 1 30%',
              minWidth: '120px',
              border: selected ? '2px solid #ffc107' : '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px 12px',
              cursor: 'pointer',
              backgroundColor: selected ? '#fff8e1' : '#fff',
              fontWeight: selected ? 'bold' : 'normal',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          >
            {selected ? '✅' : opt.icon} {opt.title}
            <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#6c757d' }}>
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
      style={{
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        textAlign: 'center',
        backgroundColor: '#fffdf5',
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: '8px' }}>Scan & pay ₹{amount}</p>
      <img
        src={QR_IMAGE_SRC}
        alt="UPI QR Code"
        style={{
          maxWidth: '220px',
          width: '100%',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}
      />
      <p style={{ fontSize: '0.85rem', color: '#6c757d', margin: '8px 0 12px' }}>
        Pay the exact amount, then enter the 12-digit UTR / Reference No. from your UPI app below.
      </p>
      <input
        type="text"
        placeholder="12-digit UTR / Reference No."
        value={utr}
        maxLength={12}
        inputMode="numeric"
        onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
        style={{ textAlign: 'center', width: '100%', boxSizing: 'border-box' }}
      />
      <small style={{ display: 'block', color: '#6c757d', marginTop: '8px' }}>
        Booking is confirmed only after our team verifies your payment.
      </small>
    </div>
  );
}

function HallCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const hall = location.state?.hall;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    bookingDate: ''
  });
  const [submitted, setSubmitted] = useState(false);

  // ---------- Payment: "hotel" | "razorpay" | "qr" ----------
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payingNow, setPayingNow] = useState(false); // Razorpay modal open aagum pothu
  const [placedPayment, setPlacedPayment] = useState(null); // { label, status }

  if (!hall) {
    return (
      <div className="hall-checkout-page">
        <p>Hall details illa. <span onClick={() => navigate('/hall-booking')} className="link-text">Hall Booking page ku thirumbu poga click pannunga</span>.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ---------- Form validation (same rules as before) ----------
  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.address || !formData.phone || !formData.bookingDate) {
      alert('Please fill all fields');
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      alert('Please enter a valid email address! 📧');
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      alert('Phone number must be 10 digits!📱');
      return false;
    }

    return true;
  };

  // ---------- Actually save the hall booking to MongoDB ----------
  // paymentStatus: "Paid" (Razorpay) | "Pending Verification" (QR) | "Pay at Hotel"
  const saveBooking = async (paymentLabel, paymentStatus, utrValue = '') => {
    setSubmitting(true);
    const bookingData = {
      type: 'hall',
      itemName: hall.name,
      userName: formData.name,
      userEmail: formData.email,
      price: hall.price,
      details: {
        address: formData.address,
        phone: formData.phone,
        bookingDate: formData.bookingDate,
        paymentMethod: paymentLabel,
        paymentStatus: paymentStatus,
        utr: utrValue
      }
    };

    try {
      const res = await fetch('https://hotelheaven.onrender.com/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (res.ok) {
        setPlacedPayment({ label: paymentLabel, status: paymentStatus });
        setSubmitted(true);
      } else {
        alert('Booking failed, try again');
      }
    } catch (err) {
      alert('Server error. Please check whether the backend server is running.');
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
        alert('Razorpay could not be loaded. Please check your internet connection and try again.');
        setPayingNow(false);
        return;
      }

      // Step 1: Backend la order create pannurom
      const orderRes = await fetch('https://hotelheaven.onrender.com/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const orderData = await orderRes.json();

      if (!orderData.orderId) {
        console.error('Create order response:', orderData);
        alert('Unable to create the payment order. Please check whether the backend server is running.');
        setPayingNow(false);
        return;
      }

      // Step 2: Razorpay checkout popup open pannurom
      const options = {
        key: orderData.keyId || RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Hotel Heaven',
        description: 'Hall Booking Payment',
        order_id: orderData.orderId,
        handler: async function (response) {
          // Step 3: Payment success aana, backend la signature verify pannurom
          try {
            const verifyRes = await fetch('https://hotelheaven.onrender.com/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
              alert('Payment could not be verified. Even if the amount has been debited, your booking has not been confirmed. Please contact support.');
            }
          } catch (err) {
            console.error('Verification call failed:', err);
            alert('An error occurred while verifying the payment. Please contact support.');
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
          name: formData.name || '',
          email: formData.email || '',
          contact: formData.phone || '',
        },
        theme: { color: '#ffc107' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay payment failed:', err);
      alert('An error occurred while processing the payment. Please try again.');
      setPayingNow(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (paymentMethod === 'hotel') {
      // No payment now - pay at reception
      await saveBooking('Pay at Hotel', 'Pay at Hotel');
    } else if (paymentMethod === 'qr') {
      // QR payment - UTR kudutha aprom booking "Pending Verification" nu save aagum
      if (!/^\d{12}$/.test(utr)) {
        alert('Enter the 12-digit UTR / Reference No. from your UPI app 🔢');
        return;
      }
      await saveBooking(`UPI QR (UTR: ${utr})`, 'Pending Verification', utr);
    } else {
      // Real Razorpay payment - popup open aagum, success aana booking save aagum
      startRazorpayPayment({
        amount: hall.price,
        onSuccess: (paymentId) => {
          saveBooking(`Online Payment (Razorpay - ${paymentId})`, 'Paid');
        },
      });
    }
  };

  if (submitted) {
    const isQrPending = placedPayment?.status === 'Pending Verification';

    return (
      <div className="hall-checkout-page">
        <div className="thank-you-box">
          <h2>{isQrPending ? '⏳ Booking Received!' : '🎉 Thank You for Your Booking!'}</h2>
          <p>{hall.name} - ₹{hall.price.toLocaleString()} / Event</p>
          <p>Booking Date: {formData.bookingDate}</p>
          <p>Payment: {placedPayment ? placedPayment.label : '-'}</p>
          {isQrPending && (
            <p style={{ color: '#856404', background: '#fff3cd', padding: '10px', borderRadius: '8px' }}>
              Your QR payment is being verified by our team. Booking will be confirmed once
              the payment is received.
            </p>
          )}
          <button className="back-btn" onClick={() => navigate('/hall-booking')}>
            Back to Halls
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hall-checkout-page">
      <div className="checkout-card">
        <h2>{hall.icon} {hall.name} - Booking Details</h2>
        <p className="rate-display">💰 ₹{hall.price.toLocaleString()} / Event</p>

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />

          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your address"
          />

          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />

          <label>Booking Date</label>
          <input
            type="date"
            name="bookingDate"
            value={formData.bookingDate}
            onChange={handleChange}
          />

          {/* ---------- PAYMENT METHOD SECTION ---------- */}
          <label>Payment Method</label>
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

          {paymentMethod === 'qr' && (
            <QrPaymentBox amount={hall.price.toLocaleString()} utr={utr} setUtr={setUtr} />
          )}
          {/* ---------- END PAYMENT METHOD SECTION ---------- */}

          <button
            type="submit"
            className="confirm-btn"
            disabled={submitting || payingNow}
          >
            {payingNow
              ? 'Opening Payment...'
              : submitting
              ? 'Confirming...'
              : paymentMethod === 'hotel'
              ? 'Confirm Booking (Cash at Hotel)'
              : paymentMethod === 'qr'
              ? 'Submit Payment Details'
              : `Pay ₹${hall.price.toLocaleString()} Online`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default HallCheckout;