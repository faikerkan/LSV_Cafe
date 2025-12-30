import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { CafeEvent } from '../types';

// Query key factory
export const eventKeys = {
  all: ['events'] as const,
  detail: (id: string) => ['events', id] as const,
  logs: (id: string) => ['events', id, 'logs'] as const,
};

// Get all events
export const useEvents = () => {
  return useQuery({
    queryKey: eventKeys.all,
    queryFn: api.getEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Create event mutation
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createEvent,
    onMutate: async (newEvent: CafeEvent) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: eventKeys.all });
      
      // Snapshot previous value
      const previousEvents = queryClient.getQueryData<CafeEvent[]>(eventKeys.all);
      
      // Optimistically update
      if (previousEvents) {
        queryClient.setQueryData<CafeEvent[]>(eventKeys.all, [...previousEvents, newEvent]);
      }
      
      return { previousEvents };
    },
    onError: (err, newEvent, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(eventKeys.all, context.previousEvents);
      }
    },
    onSuccess: () => {
      // Refetch to get server data
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
};

// Update event mutation
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.updateEvent,
    onMutate: async (updatedEvent: CafeEvent) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.all });
      
      const previousEvents = queryClient.getQueryData<CafeEvent[]>(eventKeys.all);
      
      if (previousEvents) {
        queryClient.setQueryData<CafeEvent[]>(
          eventKeys.all,
          previousEvents.map(event => 
            event.id === updatedEvent.id ? updatedEvent : event
          )
        );
      }
      
      return { previousEvents };
    },
    onError: (err, updatedEvent, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(eventKeys.all, context.previousEvents);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
};

// Delete event mutation
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteEvent,
    onMutate: async (eventId: string) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.all });
      
      const previousEvents = queryClient.getQueryData<CafeEvent[]>(eventKeys.all);
      
      if (previousEvents) {
        queryClient.setQueryData<CafeEvent[]>(
          eventKeys.all,
          previousEvents.filter(event => event.id !== eventId)
        );
      }
      
      return { previousEvents };
    },
    onError: (err, eventId, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(eventKeys.all, context.previousEvents);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
};

// Approve event (admin only)
export const useApproveEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.approveEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
};

// Reject event (admin only)
export const useRejectEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      api.rejectEvent(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
};
