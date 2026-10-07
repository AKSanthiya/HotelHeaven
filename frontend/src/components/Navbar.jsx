import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/logo.jpeg";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const scrollToContact = (e) => {
    e.preventDefault();
    document
      .getElementById("contact")
      ?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container">

        {/* Hotel Name / Logo */}
        <Link className="navbar-brand fw-bold fs-3 d-flex align-items-center gap-2" to="/home">
          <img
            src={logo}
            alt="Hotel Heaven Logo"
            style={{ height: "45px", width: "45px", objectFit: "cover", borderRadius: "50%" }}
          />
          Hotel Heaven
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#hotelNavbar"
          aria-controls="hotelNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Menu */}
        <div className="collapse navbar-collapse" id="hotelNavbar">
          <ul className="navbar-nav ms-auto align-items-lg-center">

            {/* Home */}
            <li className="nav-item">
              <Link className="nav-link" to="/home">
                Home
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/about">
                About Us
              </Link>
            </li>

            {/* Food */}
            <li className="nav-item">
              <Link className="nav-link" to="/food">
                🍽️ Food
              </Link>
            </li>

            {/* Rooms */}
            <li className="nav-item">
              <Link className="nav-link" to="/rooms">
                🛏️ Rooms
              </Link>
            </li>

            {/* Hall */}
            <li className="nav-item">
              <Link className="nav-link" to="/hall-booking">
                🎉 Party Hall
              </Link>
            </li>

            {/* Parking */}
            <li className="nav-item">
              <Link className="nav-link" to="/parking">
                🚗 Parking
              </Link>
            </li>

            {/* Booking History - login pannirundha mattum theriyum */}
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/booking-history">
                  📋 Booking History
                </Link>
              </li>
            )}

            {/* Contact - footer ku scroll aagum */}
            <li className="nav-item">
              <a className="nav-link" href="#contact" onClick={scrollToContact}>
                Contact
              </a>
            </li>

            {/* User Avatar / Logout Dropdown */}
            {user && (
              <li className="nav-item dropdown ms-lg-3">
                <button
                  className="nav-link dropdown-toggle d-flex align-items-center bg-transparent border-0"
                  type="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    referrerPolicy="no-referrer"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #e8b53d",
                    }}
                  />
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="userDropdown"
                >
                  <li>
                    <span className="dropdown-item-text fw-bold">
                      {user.displayName}
                    </span>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
                      🚪 Logout
                    </button>
                  </li>
                </ul>
              </li>
            )}

          </ul>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;