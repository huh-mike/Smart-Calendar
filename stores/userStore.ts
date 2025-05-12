import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

async function getSupabaseUserId(): Promise<string | null> {
    const supabase = createClient()
    try {
        const {data, error: authError} = await supabase.auth.getUser()

        if (authError) {
            console.error('Supabase error in fetching user: ', authError.message)
            return null
        }

        if (data?.user) {
            console.log('Supabase User ID from getSupabaseUserID: ', data.user.id)
            return data.user.id
        }else {
            console.log('No user found in getSupabaseUserID')
            return null
        }
    }catch(e: any) {
        console.error('Unexpected error with getSupabaseUserID: ',e.message)
        throw e
    }
}

interface UserState {
    userId: string | null
    isLoading: boolean
    error: string | null
    fetchUserId: () => Promise<void>
    clearUser: () => void
}

export const useUserStore = create<UserState>((set,get)=> ({
    userId: null,
    isLoading: false,
    error: null,

    fetchUserId: async () => {
        if (get().isLoading && get().userId) return
        set({isLoading: true, error: null})
        try {
            const id = await getSupabaseUserId()
            set({isLoading: false, userId: id})
            if (!id){
                console.log('No user found in Zustand Store')
            }
        } catch(e: any) {
            console.error('Unexpected error with Zustand Store: ',e.message)
            set({isLoading: false, error: e.message || 'Failed to fetch user ID (Zustand Store)', userId: null})
        }
    },

    clearUser: async () => {
        set({userId: null, isLoading: false, error: null})
        console.log('Clearing user in Zustand Store')
    },
}))

