import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { DepartmentConfig, ResourceConfig, LocationConfig } from '../types';

// Query keys
export const configKeys = {
  departments: ['config', 'departments'] as const,
  resources: ['config', 'resources'] as const,
  locations: ['config', 'locations'] as const,
};

// Get departments
export const useDepartments = () => {
  return useQuery({
    queryKey: configKeys.departments,
    queryFn: api.getDepartments,
    staleTime: 10 * 60 * 1000, // 10 minutes - config doesn't change often
    select: (data: DepartmentConfig[]) => data.filter(d => d.active),
  });
};

// Get resources
export const useResources = () => {
  return useQuery({
    queryKey: configKeys.resources,
    queryFn: api.getResources,
    staleTime: 10 * 60 * 1000,
    select: (data: ResourceConfig[]) => data.filter(r => r.active),
  });
};

// Get locations
export const useLocations = () => {
  return useQuery({
    queryKey: configKeys.locations,
    queryFn: api.getLocations,
    staleTime: 10 * 60 * 1000,
    select: (data: LocationConfig[]) => data.filter(l => l.active),
  });
};

// Combined config hook for convenience
export const useConfig = () => {
  const departments = useDepartments();
  const resources = useResources();
  const locations = useLocations();
  
  return {
    departments: departments.data || [],
    resources: resources.data || [],
    locations: locations.data || [],
    isLoading: departments.isLoading || resources.isLoading || locations.isLoading,
    isError: departments.isError || resources.isError || locations.isError,
    error: departments.error || resources.error || locations.error,
  };
};

// Admin mutations
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.departments });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.departments });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.departments });
    },
  });
};

// Similar mutations for resources and locations
export const useCreateResource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.resources });
    },
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.locations });
    },
  });
};
