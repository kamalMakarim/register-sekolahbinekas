import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

interface Student {
  id: string
  name: string
  batch: number
  class_name: string
  status: 'pending' | 'rejected' | 'authenticated'
  created_at: string
}

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

    useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/')
      } else {
        setLoading(false)
      }
    })
  }, [router])

  
  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    setErrorMsg(null)

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('students_pending')
      .select('id, name, batch, class_name, status, created_at')
      .eq('parent_auth_id', user.id)
      .in('status', ['pending', 'rejected', 'authenticated'])
      .order('created_at', { ascending: false })

    if (error) setErrorMsg(error.message)
    else setStudents(data || [])

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/add-student')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition duration-200 shadow"
            >
              + Add Student
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <p className="text-red-500 text-sm mb-4 text-center">{errorMsg}</p>
        )}

        {/* Table or loading state */}
        {loading ? (
          <p className="text-center text-gray-600">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-center text-gray-600">No pending students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Batch</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Class</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-t border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 text-gray-800">{student.name}</td>
                    <td className="py-3 px-4 text-gray-700">{student.batch}</td>
                    <td className="py-3 px-4 text-gray-700">{student.class_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          student.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : student.status === 'authenticated'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
