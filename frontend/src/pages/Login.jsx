import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { useApp } from "@/context/useApp";
import full_cart from "@/assets/full-cart.jpg";
import { InputField } from "@/components/InputField";
import Footer from "@/components/Footer";

// css properties
const label_css = "block text-sm font-medium text-gray-700 mb-1";
const input_css =
  "block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900";
const error_label_css = "block text-sm font-medium text-red-600";
const error_input_css =
  "w-full px-4 py-2 border border-red-500 rounded-lg focus:ring-red-500 focus:border-red-500";
const error_text_css = "mt-1 text-xs text-red-500";
{
  /* <p class="mt-1 text-xs text-red-500">Password must be at least 8 characters.</p> */
}

const tbl_header = "border border-slate-600  bg-gray-500 p-1";
const tbl_thead_tr = " text-white border-r-2  border-gray-300";
const tbl_thead_th = "px-6 py-2 border-r-2  border-gray-300";
const tbl_tbody_td = "border-r-2  border-gray-300 px-1";

export const Login = () => {
  const { fetchCompany, fetchSuppliers } = useApp();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginData, setLoginData] = useState({
    username: "admin",
    password: "123456",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Track Form submission state

  // Get the page the user was redirected from, or default to dashboard
  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setErrorMessage("");
      setIsSubmitting(true);

      const result = await login({
        username: loginData.username,
        password: loginData.password,
      });

      if (result.success) {
       fetchCompany();
       fetchSuppliers(); 
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.log(`Error Login :`, error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      {/* --- HEADER --- */}
      <header className="w-full p-2 bg-gray-300 border-b shadow-sm">
        <div>
          <div className="font-bold text-xl text-blue-600">MyStore</div>
        </div>
      </header>

      {/* --- MAIN CONTENT (Centered Login) --- */}
      {/* flex-grow makes this section expand to fill the gap between header and footer */}
      <main className="flex grow items-center justify-center p-6 ">
        {/* Container for the Form and Logo */}
        <div className="flex w-full max-w-2xl  items-center   gap-10 border border-gray-400 rounded-xl p-8 shadow-lg">
          {/* Logo Section */}
          <div className="hidden md:block">
            {/* Hidden on mobile for better UX */}
            <img src={full_cart} alt="cart-logo" className="w-48" />
          </div>

          {/* Form Section */}
          <div className="flex-1">
            <div className="text-center mb-6">
              <span className="text-3xl font-semibold text-gray-800">
                Login
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <InputField
                  type="text"
                  label="Username"
                  id="username"
                  name="username"
                  value={loginData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <InputField
                  type="Password"
                  label="password"
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full transition-colors rounded-md text-white font-medium px-4 py-2 mt-4 ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-600"
                }`}
              >
                Log In
              </button>

              {errorMessage && (
                <span className="text-red-500 text-sm mt-4 block text-center">
                  {errorMessage}
                </span>
              )}
            </form>
          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="w-full p-2 border-t pl-6 bg-gray-300 ">
        <div className="max-w-7xl mx-auto   text-gray-500 text-sm">
          &copy; Vishwakarma Tech.
        </div>
      </footer>
    </div>
  );
};
