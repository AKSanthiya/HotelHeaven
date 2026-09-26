import React, { useState, useEffect } from 'react';
import parkingImg from '../assets/parking/parking-image2.jpeg';
import './Parking.css';

const TOTAL_SLOTS = 30;
const SLOT_PRICE = 100; // 🔧 venumna price maathikonga

// ============================================================
// 🔧 ovoru slot-kum category assign pannirukom.
// venumna range numbers maathikkalam (total 30 kulla irukanum).
// ============================================================
const BIKE_SLOTS = Array.from({ length: 10 }, (_, i) => i + 1);       // 1-10
const CAR_SLOTS = Array.from({ length: 10 }, (_, i) => i + 11);       // 11-20
const OTHER_SLOTS = Array.from({ length: 10 }, (_, i) => i + 21);     // 21-30

const CATEGORY_MAP = {};
BIKE_SLOTS.forEach((n) => (CATEGORY_MAP[n] = 'Bike'));
CAR_SLOTS.forEach((n) => (CATEGORY_MAP[n] = 'Car'));
OTHER_SLOTS.forEach((n) => (CATEGORY_MAP[n] = 'Other'));

const FILTERS = [
  { id: 'All', label: 'All' },
  { id: 'Bike', label: 'Bike' },
  { id: 'Car', label: 'Car' },
  { id: 'Other', label: 'Others' },
];

export default function Parking() {
  const [booked, setBooked] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const [form, setForm] = useState({
    userName: '',
    userEmail: '',
    vehicleNumber: '',
    vehicleType: 'Car',
  });

  useEffect(() => {
    fetchBookedSlots();
  }, []);

  const fetchBookedSlots = () => {
    setLoading(true);
    fetch('https://hotelheaven.onrender.com/api/booked-parking')
      .then((res) => res.json())
      .then((data) => {
        setBooked(data.map((s) => Number(s)));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch booked slots:', err);
        setLoading(false);
      });
  };

  const handleSlotClick = (slotNum) => {
    if (booked.includes(slotNum)) return;
    setSelected(slotNum);
    setMessage(null);
    // slot-oda category-ku match aana vehicle type auto-select
    const cat = CATEGORY_MAP[slotNum];
    setForm((prev) => ({ ...prev, vehicleType: cat === 'Other' ? 'Car' : cat }));
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setSelected(null);
    setForm({ userName: '', userEmail: '', vehicleNumber: '', vehicleType: 'Car' });
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();

    if (!form.userName || !form.userEmail || !form.vehicleNumber) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const bookingData = {
      type: 'parking',
      itemName: `Parking Slot ${selected}`,
      userName: form.userName,
      userEmail: form.userEmail,
      price: SLOT_PRICE,
      details: {
        slot: String(selected),
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber,
      },
    };

    try {
      const res = await fetch('https://hotelheaven.onrender.com/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Slot ${selected} booked! Confirmation mail anupitrukom.` });
        setBooked((prev) => [...prev, selected]);
        setSelected(null);
        setForm({ userName: '', userEmail: '', vehicleNumber: '', vehicleType: 'Car' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Booking failed, try again' });
      }
    } catch (err) {
      console.error('Booking error:', err);
      setMessage({ type: 'error', text: 'Server error, try again later' });
    } finally {
      setSubmitting(false);
    }
  };

  // Fixed 1-30. Position never changes, only color/state + filter visibility changes.
  const allSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1);
  const availableCount = allSlots.filter((n) => !booked.includes(n)).length;

  const visibleSlots = allSlots.filter(
    (n) => activeFilter === 'All' || CATEGORY_MAP[n] === activeFilter
  );

  return (
    <div className="parking-page">
      <h2 className="parking-title">Parking Slot Booking</h2>

      {/* Image - just decorative on top */}
      <div className="parking-lot-container">
        <img src={parkingImg} alt="Parking Lot" className="parking-lot-image" />
      </div>

      {/* Legend */}
      <div className="parking-legend">
        <span className="legend-item"><span className="legend-box legend-available"></span> Available</span>
        <span className="legend-item"><span className="legend-box legend-selected"></span> Selected</span>
        <span className="legend-item"><span className="legend-box legend-booked"></span> Booked</span>
      </div>

      {loading ? (
        <p className="parking-loading">Loading slots...</p>
      ) : (
        <div className="parking-content">
          {/* Left sidebar filters */}
          <div className="parking-sidebar">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className={`filter-btn ${activeFilter === f.id ? 'filter-active' : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Right side grid */}
          <div className="parking-main">
            <h3 className="parking-section-title">
              Slots ({availableCount} available / {TOTAL_SLOTS} total)
            </h3>
            <div className="parking-grid">
              {visibleSlots.map((num) => {
                const isBooked = booked.includes(num);
                const isSelected = selected === num;
                return (
                  <div
                    key={num}
                    className={`parking-box ${isBooked ? 'box-booked' : ''} ${isSelected ? 'box-selected' : ''}`}
                    onClick={() => handleSlotClick(num)}
                    title={isBooked ? `Slot ${num} - Booked` : `Slot ${num} - Available`}
                  >
                    {num}
                  </div>
                );
              })}
              {visibleSlots.length === 0 && (
                <p className="parking-empty">Idhu category-la slots illa</p>
              )}
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`parking-message ${message.type === 'success' ? 'msg-success' : 'msg-error'}`}>
          {message.text}
        </div>
      )}

      {selected && (
        <div className="parking-form-overlay">
          <form className="parking-form" onSubmit={handleConfirmBooking}>
            <h3>Book Slot {selected}</h3>

            <label>Name</label>
            <input
              type="text"
              name="userName"
              value={form.userName}
              onChange={handleFormChange}
              placeholder="Your name"
              required
            />

            <label>Email</label>
            <input
              type="email"
              name="userEmail"
              value={form.userEmail}
              onChange={handleFormChange}
              placeholder="your@email.com"
              required
            />

            <label>Vehicle Number</label>
            <input
              type="text"
              name="vehicleNumber"
              value={form.vehicleNumber}
              onChange={handleFormChange}
              placeholder="TN 12 AB 1234"
              required
            />

            <label>Vehicle Type</label>
            <select name="vehicleType" value={form.vehicleType} onChange={handleFormChange}>
              <option value="Car">Car</option>
              <option value="Bike">Bike</option>
              <option value="Other">Other</option>
            </select>

            <div className="parking-form-buttons">
              <button type="button" className="btn-cancel" onClick={handleCancel} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-confirm" disabled={submitting}>
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}