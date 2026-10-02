import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  EmptyState,
  Skeleton,
  Button,
  Input,
  Select,
  Form,
  Alert,
} from "../../components/ui";
import { fetchDocuments, setDocumentFilter, clearDocumentFilter, setCurrentPage } from "../../features/documents/documentSlice";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

const SecurityDeposits = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useSearchParams("");

  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch security deposit records
    // We'll use the documents API and filter by relevant types, or use a direct approach
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
        <h2 className="text-2xl font-bold text-rentora-dark mb-6">
          Security Deposit Management
        </h2>

        <Button
          variant="secondary"
          onClick={() => setFormVisible(true)}
          className="mb-3"
        >
          + Record Security Deposit
        </Button>

        {/* Deposits table */}
        <div className="overflow-x-auto">
          <Table
            columns={
              ["tenant", "property", "depositAmount", "deductions", "refundAmount", "status", "actions"]
            }
            data={[]}
            title="Security Deposits"
          >
            {/* Placeholder - would need dedicated API endpoint or use documents with deposit data */}
            <tr>
              <td colSpan={7} className="text-center text-rentora-muted py-8">
                No deposit records found.
                <br />
                Deposits are recorded when creating a security deposit through the agreement or payment system.
              </td>
            </tr>
          </Table>
        </div>

        {/* Information section about how deposits work */}
        {totalCount === 0 && (
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
        )}
      </Card>
    </div>
  );
};

export default SecurityDeposits;