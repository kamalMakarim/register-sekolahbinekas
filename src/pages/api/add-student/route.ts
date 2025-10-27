// pages/api/add-student.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate session
  const { data: { user }, error: sessionError } = await supabase.auth.getUser(
    // @ts-ignore: NextAuth style?
    // actually for pages router you might use supabase.auth.getSession; adjust accordingly
    undefined
  )
  if (sessionError || !user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { name, batch, class_name } = req.body
  if (!name || typeof batch !== 'number' || !class_name) {
    return res.status(400).json({ error: 'Invalid input' })
  }

  const { data, error } = await supabase
    .from('students_pending')
    .insert([
      {
        parent_auth_id: user.id,
        name,
        batch,
        class_name,
        status: 'pending'
      }
    ])

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}
