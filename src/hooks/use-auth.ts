'use client';

import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

export const useAuth = () => {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.viewer);
  const { signOut, signIn } = useAuthActions();
  
  const updateUserMutation = useMutation(api.users.update);
  const awardPointsMutation = useMutation(api.users.awardPoints);
  const checkInMutation = useMutation(api.users.checkIn);

  return {
    user,
    loading: isLoading || (isAuthenticated && user === undefined),
    isAuthenticated,
    logout: signOut,
    signIn,
    updateUser: (data: any) => updateUserMutation(data),
    awardPoints: (points: number) => awardPointsMutation({ points }),
    checkInUser: () => checkInMutation(),
    // Shim for register if needed, though usually handled by flow
    register: async (data: any) => {
        // Logic to update user profile after initial auth
        return updateUserMutation(data);
    },
    users: [], // Shim for components expecting users list from auth (admin only usually)
  };
};