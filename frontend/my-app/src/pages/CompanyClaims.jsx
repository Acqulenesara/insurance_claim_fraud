import { useParams } from "react-router-dom";

const CompanyClaims = () => {
  const { id } = useParams();

  const claims = [
    { id: 1, text: "Claim 1 - Car accident damages" },
    { id: 2, text: "Claim 2 - Health insurance reimbursement" },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-center mb-6">
        Claims for Company ID: {id}
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {claims.map((c) => (
          <div
            key={c.id}
            className="p-6 border rounded-lg bg-white shadow hover:shadow-lg"
          >
            {c.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyClaims;
