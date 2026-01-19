import React, { createContext, useContext, useState, useCallback } from 'react';
import backendClient from '../services/backendClient';

const CommunityContext = createContext();

export const useCommunity = () => useContext(CommunityContext);

export const CommunityProvider = ({ children }) => {
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [flats, setFlats] = useState([]);
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all communities for president
  const fetchCommunities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await backendClient.get('/api/communities');
      if (response.success) {
        setCommunities(response.communities);
        // Auto-select first community if none selected
        if (!selectedCommunity && response.communities.length > 0) {
          setSelectedCommunity(response.communities[0]);
        }
        return response.communities;
      }
    } catch (err) {
      setError(err.message);
      console.error('[CommunityContext] Failed to fetch communities:', err);
    } finally {
      setIsLoading(false);
    }
    return [];
  }, [selectedCommunity]);

  // Select a community
  const selectCommunity = useCallback((community) => {
    setSelectedCommunity(community);
    // Clear cached data for the new community
    setFlats([]);
    setMembers([]);
    setPendingMembers([]);
  }, []);

  // Fetch flats for selected community
  const fetchFlats = useCallback(async (communityId) => {
    const id = communityId || selectedCommunity?.id;
    if (!id) return [];

    setIsLoading(true);
    try {
      const response = await backendClient.get(`/api/communities/${id}/flats`);
      if (response.success) {
        setFlats(response.flats);
        return response.flats;
      }
    } catch (err) {
      console.error('[CommunityContext] Failed to fetch flats:', err);
    } finally {
      setIsLoading(false);
    }
    return [];
  }, [selectedCommunity]);

  // Add a flat
  const addFlat = useCallback(async (number) => {
    if (!selectedCommunity?.id) return { success: false, message: 'No community selected' };

    try {
      const response = await backendClient.post(
        `/api/communities/${selectedCommunity.id}/flats`,
        { number }
      );
      if (response.success) {
        await fetchFlats();
        return { success: true, flat: response.flat };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [selectedCommunity, fetchFlats]);

  // Delete a flat
  const deleteFlat = useCallback(async (flatId) => {
    try {
      const response = await backendClient.delete(`/api/flats/${flatId}`);
      if (response.success) {
        setFlats(prev => prev.filter(f => f.id !== flatId));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  // Fetch members for selected community
  const fetchMembers = useCallback(async (communityId) => {
    const id = communityId || selectedCommunity?.id;
    if (!id) return [];

    setIsLoading(true);
    try {
      const response = await backendClient.get(`/api/communities/${id}/members`);
      if (response.success) {
        setMembers(response.members);
        return response.members;
      }
    } catch (err) {
      console.error('[CommunityContext] Failed to fetch members:', err);
    } finally {
      setIsLoading(false);
    }
    return [];
  }, [selectedCommunity]);

  // Fetch pending members
  const fetchPendingMembers = useCallback(async (communityId) => {
    const id = communityId || selectedCommunity?.id;
    if (!id) return [];

    try {
      const response = await backendClient.get(`/api/communities/${id}/pending-members`);
      if (response.success) {
        setPendingMembers(response.pendingMembers);
        return response.pendingMembers;
      }
    } catch (err) {
      console.error('[CommunityContext] Failed to fetch pending members:', err);
    }
    return [];
  }, [selectedCommunity]);

  // Approve a pending member
  const approveMember = useCallback(async (memberId) => {
    try {
      const response = await backendClient.post(`/api/members/${memberId}/approve`);
      if (response.success) {
        setPendingMembers(prev => prev.filter(m => m.id !== memberId));
        await fetchMembers();
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [fetchMembers]);

  // Reject a pending member
  const rejectMember = useCallback(async (memberId) => {
    try {
      const response = await backendClient.post(`/api/members/${memberId}/reject`);
      if (response.success) {
        setPendingMembers(prev => prev.filter(m => m.id !== memberId));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  // Remove a member
  const removeMember = useCallback(async (memberId) => {
    try {
      const response = await backendClient.delete(`/api/members/${memberId}`);
      if (response.success) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  // Fetch announcements for selected community
  const fetchAnnouncements = useCallback(async (communityId) => {
    const id = communityId || selectedCommunity?.id;
    if (!id) return [];

    setIsLoading(true);
    try {
      const response = await backendClient.get(`/api/communities/${id}/announcements`);
      if (response.success) {
        setAnnouncements(response.announcements);
        return response.announcements;
      }
    } catch (err) {
      console.error('[CommunityContext] Failed to fetch announcements:', err);
    } finally {
      setIsLoading(false);
    }
    return [];
  }, [selectedCommunity]);

  // Create announcement
  const createAnnouncement = useCallback(async (data) => {
    if (!selectedCommunity?.id) return { success: false, message: 'No community selected' };

    try {
      const response = await backendClient.post(
        `/api/communities/${selectedCommunity.id}/announcements`,
        data
      );
      if (response.success) {
        await fetchAnnouncements();
        return { success: true, announcement: response.announcement };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [selectedCommunity, fetchAnnouncements]);

  // Delete announcement
  const deleteAnnouncement = useCallback(async (announcementId) => {
    try {
      const response = await backendClient.delete(`/api/announcements/${announcementId}`);
      if (response.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  // Get single announcement with comments
  const getAnnouncement = useCallback(async (announcementId) => {
    try {
      const response = await backendClient.get(`/api/announcements/${announcementId}`);
      if (response.success) {
        return { success: true, announcement: response.announcement };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  // Add comment to announcement
  const addComment = useCallback(async (announcementId, content) => {
    try {
      const response = await backendClient.post(
        `/api/announcements/${announcementId}/comments`,
        { content }
      );
      if (response.success) {
        return { success: true, comment: response.comment };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  // Vote on announcement
  const voteOnAnnouncement = useCallback(async (announcementId, optionId) => {
    try {
      const response = await backendClient.post(
        `/api/announcements/${announcementId}/vote`,
        { optionId }
      );
      if (response.success) {
        // Update announcements with new vote results
        setAnnouncements(prev => prev.map(a =>
          a.id === announcementId
            ? { ...a, voteOptions: response.voteResults, hasVoted: true }
            : a
        ));
        return { success: true, voteResults: response.voteResults };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  // Clear all data (on logout)
  const clearCommunityData = useCallback(() => {
    setCommunities([]);
    setSelectedCommunity(null);
    setFlats([]);
    setMembers([]);
    setPendingMembers([]);
    setAnnouncements([]);
    setError(null);
  }, []);

  const value = {
    communities,
    selectedCommunity,
    flats,
    members,
    pendingMembers,
    announcements,
    isLoading,
    error,
    fetchCommunities,
    selectCommunity,
    fetchFlats,
    addFlat,
    deleteFlat,
    fetchMembers,
    fetchPendingMembers,
    approveMember,
    rejectMember,
    removeMember,
    fetchAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    getAnnouncement,
    addComment,
    voteOnAnnouncement,
    clearCommunityData,
  };

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
};

export default CommunityContext;
