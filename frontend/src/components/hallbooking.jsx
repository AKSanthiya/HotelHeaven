import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './HallBooking.css';

import conferenceImg from './decoration images/conference hall.jpg';
import royalPartyImg from './decoration images/royal party hall.jpg';
import grandCelebrationImg from './decoration images/grand-celebration-hall.jpg';

const halls = [
  {
    id: 'conference-hall',
    name: 'Conference Hall',
    icon: '💼',
    image: conferenceImg,
    capacity: '100 Guests',
    suitableFor: [
      'Business Meetings 💼', 'Seminars', 'Workshops',
      'Training Programs', 'Conferences', 'College Events',
      'Corporate Meetings', 'Presentations 📊'
    ],
    facilities: [
      'Fully Air-Conditioned ❄️', '100 Guest Seating 🪑',
      'Large Projector Screens 📽️', 'Presentation Stage',
      'Microphone 🎤', 'Professional Sound System 🔊',
      'High-Speed Wi-Fi 📶', 'LED Lighting ✨',
      'Drinking Water Facility 💧', 'Parking Facility 🚗'
    ],
    decorationOptions: [
      'Professional Seating Arrangement',
      'Stage + Projector Setup',
      'Hotel Heaven Branding Backdrop',
      'Minimal Floral Decoration 🌿'
    ],
    price: 20000
  },
  {
    id: 'royal-party-hall',
    name: 'Royal Party Hall',
    icon: '🎈',
    image: royalPartyImg,
    capacity: '80–120 Guests',
    suitableFor: [
      'Birthday Parties 🎂', 'Anniversary Celebrations ❤️',
      'Baby Shower 👶', 'Family Get-Together',
      'Farewell Parties', 'Small Engagement Functions'
    ],
    facilities: [
      'Fully Air-Conditioned ❄️', 'Party Stage 🎤',
      'Music System 🔊', 'LED Lighting ✨',
      'Comfortable Seating 🪑', 'Cake Cutting Area 🎂',
      'Photo Booth 📸', 'Decoration Support 🎈',
      'Dining Arrangement 🍽️'
    ],
    decorationOptions: [
      'Balloon Decoration 🎈', 'Birthday Theme 🎂',
      'Floral Decoration 🌸', 'LED Theme ✨',
      'Custom Name Backdrop'
    ],
    price: 40000
  },
  {
    id: 'grand-celebration-hall',
    name: 'Grand Celebration Hall',
    icon: '👑',
    image: grandCelebrationImg,
    capacity: '200–250 Guests',
    suitableFor: [
      'Weddings 💍', 'Wedding Receptions',
      'Engagement Functions', 'பெரிய Family Functions',
      'Cultural Events', 'Award Functions'
    ],
    facilities: [
      'Fully Air-Conditioned ❄️', 'Large Grand Stage 🎭',
      'Premium Seating 🪑', 'Sound System 🔊',
      'Microphone 🎤', 'LED Lighting ✨',
      'Dining Area 🍽️', 'Decoration Support 🌸',
      'Photography Area 📸', 'Parking Facility 🚗'
    ],
    decorationOptions: [
      'Royal Floral Theme 👑🌸',
      'Traditional Wedding Decoration',
      'Modern LED Decoration ✨',
      'Luxury Stage Decoration'
    ],
    price: 75000
  }
];

function HallBooking() {
  const [lightboxImage, setLightboxImage] = useState(null);
  const [bookedHalls, setBookedHalls] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookedHalls = async () => {
      try {
        const res = await fetch('https://hotelheaven.onrender.com/api/booked-halls');
        const data = await res.json();
        setBookedHalls(data); // e.g. ["Conference Hall", "Royal Party Hall"]
      } catch (err) {
        console.error('Failed to fetch booked halls:', err);
      }
    };
    fetchBookedHalls();
  }, []);

  const isHallBooked = (hallName) => bookedHalls.includes(hallName);

  const openLightbox = (image) => setLightboxImage(image);
  const closeLightbox = () => setLightboxImage(null);

  const handleBookNow = (hall) => {
    if (isHallBooked(hall.name)) {
      alert('This hall is already booked. Please select another hall.🙅‍♀️');
      return;
    }
    navigate('/hall-checkout', { state: { hall } });
  };

  return (
    <div className="hall-booking-page">
      <div className="hall-booking-header">
        <h1>🎉 Hall Booking</h1>
        <p>Choose the perfect hall for your event</p>
      </div>

      {/* Legend */}
      <div className="mb-4 d-flex gap-4 justify-content-center">
        <span>
          <span
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              background: '#28a745',
              borderRadius: '3px',
              marginRight: '6px',
            }}
          ></span>
          Available
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              background: '#dc3545',
              borderRadius: '3px',
              marginRight: '6px',
            }}
          ></span>
          Booked
        </span>
      </div>

      <div className="hall-grid">
        {halls.map((hall) => {
          const booked = isHallBooked(hall.name);

          return (
            <div className="hall-card" key={hall.id}>
              <div
                className="hall-image-wrapper"
                onClick={() => openLightbox(hall.image)}
              >
                <img src={hall.image} alt={hall.name} className="hall-image" />
                <span className="zoom-hint">🔍 Click to zoom</span>
              </div>

              <div className="hall-card-body">
                <h2>{hall.icon} {hall.name}</h2>

                <div className="hall-section">
                  <h4>👥 Capacity</h4>
                  <p>{hall.capacity}</p>
                </div>

                <div className="hall-section">
                  <h4>🎊 Suitable For</h4>
                  <ul>
                    {hall.suitableFor.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>

                <div className="hall-section">
                  <h4>✨ Facilities</h4>
                  <ul>
                    {hall.facilities.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>

                <div className="hall-section">
                  <h4>🌸 Decoration Options</h4>
                  <ul>
                    {hall.decorationOptions.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>

                <div className="hall-price">
                  💰 ₹{hall.price.toLocaleString()} / Event
                </div>

                <button
                  className="book-now-btn"
                  disabled={booked}
                  style={{
                    backgroundColor: booked ? '#dc3545' : '#28a745',
                    cursor: booked ? 'not-allowed' : 'pointer',
                    opacity: booked ? 0.85 : 1,
                  }}
                  onClick={() => handleBookNow(hall)}
                >
                  {booked ? 'Already Booked' : 'Book Now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {lightboxImage && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <img src={lightboxImage} alt="Hall preview" className="lightbox-image" />
          <button className="lightbox-close" onClick={closeLightbox}>✕</button>
        </div>
      )}

      <div className="text-center mt-4" style={{ textAlign: 'center', margin: '30px 0' }}>
        <Link to="/" className="btn btn-dark">
          ← Back to Home Page
        </Link>
      </div>
    </div>
  );
}

export default HallBooking;