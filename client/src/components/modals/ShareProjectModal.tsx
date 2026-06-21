'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/store/ui.store';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { Project, ProjectMember } from '@/types/project.types';
import toast from 'react-hot-toast';
import { Loader2, Mail, Trash2, UserPlus } from 'lucide-react';
import { UserAvatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth.store';

export const ShareProjectModal = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { shareModalOpen, closeShareModal, activeProjectId } = useUIStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', activeProjectId],
    queryFn: async () => {
      const res = await apiGet<Project>(`/projects/${activeProjectId}`);
      return res.data.data;
    },
    enabled: !!activeProjectId && shareModalOpen,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiPost(`/projects/${activeProjectId}/members/invite`, { email, role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', activeProjectId] });
      toast.success('User invited to project');
      setEmail('');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to invite user'),
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiDelete(`/projects/${activeProjectId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', activeProjectId] });
      toast.success('User removed from project');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to remove user'),
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    inviteMutation.mutate();
  };

  const isAdminOrOwner = project?.members.find(m => m.user._id === currentUser?._id)?.role === 'admin' || project?.members.find(m => m.user._id === currentUser?._id)?.role === 'owner';

  return (
    <Dialog open={shareModalOpen} onOpenChange={(open) => !open && closeShareModal()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-0 space-y-6">
          {/* Invite Form */}
          {isAdminOrOwner && (
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    label="Invite by email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="h-4 w-4" />}
                    required
                  />
                </div>
                <div className="w-32 mt-[22px]">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
                  >
                    <option value="member" className="bg-popover">Member</option>
                    <option value="admin" className="bg-popover">Admin</option>
                    <option value="viewer" className="bg-popover">Viewer</option>
                  </select>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                isLoading={inviteMutation.isPending}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Send Invite
              </Button>
            </form>
          )}

          {/* Members List */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Project Members</h3>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {project?.members.map((member: ProjectMember) => (
                  <div key={member.user._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={member.user} size="sm" />
                      <div>
                        <p className="text-sm font-medium leading-none">{member.user.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {member.role}
                      </span>
                      {isAdminOrOwner && member.user._id !== currentUser?._id && (
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          className="text-red-500 hover:bg-red-500/10"
                          onClick={() => {
                            if (confirm(`Remove ${member.user.name} from project?`)) {
                              removeMutation.mutate(member.user._id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
