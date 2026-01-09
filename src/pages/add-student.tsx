import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

type ClassRow = {
  class_name: string
  tingkat: 'TK' | 'SD'
  tahun: number
}

export default function Dashboard() {
  const [studentName, setStudentName] = useState('')
  const [batch, setBatch] = useState<number>(new Date().getFullYear())
  const [level, setLevel] = useState<'TK' | 'SD'>('TK')
  const [className, setClassName] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 👉 store ALL classes once
  const [allClasses, setAllClasses] = useState<ClassRow[]>([])

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

  // ✅ fetch ALL classes only once
  useEffect(() => {
    const fetchAllClasses = async () => {
      const { data, error } = await supabase
        .from('tingkat_classes')
        .select('class_name, tingkat, tahun')

      if (!error && data) {
        setAllClasses(data)
      }
    }

    fetchAllClasses()
  }, [])

  // 👉 derived classes based on selected level (keep tahun for display)
  const classesDetails = allClasses.filter(c => c.tingkat === level).sort((a, b) => a.tahun - b.tahun)

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      setErrorMsg('Not logged in.')
      return
    }

    const formattedName =
      studentName
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase())
        .trim()

    setStudentName(formattedName)

    const { error } = await supabase
      .from('students_pending')
      .insert([
        {
          parent_auth_id: userData.user.id,
          name: formattedName,
          batch,
          class_name: className,
          status: 'pending'
        }
      ])

    if (error) {
      setErrorMsg(error.message)
      return
    }

    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-lg text-gray-600 animate-pulse">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <img src="./LogoBinekas.png" alt="Binekas Logo" className="h-32 mx-auto mb-6" />
        {errorMsg && (
          <p className="text-red-500 text-sm mb-4 text-center">{errorMsg}</p>
        )}

        <form onSubmit={handleAddStudent} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Nama Lengkap Anak
            </label>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Masukkan Nama Lengkap Anak"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Jenjang
            </label>
            <select
              value={level}
              onChange={e => {
                setLevel(e.target.value as 'TK' | 'SD')
                setClassName('') // reset class on level change
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TK">TK/PG</option>
              <option value="SD">SD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Kelas
            </label>
            <select
              value={className}
              onChange={e => {
                const cur = e.currentTarget
                if (!cur.value) {
                  setClassName('')
                  setBatch(new Date().getFullYear())
                  return
                }
                const tahunAttr = cur.options[cur.selectedIndex].getAttribute('data-tahun')
                const tahun = tahunAttr ? Number(tahunAttr) : new Date().getFullYear()
                setClassName(cur.value)
                setBatch(new Date().getFullYear() - tahun)
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Class</option>
              {classesDetails.map(c => (
                <option key={`${c.class_name}-${c.tahun}`} value={c.class_name} data-tahun={c.tahun}>
                  {`(${c.tahun}) ${c.class_name}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Tahun Masuk Anak
            </label>
            <input
              type="number"
              value={batch}
              onChange={e => setBatch(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Contoh: 2024"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow"
          >
            Add Student
          </button>
        </form>
      </div>
    </div>
  )
}
