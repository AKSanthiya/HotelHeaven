import React from "react";

function FoodList({ category, onBack }) {
  const southIndianFoods = [
    { name: "Idly", price: 40 },
    { name: "Dosa", price: 60 },
    { name: "Ghee Roast", price: 100 },
    { name: "Pongal", price: 70 },
    { name: "Poori", price: 60 },
    { name: "Vada", price: 25 },
    { name: "Full Meals", price: 300 },
    { name: "Sambar Rice", price: 150 },
    { name: "Curd Rice", price: 150 },
    { name: "Lemon Rice", price: 150 },
  ];

  return (
    <div style={{ paddingTop: "100px" }}>
      <div className="container py-5">

        {/* Back Button */}
        <button
          className="btn btn-outline-dark mb-4"
          onClick={onBack}
        >
          ← Back to Food Menu
        </button>

        {/* Heading */}
        <h1 className="text-center fw-bold mb-5">
          🍛 {category}
        </h1>

        {/* Food Cards */}
        <div className="row g-4">
          {southIndianFoods.map((food) => (
            <div
              className="col-md-6 col-lg-4"
              key={food.name}
            >
              <div className="card h-100 shadow">

                <div className="card-body text-center p-4">

                  <h4 className="fw-bold mb-3">
                    {food.name}
                  </h4>

                  <h5 className="text-success fw-bold mb-4">
                    ₹{food.price}
                  </h5>

                  {/* Add to Cart */}
                  <button
                    className="btn btn-dark me-2"
                    onClick={() =>
                      alert(`${food.name} added to cart!`)
                    }
                  >
                    🛒 Add to Cart
                  </button>

                  {/* Order Food */}
                  <button
                    className="btn btn-success"
                    onClick={() =>
                      alert(`Ordering ${food.name}!`)
                    }
                  >
                    🍽️ Order Food
                  </button>

                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default FoodList;