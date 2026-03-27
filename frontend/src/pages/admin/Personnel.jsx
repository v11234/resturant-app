import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import { Trash2, UserPlus } from "lucide-react";

const Personnel = () => {
  const { axios } = useContext(AppContext);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const fetchPersonnel = async () => {
    try {
      const { data } = await axios.get("/api/auth/admin/personnel");
      if (data.success) {
        setPersonnel(data.personnel);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong";
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const { data } = await axios.post("/api/auth/admin/personnel", formData);
      if (data.success) {
        toast.success(data.message);
        setFormData({ name: "", email: "", password: "" });
        fetchPersonnel();
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

  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(`/api/auth/admin/personnel/${id}`);
      if (data.success) {
        toast.success(data.message);
        fetchPersonnel();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Delivery Personnel
        </h1>
        <p className="text-sm text-gray-500">
          Create and manage delivery accounts.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-2 text-gray-700">
          <UserPlus size={18} />
          <h2 className="text-lg font-semibold">Register Personnel</h2>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full name"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Temporary password"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">
          Active Personnel
        </h2>
        {personnel.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No delivery personnel registered yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {personnel.map((person) => (
              <div
                key={person._id}
                className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {person.name}
                  </p>
                  <p className="text-xs text-gray-500">{person.email}</p>
                </div>
                <button
                  onClick={() => handleDelete(person._id)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Personnel;
