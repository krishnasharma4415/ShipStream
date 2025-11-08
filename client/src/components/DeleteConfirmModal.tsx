import { Button } from './ui/button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  deploymentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({ 
  isOpen, 
  deploymentName, 
  onConfirm, 
  onCancel, 
  isLoading = false 
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-6 max-w-md w-full mx-4 shadow-lg border-0">
        <h3 className="text-lg font-medium text-foreground mb-4">
          Delete Deployment
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete <strong>{deploymentName}</strong>? 
          This action cannot be undone and will remove all associated files.
        </p>
        <div className="flex space-x-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}