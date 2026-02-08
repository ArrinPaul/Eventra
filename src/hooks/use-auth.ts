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
    updateUser: async (data: any) => {
        try {
            return await updateUserMutation(data);
        } catch (e) {
            console.error("Update user failed", e);
            throw e;
        }
    },
    awardPoints: async (points: number) => {
        try {
            return await awardPointsMutation({ points });
        } catch (e) {
            console.error("Award points failed", e);
        }
    },
    checkInUser: async () => {
        try {
            return await checkInMutation();
        } catch (e) {
            console.error("Check-in failed", e);
        }
    },
    register: async (data: any) => {
        return updateUserMutation(data);
    },
    users: [],
  };
};
