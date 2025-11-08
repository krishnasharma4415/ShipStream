import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Deployment } from '../types';
import { deploymentService } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import DeploymentList from '../components/DeploymentList';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const navigate = useNavigate();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; deployment: Deployment | null }>({
    isOpen: false,
    deployment: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      const response = await deploymentService.getDeployments();
      setDeployments(response.data.deployments);
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (id: string) => {
    navigate(`/deployments/${id}`);
  };

  const handleRedeploy = async (id: string) => {
    try {
      await deploymentService.redeployDeployment(id);
      fetchDeployments();
    } catch (error) {
      console.error('Failed to redeploy:', error);
    }
  };

  const handleDelete = (id: string) => {
    const deployment = deployments.find(d => d.id === id);
    if (deployment) {
      setDeleteModal({ isOpen: true, deployment });
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.deployment) return;

    try {
      setIsDeleting(true);
      await deploymentService.deleteDeployment(deleteModal.deployment.id);
      setDeployments(prev => prev.filter(d => d.id !== deleteModal.deployment!.id));
      setDeleteModal({ isOpen: false, deployment: null });
    } catch (error) {
      console.error('Failed to delete deployment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, deployment: null });
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-foreground">Deployments</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your deployed applications
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Button onClick={() => navigate('/deploy')}>
              New Deployment
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <DeploymentList
            deployments={deployments}
            onView={handleView}
            onRedeploy={handleRedeploy}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        deploymentName={deleteModal.deployment?.repoName || ''}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isDeleting}
      />
    </AuthLayout>
  );
}