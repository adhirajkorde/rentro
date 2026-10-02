import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Table, EmptyState, Skeleton, StatsCard } from "../../components/ui";
import { fetchAgreements, setAgreementFilter, clearAgreementFilter, setCurrentPage } from "../../features/agreements/agreementSlice";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

const Agreements = () => {
  const dispatch = useDispatch();
  const { agreements, loading, error, currentPage, totalPages, totalCount, filter } = useSelector(
    (state: any) => state.agreements
  );
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useSearchParams("");

  useEffect(() => {
    dispatch(fetchAgreements({ page: 1, filter }));
    setCurrentPage(1);
  }, [dispatch, filter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    dispatch(setAgreementFilter({ q: e.target.value }));
    dispatch(fetchAgreements({ page: 1 }));
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setAgreementFilter({ [name]: value }));
    dispatch(fetchAgreements({ page: 1 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchAgreements({ page }));
    setCurrentPage(page);
  };

  if (loading) {
    return <Skeleton className="h-64" />;
  }

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" /><path d="M14 2v2l6 6v6h-4l-2 4l-4-4l-2 4L14 22l4-4h6a2 2 0 0 0 2-2v-6.3l-.5-3.4L18 9l-2-2.3" /></svg>}
        title="No agreements found"
        description="Create a rental agreement to get started"
      />
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-rentora-dark">Rental Agreements</h2>
          <div>
            <button
              className="text-sm text-rentora-accent font-medium hover:underline"
              onClick={() => navigate("/agreements/create")}
            >
              Create Agreement
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm text-rentora-muted mb-1">Search</label>
            <input
              type="text"
              placeholder="Search agreements..."
              value={searchQuery || ""}
              onChange={handleSearch}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Tenant</label>
            <select
              name="tenant"
              value={filter.tenant || ""}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="">All tenants</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Property</label>
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
            <label className="block text-sm text-rentora-muted mb-1">Status</label>
            <select
              name="status"
              value={filter.status || ""}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Expiring</label>
            <select
              name="expiring"
              value={filter.expiring || ""}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="">Not expiring</option>
              <option value="yes">Expiring soon (30 days)</option>
            </select>
          </div>
        </div>

        {/* Agreements table */}
        <div className="overflow-x-auto">
          <Table
            columns={["tenant", "property", "rent", "period", "status", "actions"]}
            data={agreements}
            title="Your Agreements"
          >
            {agreements.map((agreement) => (
              <tr key={agreement._id}>
                <td>{/* Tenant name would be populated */}</td>
                <td>{/* Property name would be populated */}</td>
                <td>₹{agreement.monthlyRent.toLocaleString()}</td>
                <td>{/* Period */}</td>
                <td>
                  <span className={`status-pill status-${agreement.status?.toLowerCase() || "draft"}`}>
                    {agreement.status}
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

export default Agreements;

function startIndex() {
  return (currentPage - 1) * 10;
}