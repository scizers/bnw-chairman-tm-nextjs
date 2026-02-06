"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { App, Dropdown } from "antd";
import { Pencil } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import { tasksApi } from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "blocked", label: "Blocked" },
  { value: "critical", label: "Critical" }
];

interface TaskStatusBadgeProps {
  taskId?: string;
  status: string;
  onChange?: (nextStatus: string) => void;
  disabled?: boolean;
}

export default function TaskStatusBadge({
  taskId,
  status,
  onChange,
  disabled
}: TaskStatusBadgeProps) {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);
  const pendingStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (pendingStatusRef.current) return;
    setLocalStatus(status);
  }, [status]);

  const menuItems = useMemo(
    () =>
      STATUS_OPTIONS.map((option) => ({
        key: option.value,
        label: option.label,
        disabled: option.value === localStatus
      })),
    [localStatus]
  );

  const handleSelect = async (nextStatus: string) => {
    if (!taskId || nextStatus === localStatus || saving) return;
    const previousStatus = localStatus;
    pendingStatusRef.current = nextStatus;
    setLocalStatus(nextStatus);
    onChange?.(nextStatus);
    setSaving(true);
    try {
      await tasksApi.update(taskId, { status: nextStatus });
      message.success("Status updated.");
    } catch (err) {
      let confirmed = false;
      try {
        const refreshed = await tasksApi.getById(taskId);
        if (refreshed?.status === nextStatus) {
          confirmed = true;
        }
      } catch {
        confirmed = false;
      }
      if (confirmed) {
        message.success("Status updated.");
      } else {
        setLocalStatus(previousStatus);
        onChange?.(previousStatus);
        message.error("Unable to update status.");
      }
    } finally {
      pendingStatusRef.current = null;
      setSaving(false);
    }
  };

  const isEditable = Boolean(taskId) && !disabled;

  return (
    <div
      className="group inline-flex items-center gap-1"
      onClick={(event) => event.stopPropagation()}
    >
      <StatusBadge label={localStatus} />
      {isEditable ? (
        <Dropdown
          trigger={["click"]}
          placement="bottomLeft"
          menu={{
            items: menuItems,
            onClick: ({ key, domEvent }) => {
              domEvent?.stopPropagation();
              void handleSelect(String(key));
            }
          }}
        >
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full border border-border-subtle p-1 text-text-muted opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Edit task status"
          >
            <Pencil size={12} />
          </button>
        </Dropdown>
      ) : null}
    </div>
  );
}
