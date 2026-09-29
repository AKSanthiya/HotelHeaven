import React, { useEffect, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useNavigate } from "react-router-dom";
import hotelImg from "./food images/hotelheaven1.jpg";

function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";

    // load elegant hotel-style fonts
    const fontLink = document.createElement("link");
    fontLink.id = "hotel-fonts";
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Poppins:wght@400;500;600&display=swap";
    if (!document.getElementById("hotel-fonts")) {
      document.head.appendChild(fontLink);
    }

    // typewriter keyframes injected once
    const styleTag = document.createElement("style");
    styleTag.id = "typewriter-style";
    styleTag.innerHTML = `
      @keyframes typewriter {
        from { width: 0; }
        to { width: 100%; }
      }
      @keyframes blinkCaret {
        from, to { border-color: transparent; }
        50% { border-color: #fff; }
      }
      .typewriter-text {
        display: inline-block;
        overflow: hidden;
        white-space: nowrap;
        border-right: 3px solid #fff;
        width: 0;
        font-family: 'Playfair Display', Georgia, serif;
        animation: typewriter 2.5s steps(22, end) forwards,
          blinkCaret 0.75s step-end 4, 
          hideCaret 0s 3s forwards;
      }
      @keyframes hideCaret {
        to { border-right-color: transparent; }
      }
    `;
    if (!document.getElementById("typewriter-style")) {
      document.head.appendChild(styleTag);
    }
    return () => {
      const tag = document.getElementById("typewriter-style");
      if (tag) tag.remove();
    };
  }, []);

  const handleGoogleLogin = async () => {
    // Guard: if a login is already in progress, ignore extra clicks
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      fetch("https://hotelheaven.onrender.com/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name: user.displayName }),
      })
        .then((res) => res.json())
        .then((data) => console.log("Email response:", data))
        .catch((err) => console.error("Email sending error:", err));

      // Leading slash is important: absolute path, so /login la irundhaalum /home ku dhaan pogum
      navigate("/home");
    } catch (error) {
      console.error("Login failed:", error);

      // Don't show an alert for a cancelled popup — that's not a real error,
      // it just means the user closed the popup or clicked again too fast.
      if (
        error.code !== "auth/cancelled-popup-request" &&
        error.code !== "auth/popup-closed-by-user"
      ) {
        alert("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        fontFamily: "'Poppins', Arial, sans-serif",
      }}
    >
      <img
        src={hotelImg}
        alt="Hotel Heaven"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* light overlay just to boost text contrast, not a visible box */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          textAlign: "left",
          padding: "20px",
          paddingLeft: "6%",
          paddingBottom: "12%",
        }}
      >
        <h1
          className="typewriter-text"
          style={{
            color: "#fff",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontSize: "2.8rem",
            letterSpacing: "1px",
            margin: 0,
            marginBottom: "14px",
            textShadow:
              "0 0 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,1)",
          }}
        >
          WELCOME TO HOTEL HEAVEN
        </h1>
        <p
          style={{
            color: "#f0e6d2",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: "1.1rem",
            letterSpacing: "0.5px",
            margin: 0,
            marginBottom: "28px",
            textShadow:
              "0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,1)",
          }}
        >
          PLEASE SIGN IN TO CONTINUE
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{
            padding: "12px 28px",
            fontFamily: "'Poppins', sans-serif",
            fontSize: "16px",
            fontWeight: "600",
            backgroundColor: "#fff",
            color: "#3c4043",
            border: "none",
            borderRadius: "8px",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24 C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}

export default Login;