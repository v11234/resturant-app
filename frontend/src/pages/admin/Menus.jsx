import { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { CircleX, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
const Menus = () => {
  const { menus, fetchMenus, axios } = useContext(AppContext);

  const deleteMenu = async (id) => {
    try {
      const { data } = await axios.delete(`/api/menu/delete/${id}`);
      if (data.success) {
        toast.success(data.message);
        fetchMenus();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong";
      toast.error(message);
    }
  };
  return (
    <div className="py-4">
      <h1 className="text-3xl font-bold mb-3">All Menus</h1>
      <div className="border border-gray-400 max-w-5xl mx-auto p-3 ">
        <div className="grid grid-cols-5 font-semibold text-gray-700">
          <div>Image</div>
          <div>Name</div>
          <div>Category</div>
          <div>Price</div>
          <div>Action</div>
        </div>
        <hr className="w-full my-4 text-gray-200" />
        <ul>
          {menus.map((item) => (
            <div key={item._id}>
              <div className="grid grid-cols-5 items-center mb-4">
                <div className="flex items-center gap-2 max-w-md">
                  <img src={item.image} alt="" className="w-20 h-20" />
                </div>
                <p>{item?.name}</p>
                <p>{item?.category?.name}</p>
                <p>FCFA {item.price}</p>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/admin/menus/edit/${item._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    <Pencil />
                  </Link>
                  <button
                    className="text-red-600 cursor-pointer hover:underline"
                    onClick={() => deleteMenu(item._id)}
                  >
                    <CircleX />
                  </button>
                </div>
              </div>
              <hr className="w-full text-gray-300" />
            </div>
          ))}
        </ul>
      </div>
    </div>
  );
};
export default Menus;
