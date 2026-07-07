import { Button } from "./Button";

interface DialogFooterProps {
  onCancel: () => void;
  loading?: boolean;
  submitLabel: string;
  cancelLabel?: string;
  /** Quando o botão de submit vive fora de um <form> (usa o atributo form=id). */
  formId?: string;
}

/** Rodapé padrão dos modais de formulário: Cancelar + submit com loading. */
export function DialogFooter({
  onCancel,
  loading,
  submitLabel,
  cancelLabel = "Cancelar",
  formId,
}: DialogFooterProps) {
  return (
    <div className="border-line flex justify-end gap-2 border-t pt-4">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button type="submit" form={formId} loading={loading}>
        {submitLabel}
      </Button>
    </div>
  );
}
