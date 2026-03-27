import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../context/AppContext";
import {
  BarChart3,
  CalendarCheck,
  Layers,
  PieChart,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

const Dashboard = () => {
  const { axios, menus, categories, fetchMenus, fetchCategories, admin } =
    useContext(AppContext);

  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const formatNumber = (value) =>
    new Intl.NumberFormat("en-US").format(Math.round(value));
  const formatMoney = (value) => `FCFA ${formatNumber(value)}`;

  const dateKeyLocal = (date) => {
    if (!date || Number.isNaN(new Date(date).getTime())) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const bookingDateKey = (value) => {
    if (!value) return "";
    if (typeof value === "string" && value.length >= 10) {
      return value.slice(0, 10);
    }
    return dateKeyLocal(value);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const [ordersRes, bookingsRes] = await Promise.all([
        axios.get("/api/order/orders"),
        axios.get("/api/booking/bookings"),
      ]);

      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.orders || []);
      }
      if (bookingsRes.data?.success) {
        setBookings(bookingsRes.data.bookings || []);
      }
      setLastUpdated(new Date());
    } catch (err) {
      const message =
        err?.response?.data?.message || "Unable to load dashboard data";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchDashboardData();
      if (!menus?.length) {
        fetchMenus();
      }
      if (!categories?.length) {
        fetchCategories();
      }
    }
  }, [admin]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (Number(order?.totalAmount) || 0),
      0
    );
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    const orderStatus = {
      Pending: 0,
      Preparing: 0,
      Delivered: 0,
    };
    orders.forEach((order) => {
      if (orderStatus[order?.status] !== undefined) {
        orderStatus[order.status] += 1;
      }
    });

    const bookingStatus = {
      Pending: 0,
      Approved: 0,
      Cancelled: 0,
    };
    bookings.forEach((booking) => {
      if (bookingStatus[booking?.status] !== undefined) {
        bookingStatus[booking.status] += 1;
      }
    });

    const todayKey = dateKeyLocal(new Date());
    const upcomingBookings = bookings.filter(
      (booking) => bookingDateKey(booking?.date) >= todayKey
    ).length;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalBookings: bookings.length,
      upcomingBookings,
      orderStatus,
      bookingStatus,
    };
  }, [orders, bookings]);

  const revenueSeries = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }

    const revenueByDate = {};
    const ordersByDate = {};
    orders.forEach((order) => {
      const key = dateKeyLocal(order?.createdAt);
      if (!key) return;
      revenueByDate[key] = (revenueByDate[key] || 0) + (order.totalAmount || 0);
      ordersByDate[key] = (ordersByDate[key] || 0) + 1;
    });

    const series = days.map((date) => {
      const key = dateKeyLocal(date);
      return {
        key,
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        fullLabel: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: revenueByDate[key] || 0,
        orders: ordersByDate[key] || 0,
      };
    });

    const maxRevenue = Math.max(0, ...series.map((item) => item.revenue));
    const totalRevenue = series.reduce((sum, item) => sum + item.revenue, 0);

    const prevStart = new Date(today);
    prevStart.setDate(today.getDate() - 13);
    const prevEnd = new Date(today);
    prevEnd.setDate(today.getDate() - 6);

    const previousRevenue = orders.reduce((sum, order) => {
      const orderDate = new Date(order?.createdAt);
      if (orderDate >= prevStart && orderDate < prevEnd) {
        return sum + (order.totalAmount || 0);
      }
      return sum;
    }, 0);

    const trend =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : null;

    return {
      series,
      maxRevenue,
      totalRevenue,
      previousRevenue,
      trend,
    };
  }, [orders]);

  const orderStatusData = useMemo(
    () => [
      {
        label: "Pending",
        value: stats.orderStatus.Pending,
        color: "#f59e0b",
        badge: "bg-amber-100 text-amber-700",
      },
      {
        label: "Preparing",
        value: stats.orderStatus.Preparing,
        color: "#3b82f6",
        badge: "bg-blue-100 text-blue-700",
      },
      {
        label: "Delivered",
        value: stats.orderStatus.Delivered,
        color: "#10b981",
        badge: "bg-emerald-100 text-emerald-700",
      },
    ],
    [stats.orderStatus]
  );

  const bookingStatusData = useMemo(
    () => [
      {
        label: "Pending",
        value: stats.bookingStatus.Pending,
        color: "#f97316",
        badge: "bg-orange-100 text-orange-700",
      },
      {
        label: "Approved",
        value: stats.bookingStatus.Approved,
        color: "#22c55e",
        badge: "bg-green-100 text-green-700",
      },
      {
        label: "Cancelled",
        value: stats.bookingStatus.Cancelled,
        color: "#ef4444",
        badge: "bg-red-100 text-red-700",
      },
    ],
    [stats.bookingStatus]
  );

  const buildPieBackground = (segments) => {
    const total = segments.reduce((sum, item) => sum + item.value, 0);
    if (!total) return "conic-gradient(#e5e7eb 0% 100%)";
    let start = 0;
    const stops = segments.map((segment) => {
      const percent = (segment.value / total) * 100;
      const end = start + percent;
      const stop = `${segment.color} ${start}% ${end}%`;
      start = end;
      return stop;
    });
    return `conic-gradient(${stops.join(", ")})`;
  };

  const topItems = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      order?.items?.forEach((item) => {
        const menu = item?.menuItem;
        if (!menu) return;
        const key = menu?._id || menu?.name || "unknown";
        const current = map.get(key) || {
          name: menu?.name || "Unknown item",
          quantity: 0,
          revenue: 0,
          image: menu?.image || "",
        };
        const quantity = Number(item?.quantity) || 0;
        current.quantity += quantity;
        current.revenue += quantity * (Number(menu?.price) || 0);
        map.set(key, current);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const categoryMix = useMemo(() => {
    const map = new Map();
    menus?.forEach((menu) => {
      const name = menu?.category?.name || "Uncategorized";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [menus]);

  const categoryMax = useMemo(() => {
    if (!categoryMix.length) return 1;
    return Math.max(...categoryMix.map((entry) => entry.count), 1);
  }, [categoryMix]);

  const insights = useMemo(() => {
    const topItem = topItems[0];
    const busiestOrder = revenueSeries.series.reduce(
      (best, item) => (item.orders > best.orders ? item : best),
      { orders: 0, label: "N/A" }
    );
    const avgGuests =
      bookings.length > 0
        ? (
            bookings.reduce(
              (sum, booking) => sum + (Number(booking?.numberOfPeople) || 0),
              0
            ) / bookings.length
          ).toFixed(1)
        : "0.0";

    const latestOrder = orders[0]?.createdAt
      ? new Date(orders[0].createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

    return [
      topItem
        ? `Best seller: ${topItem.name} (${topItem.quantity} sold)`
        : "Best seller: No sales yet - new orders will unlock this insight.",
      busiestOrder.orders
        ? `Busiest order day: ${busiestOrder.label} (${busiestOrder.orders} orders)`
        : "Busiest order day: No order activity yet.",
      bookings.length
        ? `Average party size: ${avgGuests} guests (${stats.upcomingBookings} upcoming)`
        : "Average party size: No bookings yet.",
      latestOrder
        ? `Latest order: ${latestOrder}`
        : "Latest order: No orders yet.",
    ];
  }, [
    topItems,
    revenueSeries.series,
    bookings,
    orders,
    stats.upcomingBookings,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Track restaurant performance, orders, and bookings at a glance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lastUpdated && (
            <p className="text-xs text-gray-400">
              Updated{" "}
              {lastUpdated.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Wallet size={20} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-gray-900">
            {formatMoney(stats.totalRevenue)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Last 7 days: {formatMoney(revenueSeries.totalRevenue)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Orders</p>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <ShoppingCart size={20} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-gray-900">
            {formatNumber(stats.totalOrders)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Avg order: {formatMoney(stats.avgOrderValue)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Bookings</p>
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <CalendarCheck size={20} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-gray-900">
            {formatNumber(stats.totalBookings)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Upcoming: {formatNumber(stats.upcomingBookings)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Menu Items</p>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <Layers size={20} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-gray-900">
            {formatNumber(menus?.length || 0)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Categories: {formatNumber(categories?.length || 0)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Revenue (Last 7 Days)
              </h2>
              <p className="text-xs text-gray-500">
                Orders and revenue trend by day
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BarChart3 size={18} />
              <span>{formatMoney(revenueSeries.totalRevenue)}</span>
            </div>
          </div>

          <div className="mt-6 flex h-52 items-end gap-3">
            {revenueSeries.series.map((item) => {
              const height = revenueSeries.maxRevenue
                ? Math.max((item.revenue / revenueSeries.maxRevenue) * 100, 6)
                : 6;
              return (
                <div key={item.key} className="flex flex-1 flex-col items-center">
                  <div className="flex h-40 w-full items-end">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-blue-500 to-sky-300"
                      style={{ height: `${height}%` }}
                      title={`${item.fullLabel}: ${formatMoney(item.revenue)}`}
                    />
                  </div>
                  <span className="mt-2 text-xs text-gray-600">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatNumber(item.orders)} orders
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm text-gray-600">
            {revenueSeries.trend !== null ? (
              <>
                {revenueSeries.trend >= 0 ? (
                  <TrendingUp size={16} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={16} className="text-red-500" />
                )}
                <span>
                  {Math.abs(revenueSeries.trend).toFixed(1)}%{" "}
                  {revenueSeries.trend >= 0 ? "up" : "down"} vs previous 7 days
                </span>
              </>
            ) : (
              <span>No prior week data to compare yet.</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Orders by Status
              </h2>
              <p className="text-xs text-gray-500">
                Distribution of current order states
              </p>
            </div>
            <PieChart size={18} className="text-gray-400" />
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div
              className="h-36 w-36 rounded-full"
              style={{ background: buildPieBackground(orderStatusData) }}
            />
          </div>

          <div className="mt-6 space-y-2 text-sm">
            {orderStatusData.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1 text-gray-600">{item.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${item.badge}`}>
                  {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Booking Status
              </h2>
              <p className="text-xs text-gray-500">
                Active booking pipeline
              </p>
            </div>
            <PieChart size={18} className="text-gray-400" />
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div
              className="h-32 w-32 rounded-full ring-8 ring-white"
              style={{ background: buildPieBackground(bookingStatusData) }}
            />
          </div>

          <div className="mt-6 space-y-2 text-sm">
            {bookingStatusData.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1 text-gray-600">{item.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${item.badge}`}>
                  {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Top Menu Items
              </h2>
              <p className="text-xs text-gray-500">
                Most ordered items and revenue contribution
              </p>
            </div>
            <ShoppingCart size={18} className="text-gray-400" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {topItems.length ? (
              topItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 p-3"
                >
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatNumber(item.quantity)} orders -{" "}
                      {formatMoney(item.revenue)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No order data yet. Once orders arrive, top items will appear
                here.
              </p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700">
              Category Mix
            </h3>
            <div className="mt-3 space-y-3">
              {categoryMix.length ? (
                categoryMix.map((item) => {
                  const width = Math.max((item.count / categoryMax) * 100, 6);
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{item.name}</span>
                        <span>{formatNumber(item.count)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500">
                  Add menu items to see category distribution.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Insights</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          {insights.map((insight) => (
            <li key={insight} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
