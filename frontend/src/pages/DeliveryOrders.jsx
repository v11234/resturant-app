import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const DeliveryOrders = () => {
  const { axios, user } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get("/api/order/orders");
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong";
      toast.error(message);
    }
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

  useEffect(() => {
    if (user?.role === "delivery") {
      fetchOrders();
    }
  }, [user?.role]);

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
    <div className="max-w-5xl mx-auto mt-10 p-6">
      <h2 className="text-2xl font-semibold text-center mb-6">
        Delivery Orders
      </h2>
      {orders.length === 0 ? (
        <p className="text-center text-gray-600">No orders available.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Order</p>
                  <p className="font-semibold text-gray-800">
                    #{order._id.slice(-6)}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {order.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                <p>
                  <span className="font-medium">Address:</span> {order.address}
                </p>
                <p>
                  <span className="font-medium">Total:</span> FCFA{" "}
                  {order.totalAmount}
                </p>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">
                  Update Status
                </label>
                <select
                  value={order.status}
                  onChange={(e) =>
                    handleStatusChange(order._id, e.target.value)
                  }
                  disabled={loading || order.status === "Cancelled"}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryOrders;
