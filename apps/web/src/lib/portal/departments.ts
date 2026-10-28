export type DepartmentLike = Readonly<{
  name: string;
  code: string;
}>;

export function departmentCode(
  departments: ReadonlyArray<DepartmentLike>,
  name: string,
) {
  return departments.find((department) => department.name === name)?.code;
}

export function isKnownDepartment(
  departments: ReadonlyArray<DepartmentLike>,
  name: string,
) {
  return departments.some((department) => department.name === name);
}

export function departmentOptions(
  departments: ReadonlyArray<DepartmentLike>,
  current = "",
) {
  const options = departments.map((department) => ({
    value: department.name,
    label: `${department.name} (${department.code})`,
  }));

  return current && !isKnownDepartment(departments, current)
    ? [...options, { value: current, label: current }]
    : options;
}
