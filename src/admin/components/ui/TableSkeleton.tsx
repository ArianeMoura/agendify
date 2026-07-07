import { Skeleton } from "./Skeleton";

/** Linhas de esqueleto para o carregamento de listas/tabelas. */
export function TableSkeleton({
  rows = 5,
  rowClassName = "h-12",
}: {
  rows?: number;
  rowClassName?: string;
}) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`${rowClassName} w-full`} />
      ))}
    </div>
  );
}
