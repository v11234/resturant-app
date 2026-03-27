import { useContext, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Upload } from "lucide-react";

const EditMenu = () => {
  const { id } = useParams();
  const { axios, menus, categories, fetchMenus, fetchCategories } =
    useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
  });

  const menuItem = useMemo(
    () => menus.find((item) => item._id === id),
    [menus, id]
  );

  useEffect(() => {
    if (!menus.length) {
      fetchMenus();
    }
    if (!categories.length) {
      fetchCategories();
    }
  }, []);

  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name || "",
        price: menuItem.price || "",
        description: menuItem.description || "",
        category: menuItem.category?._id || menuItem.category || "",
      });
      setPreview(menuItem.image || "");
    }
  }, [menuItem]);

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("price", formData.price);
      payload.append("description", formData.description);
      payload.append("category", formData.category);
      if (file) {
        payload.append("image", file);
      }

      const { data } = await axios.put(`/api/menu/update/${id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        toast.success(data.message);
        fetchMenus();
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

  if (!menuItem) {
    return (
      <div className="py-8">
        <p className="text-sm text-gray-500">Menu item not found.</p>
        <Link to="/admin/menus" className="text-sm text-blue-600">
          Back to menus
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Menu</h1>
        <Link to="/admin/menus" className="text-sm text-blue-600">
          Back to menus
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl w-full flex flex-col gap-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Menu Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
            placeholder="Enter Menu name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Menu Price
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
            placeholder="Enter Menu Price"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Menu Description
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
            placeholder="Enter Menu Description"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
          >
            <option value="">Select a category</option>
            {categories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Menu Image
          </label>
          <input
            type="file"
            id="fileUpload"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="fileUpload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 transition"
          >
            <Upload className="w-8 h-8 text-gray-500 mb-2" />
            <span className="text-gray-600 text-sm">
              {file ? file.name : "Click to upload a new image (optional)"}
            </span>
          </label>
        </div>

        {preview && (
          <img src={preview} alt="preview" className="w-32 rounded-lg" />
        )}

        <button className="bg-orange-500 text-white px-8 py-3 cursor-pointer">
          {loading ? "Updating..." : "Update Menu"}
        </button>
      </form>
    </div>
  );
};

export default EditMenu;
