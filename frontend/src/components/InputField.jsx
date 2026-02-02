export const InputField = ({ label, size="w-full", icon: Icon, type = "text", error, ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-800 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          className={`${size} ${Icon ? 'pl-10' : 'pl-4'} px-4 py-2 border rounded-md transition duration-200 outline-none
            ${error 
              ? "border-red-500 focus:ring-red-200" 
              : "border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            }`}
          {...props}
          value={props.value ?? ""}
        />
      </div>
      
      {error && <span className="text-sm text-red-500 mt-1">{error}</span>}
    </div>
  );
};