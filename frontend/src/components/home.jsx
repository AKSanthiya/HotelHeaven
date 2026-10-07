import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import aboutImg from "../assets/sideviewhh.jpeg";
import "./Home.css";

function Home() {
  const [user, setUser] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const location = useLocation();

  // Listen for Firebase login state (persists automatically across pages)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Welcome message - oru login ku oru dhadava mattum
  useEffect(() => {
    if (!user) return;
    const key = `welcomed_${user.uid}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "yes");
    setShowWelcome(true);
    const timer = setTimeout(() => setShowWelcome(false), 3500);
    return () => clearTimeout(timer);
  }, [user]);

  // Other page la irundhu Contact click panna -> Home vandhu footer ku scroll
  useEffect(() => {
    if (location.state?.scrollTo === "contact") {
      setTimeout(() => {
        document
          .getElementById("contact")
          ?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 150);
    }
  }, [location]);

  // Once we know who's logged in, check their voucher status
  useEffect(() => {
    if (!user?.email) {
      setVoucher(null);
      return;
    }

    fetch(`https://hotelheaven.onrender.com/api/voucher-status/${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => setVoucher(data.activeVoucher))
      .catch((err) => console.error("Voucher status fetch failed:", err));
  }, [user]);

  return (
    <div className="home-page">

      {/* WELCOME MESSAGE */}
      {showWelcome && (
        <div className="welcome-toast">
          Welcome back, {user?.displayName?.split(" ")[0] || "Guest"} 👋
        </div>
      )}

      {/* VOUCHER NOTIFICATION BANNER */}
      {voucher && (
        <div
          style={{
            background: "linear-gradient(90deg, #ffc107, #ffb300)",
            color: "#1a1a1a",
            padding: "16px 20px",
            marginTop: "80px",
            textAlign: "center",
            fontWeight: 600,
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}
        >
          🎉 Hello {user?.displayName || "Guest"}! You've unlocked a{" "}
          <strong>₹{voucher.amount} Food Voucher</strong> + <strong>Free Parking</strong>!
          <br />
          <span style={{ fontSize: "0.9rem" }}>
            Valid for 1 day from today — use it before it expires.
          </span>
          <br />
          <Link
            to="/food"
            state={{ voucherId: voucher._id, voucherBalance: voucher.remainingAmount }}
            style={{
              display: "inline-block",
              marginTop: "10px",
              padding: "8px 20px",
              background: "#1a1a1a",
              color: "#fff",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            🍽️ Order Free Food Now →
          </Link>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(2,15,32,0.95), rgba(2,15,32,0.45)), url(${aboutImg})` }}>
        <div className="hero-content">
          <p className="welcome fade-up">Welcome to</p>
          <h1 className="fade-up d1">HOTEL<br />HEAVEN</h1>

          <div className="gold-line line-grow"></div>

          <h3 className="fade-up d2">Your Comfort, Our Priority</h3>

          <p className="hero-text fade-up d3">
            Experience comfortable rooms, delicious food
            and memorable celebrations under one roof.
          </p>

          <div className="hero-buttons fade-up d4">
            <Link to="/rooms">
              <button>🛏 BOOK A ROOM</button>
            </Link>
            <Link to="/admin">
              <button className="outline-btn">🔐 ADMIN</button>
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section">
        <h2>OUR SERVICES</h2>
        <div className="heading-line"></div>

        <div className="service-container">

          <div className="service-card fade-up d1">
            <div className="service-icon">🛏️</div>
            <h3>ROOM BOOKING</h3>
            <p>Comfortable and luxurious rooms for a relaxing stay.</p>
            <Link to="/rooms">BOOK NOW →</Link>
          </div>

          <div className="service-card fade-up d2">
            <div className="service-icon">🍽️</div>
            <h3>FOOD & RESTAURANT</h3>
            <p>Delicious food with a great dining experience.</p>
            <Link to="/food">EXPLORE FOOD →</Link>
          </div>

          <div className="service-card fade-up d3">
            <div className="service-icon">🎉</div>
            <h3>PARTY HALL</h3>
            <p>Perfect space for weddings, birthdays and events.</p>
            <Link to="/hall-booking">VIEW HALLS →</Link>
          </div>

          <div className="service-card fade-up d4">
            <div className="service-icon">🚗</div>
            <h3>PARKING</h3>
            <p>Safe and convenient parking facilities.</p>
            <Link to="/parking">PARKING INFO →</Link>
          </div>

        </div>
      </section>


      {/* WHY CHOOSE US */}
      <section className="why-section">
        <h2>WHY CHOOSE HOTEL HEAVEN?</h2>
        <div className="heading-line"></div>

        <div className="why-container">

          <div>
            <div className="why-icon">⭐</div>
            <h3>COMFORTABLE STAY</h3>
            <p>Well-furnished rooms for a relaxing stay.</p>
          </div>

          <div>
            <div className="why-icon">🍴</div>
            <h3>QUALITY FOOD</h3>
            <p>Hygienic and tasty food for every mood.</p>
          </div>

          <div>
            <div className="why-icon">🏨</div>
            <h3>BEAUTIFUL HALLS</h3>
            <p>Spacious halls for all your celebrations.</p>
          </div>

          <div>
            <div className="why-icon">🚗</div>
            <h3>EASY PARKING</h3>
            <p>Ample and secure parking space.</p>
          </div>

          <div>
            <div className="why-icon">👨‍💼</div>
            <h3>EXCELLENT SERVICE</h3>
            <p>Friendly staff and quick service always.</p>
          </div>

        </div>
      </section>


      {/* FOOTER */}
      <footer>
        <div className="footer-container">

          <div>
            <h2>♛ HOTEL HEAVEN</h2>
            <p>Your Comfort, Our Priority.</p>
            <p>Thank you for choosing Hotel Heaven.</p>
          </div>

          <div>
            <h3>QUICK LINKS</h3>
            <p><Link to="/">Home</Link></p>
            <p><Link to="/about">About Us</Link></p>
            <p><Link to="/rooms">Rooms</Link></p>
            <p><Link to="/food">Food</Link></p>
            <p><Link to="/hall-booking">Party Hall</Link></p>
            <p><Link to="/parking">Parking</Link></p>
          </div>

          <div>
            <h3>OUR SERVICES</h3>
            <p><Link to="/rooms">Room Booking</Link></p>
            <p><Link to="/food">Food & Restaurant</Link></p>
            <p><Link to="/hall-booking">Party Hall</Link></p>
            <p><Link to="/parking">Parking</Link></p>
          </div>

          <div id="contact">
            <h3>CONTACT US</h3>
            <p>📞 +91 90801 44082</p>
            <p>✉️ info@hotelheaven.com</p>
            <p>📍 Sivakasi, Tamil Nadu</p>
          </div>

        </div>

        <div className="copyright">
          © 2026 Hotel Heaven. All Rights Reserved.
        </div>
      </footer>

    </div>
  );
}

export default Home;