import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BubbleController,
  PolarAreaController,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Bubble, PolarArea } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BubbleController,
  PolarAreaController,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

// ---------- 4 categories, each with its own colour in the analytics charts ----------
const CATEGORIES = [
  { key: "food", label: "Food", color: "#ff7043" },
  { key: "room", label: "Room", color: "#1e88e5" },
  { key: "hall", label: "Hall", color: "#8e24aa" },
  { key: "parking", label: "Parking", color: "#43a047" },
];

// ---------- Custom plugin: bubble kulla ₹ amount ezhuthum (monthly bubble chart) ----------
const bubbleLabelPlugin = {
  id: "bubbleLabels",
  afterDatasetsDraw: (chart) => {
    const { ctx } = chart;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 11px sans-serif";

    chart.data.datasets.forEach((dataset, i) => {
      if (!chart.isDatasetVisible(i)) return;
      const meta = chart.getDatasetMeta(i);

      meta.data.forEach((point, j) => {
        const raw = dataset.data[j];
        if (!raw || !raw.sales) return;

        const label = `₹${Math.round(raw.sales)}`;
        if (raw.r >= 16) {
          // periya bubble - ulla ezhuthalam
          ctx.fillStyle = "#fff";
          ctx.fillText(label, point.x, point.y);
        } else {
          // sinna bubble - mela ezhuthalam
          ctx.fillStyle = "#333";
          ctx.fillText(label, point.x, point.y - raw.r - 8);
        }
      });
    });

    ctx.restore();
  },
};

// ---------- Room check-in / checkout timings ----------
// Check-in = customer type panna bookingDate (local time). Checkout = check-in + days.
function formatDateTime(date) {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getRoomTimings(details) {
  if (!details?.bookingDate) return { checkIn: "-", checkout: "-" };

  const checkInDate = new Date(details.bookingDate);
  if (isNaN(checkInDate.getTime())) return { checkIn: "-", checkout: "-" };

  const days = Number(details.days) || 1;
  const checkoutDate = new Date(checkInDate.getTime() + days * 24 * 60 * 60 * 1000);

  return {
    checkIn: formatDateTime(checkInDate),
    checkout: formatDateTime(checkoutDate),
  };
}

// price string ah ("1500", "₹1500", "1,500") number ah maathum
function toNumber(value) {
  const n = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

// ---------- Groups bookings by customer email + the calendar day they were
// booked on. Parking bookings are pulled OUT of the item list and folded
// into a single "Parking" summary for that customer/day instead of getting
// their own row. Used only for the "all" filter view. ----------
function groupBookingsByCustomerDay(bookings) {
  const groups = {};

  bookings.forEach((b) => {
    const dateKey = new Date(b.createdAt).toLocaleDateString();
    const groupKey = `${b.userEmail}__${dateKey}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        key: groupKey,
        dateKey,
        userName: b.userName,
        userEmail: b.userEmail,
        phone: b.details?.phone || "-",
        address: b.details?.address || "-",
        items: [],
        parkings: [],
        latestCreatedAt: b.createdAt,
      };
    }

    const group = groups[groupKey];

    if (b.details?.phone) group.phone = b.details.phone;
    if (b.details?.address) group.address = b.details.address;

    if (new Date(b.createdAt) > new Date(group.latestCreatedAt)) {
      group.latestCreatedAt = b.createdAt;
    }

    if (b.type === "parking") {
      group.parkings.push(b);
    } else {
      group.items.push(b);
    }
  });

  return Object.values(groups).sort(
    (a, b) => new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt)
  );
}

// ---------- Groups search results by Order ID (one order = many bookings) ----------
function groupByOrderId(bookings) {
  const groups = {};

  bookings.forEach((b) => {
    const key = b.orderId || "-";

    if (!groups[key]) {
      groups[key] = {
        orderId: key,
        userName: b.userName,
        userEmail: b.userEmail,
        phone: b.details?.phone || "-",
        address: b.details?.address || "-",
        createdAt: b.createdAt,
        bookings: [],
      };
    }

    const group = groups[key];
    if (b.details?.phone) group.phone = b.details.phone;
    if (b.details?.address) group.address = b.details.address;
    group.bookings.push(b);
  });

  return Object.values(groups).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function Admin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  // ---------- Order ID search ----------
  const [searchInput, setSearchInput] = useState("");
  const [searchedText, setSearchedText] = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = search illa, [] = onnum kedaikala
  const [searchLoading, setSearchLoading] = useState(false);

  const [view, setView] = useState("bookings");
  // analyticsData = { periods: ["09 Sep", ...], series: [{ sales: [...], counts: [...] } x 4 (CATEGORIES order)] }
  const [analyticsData, setAnalyticsData] = useState({ periods: [], series: [] });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState("monthly");
  const [selectedWeek, setSelectedWeek] = useState(null); // null = latest week

  const ADMIN_PASSWORD = "admin123";

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Wrong password! Try again.");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const text = searchInput.trim();

    if (!text) {
      setSearchResults(null);
      setSearchedText("");
      return;
    }

    setSearchLoading(true);
    setSearchedText(text);
    try {
      const res = await fetch(
        `http://localhost:5000/api/bookings?orderId=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Order search failed:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchedText("");
    setSearchResults(null);
  };

  useEffect(() => {
    if (!authenticated || view !== "bookings") return;

    const fetchBookings = async () => {
      setLoading(true);
      try {
        const url =
          filter === "all"
            ? "http://localhost:5000/api/bookings"
            : `http://localhost:5000/api/bookings?type=${filter}`;

        const res = await fetch(url);
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [authenticated, filter, view]);

  useEffect(() => {
    if (!authenticated || view !== "analytics") return;

    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const base = `http://localhost:5000/api/analytics?range=${analyticsRange}`;

        // 1 call for the overall period list (chronological order) + 1 call per category
        const responses = await Promise.all([
          fetch(base),
          ...CATEGORIES.map((c) => fetch(`${base}&type=${c.key}`)),
        ]);
        const [totalData, ...categoryData] = await Promise.all(
          responses.map((r) => r.json())
        );

        const periods = totalData.map((d) => d.month);

        const series = CATEGORIES.map((cat, i) => {
          const lookup = {};
          categoryData[i].forEach((d) => {
            lookup[d.month] = d;
          });
          return {
            sales: periods.map((p) => lookup[p]?.totalSales || 0),
            counts: periods.map((p) => lookup[p]?.totalBookings || 0),
          };
        });

        setAnalyticsData({ periods, series });
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [authenticated, view, analyticsRange]);

  if (!authenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            background: "#fff",
            padding: "2.5rem",
            borderRadius: "10px",
            width: "320px",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <h3 style={{ marginBottom: "1.5rem" }}>🔐 Admin Login</h3>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control mb-3"
            autoFocus
          />
          {error && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>
          )}
          <button type="submit" className="btn btn-warning w-100 fw-bold">
            Login
          </button>
        </form>
      </div>
    );
  }

  // ---------- Common labels ----------
  const labels = analyticsData.periods;

  const titleText =
    analyticsRange === "daily"
      ? "Day-wise Sales by Category"
      : analyticsRange === "weekly"
      ? "Week-wise Sales by Category"
      : "Month-wise Sales by Category";

  // ---------- One dataset per category (own colour each) ----------
  // counts = number of bookings, shown in the tooltip on hover
  const buildDatasets = (asLine) =>
    analyticsData.series.map((s, i) => {
      const cat = CATEGORIES[i];
      const base = { label: cat.label, data: s.sales, counts: s.counts };

      if (asLine) {
        return {
          ...base,
          borderColor: cat.color,
          backgroundColor: cat.color,
          pointBackgroundColor: cat.color,
          pointBorderColor: "#fff",
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35,
          borderWidth: 3,
          fill: false,
        };
      }

      return {
        ...base,
        backgroundColor: cat.color,
        borderRadius: 6,
        maxBarThickness: 30,
      };
    });

  const tooltipCallbacks = {
    label: (ctx) => {
      const count = ctx.dataset.counts?.[ctx.dataIndex] ?? 0;
      return `${ctx.dataset.label}: ₹${ctx.raw} (${count} booking${count === 1 ? "" : "s"})`;
    },
  };

  // ---------- DAILY → Bar chart ----------
  const barData = { labels, datasets: buildDatasets(false) };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: titleText, font: { size: 16 } },
      tooltip: { callbacks: tooltipCallbacks },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Sales (₹)" },
        grid: { display: false },
      },
      x: { grid: { display: false } },
    },
  };

  // ---------- WEEKLY → Rose (Polar Area) chart ----------
  // One petal per category (own colour). Petal size = that week's sales.
  // Admin dropdown la week select pannalaam (default = latest week).
  const weekIdx =
    selectedWeek !== null && selectedWeek < labels.length
      ? selectedWeek
      : labels.length - 1;

  const weekSales = analyticsData.series.map((s) => s.sales[weekIdx] || 0);
  const weekCounts = analyticsData.series.map((s) => s.counts[weekIdx] || 0);

  const polarData = {
    // legend la category peru + ₹ amount kaattum
    labels: CATEGORIES.map((c, i) => `${c.label} (₹${Math.round(weekSales[i])})`),
    datasets: [
      {
        data: weekSales,
        counts: weekCounts,
        backgroundColor: CATEGORIES.map((c) => `${c.color}cc`),
        borderColor: CATEGORIES.map((c) => c.color),
        borderWidth: 2,
      },
    ],
  };

  const polarOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "bottom", labels: { usePointStyle: true } },
      title: {
        display: true,
        text: `Sales by Category — ${labels[weekIdx] || ""}`,
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const count = ctx.dataset.counts?.[ctx.dataIndex] ?? 0;
            return `₹${ctx.raw} (${count} booking${count === 1 ? "" : "s"})`;
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: { backdropColor: "transparent" },
      },
    },
  };

  // ---------- MONTHLY → Bubble chart ----------
  // Rows = categories (Food / Room / Hall / Parking), columns = months.
  // Bubble size = sales amount. Each category has its own colour.
  const maxSales = Math.max(
    1,
    ...analyticsData.series.flatMap((s) => s.sales)
  );

  const bubbleData = {
    datasets: analyticsData.series.map((s, catIndex) => {
      const cat = CATEGORIES[catIndex];
      return {
        label: cat.label,
        backgroundColor: `${cat.color}b3`, // same colour, slightly transparent
        borderColor: cat.color,
        borderWidth: 2,
        hoverBorderWidth: 3,
        data: s.sales.map((sales, monthIndex) => ({
          x: monthIndex,
          y: catIndex,
          // sales 0 na bubble illa; illa na 8 to 40 size la scale aagum
          r: sales > 0 ? 8 + (sales / maxSales) * 32 : 0,
          sales,
          count: s.counts[monthIndex],
        })),
      };
    }),
  };

  const bubbleOptions = {
    responsive: true,
    layout: { padding: 30 },
    plugins: {
      legend: { display: true, labels: { usePointStyle: true } },
      title: { display: true, text: titleText, font: { size: 16 } },
      tooltip: {
        callbacks: {
          title: (items) => labels[items[0].raw.x],
          label: (ctx) => {
            const { sales, count } = ctx.raw;
            return `${ctx.dataset.label}: ₹${sales} (${count} booking${count === 1 ? "" : "s"})`;
          },
        },
      },
    },
    scales: {
      x: {
        min: -0.5,
        max: labels.length - 0.5,
        ticks: {
          stepSize: 1,
          callback: (v) => (Number.isInteger(v) ? labels[v] : ""),
        },
        grid: { display: false },
      },
      y: {
        min: -0.5,
        max: CATEGORIES.length - 0.5,
        reverse: true, // Food mela, Parking keela
        ticks: {
          stepSize: 1,
          callback: (v) => (Number.isInteger(v) ? CATEGORIES[v]?.label : ""),
        },
        grid: { color: "#eee" },
      },
    },
  };

  const renderChart = () => {
    if (analyticsRange === "daily") {
      return <Bar data={barData} options={barOptions} />;
    }
    if (analyticsRange === "weekly") {
      return <PolarArea data={polarData} options={polarOptions} />;
    }
    return (
      <Bubble
        data={bubbleData}
        options={bubbleOptions}
        plugins={[bubbleLabelPlugin]}
      />
    );
  };

  const groupedBookings = filter === "all" ? groupBookingsByCustomerDay(bookings) : [];

  return (
    <div style={{ padding: "100px 30px 40px", minHeight: "100vh" }}>
      <h2 className="mb-4">📋 Admin Dashboard</h2>

      <div className="mb-4">
        <button
          onClick={() => setView("bookings")}
          className={`btn me-2 mb-2 ${
            view === "bookings" ? "btn-dark" : "btn-outline-dark"
          }`}
        >
          📋 Bookings
        </button>
        <button
          onClick={() => setView("analytics")}
          className={`btn me-2 mb-2 ${
            view === "analytics" ? "btn-dark" : "btn-outline-dark"
          }`}
        >
          📊 Analytics
        </button>
      </div>

      {view === "bookings" && (
        <>
          {/* ---------- Search Order ID ---------- */}
          <form
            onSubmit={handleSearch}
            className="mb-4 d-flex flex-wrap gap-2"
            style={{ maxWidth: "650px" }}
          >
            <input
              type="text"
              className="form-control"
              style={{ flex: "1 1 260px" }}
              placeholder="🔍 Search Order ID (e.g. order_Nxxxx...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn btn-dark">
              Search
            </button>
            {searchResults !== null && (
              <button type="button" className="btn btn-outline-secondary" onClick={clearSearch}>
                Clear
              </button>
            )}
          </form>

          {/* ---------- Search results (order-wise) ---------- */}
          {searchResults !== null && (
            <div className="mb-4">
              {searchLoading && <p>Searching...</p>}

              {!searchLoading && searchResults.length === 0 && (
                <div className="alert alert-warning">
                  "{searchedText}" nu oru Order ID kedaikala.
                </div>
              )}

              {!searchLoading &&
                groupByOrderId(searchResults).map((g) => {
                  const orderTotal = g.bookings.reduce(
                    (sum, b) => sum + toNumber(b.price),
                    0
                  );

                  return (
                    <div className="card mb-3" key={g.orderId}>
                      <div className="card-header bg-dark text-white">
                        <strong>Order ID:</strong>{" "}
                        <span style={{ fontFamily: "monospace" }}>{g.orderId}</span>
                        <span className="float-end">
                          {new Date(g.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="row mb-3" style={{ fontSize: "0.95rem" }}>
                          <div className="col-md-3">
                            <strong>Customer:</strong> {g.userName}
                          </div>
                          <div className="col-md-3">
                            <strong>Email:</strong> {g.userEmail}
                          </div>
                          <div className="col-md-3">
                            <strong>Phone:</strong> {g.phone}
                          </div>
                          <div className="col-md-3">
                            <strong>Address:</strong> {g.address}
                          </div>
                        </div>

                        <div className="table-responsive">
                          <table className="table table-striped table-bordered align-middle mb-2">
                            <thead className="table-secondary">
                              <tr>
                                <th>Type</th>
                                <th>Item</th>
                                <th>Details</th>
                                <th>Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.bookings.map((b) => {
                                const timings =
                                  b.type === "room" ? getRoomTimings(b.details) : null;

                                return (
                                  <tr key={b._id}>
                                    <td style={{ textTransform: "capitalize" }}>{b.type}</td>
                                    <td>{b.itemName}</td>
                                    <td style={{ fontSize: "0.9rem" }}>
                                      {b.details?.roomNumber &&
                                        b.details.roomNumber !== "Not from room" && (
                                          <div>Room: {b.details.roomNumber}</div>
                                        )}
                                      {b.details?.tableNumber &&
                                        b.details.tableNumber !== "Not dining in" && (
                                          <div>Table: {b.details.tableNumber}</div>
                                        )}
                                      {b.details?.slot && <div>Slot: {b.details.slot}</div>}
                                      {b.details?.vehicleType && (
                                        <div>Vehicle: {b.details.vehicleType}</div>
                                      )}
                                      {b.details?.days && <div>Days: {b.details.days}</div>}
                                      {timings && timings.checkIn !== "-" && (
                                        <div>
                                          🕒 Check-in: {timings.checkIn} → Checkout:{" "}
                                          {timings.checkout}
                                        </div>
                                      )}
                                    </td>
                                    <td>₹{b.price}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="text-end fw-bold">Order Total: ₹{orderTotal}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* ---------- Normal bookings view (search illa na mattum) ---------- */}
          {searchResults === null && (
            <>
              <div className="mb-4">
                {["all", "room", "hall", "parking", "food"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`btn me-2 mb-2 ${
                      filter === type ? "btn-warning" : "btn-outline-secondary"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {loading && <p>Loading...</p>}

              {!loading && bookings.length === 0 && <p>No bookings found.</p>}

              {!loading && filter === "all" && groupedBookings.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-striped table-bordered align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>Date</th>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Items Ordered</th>
                        <th>Items Total</th>
                        <th>Parking</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedBookings.map((g) => {
                        const itemsTotal = g.items.reduce(
                          (sum, item) => sum + (Number(item.price) || 0),
                          0
                        );

                        const orderIds = [
                          ...new Set(
                            [...g.items, ...g.parkings]
                              .map((x) => x.orderId)
                              .filter(Boolean)
                          ),
                        ];

                        return (
                          <tr key={g.key}>
                            <td>{g.dateKey}</td>
                            <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                              {orderIds.length === 0
                                ? "-"
                                : orderIds.map((id) => <div key={id}>{id}</div>)}
                            </td>
                            <td>{g.userName}</td>
                            <td>{g.userEmail}</td>
                            <td>{g.phone}</td>
                            <td>{g.address}</td>
                            <td>
                              {g.items.length === 0 ? (
                                "-"
                              ) : (
                                <ul className="mb-0 ps-3" style={{ fontSize: "0.9rem" }}>
                                  {g.items.map((item) => {
                                    const timings =
                                      item.type === "room"
                                        ? getRoomTimings(item.details)
                                        : null;

                                    return (
                                      <li key={item._id}>
                                        <span style={{ textTransform: "capitalize" }}>
                                          {item.type}
                                        </span>
                                        : {item.itemName}
                                        {item.details?.roomNumber &&
                                        item.details.roomNumber !== "Not from room"
                                          ? ` — Room ${item.details.roomNumber}`
                                          : ""}
                                        {item.details?.tableNumber &&
                                        item.details.tableNumber !== "Not dining in"
                                          ? ` — ${item.details.tableNumber}`
                                          : ""}
                                        {" — ₹"}
                                        {item.price}
                                        {timings && timings.checkIn !== "-" && (
                                          <div
                                            className="text-muted"
                                            style={{ fontSize: "0.8rem" }}
                                          >
                                            🕒 Check-in: {timings.checkIn} → Checkout:{" "}
                                            {timings.checkout}
                                          </div>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </td>
                            <td className="fw-bold">₹{itemsTotal}</td>
                            <td>
                              {g.parkings.length === 0 ? (
                                <span className="text-muted">No</span>
                              ) : (
                                <ul className="mb-0 ps-3" style={{ fontSize: "0.9rem" }}>
                                  {g.parkings.map((p) => (
                                    <li key={p._id}>
                                      Yes — {p.details?.vehicleType || "Vehicle"},{" "}
                                      {p.details?.days || 1} day
                                      {(p.details?.days || 1) > 1 ? "s" : ""}
                                      {" (₹"}
                                      {p.price})
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && filter !== "all" && bookings.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-striped table-bordered">
                    <thead className="table-dark">
                      <tr>
                        <th>Order ID</th>
                        <th>Type</th>
                        <th>Item</th>
                        <th>Room Number</th>
                        <th>Table Number</th>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        {filter === "room" ? (
                          <>
                            <th>Check-in</th>
                            <th>Checkout</th>
                          </>
                        ) : (
                          <th>Booking Date</th>
                        )}
                        <th>Price</th>
                        <th>Booked On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => {
                        const timings = filter === "room" ? getRoomTimings(b.details) : null;

                        return (
                          <tr key={b._id}>
                            <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                              {b.orderId || "-"}
                            </td>
                            <td style={{ textTransform: "capitalize" }}>{b.type}</td>
                            <td>{b.itemName}</td>
                            <td>{b.details?.roomNumber || "-"}</td>
                            <td>{b.details?.tableNumber || "-"}</td>
                            <td>{b.userName}</td>
                            <td>{b.userEmail}</td>
                            <td>{b.details?.phone || "-"}</td>
                            <td>{b.details?.address || "-"}</td>
                            {filter === "room" ? (
                              <>
                                <td>{timings.checkIn}</td>
                                <td>{timings.checkout}</td>
                              </>
                            ) : (
                              <td>{b.details?.bookingDate || "-"}</td>
                            )}
                            <td>{b.price}</td>
                            <td>{new Date(b.createdAt).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {view === "analytics" && (
        <div>
          <div className="mb-4">
            {["daily", "weekly", "monthly"].map((r) => (
              <button
                key={r}
                onClick={() => setAnalyticsRange(r)}
                className={`btn me-2 mb-2 ${
                  analyticsRange === r ? "btn-warning" : "btn-outline-secondary"
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {analyticsLoading && <p>Loading chart...</p>}

          {!analyticsLoading && analyticsData.periods.length === 0 && (
            <p>No booking data yet to show analytics.</p>
          )}

          {!analyticsLoading && analyticsData.periods.length > 0 && (
            <div
              style={{
                background: "#fff",
                padding: "20px",
                borderRadius: "10px",
                maxWidth: analyticsRange === "weekly" ? "650px" : "900px",
              }}
            >
              {analyticsRange === "weekly" && (
                <div className="mb-3">
                  <select
                    className="form-select w-auto"
                    value={weekIdx}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  >
                    {labels.map((l, i) => (
                      <option key={l} value={i}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {renderChart()}
              {analyticsRange === "weekly" && (
                <p
                  className="text-muted text-center mb-0 mt-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  🌹 **Bigger petal = Higher sales**

                </p>
              )}
              {analyticsRange === "monthly" && (
                <p
                  className="text-muted text-center mb-0 mt-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  🫧 **Bigger bubble = Higher sales**

                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;