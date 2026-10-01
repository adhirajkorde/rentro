import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, StatsCard, Table, EmptyState, Skeleton } from "../../components/ui";
import { getProperties, getTenants, getAgreements } from "../../services/api";
import { fetchProperties, fetchTenants, fetchAgreements } from "../../features/properties/propertySlice";
import { fetchTenants as fetchTenantData } from "../../features/tenants/tenantSlice";
import { fetchAgreements as fetchAgreementData } from "../../features/agreements/agreementSlice";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);

  // Dashboard stats
  const [stats, setStats] = React.useState({
    totalProperties: 0,
    availableProperties: 0,
    occupiedProperties: 0,
    totalTenants: 0,
    monthlyExpectedRent: 0,
    monthlyCollectedRent: 0,
    pendingRent: 0,
    overdueRent: 0,
    securityDeposits: 0,
    expiringAgreements: 0,
    pendingDocuments: 0,
    pendingInspections: 0,
  });

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Fetch properties
        const propertiesResp = await getProperties();
        const properties = propertiesResp.data || [];
        
        const totalProperties = properties.length;
        const availableProperties = properties.filter((p: any) => p.status === "available").length;
        const occupiedProperties = properties.filter((p: any) => p.status === "occupied").length;

        // Fetch tenants
        const tenantsResp = await getTenants();
        const tenants = tenantsResp.data || [];
        const totalTenants = tenants.length;

        // Fetch agreements
        const agreementsResp = await getAgreements();
        const agreements = agreementsResp.data || [];
        const expiringAgreements = agreements.filter((a: any) => a.status === "expiring-soon").length;

        // Calculate rent stats from rent records
        const { data: rentRecords } = await getRentRecords();
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

        // Security deposits
        const { data: deposits } = await getSecurityDeposits();
        const securityDeposits = deposits.reduce((sum: number, d: any) => sum + (d.depositAmount || 0), 0);

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
          pendingDocuments: 0, // Will be fetched separately
          pendingInspections: 0, // Will be fetched separately
        });

        // Dispatch to Redux
        dispatch(fetchProperties(properties));
        dispatch(fetchTenants(tenants));
        dispatch(fetchAgreements(agreements));
      } catch (error) {
        console.error("Dashboard load error:", error);
      }
    };

    loadDashboard();
  }, [dispatch]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-rentora-dark mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
        <StatsCard
          title="Pending Documents"
          value={stats.pendingDocuments}
          subtitle="Awaiting verification"
        />
        <StatsCard
          title="Pending Inspections"
          value={stats.pendingInspections}
          subtitle="Awaiting completion"
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="space-y-4">
          <h3 className="text-font-medium text-rentora-dark mb-3">Recent Rent Payments</h3>
          <EmptyState
            icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4m0 4v8m0-8V2a2 2 0 0 0-2-2h-2m2 4h2m7 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0" /></svg>}
            title="No rent payments yet"
            description="Add your first property to start tracking rent payments"
          />
          <Table
            columns={["Tenant", "Property", "Amount", "Status", "Date"]}
            data={[]}
            title="Recent payments"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-font-medium text-rentora-dark mb-3">Recent Tenants</h3>
          <EmptyState
            icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="3" cy="3" r="3" /><circle cx="5" cy="5" r="3" /><circle cx="9" cy="9" r="3" /><circle cx="11" cy="11" r="3" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
            title="No tenants yet"
            description="Add your first tenant to get started"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;