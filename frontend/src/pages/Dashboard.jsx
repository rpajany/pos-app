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
      console.log("Error :", error);
    } finally {
      setIsLoading(false);
    }
  };

  console.log("cashFlow :", cashFlow);

  // 3. Triggering the effect
  useEffect(() => {
    fetchStats();
    fetch_CashFlow();
    // Ensure dateRange is stable (use strings for dates in state)
  }, [dateRange.start, dateRange.end]);

  // console.log("stats :", stats);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];


  const SalesPaymentStatsChart = ({ data }) => {
  // Define colors for your payment types
  const COLORS = {
    cash: '#22c55e', // Green
    upi: '#3b82f6',  // Blue
    card: '#f59e0b', // Amber
    credit: '#ef4444', // Red
    bank_transfer: '#8b5cf6' // Purple
  };

  // Format the data for the chart (Capitalize names)
  const chartData = data.map(item => ({
    name: item.method.charAt(0).toUpperCase() + item.method.slice(1),
    value: item.amount,
    count: item.count
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name.toLowerCase().replace(" ", "_")] || '#94a3b8'} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `₹${value.toLocaleString()}`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

  return (
    /* p-4 on mobile, p-6 on desktop to maximize space */
    <div className="p-4 md:p-6  bg-gray-50 min-h-screen pb-20">
      {/* HEADER & DATE FILTER: Stacks on mobile */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          Business Overview
        </h2>
        <div className="flex gap-1  md:gap-2 bg-white p-2 rounded-lg shadow-sm border">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
            className="outline-none text-xs md:text-sm bg-transparent"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
            className="outline-none text-xs md:text-sm bg-transparent"
          />
        </div>
      </div>

      {/* SUMMARY CARDS: 1 col on mobile, 2 on tablet, 4 on desktop */}
      <div className="  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      <div className="mb-6">
        <CashFlowCards data={cashFlow?.data} />
      </div>

      {/* Yearly Bar Chart : Responsive height */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border  mb-6">
        <h3 className="font-bold mb-6 text-gray-700 text-sm md:text-base">
          Yearly Performance (Sales, Purchases & Expenses)
        </h3>
        <div className="h-[300px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis tickFormatter={(val) => `₹${val}`} tick={{fontSize: 12}} />
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

 {/* PIE CHART & STATS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

{/* Payment Mode Pie Chart */}
      <div className="bg-white border rounded-xl p-4 flex flex-col items-center ">
        {/* <div className="flex items-center self-start mb-4">
          <IndianRupee size={18} className="mr-2 text-blue-600" />

          <h3 className="font-bold text-gray-700">Sales / Payment Mode</h3>
        </div> */}

{/* <div className="h-[300px] w-full">
<ResponsiveContainer width="100%" height="100%">
<PieChart>
  
          <Pie
            data={stats?.paymentStats}
            dataKey="amount"
            nameKey="_id"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            // label
            labelLine={false}
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
        </ResponsiveContainer>
</div> */}


<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center self-start mb-4">
          <IndianRupee size={18} className="mr-2 text-blue-600" />

          <h3 className="font-bold text-gray-700">Sales / Payment Mode</h3>
        </div>
    <SalesPaymentStatsChart data={stats?.paymentStats || []} />
  </div>
        
      </div>

 
     
        {/* Top 10 Table Snippet */}
        <div className="lg:w-full sm:w-full  bg-white p-4 rounded-lg shadow border   ">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
        
              <ArrowUpNarrowWide />
           
            <h3 className="font-bold mb-3">Top 10 Selling Items</h3>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {stats?.topItems.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between text-sm border-b pb-1"
              >
                <span className="text-gray-600 truncate mr-4">{item.name}</span>
                <span className="font-bold whitespace-nowrap">{item.qty} units</span>
              </div>
            ))}
          </div>
        </div>
      
</div>

       {/* SECOND GRID: Low Stock & Inventory Value */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          
        {/* Low Stock Alerts */}
        <div className="bg-white p-6 md:p-6 rounded-xl shadow-sm border border-red-300 ">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Low Stock Alerts
            </h3>
            <button className="text-blue-600 text-xs font-semibold hover:underline">
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
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
      
     

      {/* Inventory Asset Value */}
 
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
            Inventory Asset Value
          </p>
          <p>("Buy Price" of your inventory)</p>
          <h2 className="text-3xl font-black mt-1">
            ₹ {stats?.summary.stockValue.toLocaleString()}
          </h2>
           <p className="text-xs opacity-70 mt-1">Cost value of current stock</p>

          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
              Potential Revenue
            </p>
            <p>
              (Total amount of money will collect if sell every item at retail
              selling price.)
            </p>
            <p className="text-2xl font-bold mt-1">
              ₹ {stats?.summary.potentialRevenue.toLocaleString()}
            </p>
               <p className="text-xs opacity-70 mt-1">Estimated value at retail price</p>
          </div>
        </div>
          
         </div>

         {/* RECENT TRANSACTIONS: Scrollable on mobile */}
        <div className="bg-white p-4 rounded-xl shadow border mt-4 lg:w-full sm:w-full overflow-hidden">
          <h3 className="font-bold mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto"> {/* Critical for mobile tables */}
          <table className="w-full text-sm min-w-[500px] uppercase text-[10px] tracking-wider">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3">Invoice</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Method</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats?.recentSales?.map((sale) => (
                <tr
                  key={sale._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 text-blue-600 font-bold">
                    {sale.invoiceNo}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col">
                      {/* Accessing populated customer data safely */}
                      <span className="font-bold text-gray-700">
                        {sale.customerId?.name || "Walk-in"}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {sale.customerId?.phone || "No Phone"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-blue-200 rounded-md text-[10px] font-bold uppercase text-gray-500 ">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 text-right font-black text-gray-900">
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
      className={`bg-white p-4 md:p-5 rounded-xl border-l-4 shadow-sm     
        hover:shadow-md transition-shadow ${colors[color]}`}
    >
      <div className="flex justify-between items-center">
        {/* min-w-0 and truncate are key to keeping text inside the card */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px]  font-bold uppercase text-gray-400 tracking-wider truncate">
            {title}
          </p>
          <p className="text-lg md:text-2xl font-black mt-1 text-gray-800   ">
            ₹ {value?.toLocaleString() || 0}
          </p>
        </div>
        {/* Shrink the icon on mobile so it doesn't push the text out */}
        <div className="opacity-20 transform scale-110 md:scale-125">{icon}</div>
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
