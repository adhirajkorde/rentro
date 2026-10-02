import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Table, EmptyState, Skeleton, StatsButton } from "../../components/ui";
import { fetchDocuments, setDocumentFilter, clearDocumentFilter, setCurrentPage } from "../../features/documents/documentSlice";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

const SecurityDeposits = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useSearchParams("");

  useEffect(() => {
    // Fetch security deposit records via documents (or we could add a separate API)
    // For now, we'll use the SecurityDeposit model through the API
    // Since there's no dedicated security deposit list endpoint, we'll fetch documents and filter
    dispatch(fetchDocuments({ page: 1 }));
    setCurrentPage(1);
  }, [dispatch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    dispatch(setDocumentFilter({ q: e.target.value }));
    dispatch(fetchDocuments({ page: 1 }));
    setCurrentPage(1);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    dispatch(setDocumentFilter({ [name]: value }));
    dispatch(fetchDocuments({ page: 1 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchDocuments({ page }));
    setCurrentPage(page);
  };

  if (/* loading */ true) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="p-6">
      <Card>
        <h2 className="text-2xl font-bold text-rentora-dark mb-6">Security Deposit Management</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm text-rentora-muted mb-1">Search</label>
            <Input
              type="text"
              placeholder="Search deposits..."
              value={searchQuery || ""}
              onChange={handleSearch}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Tenant</label>
            <Select
              onValueChange={(value: string) => setSearchQuery(value)}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="">All tenants</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Status</label>
            <Select
              onValueChange={(value: string) => setSearchQuery(value)}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="full">Full</option>
              <option value="disputed">Disputed</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">&nbsp;</label>
            <Button
              variant="primary"
              onClick={() => dispatch(fetchDocuments({ page: 1 }))}
              className="px-4 py-2 text-sm text-white bg-rentora-accent rounded hover:bg-rentora-accent/90"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Deposits table */}
        <div className="overflow-x-auto">
          <Table
            columns={["tenant", "property", "depositAmount", "refundAmount", "deductionAmount", "status", "actions"]}
            data={[]}
            title="Security Deposits"
          >
            {/* No data placeholder - would need dedicated API endpoint */}
            <tr>
              <td colSpan={7} className="text-center text-rentora-muted py-8">
                No deposit records found. Add security deposits through the agreement creation process.
              </td>
            </tr>
          </Table>
        </div>

        {/* Information section */}
        <div className="mt-8 p-6 bg-rentora-card border border-rentora-border">
          <h3 className="font-medium text-rentora-dark mb-4">How It Works</h3>
          <ul className="space-y-3 text-rentora-muted">
            <li>
              Security deposits are collected at the start of tenancy and recorded in the
              SecurityDeposit model linked to the RentalAgreement
            </li>
            <li>
              Deposit status can be: pending, partial, full, or disputed
            </li>
            <li>
              Damage deductions are recorded through the move-out inspection damage records
            </li>
            <li>
              Outstanding rent and utility charges are deducted before refund processing
            </li>
            <li>
              Final settlement is generated after move-out inspection completion
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default SecurityDeposits;