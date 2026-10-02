import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Table, EmptyState, Skeleton, StatsCard } from "../../components/ui";
import { fetchTenants, setTenantFilter, clearTenantFilter, setCurrentPage } from "../../features/tenants/tenantSlice";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

const Tenants = () => {
  const dispatch = useDispatch();
  const { tenants, loading, error, currentPage, totalPages, totalCount, filter } = useSelector(
    (state: any) => state.tenants
  );
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useSearchParams("");

  useEffect(() => {
    dispatch(fetchTenants({ page: 1, filter }));
    setCurrentPage(1);
  }, [dispatch, filter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    dispatch(setTenantFilter({ q: e.target.value }));
    dispatch(fetchTenants({ page: 1 }));
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setTenantFilter({ [name]: value }));
    dispatch(fetchTenants({ page: 1 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchTenants({ page }));
    setCurrentPage(page);
  };

  if (loading) {
    return <Skeleton className="h-64" />;
  }

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="3" cy="3" r="3" /><circle cx="5" cy="5" r="3" /><circle cx="9" cy="9" r="3" /><circle cx="11" cy="11" r="3" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
        title="No tenants found"
        description="Add your first tenant to get started"
      />
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-rentora-dark">Tenants</h2>
          <div>
            <button
              className="text-sm text-rentora-accent font-medium hover:underline"
              onClick={() => navigate("/tenants/add")}
            >
              Add Tenant
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm text-rentora-muted mb-1">Search</label>
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchQuery || ""}
              onChange={handleSearch}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Status</label>
            <select
              name="status"
              value={filter.status || ""}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Current Property</label>
            <select
              name="property"
              value={filter.property || ""}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="">All properties</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Move-in Date</label>
            <input
              type="date"
              value={filter.moveInDate || ""}
              onChange={handleFilterChange}
              name="moveInDate"
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            />
          </div>
        </div>

        {/* Tenants table */}
        <div className="overflow-x-auto">
          <Table
            columns={["name", "email", "phone", "property", "status", "actions"]}
            data={tenants}
            title="Your Tenants"
          >
            {tenants.map((tenant) => (
              <tr key={tenant._id}>
                <td>{tenant.fullName}</td>
                <td>{tenant.email}</td>
                <td>{tenant.phone || "-"}</td>
                <td>{tenant.currentProperty ? "Property " + tenant.currentProperty.slice(-4) : "—"}</td>
                <td>
                  <span className={`status-pill status-${tenant.status?.toLowerCase() || "active"}`}>
                    {tenant.status || "active"}
                  </span>
                </td>
                <td>
                  <button className="text-xs text-rentora-accent hover:underline">View</button>
                  <button className="text-xs text-rentora-muted hover:underline ml-2">Edit</button>
                  <button className="text-xs text-rentora-error hover:underline ml-2">Delete</button>
                </td>
              </tr>
            ))}
          </Table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-rentora-muted">
              Showing {startIndex() + 1} of {totalCount}
            </span>
            <nav>
              <ul className="flex space-x-2">
                {currentPage > 1 && (
                  <li>
                    <button
                      className="text-xs text-rentora-accent hover:underline"
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Prev
                    </button>
                  </li>
                )}
                {currentPage < totalPages && (
                  <li>
                    <button
                      className="text-xs text-rentora-accent hover:underline"
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Tenants;

function startIndex() {
  return (currentPage - 1) * 10;
}