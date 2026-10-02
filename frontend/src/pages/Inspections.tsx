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
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      setFormVisible(true);
      // Reset form or navigate to inspection detail
      setEditingId(null);
      setFormVisible(false);
    } catch (err: any) {
      Alert({
        title: "Error",
        message: err.response?.data?.message || "Failed to create inspection",
        variant: "destructive",
      });
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
        <h2 className="text-2xl font-bold text-rentora-dark mb-6">
          {form.type === "move-in"
            ? "Move-in Inspection"
            : form.type === "move-out"
              ? "Move-out Inspection"
              : "Routine Inspection"}
        </h2>

        <Button
          variant="secondary"
          onClick={() => setFormVisible(true)}
          className="mb-3"
        >
          + New {form.type === "move-in" ? "Move-in" : form.type === "move-out" ? "Move-out" : "Routine"} Inspection
        </Button>

        {formVisible && (
          <Alert
            title="Create Inspection"
            onClose={() => setFormVisible(false)}
            description="Enter inspection details below"
          >
            <Form onSubmit={onSubmit} className="space-y-4">
              <Input
                name="property"
                type="text"
                placeholder="Property name/ID"
                value={form.property}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
              />
              <Input
                name="tenant"
                type="text"
                placeholder="Tenant name/ID"
                value={form.tenant}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
              />
              <Input
                name="inspector"
                type="text"
                placeholder="Inspector name"
                value={form.inspector}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
              />
              <Input
                name="inspectionDate"
                type="date"
                value={form.inspectionDate}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
              />
              <Select
                onValueChange={(value: string) =>
                  setForm((prev) => ({ ...prev, type: value }))
                }
                className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
              >
                <option value="move-in">Move-in</option>
                <option value="move-out">Move-out</option>
                <option value="routine">Routine</option>
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="electricityMeter"
                  type="number"
                  placeholder="Electricity meter"
                  value={form.electricityMeter}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                />
                <Input
                  name="waterMeter"
                  type="number"
                  placeholder="Water meter"
                  value={form.waterMeter}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                />
                <Input
                  name="gasMeter"
                  type="number"
                  placeholder="Gas meter"
                  value={form.gasMeter}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Select
                  onValueChange={(value: string) =>
                    setForm((prev) => ({ ...prev, generalCondition: value }))
                  }
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>

                <Select
                  onValueChange={(value: string) =>
                    setForm((prev) => ({ ...prev, walls: value }))
                  }
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>

                <Select
                  onValueChange={(value: string) =>
                    setForm((prev) => ({ ...prev, floors: value }))
                  }
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Select
                  onValueChange={(value: string) =>
                    setForm((prev) => ({ ...prev, doors: value }))
                  }
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>

                <Select
                  onValueChange={(value: string) =>
                    setForm((prev) => ({ ...prev, windows: value }))
                  }
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>

                <Select
                  onValueChange={(value: string) =>
                    setForm((prev) => ({ ...prev, kitchen: value }))
                  }
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Select
                  onValueChange={(value: string) =>
                    setForm((prev) => ({ ...prev, bathroom: value }))
                  }
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>

                <Select
                  onValueChange={(value: string) =>
                    setForm((prev) => ({ ...prev, furniture: value }))
                  }
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>

                <Select
                  onValueChange={(value: string) =>
                    setForm((prev) => ({ ...prev, appliances: value }))
                  }
                  className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>
              </div>

              <Input
                name="otherRemarks"
                placeholder="Other remarks"
                value={form.otherRemarks}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-rentora-border p-2 focus:outline-none focus:ring-rentora-accent"
                rows={3}
              />

              <div className="flex gap-3">
                <Button type="submit" variant="primary">
                  Save Inspection
                </Button>
                <Button variant="outline" onClick={() => setFormVisible(false)}>
                  Cancel
                </Button>
              </div>
            </Form>
          </Alert>
        )}

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