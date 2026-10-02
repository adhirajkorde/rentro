import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  EmptyState,
  Skeleton,
  StatsCard,
  Upload,
  Button,
  Input,
  Select,
  Form,
} from "../../components/ui";
import {
  fetchInspections,
  createInspection,
  updateInspection,
  setInspectionFilter,
  clearInspectionFilter,
  setCurrentPage,
} from "../../features/inspections/inspectionSlice";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

const Inspections = () => {
  const dispatch = useDispatch();
  const {
    inspections,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    filter,
  } = useSelector((state: any) => state.inspections);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useSearchParams("");

  const [form, setForm] = useState({
    property: "",
    tenant: "",
    inspector: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    type: "move-in" as "move-in" | "move-out" | "routine",
    electricityMeter: "",
    waterMeter: "",
    gasMeter: "",
    generalCondition: "good" as
      | "excellent"
      | "good"
      | "fair"
      | "poor",
    walls: "good" as "excellent" | "good" | "fair" | "poor",
    floors: "good" as "excellent" | "good" | "fair" | "poor",
    doors: "good" as "excellent" | "good" | "fair" | "poor",
    windows: "good" as "excellent" | "good" | "fair" | "poor",
    kitchen: "good" as "excellent" | "good" | "fair" | "poor",
    bathroom: "good" as "excellent" | "good" | "fair" | "poor",
    furniture: "good" as "excellent" | "good" | "fair" | "poor",
    appliances: "good" as "excellent" | "good" | "fair" | "poor",
    otherRemarks: "",
  });

  useEffect(() => {
    dispatch(fetchInspections({ page: 1, filter }));
    setCurrentPage(1);
  }, [dispatch, filter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    dispatch(setInspectionFilter({ q: e.target.value }));
    dispatch(fetchInspections({ page: 1 }));
    setCurrentPage(1);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    dispatch(setInspectionFilter({ [name]: value }));
    dispatch(fetchInspections({ page: 1 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchInspections({ page }));
    setCurrentPage(page);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createInspection(form);
      // Reset form or navigate
      navigate(`/inspections/${result.data._id}`);
    } catch (err: any) {
      console.error("Inspection creation error:", err);
    }
  };

  if (loading) {
    return <Skeleton className="h-64" />;
  }

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" /><path d="M14 2v2l6 6v6h-4l-2 4l-4-4l-2 4L14 22l4-4h6a2 2 0 0 0 2-2v-6.3l-.5-3.4L18 9l-2-2.3" /></svg>}
        title="No inspections found"
        description="Conduct move-in or move-out inspections"
      />
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-rentora-dark">
            {form.type === "move-in" ? "Move-in Inspection" : form.type === "move-out" ? "Move-out Inspection" : "Routine Inspection"}
          </h2>
          <button
            className="text-sm text-rentora-accent font-medium hover:underline"
            onClick={() => navigate("/inspections/create")}
          >
            New Inspection
          </button>
        </div>

        {/* Search and filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div>
            <label className="block text-sm text-rentora-muted mb-1">Search</label>
            <Input
              type="text"
              placeholder="Search inspections..."
              value={searchQuery || ""}
              onChange={handleSearch}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Property</label>
            <select
              name="property"
              value={form.property || ""}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="">Select property</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Tenant</label>
            <select
              name="tenant"
              value={form.tenant || ""}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="">Select tenant</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Type</label>
            <Select
              onValueChange={(value: string) => setForm((prev) => ({ ...prev, type: value }))}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="move-in">Move-in</option>
              <option value="move-out">Move-out</option>
              <option value="routine">Routine</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">Status</label>
            <Select
              onValueChange={(value: string) => setForm((prev) => ({ ...prev, status: value }))}
              className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-rentora-muted mb-1">&nbsp;</label>
            <Button
              variant="primary"
              type="submit"
              onClick={handleSearch}
              className="px-4 py-2 text-sm text-white bg-rentora-accent rounded hover:bg-rentora-accent/90"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Inspections table */}
        <div className="overflow-x-auto">
          <Table
            columns={["property", "tenant", "type", "date", "status", "actions"]}
            data={inspections}
            title="Inspections"
          >
            {inspections.map((inspection) => (
              <tr key={inspection._id}>
                <td>{inspection.property ? "Property" : "—"}</td>
                <td>{inspection.tenant ? "Tenant" : "—"}</td>
                <td>{inspection.type}</td>
                <td>{inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString() : "—"}</td>
                <td>
                  <span className={`status-pill status-${inspection.status}`}>
                    {inspection.status}
                  </span>
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => navigate(`/inspections/${inspection._id}`)}
                  >
                    View
                  </Button>
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
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Prev
                    </Button>
                  </li>
                )}
                {currentPage < totalPages && (
                  <li>
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
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

export default Inspections;

function startIndex() {
  return (currentPage - 1) * 10;
}