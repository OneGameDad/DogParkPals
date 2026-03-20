
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import type { Organization, OrganizationMember, Event } from '../types';

interface OrganizationDetails extends Organization {
  members: OrganizationMember[];
  events: Event[];
  accessLevel: 'PUBLIC' | 'INVITEE' | 'MEMBER' | 'MODERATOR' | 'OWNER' | 'ADMIN';
}

interface UseOrganizationResult {
  organization: OrganizationDetails | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isMember: boolean;
  isInvitee: boolean;
  canEdit: boolean;
}

export const useOrganization = (organizationId: string | undefined): UseOrganizationResult => {
  const { t } = useTranslation();
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.get<OrganizationDetails>(`/api/organizations/${organizationId}/details`);
      setOrganization(data);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || t('organizations.fetchError', 'Failed to fetch organization details');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, t]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const accessLevel = organization?.accessLevel || 'PUBLIC';

  const isOwner = accessLevel === 'OWNER';
  // Moderators effectively have same editing rights as owners for most things except deleting the org
  const isModerator = accessLevel === 'MODERATOR';
  const isAdmin = accessLevel === 'ADMIN';
  const isMember = ['MEMBER', 'MODERATOR', 'OWNER'].includes(accessLevel);
  const isInvitee = accessLevel === 'INVITEE';

  // Edit permission: Owner, Moderator, or Admin
  const canEdit = isOwner || isModerator || isAdmin;

  return {
    organization,
    loading,
    error,
    refresh: fetchOrganization,
    isOwner,
    isAdmin,
    isModerator,
    isMember,
    isInvitee,
    canEdit,
  };
};
