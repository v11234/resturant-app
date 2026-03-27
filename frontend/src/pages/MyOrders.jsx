import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const MyOrders = () => {
  const { axios } = useContext(AppContext);
  const [orders, setOrders] = useState([]);

  const fetchMyOrders = async () => {
    try {
      const { data } = await axios.get("/api/order/my-orders");
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchMyOrders();
  }, []);

  const cancelOrder = async (orderId) => {
    try {
      const { data } = await axios.put(`/api/order/cancel/${orderId}`);
      if (data.success) {
        toast.success(data.message);
        fetchMyOrders();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong";
      toast.error(message);
    }
  };

  const statusClasses = (status) => {
    if (status === "Pending") return "bg-yellow-100 text-yellow-700";
    if (status === "Preparing") return "bg-blue-100 text-blue-700";
    if (status === "Delivered") return "bg-green-100 text-green-700";
    if (status === "Cancelled") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };
  return (
    <div className="max-w-5xl mx-auto mt-10 p-6">
      <h2 className="text-2xl font-semibold mb-6 text-center">My Orders</h2>
      {orders.length === 0 ? (
        <p className="text-center text-gray-600">You have no orders yet</p>
      ) : (
        <div>
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white shadow-md rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Order ID:
                  <span className="text-green-600">{order._id.slice(-6)}</span>
                </h3>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${statusClasses(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                <p>
                  {" "}
                  <span className="font-medium">Address: </span>
                  {order.address}{" "}
                </p>
                <p>
                  <span className="font-medium">Payment:</span>{" "}
                  {order.paymentMethod}
                </p>
                <p>
                  <span className="font-medium">Total:</span> FCFA 
                  {order.totalAmount}
                </p>
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-gray-600 text-sm">
                  <span className="font-medium">Items:</span>
                  {order.items.length} product(s)
                </p>
              </div>
              {order.status === "Pending" && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => cancelOrder(order._id)}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MyOrders;
