import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, StatsCard } from "../../components/ui";
import { setStats } from "../../features/reports/reportsSlice";
import { useNavigate } from "react-router-dom";

const Reports = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector((state: any) => state.reports);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch dashboard stats
    const loadStats = async () => {
      try {
        const propertiesResp = await fetchProperties();
        const properties = propertiesResp.data?.data || [];

        const totalProperties = properties.length;
        const availableProperties = properties.filter((p: any) => p.status === "available").length;
        const occupiedProperties = properties.filter((p: any) => p.status === "occupied").length;

        const tenantsResp = await fetchTenants();
        const tenants = tenantsResp.data?.data || [];
        const totalTenants = tenants.length;

        const agreementsResp = await fetchAgreements();
        const agreements = agreementsResp.data?.data || [];
        const expiringAgreements = agreements.filter((a: any) => a.status === "active" && new Date(a.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length;

        const { data: rentRecords } = await fetchRentRecords();
        const monthlyExpectedRent = totalProperties > 0
          ? (properties.reduce((sum: number, p: any) => sum + (p.monthlyRent || 0), 0) / totalProperties)
          : 0;
        const monthlyCollectedRent = rentRecords
          .filter((r: any) => r.status === "paid")
          .reduce((sum: number, r: any) => sum + (r.paidAmount || 0), 0);
        const pendingRent = rentRecords
          .filter((r: any) => r.status === "unpaid" || r.status === "partially-paid")
          .reduce((sum: number, r: any) => sum + (r.remainingAmount || 0), 0);
        const overdueRent = rentRecords
          .filter((r: any) => r.status === "overdue")
          .reduce((sum: number, r: any) => sum + (r.remainingAmount || 0), 0);

        const { data: deposits } = await fetchDocuments(); // Using docs API for deposits, or we could add a separate API
        const securityDeposits = deposits.reduce((sum: number, d: any) => sum + (d.depositAmount || 0), 0);

        dispatch(
          setStats({
            totalProperties,
            availableProperties,
            occupiedProperties,
            totalTenants,
            monthlyExpectedRent,
            monthlyCollectedRent,
            pendingRent,
            overdueRent,
            securityDeposits,
            expiringAgreements,
            pendingDocuments: 0,
            pendingInspections: 0,
            totalPayments: 0,
            totalRefundedDeposits: 0,
          })
        );
      } catch (error) {
        console.error("Reports load error:", error);
      }
    };

    loadStats();
  }, [dispatch]);

  return (
    <div className="p-6">
      <Card>
        <h2 className="text-2xl font-bold text-rentora-dark mb-6">Reports</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Properties"
            value={stats.totalProperties}
            subtitle="Overall portfolio size"
          />
          <StatsCard
            title="Available Properties"
            value={stats.availableProperties}
            subtitle="Ready for occupancy"
          />
          <StatsCard
            title="Occupied Properties"
            value={stats.occupiedProperties}
            subtitle="Currently rented"
          />
          <StatsCard
            title="Total Tenants"
            value={stats.totalTenants}
            subtitle="Active tenants"
          />
          <StatsCard
            title="Monthly Expected Rent"
            value={`₹${stats.monthlyExpectedRent.toLocaleString()}`}
            subtitle="Based on active properties"
          />
          <StatsCard
            title="Monthly Collected Rent"
            value={`₹${stats.monthlyCollectedRent.toLocaleString()}`}
            subtitle="This period collected"
          />
          <StatsCard
            title="Pending Rent"
            value={`₹${stats.pendingRent.toLocaleString()}`}
            subtitle="Outstanding payments"
          />
          <StatsCard
            title="Overdue Rent"
            value={`₹${stats.overdueRent.toLocaleString()}`}
            subtitle="Past due amounts"
          />
          <StatsCard
            title="Security Deposits"
            value={`₹${stats.securityDeposits.toLocaleString()}`}
            subtitle="Total held deposits"
          />
          <StatsCard
            title="Expiring Agreements"
            value={stats.expiringAgreements}
            subtitle="Agreements ending soon"
          />
        </div>
      </Card>
    </div>
  );
};

export default Reports;