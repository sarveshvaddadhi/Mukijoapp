import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useDiscoveryFlow = create(
  persist(
    (set) => ({
      // Step 1
      user: null,
      
      // Step 2
      team: {
        name: '',
        type: null, // 'club' | 'school' | 'corporate' | 'recreational'
        age_group: null,
        visibility: 'private'
      },
      
      // Step 3
      sport: null,
      
      // Step 4
      location: null,
      
      // Step 5
      venue: null,
      
      // Step 6
      members: [],

      // Actions
      setUser: (user) => set({ user }),
      setTeam: (teamData) => set((state) => ({ team: { ...state.team, ...teamData } })),
      setSport: (sport) => set({ sport }),
      setLocation: (location) => set({ location }),
      setVenue: (venue) => set({ venue }),
      addMember: (member) => set((state) => ({ 
        members: [...state.members, member] 
      })),
      removeMember: (email_or_phone) => set((state) => ({
        members: state.members.filter(m => m.email_or_phone !== email_or_phone)
      })),
      reset: () => set({
        user: null,
        team: { name: '', type: null, age_group: null, visibility: 'private' },
        sport: null,
        location: null,
        venue: null,
        members: []
      })
    }),
    {
      name: 'mukijo-discovery-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
