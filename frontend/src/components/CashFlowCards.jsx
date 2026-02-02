import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";

export const CashFlowCards = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Inflow */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-green-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 text-sm font-bold uppercase">Total Inflow <span className="text-green-600">( Sales Collection )</span></span>
          <ArrowUpCircle className="text-green-500" size={20} />
        </div>
        <p className="text-2xl font-bold text-gray-800">₹ {(data?.totalInflow || 0).toFixed(2)}</p>
      </div>

      {/* Outflow */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-red-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 text-sm font-bold uppercase">Total Outflow <span className="text-red-600">( Purchases Paid )</span></span>
          <ArrowDownCircle className="text-red-500" size={20} />
        </div>
        <p className="text-2xl font-bold text-gray-800">₹ {(data?.totalOutflow || 0).toFixed(2)}</p>
      </div>

      {/* Net */}
      <div className={`p-5 rounded-xl shadow-sm border ${data?.netCashFlow >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 text-sm font-bold uppercase">Net Cash Position</span>
          <Wallet className={data?.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'} size={20} />
        </div>
        <p className={`text-2xl font-extrabold ${data?.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          ₹ {(data?.netCashFlow || 0 ).toFixed(2)}
        </p>
      </div>
    </div>
  );
};