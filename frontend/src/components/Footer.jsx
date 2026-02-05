import React from 'react'

// export default function Footer() {
//   return (
//       <footer className="w-full z-50 p-2 border-t pl-6 bg-gray-300 ">
//         <div className="max-w-7xl mx-auto   text-gray-500 text-sm">
//           &copy; Vishwakarma Tech.
//         </div>
       
//       </footer>
//   )
// }

 

export default function Footer() {
  // Get current year dynamically
  const currentYear = new Date().getFullYear();

  return (
    /* - h-auto md:h-10: Self-adjusting height.
       - text-center md:text-left: Center text on mobile for better balance.
       - text-[10px] md:text-sm: Smaller text on mobile to save space.
    */
    <footer className="w-full z-50 p-3 md:p-2 border-t bg-gray-100 text-gray-600 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-4 md:px-6 gap-2">
        
        {/* Copyright Section */}
        <div className="text-[11px] md:text-sm font-medium tracking-wide">
          &copy; {currentYear} <span className="text-blue-600">Vishwakarma Tech.</span>
        </div>

        {/* Optional: POS Status/Version (Hidden on very small screens or made tiny) */}
        <div className="flex items-center gap-4 text-[10px] md:text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            System Online
          </div>
          <span className="hidden sm:inline">|</span>
          <span>v1.0.4</span>
        </div>

      </div>
    </footer>
  )
}