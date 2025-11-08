import { Deployment } from '../types';
import StatusBadge from './StatusBadge';
import { Button } from './ui/button';

interface DeploymentCardProps {
  deployment: Deployment;
  onView: (id: string) => void;
  onRedeploy: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DeploymentCard({ deployment, onView, onRedeploy, onDelete }: DeploymentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg shadow-lg border-0 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-foreground mb-2">
            {deployment.repoName}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
            <StatusBadge status={deployment.status} />
            <span>Branch: {deployment.branch}</span>
            <span>Created: {formatDate(deployment.createdAt)}</span>
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            <a
              href={`https://${deployment.subdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {deployment.subdomain}
            </a>
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(deployment.id)}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRedeploy(deployment.id)}
          disabled={deployment.status === 'building'}
        >
          Redeploy
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(deployment.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}