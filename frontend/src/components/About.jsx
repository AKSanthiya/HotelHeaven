import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import aboutImg from "../assets/hotelsheaven.png";
import "./About.css";

function About() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section id="about" className="py-5" ref={sectionRef}>
      <div className="container">
        <div className="row align-items-center">

          {/* Hotel Image */}
          <div
            className={`col-lg-6 mb-4 mb-lg-0 about-fade about-fade-left ${
              isVisible ? "about-visible" : ""
            }`}
          >
            <img
  src={aboutImg}
  alt="Hotel Heaven"
  className="img-fluid rounded shadow"
/>
          </div>

          {/* About Content */}
          <div
            className={`col-lg-6 about-fade about-fade-right ${
              isVisible ? "about-visible" : ""
            }`}
          >
            <p className="text-warning fw-bold">✨ ABOUT HOTEL HEAVEN</p>

            <h2 className="fw-bold mb-4">
              A Place Where Every Stay Feels Special
            </h2>

            <p className="text-muted">
              Welcome to Hotel Heaven, a destination created for comfort,
              elegance, and unforgettable experiences. From relaxing stays
              in our beautifully designed rooms to enjoying delicious food
              and celebrating special moments in our elegant party halls,
              everything is designed to make your time with us truly
              memorable.
            </p>

            <p className="text-muted">
              Whether you are travelling with family, planning a
              celebration, enjoying a delicious meal, or simply looking
              for a comfortable place to stay, Hotel Heaven brings
              everything together under one roof.
            </p>

            <p className="text-muted">
              With modern facilities, warm hospitality, comfortable rooms,
              delightful dining, spacious event halls, and convenient
              parking, we aim to give every guest an experience worth
              remembering.
            </p>

            <div className="stay-dine-tagline mb-4">
              {["Stay", "Dine", "Celebrate", "Enjoy"].map((word, index) => (
                <span
                  key={word}
                  className={`tagline-word ${
                    isVisible ? "tagline-visible" : ""
                  }`}
                  style={{ transitionDelay: `${index * 0.2 + 0.5}s` }}
                >
                  {word}
                  {index !== 3 && <span className="tagline-dot"> • </span>}
                </span>
              ))}
            </div>

            <p className="fst-italic fw-semibold mb-4">
              Hotel Heaven — Where Comfort Meets Happiness.
            </p>

            <div className="row">
              <div className="col-6 mb-3">
                <h6>✓ Comfortable Rooms</h6>
              </div>
              <div className="col-6 mb-3">
                <h6>✓ Delicious Food</h6>
              </div>
              <div className="col-6">
                <h6>✓ Beautiful Party Halls</h6>
              </div>
              <div className="col-6">
                <h6>✓ Safe Parking</h6>
              </div>
            </div>
          </div>

        </div>

        {/* Back to Home button */}
        <div className="text-center mt-5">
          <Link to="/home" className="btn btn-dark">
            ← Back to Home Page
          </Link>
        </div>
      </div>
    </section>
  );
}

export default About;