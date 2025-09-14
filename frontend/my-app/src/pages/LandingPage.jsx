import { useNavigate } from "react-router-dom";
import { FaUser, FaUserShield } from "react-icons/fa";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex gap-16">
        {/* User Box */}
        <div
          className="flex flex-col items-center justify-center p-10 rounded-xl cursor-pointer bg-gray-800 hover:bg-gray-700 w-64 h-64 shadow-lg transition"
          onClick={() => navigate("/user-login")}
        >
          <FaUser size={70} className="text-blue-400" />
          <h2 className="mt-6 text-xl font-semibold text-white">User</h2>
        </div>

        {/* Admin Box */}
        <div
          className="flex flex-col items-center justify-center p-10 rounded-xl cursor-pointer bg-gray-800 hover:bg-gray-700 w-64 h-64 shadow-lg transition"
          onClick={() => navigate("/admin-login")}
        >
          <FaUserShield size={70} className="text-blue-400" />
          <h2 className="mt-6 text-xl font-semibold text-white">Company</h2>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
