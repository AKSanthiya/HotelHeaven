import React from "react";

function Services() {
  const services = [
    {
      icon: "🛏️",
      title: "Luxury Rooms",
      description:
        "Comfortable and well-equipped rooms for a relaxing stay."
    },
    {
      icon: "🍽️",
      title: "Restaurant & Food",
      description:
        "Enjoy delicious food and refreshing drinks with great taste."
    },
    {
      icon: "🎉",
      title: "Party Hall",
      description:
        "Celebrate weddings, birthdays and special occasions with us."
    },
    {
      icon: "🎀",
      title: "Hall Decoration",
      description:
        "Beautiful decoration ideas to make your celebrations memorable."
    },
    {
      icon: "🚗",
      title: "Parking",
      description:
        "Safe and convenient parking facilities for our guests."
    },
    {
      icon: "⭐",
      title: "24/7 Hospitality",
      description:
        "Friendly and professional service to make your stay special."
    }
  ];

  return (
    <section id="services" className="py-5 bg-light">
      <div className="container">

        {/* Heading */}
        <div className="text-center mb-5">
          <p className="text-warning fw-bold">OUR SERVICES</p>

          <h2 className="fw-bold">
            Everything You Need in One Place
          </h2>

          <p className="text-muted">
            Experience comfort, convenience and memorable moments
            at Hotel Heaven.
          </p>
        </div>

        {/* Service Cards */}
        <div className="row g-4">

          {services.map((service, index) => (
            <div className="col-md-6 col-lg-4" key={index}>

              <div className="card h-100 border-0 shadow-sm text-center p-4 service-card">

                <div className="fs-1 mb-3">
                  {service.icon}
                </div>

                <h4 className="fw-bold mb-3">
                  {service.title}
                </h4>

                <p className="text-muted mb-0">
                  {service.description}
                </p>

              </div>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Services;