import {Routes,Route} from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";

import PrivateRoute from '@/components/PrivateRoute';
 import RoleGate from '@/components/RoleGate';
import { ROLES } from "@/constants/roles";

import { Dashboard } from "@/pages/Dashboard";
import {Login} from "@/pages/Login";
import { Page404 } from "@/pages/Page404";
import { ItemMaster } from "@/pages/ItemMaster";
import {SalesBill} from "@/pages/SalesBill";
import { Customer } from "@/pages/Customer";
import { Purchase } from "@/pages/Purchase";
import { SalesGSTReport } from "@/pages/SalesGSTReport";
import { DailyExpense } from "@/pages/DailyExpense";
import { CompanyProfile } from "@/pages/CompanyProfile";
import { SupplierPage } from "@/pages/Supplier";
import { PurchaseGSTReport } from "@/pages/PurchaseGSTReport";
import { SalesPaymentReport } from "@/pages/SalesPaymentReport";
import { PurchasePaymentReport } from "@/pages/PurchasePaymentReport";
import { Quotation } from "@/pages/Quotation";
import StockHistoryReport from "@/pages/StockHistoryReport";

export const AllRoutes = () => {
  return (
    <>
      <Routes>
        {/* 1. PUBLIC ROUTES (No Header/Footer) */}
        <Route path="/login" element={<Login />} />

        {/* 2. PROTECTED ROUTES (Inside MainLayout) */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            
            {/* Accessible by ANY logged-in user */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ItemMaster />} />
            <Route path="/sales" element={<SalesBill />} />
            <Route path="/customer" element={<Customer />} />
            <Route path="/purchase" element={<Purchase />} />
            <Route path="/salesgstReport" element={<SalesGSTReport />} />
            <Route path="/purchasegstReport" element={<PurchaseGSTReport />} />
            <Route path="/expenses" element={<DailyExpense />} />
            <Route path="/company" element={<CompanyProfile />} />
            <Route path="/supplier" element={<SupplierPage />} />
            <Route path="/salesPaymentReport" element={<SalesPaymentReport />} />
            <Route path="/purchasePaymentReport" element={<PurchasePaymentReport />} />
            <Route path="/quotation" element={<Quotation />} />
            <Route path="/stockHistoryReport" element={<StockHistoryReport />} />
            {/* <Route path="/profile" element={<UserProfile />} /> */}

            {/* Accessible only by ADMINS */}
            <Route element={<RoleGate allowedRoles={[ROLES.ADMIN]} />}>
              {/* <Route path="/admin" element={<AdminPanel />} /> */}
            </Route>
            
          </Route>
        </Route>

        {/* 404 Page */}
        <Route path="*" element={<Page404/>} />
      </Routes>
    </>

  )
}
