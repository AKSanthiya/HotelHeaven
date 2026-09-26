import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Rooms.css";

// Room images
import standardRoomImg from "./food images/standard room.png";
import deluxeRoomImg from "./food images/deluxe room.png";
import familyRoomImg from "./food images/family room.png";
import executiveSuiteImg from "./food images/executive suite.png";
import premiumRoomImg from "./food images/premium-room.jpg";
import luxuryRoomImg from "./food images/luxury-room.jpg";

function Rooms() {
  const navigate = useNavigate();
  const [selectedRoomNumbers, setSelectedRoomNumbers] = React.useState({});
  const [selectedDays, setSelectedDays] = React.useState({});
  const [cart, setCart] = React.useState([]);
  const [lightboxRoom, setLightboxRoom] = React.useState(null);
  const [bookedRooms, setBookedRooms] = React.useState([]);

  const roomTypes = [
    {
      id: "standard",
      icon: "🛏️",
      name: "Standard",
      price: 2000,
      amenities: ["AC", "TV", "Wi-Fi", "Queen Bed", "Bathroom"],
      image: standardRoomImg,
      roomNumbers: ["101", "102", "103", "104", "105", "106", "107", "108"],
    },
    {
      id: "deluxe",
      icon: "🛏️",
      name: "Deluxe",
      price: 2800,
      amenities: ["AC", "Smart TV", "Wi-Fi", "King Bed", "Mini Fridge"],
      image: deluxeRoomImg,
      roomNumbers: ["201", "202", "203", "204"],
    },
    {
      id: "premium",
      icon: "⭐",
      name: "Premium",
      price: 3500,
      amenities: ["AC", "Smart TV", "King Bed", "Sofa", "City View"],
      image: premiumRoomImg,
      roomNumbers: ["301", "302", "303"],
    },
    {
      id: "family",
      icon: "👨‍👩‍👧‍👦",
      name: "Family",
      price: 4200,
      amenities: ["AC", "Smart TV", "1 King + 2 Single Beds", "Large Space"],
      image: familyRoomImg,
      roomNumbers: ["401", "402"],
    },
    {
      id: "executive",
      icon: "🛋️",
      name: "Executive Suite",
      price: 5000,
      amenities: ["AC", "Smart TV", "King Bed", "Sofa", "Separate Living Room"],
      image: executiveSuiteImg,
      roomNumbers: ["501", "502"],
    },
    {
      id: "luxury",
      icon: "👑",
      name: "Luxury Suite",
      price: 7000,
      amenities: ["AC", "Smart TV", "King Bed", "Balcony", "Bathtub", "Living Room"],
      image: luxuryRoomImg,
      roomNumbers: ["601"],
    },
  ];

  // ---------- Fetch booked rooms from backend ----------
  React.useEffect(() => {
    const fetchBookedRooms = async () => {
      try {
        const res = await fetch("https://hotelheaven.onrender.com/api/booked-rooms");
        const data = await res.json();
        setBookedRooms(data); // e.g. ["Standard - Room 102", "Deluxe - Room 201"]
      } catch (err) {
        console.error("Failed to fetch booked rooms:", err);
      }
    };
    fetchBookedRooms();
  }, []);

  const isRoomBooked = (roomName, roomNumber) => {
    return bookedRooms.includes(`${roomName} - Room ${roomNumber}`);
  };

  const handleSelectRoomNumber = (roomId, roomNumber, roomName) => {
    if (isRoomBooked(roomName, roomNumber)) {
      alert("THE ROOM IS ALREADY SELECTED.. PLEASE SELECT ANOTHER ROOM 🙅‍♀️");
      return;
    }
    setSelectedRoomNumbers({ ...selectedRoomNumbers, [roomId]: roomNumber });
  };

  const handleDaysChange = (roomId, value) => {
    const days = Math.max(1, parseInt(value) || 1); // minimum 1 day
    setSelectedDays({ ...selectedDays, [roomId]: days });
  };

  const handleAddToCart = (room) => {
    const roomNumber = selectedRoomNumbers[room.id];
    if (!roomNumber) {
      alert("PLEASE SELECT THE ROOM NUMBER FIRST ! 🛏️");
      return;
    }

    const days = selectedDays[room.id] || 1;
    const totalPrice = room.price * days;

    setCart([
      ...cart,
      {
        roomType: room.name,
        roomNumber,
        pricePerNight: room.price,
        days,
        price: totalPrice, // total for this booking
      },
    ]);
    alert(`${room.name} Room ${roomNumber} — ${days} is added to a cart.. 🛒`);
  };

  const handleRemoveFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleOrderNow = () => {
    if (cart.length === 0) {
      alert("YOUR CART IS EMPTY. PLEASE ADD A ROOM FIRST ! 🛏️");
      return;
    }
    navigate("/room-checkout", { state: { cart } });
  };

  return (
    <div className="rooms-page-wrapper" style={{ paddingTop: "100px" }}>
      <div className="container py-5">
        <h1 className="text-center fw-bold mb-5">🏨 Our Rooms</h1>

        {/* Legend */}
        <div className="mb-4 d-flex gap-4 justify-content-center">
          <span>
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                background: "#28a745",
                borderRadius: "3px",
                marginRight: "6px",
              }}
            ></span>
            Available
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                background: "#dc3545",
                borderRadius: "3px",
                marginRight: "6px",
              }}
            ></span>
            Booked
          </span>
        </div>

        {roomTypes.map((room) => {
          const selectedNumber = selectedRoomNumbers[room.id];
          const days = selectedDays[room.id] || 1;

          return (
            <div className="card shadow mb-5 room-card" key={room.id}>
              <div className="row g-0">
                {/* Left side: Room image */}
                <div className="col-md-5">
                  {room.image ? (
                    <div
                      className="room-img-wrap"
                      onClick={() => setLightboxRoom(room)}
                    >
                      <img
                        src={room.image}
                        alt={room.name}
                        className="room-img"
                      />
                      <div className="room-img-zoom-hint">🔍 Click to zoom</div>
                    </div>
                  ) : (
                    <div className="room-img-placeholder">
                      Image coming soon
                    </div>
                  )}
                </div>

                {/* Right side: Room details */}
                <div className="col-md-7">
                  <div className="card-body h-100 d-flex flex-column">
                    <h3 className="fw-bold">
                      {room.icon} {room.name}
                    </h3>
                    <p className="fs-4 text-warning fw-bold">
                      ₹{room.price} <span className="fs-6 text-muted">/ night</span>
                    </p>

                    <p className="mb-2">
                      {room.amenities.join(" • ")}
                    </p>

                    <p className="fw-semibold mb-2">
                      Select Room Number:
                    </p>
                    <div className="mb-3">
                      {room.roomNumbers.map((num) => {
                        const booked = isRoomBooked(room.name, num);
                        const isSelected = selectedNumber === num;

                        let btnClass = "btn-outline-success"; // available, not selected
                        if (booked) btnClass = "btn-danger";
                        else if (isSelected) btnClass = "btn-dark";

                        return (
                          <button
                            key={num}
                            type="button"
                            className={`btn room-number-btn ${btnClass}`}
                            disabled={booked}
                            onClick={() =>
                              handleSelectRoomNumber(room.id, num, room.name)
                            }
                            title={booked ? "Already booked" : "Available"}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>

                    {/* Days selector */}
                    <div className="mb-3 d-flex align-items-center gap-2">
                      <label className="fw-semibold mb-0">
                        How many days?
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        style={{ width: "80px" }}
                        value={days}
                        onChange={(e) =>
                          handleDaysChange(room.id, e.target.value)
                        }
                      />
                      <span className="text-muted">
                        Total: ₹{room.price * days}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-warning fw-bold mt-auto align-self-start"
                      onClick={() => handleAddToCart(room)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Cart summary */}
        {cart.length > 0 && (
          <div className="card shadow p-4 mt-4">
            <h4 className="fw-bold mb-3">🛒 Your Cart</h4>
            {cart.map((item, index) => (
              <div
                key={index}
                className="d-flex justify-content-between align-items-center border-bottom py-2"
              >
                <span>
                  {item.roomType} — Room {item.roomNumber} ({item.days} day
                  {item.days > 1 ? "s" : ""})
                </span>
                <span className="d-flex align-items-center gap-3">
                  ₹{item.price}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveFromCart(index)}
                  >
                    ✕
                  </button>
                </span>
              </div>
            ))}

            <div className="d-flex justify-content-between fw-bold fs-5 mt-3">
              <span>Total</span>
              <span>
                ₹{cart.reduce((sum, item) => sum + item.price, 0)}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-warning fw-bold mt-3"
              onClick={handleOrderNow}
            >
              Order Now →
            </button>
          </div>
        )}

        <div className="text-center mt-4">
          <Link to="/" className="btn btn-dark">
            ← Back to Home Page
          </Link>
        </div>
      </div>

      {/* Lightbox modal */}
      {lightboxRoom && (
        <div
          className="room-lightbox-overlay"
          onClick={() => setLightboxRoom(null)}
        >
          <div
            className="room-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="room-lightbox-close"
              onClick={() => setLightboxRoom(null)}
            >
              &times;
            </span>

            <img
              src={lightboxRoom.image}
              alt={lightboxRoom.name}
              className="room-lightbox-img"
            />

            <div className="p-4">
              <h4 className="fw-bold">
                {lightboxRoom.icon} {lightboxRoom.name} — ₹{lightboxRoom.price}/night
              </h4>
              <p className="mb-3">{lightboxRoom.amenities.join(" • ")}</p>

              <p className="fw-semibold mb-2">Room Availability:</p>
              <div>
                {lightboxRoom.roomNumbers.map((num) => {
                  const booked = isRoomBooked(lightboxRoom.name, num);
                  const isSelected =
                    selectedRoomNumbers[lightboxRoom.id] === num;

                  let btnClass = "btn-outline-success";
                  if (booked) btnClass = "btn-danger";
                  else if (isSelected) btnClass = "btn-dark";

                  return (
                    <button
                      key={num}
                      type="button"
                      className={`btn room-number-btn ${btnClass}`}
                      disabled={booked}
                      onClick={() =>
                        handleSelectRoomNumber(
                          lightboxRoom.id,
                          num,
                          lightboxRoom.name
                        )
                      }
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="btn btn-warning fw-bold mt-3"
                onClick={() => {
                  handleAddToCart(lightboxRoom);
                  setLightboxRoom(null);
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rooms;