import React, { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Wallet,
  ArrowUpNarrowWide,
  IndianRupee,
} from "lucide-react";
import { CashFlowCards } from "@/components/CashFlowCards";

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    // Default to Current Month
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });


// Create the query params object
      const queryParams = {
        startDate: dateRange.start,
        endDate: dateRange.end,
      };

  // 2. The Fetching Logic
  const fetchStats = async () => {
    // Guard against multiple concurrent calls
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Create the query params object
      // const queryParams = {
      //   startDate: dateRange.start,
      //   endDate: dateRange.end,
      // };
      const result = await safeCall(
        api.get(`/dashboard/stats`, { params: queryParams })
      );
      if (result.success) {
        // Updates here are fine because they happen AFTER the async call
        setStats(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const fetch_CashFlow = async () => {
    try {
      const result = await safeCall(
        api.get(`/reports/cashFlow`, { params: queryParams })
      );

    
      if (result.success) {
     
        setCashFlow(result?.data);
      }

    } catch (error) {
      console.log("Error :",error);
    }finally {
      setIsLoading(false);
    }
  }

    console.log("cashFlow :", cashFlow)

  // 3. Triggering the effect
  useEffect(() => {
    fetchStats();
    fetch_CashFlow();
    // Ensure dateRange is stable (use strings for dates in state)
  }, [dateRange.start, dateRange.end]);

  // console.log("stats :", stats);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Date Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Business Overview</h2>
        <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
            className="outline-none text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
            className="outline-none text-sm"
          />
        </div>
      </div>







      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Sales"
          value={stats?.summary.sales}
          color="blue"
          icon={<TrendingUp />}
        />
        <StatCard
          title="Total Purchases"
          value={stats?.summary.purchases}
          color="orange"
          icon={<ShoppingCart />}
        />
        <StatCard
          title="Expenses"
          value={stats?.summary.expenses}
          color="red"
          icon={<CreditCard />}
        />
        <StatCard
          title="Net Profit"
          value={stats?.summary.netProfit}
          color="green"
          icon={<Wallet />}
        />
      </div>

      {/* */}
      <div>
        <CashFlowCards data={cashFlow?.data}/>
      </div>

      {/* Yearly Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-bold mb-6 text-gray-700">
          Yearly Performance (Sales, Purchases & Expenses)
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(val) => `₹${val}`} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />

              {/* Blue Bar for Sales */}
              <Bar
                dataKey="sales"
                fill="#3b82f6"
                name="Sales"
                radius={[4, 4, 0, 0]}
              />

              {/* Orange Bar for Purchases */}
              <Bar
                dataKey="purchases"
                fill="#f97316"
                name="Purchases"
                radius={[4, 4, 0, 0]}
              />

              {/* Red Bar for Expenses */}
              <Bar
                dataKey="expenses"
                fill="#ef4444"
                name="Expenses"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border rounded-xl mt-4">
        <div className="flex items-center   ml-8 mt-4">
          <IndianRupee size={18} className="mr-2"/>

          <h3 className="font-bold ">Sales / Payment Mode</h3>
        </div>

        <PieChart width={400} height={300}>
          <Pie
            data={stats?.paymentStats}
            dataKey="amount"
            nameKey="_id"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {stats?.paymentStats?.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      <div className="flex gap-8">
        {/* Top 10 Table Snippet */}
        <div className="w-1/2 bg-white p-4 rounded-lg shadow border mt-4">
          <div className="flex">
            <span>
              <ArrowUpNarrowWide />
            </span>
            <h3 className="font-bold mb-3">Top 10 Selling Items</h3>
          </div>

          <div className="space-y-2">
            {stats?.topItems.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between text-sm border-b pb-1"
              >
                <span className="text-gray-600">{item.name}</span>
                <span className="font-bold">{item.qty} units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div className="w-1/2 bg-white p-6 rounded-xl shadow-sm border border-red-300 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Low Stock Alerts
            </h3>
            <button className="text-blue-600 text-xs font-semibold hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {stats?.lowStock?.length > 0 ? (
              stats?.lowStock.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {item.itemName}
                    </p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-red-600">
                      {item.stock} {item.unit || "units"} left
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      Min: {item.minStock}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-green-600 font-medium">
                  ✅ All stock levels are healthy
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Asset Value */}
      <div className=" flex gap-8">
        <div className="  border p-6 rounded-xl shadow-lg mt-4 w-1/2">
          <p className="text-xs font-bold uppercase opacity-80">
            Inventory Asset Value 
          </p>
          <p>("Buy Price" of your inventory)</p>
          <h2 className="text-2xl font-black mt-1">
            ₹ {stats?.summary.stockValue.toLocaleString()}
          </h2>
          <div className="mt-4 pt-4 border-t border-purple-400">
            <p className="text-xs font-bold uppercase opacity-80">
              Potential Revenue 
            </p>
            <p>(Total amount of money will collect if sell every item at retail selling price.)</p>
            <p className="text-2xl font-bold">
              ₹ {stats?.summary.potentialRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recent Sales Table Snippet */}
        <div className="bg-white p-4 rounded-lg shadow border mt-4 w-1/2">
          <h3 className="font-bold mb-4">Recent Transactions</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Invoice</th>
                <th className="pb-2">Customer</th> 
                <th className="pb-2">Method</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentSales?.map((sale) => (
                <tr
                  key={sale._id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="py-3 text-blue-600 font-medium">
                    {sale.invoiceNo}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col">
                      {/* Accessing populated customer data safely */}
                      <span className="font-semibold text-gray-800">
                        {sale.customerId?.name || "Walk-in Customer"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {sale.customerId?.phone || "No Phone"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 capitalize">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-[10px]">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-gray-900">
                    ₹ {sale.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, icon }) => {
  const colors = {
    blue: "text-blue-600 border-blue-500",
    red: "text-red-600 border-red-500",
    orange: "text-orange-600 border-orange-500",
    green: "text-green-600 border-green-500",
  };
  return (
    <div
      className={`bg-white p-5 rounded-xl border-l-4 shadow-sm ${colors[color]}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-bold uppercase text-gray-400">{title}</p>
          <p className="text-2xl font-black mt-1">
            ₹{value?.toLocaleString() || 0}
          </p>
        </div>
        <div className="opacity-20">{icon}</div>
      </div>
    </div>
  );
};

// const dummyData = [
//   { name: "Jan", sales: 4000, purchases: 2400, expenses: 800 },
//   { name: "Feb", sales: 3000, purchases: 1398, expenses: 1200 },
//   { name: "Mar", sales: 2000, purchases: 9800, expenses: 2290 },
//   // ... more months
// ];
