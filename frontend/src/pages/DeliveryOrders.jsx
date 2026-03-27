import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import {
  BadgeCheck,
  Calendar,
  PieChart,
  RefreshCw,
  Truck,
} from "lucide-react";

const DeliveryOrders = () => {
  const { axios, user } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const dateKeyLocal = (date) => {
    if (!date || Number.isNaN(new Date(date).getTime())) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get("/api/order/orders");
      if (data.success) {
        setOrders(data.orders);
        setLastUpdated(new Date());
      } else {
        setError(data.message || "Unable to load orders");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "delivery") {
      fetchOrders();
    }
  }, [user?.role]);

  const stats = useMemo(() => {
    const statusCount = {
      Pending: 0,
      Preparing: 0,
      Delivered: 0,
      Cancelled: 0,
    };
    orders.forEach((order) => {
      if (statusCount[order.status] !== undefined) {
        statusCount[order.status] += 1;
      }
    });

    const todayKey = dateKeyLocal(new Date());
    const deliveredToday = orders.filter(
      (order) =>
        order.status === "Delivered" &&
        dateKeyLocal(order?.updatedAt || order?.createdAt) === todayKey
    ).length;

    return {
      total: orders.length,
      pending: statusCount.Pending,
      preparing: statusCount.Preparing,
      delivered: statusCount.Delivered,
      cancelled: statusCount.Cancelled,
      deliveredToday,
    };
  }, [orders]);

  const deliverySeries = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    const deliveredByDate = {};
    orders.forEach((order) => {
      if (order.status !== "Delivered") return;
      const key = dateKeyLocal(order?.updatedAt || order?.createdAt);
      if (!key) return;
      deliveredByDate[key] = (deliveredByDate[key] || 0) + 1;
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
        value: deliveredByDate[key] || 0,
      };
    });

    return {
      series,
      max: Math.max(1, ...series.map((item) => item.value)),
    };
  }, [orders]);

  const statusSegments = useMemo(
    () => [
      { label: "Pending", value: stats.pending, color: "#f59e0b" },
      { label: "Preparing", value: stats.preparing, color: "#3b82f6" },
      { label: "Delivered", value: stats.delivered, color: "#10b981" },
      { label: "Cancelled", value: stats.cancelled, color: "#ef4444" },
    ],
    [stats]
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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const { data } = await axios.put(`/api/order/update-status/${orderId}`, {
        status: newStatus,
      });
      if (data.success) {
        toast.success(data.message);
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(
    (order) => order.status === "Pending" || order.status === "Preparing"
  );

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          Please log in to view delivery orders.
        </h2>
      </div>
    );
  }

  if (user?.role !== "delivery") {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          Delivery access only.
        </h2>
        <p className="text-gray-500 mt-2">
          Your account does not have delivery permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Delivery Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Track today's workload, status, and recent deliveries.
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
            onClick={fetchOrders}
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
            <p className="text-sm font-medium text-gray-500">Active Orders</p>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Truck size={20} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-gray-900">
            {stats.pending + stats.preparing}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Pending {stats.pending} - Preparing {stats.preparing}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Delivered</p>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <BadgeCheck size={20} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-gray-900">
            {stats.delivered}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Today: {stats.deliveredToday}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">All Orders</p>
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <Calendar size={20} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-gray-900">
            {stats.total}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Cancelled: {stats.cancelled}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Weekly Pace</p>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <PieChart size={20} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-semibold text-gray-900">
            {deliverySeries.series.reduce((sum, item) => sum + item.value, 0)}
          </p>
          <p className="mt-2 text-xs text-gray-500">Delivered last 7 days</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Deliveries (Last 7 Days)
              </h2>
              <p className="text-xs text-gray-500">
                Daily completed deliveries
              </p>
            </div>
          </div>

          <div className="mt-6 flex h-48 items-end gap-3">
            {deliverySeries.series.map((item) => {
              const height = Math.max((item.value / deliverySeries.max) * 100, 6);
              return (
                <div key={item.key} className="flex flex-1 flex-col items-center">
                  <div className="flex h-36 w-full items-end">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-emerald-500 to-emerald-300"
                      style={{ height: `${height}%` }}
                      title={`${item.fullLabel}: ${item.value} delivered`}
                    />
                  </div>
                  <span className="mt-2 text-xs text-gray-600">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Status Breakdown
              </h2>
              <p className="text-xs text-gray-500">Live order distribution</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div
              className="h-32 w-32 rounded-full"
              style={{ background: buildPieBackground(statusSegments) }}
            />
          </div>

          <div className="mt-6 space-y-2 text-sm">
            {statusSegments.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1 text-gray-600">{item.label}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Active Orders
            </h2>
            <p className="text-xs text-gray-500">
              Update status as you pick up and deliver.
            </p>
          </div>
        </div>

        {activeOrders.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No active orders.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {activeOrders.map((order) => {
              const canUpdate = order.status !== "Cancelled";
              const options =
                order.status === "Pending"
                  ? ["Pending", "Preparing"]
                  : ["Preparing", "Delivered"];
              return (
                <div
                  key={order._id}
                  className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      #{order._id.slice(-6)} - {order?.user?.name || "Customer"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.address} - {order.items.length} item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                      {order.status}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order._id, e.target.value)
                      }
                      disabled={loading || !canUpdate}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      {options.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryOrders;
