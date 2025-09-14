import { Link } from 'react-router-dom';

const UserDashboard = () => {
  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full text-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">User Dashboard</h2>
        <p className="text-gray-600 mb-6">Welcome to your dashboard. From here, you can submit a new claim.</p>
        <Link
          to="/upload-claim"
          className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          Upload a Claim
        </Link>
      </div>
    </div>
  );
};

export default UserDashboard;