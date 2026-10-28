"use client";

import { useEffect, useState } from "react";
import {
  getDepartments,
  type DepartmentItem,
  type DepartmentList,
} from "@/features/departments/api";

type DepartmentsState = Readonly<{
  departments: ReadonlyArray<DepartmentItem>;
  loading: boolean;
}>;

let pending: Promise<DepartmentList> | null = null;

function loadDepartments() {
  pending ??= getDepartments().catch((error: unknown) => {
    pending = null;
    throw error;
  });

  return pending;
}

export function useDepartments(): DepartmentsState {
  const [state, setState] = useState<DepartmentsState>({
    departments: [],
    loading: true,
  });

  useEffect(() => {
    let active = true;

    void loadDepartments()
      .then((list) => {
        if (active) {
          setState({ departments: list.items, loading: false });
        }
      })
      .catch(() => {
        if (active) {
          setState((value) => ({ ...value, loading: false }));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
