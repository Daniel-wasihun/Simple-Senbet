
// src/app/(admin)/academics/school-classes/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  ShieldCheck,
  Share,
} from "lucide-react";
import { toast } from "sonner";
import CreateSchoolClassForm from "@/components/admin/CreateSchoolClassForm";
import { useRouter } from "next/navigation";
import DateFormat from "@/components/common/DateFormat";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSchoolStore } from "@/store/useSchoolStore";
import type { schoolClassApi } from "@/services/schoolManagement.service";

export default function AdminSchoolClassPage() {
  const { t, td, isLoading: isI18nLoading } = useTranslation();
  const router = useRouter();

  const [schoolClasses, setSchoolClasses] = useState<schoolClassApi[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSchoolClassModalOpen, setIsSchoolClassModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSchoolClass, setSelectedSchoolClass] =
    useState<schoolClassApi | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const {
    fetchList,
    createRecord,
    updateRecord,
    deleteRecord,
    loading: storeLoading,
  } = useSchoolStore();
 //console.log("loadingvalue",loading);
  const fetchSchoolClasses = useCallback(async () => {
    setIsFetching(true);

    try {
      const result = await fetchList("school-classes");

      // Normalize the response in case the store returns an API envelope.
      let records: unknown = result;

      if (records && typeof records === "object" && !Array.isArray(records)) {
        const response = records as Record<string, unknown>;

        if (Array.isArray(response.data)) {
          records = response.data;
        } else if (
          response.data &&
          typeof response.data === "object" &&
          Array.isArray((response.data as Record<string, unknown>).data)
        ) {
          records = (response.data as Record<string, unknown>).data;
        }
      }

      if (!Array.isArray(records)) {
        console.error("Unexpected school-classes response:", result);
        setSchoolClasses([]);
        toast.error(t("service.loadError"));
        return;
      }

      setSchoolClasses(records as schoolClassApi[]);
    } catch (error) {
      console.error("Failed to load school classes:", error);
      toast.error(t("service.loadError"));
    } finally {
      setIsFetching(false);
    }
  }, [fetchList, t]);
  console.log("dat for the school ",schoolClasses);
  useEffect(() => {
    void fetchSchoolClasses();
  }, [fetchSchoolClasses]);

  const handleCreateSchoolClass = () => {
    setIsEditMode(false);
    setSelectedSchoolClass(null);
    setIsSchoolClassModalOpen(true);
  };

  const handleEditSchoolClass = (schoolClass: schoolClassApi) => {
    setIsEditMode(true);
    setSelectedSchoolClass(schoolClass);
    setIsSchoolClassModalOpen(true);
  };

  const handleViewDetail = (schoolClass: schoolClassApi) => {
    router.push(`/admin/academics/school-classes/${schoolClass.id}`);
  };

  const handleDelete = async () => {
    if (!selectedSchoolClass) return;

    setIsDeleting(true);

    try {
      await deleteRecord("school-classes", selectedSchoolClass.id);
      await fetchSchoolClasses();

      toast.success(t("schoolClass.deleteSuccess"));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete school class:", error);
      toast.error(t("schoolClass.deleteError"));
    } finally {
      setIsDeleting(false);
      setSelectedSchoolClass(null);
    }
  };

  const handleStatus = async () => {
    if (!selectedSchoolClass) return;

    setIsVerifying(true);

    try {
      await updateRecord("school-classes", selectedSchoolClass.id, {
        ...selectedSchoolClass,
        is_active: !selectedSchoolClass.is_active,
      });

      await fetchSchoolClasses();
      toast.success(t("wcu.updateSuccess"));
    } catch (error) {
      console.error("Failed to update school class status:", error);
      toast.error(t("wcu.updateError"));
    } finally {
      setIsPublishModalOpen(false);
      setSelectedSchoolClass(null);
      setIsVerifying(false);
    }
  };

  const handleCreateOrUpdateSchoolClass = async (
    data: schoolClassApi
  ) => {
    try {
      if (isEditMode && selectedSchoolClass?.id) {
        await updateRecord("school-classes", selectedSchoolClass.id, data);
        toast.success(t("schoolClass.updateSuccess"));
      } else {
        await createRecord("school-classes", data);
        toast.success(t("schoolClass.createSuccess"));
      }

      setIsSchoolClassModalOpen(false);
      setSelectedSchoolClass(null);
      setIsEditMode(false);

      await fetchSchoolClasses();
    } catch (error) {
      console.error("Failed to save school class:", error);

      toast.error(
        isEditMode
          ? t("service.updateError")
          : t("service.createrror")
      );
    }
  };

  const columns: Column<schoolClassApi>[] = [
    {
      header: t("service.code"),
      accessor: (schoolClass :schoolClassApi) => schoolClass.code ?? "",
      exportValue: (schoolClass:schoolClassApi) => schoolClass.code ?? "",
    },
    {
      header: t("service.name"),
      accessor: (schoolClass:schoolClassApi) => (
        <span className="text-gray-900">
          {td(schoolClass.name)}
        </span>
      ),
      exportValue: (schoolClass:schoolClassApi) => td(schoolClass.name),
    },
    {
      header: t("service.created_at"),
      accessor: (schoolClass:schoolClassApi) => (
        <span className="text-gray-600">
          {DateFormat(schoolClass.created_at)}
        </span>
      ),
      exportValue: (schoolClass: schoolClassApi) =>
        schoolClass.created_at ? String(schoolClass.created_at) : "",
    },
    {
      header: t("common.status") || "Status",
      accessor: (schoolClass:schoolClassApi) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium",
            schoolClass.is_active ? "text-green-700" : "text-red-600"
          )}
        >
          {schoolClass.is_active && <ShieldCheck size={16} />}
          {schoolClass.is_active
            ? t("common.verfiy")
            : t("common.unverfiy")}
        </span>
      ),
      exportValue: (schoolClass:schoolClassApi) =>
        schoolClass.is_active ? "Active" : "Inactive",
    },
    {
      header: t("common.actions"),
      className: "text-right",
      cellClassName: "text-right",
      accessor: (schoolClass:schoolClassApi) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Change school class status"
            title="Change status"
            className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
            onClick={() => {
              setSelectedSchoolClass(schoolClass);
              setIsPublishModalOpen(true);
            }}
          >
            <Share size={16} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="View school class"
            title="View"
            className="h-8 w-8 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => handleViewDetail(schoolClass)}
          >
            <Eye size={16} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Edit school class"
            title="Edit"
            className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => handleEditSchoolClass(schoolClass)}
          >
            <Edit size={16} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Delete school class"
            title="Delete"
            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              setSelectedSchoolClass(schoolClass);
              setIsDeleteModalOpen(true);
            }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (isI18nLoading) return null;

  return (
    <div className="space-y-4 bg-white py-2">
      <Card className="w-full rounded-md border border-gray-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-white py-4">
          <CardTitle className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
            {t("service.servicetilte")}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void fetchSchoolClasses()}
              disabled={isFetching || Boolean(storeLoading["school-classes"])}
              aria-label="Refresh school classes"
              title="Refresh"
              className="h-10 w-10 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw
                size={18}
                className={cn(
                  (isFetching || Boolean(storeLoading["school-classes"])) && "animate-spin"
                )}
              />
            </Button>

            <Button
              type="button"
              className="h-10 gap-2 border border-gray-300 bg-white px-4 text-gray-900 shadow-none hover:bg-gray-100 sm:px-6"
              onClick={handleCreateSchoolClass}
            >
              <Plus size={18} />
              <span>{t("schoolClass.add")}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="border-none bg-white">
          <DataTable
            columns={columns}
            data={schoolClasses}
           // isLoading={isFetching || storeLoading}
            fileName="school-classes-report"
            searchPlaceholder={t("service.search")}
            itemsPerPage={10}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        isLoading={isDeleting}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSchoolClass(null);
        }}
        onConfirm={handleDelete}
        title={t("service.deleteTitle")}
        description={
          selectedSchoolClass
            ? `${t("service.deleteDesc")} (${selectedSchoolClass.code}: ${td(
                selectedSchoolClass.name
              )})`
            : t("service.deleteDesc")
        }
      />

      <ConfirmDialog
        isOpen={isPublishModalOpen}
        isLoading={isVerifying}
        onClose={() => {
          setIsPublishModalOpen(false);
          setSelectedSchoolClass(null);
        }}
        onConfirm={handleStatus}
        title={
          selectedSchoolClass?.is_active
            ? t("common.unpublishTitle")
            : t("common.publishTitle")
        }
        description={
          selectedSchoolClass?.is_active
            ? `${t("common.unpublishDesc")} "${td(
                selectedSchoolClass.name
              )}"?`
            : t("common.publishDesc")
        }
      />

      <CreateSchoolClassForm
        isOpen={isSchoolClassModalOpen}
        onClose={() => {
          setIsSchoolClassModalOpen(false);
          setSelectedSchoolClass(null);
          setIsEditMode(false);
        }}
        onConfirm={handleCreateOrUpdateSchoolClass}
        selectedClass={selectedSchoolClass}
        isSaving={Boolean(storeLoading["school-classes"])}
      />
    </div>
  );
}
