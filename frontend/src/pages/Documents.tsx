import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Table, EmptyState, Skeleton, StatsCard } from "../../components/ui";
import { fetchDocuments, setDocumentFilter, clearDocumentFilter, setCurrentPage } from "../../features/documents/documentSlice";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

const Documents = () => {
  const dispatch = useDispatch();
  const { documents, loading, error, currentPage, totalPages, totalCount, filter } = useSelector(
    (state: any) => state.documents
  );
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useSearchParams("");

  useEffect(() => {
    dispatch(fetchDocuments({ page: 1, filter }));
    setCurrentPage(1);
  }, [dispatch, filter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    dispatch(setDocumentFilter({ q: e.target.value }));
    dispatch(fetchDocuments({ page: 1 }));
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setDocumentFilter({ [name]: value }));
    dispatch(fetchDocuments({ page: 1 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchDocuments({ page }));
    setCurrentPage(page);
  };

  if (loading) {
    return <Skeleton className="h-64" />;
  }

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" /><path d="M14 2v2l6 6v6h-4l-2 4l-4-4l-2 4L14 22l4-4h6a2 2 0 0 0 2-2v-6.3l-.5-3.4L18 9l-2-2.3" /></svg>}
        title="No documents found"
        description="Upload KYC documents to get started"
      />
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-rentora-dark">KYC Documents</h2>
        </div>

        {/* Search and filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm text-rentora-muted mb-1">Search</label>
            <input
              type="text"
              placeholder="Search documents..."
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
              <option value="aadhaar">Aadhaar</option>
              <option value="pan">PAN</option>
              <option value="passport">Passport</option>
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
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
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
            <label className="block text-sm text-rentora-muted mb-1">&nbsp;</label>
            <button
              className="px-4 py-2 text-sm text-white bg-rentora-accent rounded hover:bg-rentora-accent/90"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Documents table */}
        <div className="overflow-x-auto">
          <Table
            columns={["tenant", "type", "documentNumber", "verificationStatus", "actions"]}
            data={documents}
            title="KYC Documents"
          >
            {documents.map((doc) => (
              <tr key={doc._id}>
                <td>{doc.tenant ? "Tenant" : "—"}</td>
                <td>{doc.documentType}</td>
                <td>{doc.documentNumberMasked || doc.documentNumber?.slice(-4) || "—"}</td>
                <td>
                  <span className={`status-pill status-${doc.verificationStatus}`}>
                    {doc.verificationStatus}
                  </span>
                </td>
                <td>
                  <button className="text-xs text-rentora-accent hover:underline">View</button>
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

export default Documents;

function startIndex() {
  return (currentPage - 1) * 10;
}