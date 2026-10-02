import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Table, EmptyState, Skeleton, StatsCard } from "../../components/ui";
import { fetchProperties, setPropertyFilter, clearPropertyFilter, setCurrentPage } from "../../features/properties/propertySlice";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

const Properties = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);
  const { properties, loading, error, currentPage, totalPages, totalCount, filter } = useSelector(
    (state: any) => state.properties
  );
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useSearchParams("");

  useEffect(() => {
    dispatch(fetchProperties({ page: 1, filter }));
    setCurrentPage(1);
  }, [dispatch, filter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    dispatch(setPropertyFilter({ q: e.target.value }));
    dispatch(fetchProperties({ page: 1 }));
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setPropertyFilter({ [name]: value }));
    dispatch(fetchProperties({ page: 1 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchProperties({ page }));
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <Skeleton className="h-64" />
    );
  }

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>}
        title="No properties found"
        description="Add your first property to get started"
      />
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-rentora-dark">Properties</h2>
          <div>
            <button
              className="text-sm text-rentora-accent font-medium hover:underline"
              onClick={() => navigate("/properties/add")}
            >
              Add Property
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm text-rentora-muted mb-1">Search</label>
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery || ""}
              onChange={handleSearch}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Type</label>
            <select
              name="type"
              value={filter.type || ""}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="">All types</option>
              <option value="house">House</option>
              <option value="flat">Flat</option>
              <option value="apartment">Apartment</option>
              <option value="shop">Shop</option>
              <option value="villa">Villa</option>
              <option value="commercial">Commercial</option>
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
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="under-maintenance">Under Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Min Rent</label>
            <input
              type="number"
              placeholder="0"
              value={filter.minRent || ""}
              onChange={handleFilterChange}
              name="minRent"
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            />
          </div>
        </div>

        {/* Properties table */}
        <div className="overflow-x-auto">
          <Table
            columns={["name", "type", "location", "rent", "status", "actions"]}
            data={properties}
            title="Your Properties"
          >
            {/* Custom render for actions column */}
            {properties.map((prop) => (
              <tr key={prop._id}>
                <td>{prop.name}</td>
                <td>{prop.type}</td>
                <td>{prop.city}, ${prop.state || ""}</td>
                <td>₹{prop.monthlyRent.toLocaleString()}</td>
                <td>
                  <span className={`status-pill status-${prop.status.toLowerCase()}`}>
                    {prop.status}
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
              Showing {startIndex + 1} of {totalCount}
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

export default Properties;

function startIndex() {
  return (currentPage - 1) * 10;
}