import React from "react";
import heroBg from "../assets/hotelsheaven.png";

function Hero() {
  return (
    <section
      id="home"
      className="d-flex align-items-center text-white"
      style={{
        minHeight: "100vh",
        background:
          `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.65)), url(${heroBg}) center 20%/cover no-repeat`,
        paddingTop: "80px",
      }}
    >
      <div className="container text-center">

        <p
          className="text-warning fw-semibold mb-2"
          style={{ fontSize: "22px", letterSpacing: "3px" }}
        >
          WELCOME TO
        </p>

        <h1
          className="fw-bold mb-3"
          style={{
            fontSize: "70px",
            letterSpacing: "5px",
            fontFamily: "Georgia, serif",
          }}
        >
          HOTEL HEAVEN
        </h1>

        <div
          className="mx-auto mb-4"
          style={{
            width: "180px",
            height: "3px",
            backgroundColor: "#f0b936",
          }}
        ></div>

        <h3 className="text-warning mb-3">
          Your Comfort, Our Priority
        </h3>

        <p
          className="lead mx-auto mb-4"
          style={{ maxWidth: "650px", lineHeight: "1.8" }}
        >
          Experience comfortable rooms, delicious food and
          memorable celebrations under one roof.
        </p>

        <div className="d-flex justify-content-center gap-3">

          <a
            href="#booking"
            className="btn btn-warning btn-lg px-4 fw-bold"
          >
            🛏️ BOOK A ROOM
          </a>

          <a
            href="#about"
            className="btn btn-outline-light btn-lg px-4 fw-bold"
          >
            EXPLORE HOTEL
          </a>

        </div>

      </div>
    </section>
  );
}

export default Hero;