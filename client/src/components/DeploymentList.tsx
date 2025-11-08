import { useState } from 'react';
import { Deployment } from '../types';
import DeploymentCard from './DeploymentCard';

interface DeploymentListProps {
  deployments: Deployment[];
  onView: (id: string) => void;
  onRedeploy: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DeploymentList({ deployments, onView, onRedeploy, onDelete }: DeploymentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredDeployments = deployments.filter(deployment => {
    const matchesSearch = deployment.repoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deployment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search deployments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="deployed">Deployed</option>
            <option value="building">Building</option>
            <option value="uploaded">Uploaded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {filteredDeployments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {deployments.length === 0 ? 'No deployments yet' : 'No deployments match your search'}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDeployments.map((deployment) => (
            <DeploymentCard
              key={deployment.id}
              deployment={deployment}
              onView={onView}
              onRedeploy={onRedeploy}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}