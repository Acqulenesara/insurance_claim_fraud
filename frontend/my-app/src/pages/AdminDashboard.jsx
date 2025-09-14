import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const options = [
    { id: 1, name: "Customer Registration", path: "/customer-registration" },
    { id: 2, name: "Claims List", path: "/claims-list" },
    
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {options.map((opt) => (
          <div
            key={opt.id}
            className="p-8 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-xl text-center"
            onClick={() => navigate(opt.path)}
          >
            <h3 className="text-xl font-semibold">{opt.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
