import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import About from "./components/About";
import Navbar from "./components/Navbar";
import Home from "./components/home";
import Food from "./components/Food";
import Rooms from "./components/Rooms";
import RoomCheckout from "./components/Roomcheckout";
import Login from "./components/login";
import Admin from "./components/admin";
import FoodCheckout from "./components/foodcheckout";
import HallBooking from "./components/hallbooking";
import HallCheckout from "./components/hallcheckout";
import Parking from "./components/parking";
import ParkingCheckout from "./components/parkingcheckout";
import Chatbot from "./components/Chatbot";

function AppContent() {
  const location = useLocation();
  const hideChrome = location.pathname === "/";

  return (
    <>
      {!hideChrome && <Navbar />}

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/food" element={<Food />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/room-checkout" element={<RoomCheckout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/food-checkout" element={<FoodCheckout />} />
        <Route path="/hall-booking" element={<HallBooking />} />
        <Route path="/hall-checkout" element={<HallCheckout />} />
        <Route path="/parking" element={<Parking />} />
        <Route path="/parking-checkout" element={<ParkingCheckout />} />
      </Routes>

      {!hideChrome && <Chatbot />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;