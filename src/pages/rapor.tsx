import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Student {
    id: string;
    name: string;
    class_name: string;
    batch: number;
}

interface Rapor {
    id: string;
    semester: number;
    tahun_ajaran: string;
}

export default function RaporManagement() {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [rapor, setRapor] = useState<Rapor | null>(null);
    const [semester, setSemester] = useState('1');
    const [tahunAjaran, setTahunAjaran] = useState('2024-2025');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [classes, setClasses] = useState<string[]>([]);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [searchQuery, filterClass, students]);

    const fetchStudents = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('students')
                .select('*');

            if (fetchError) throw fetchError;

            setStudents(data || []);
            const uniqueClasses = [...new Set(data?.map(s => s.class_name))];
            setClasses(uniqueClasses as string[]);
        } catch (err) {
            setError('Failed to fetch students');
        }
    };

    const filterStudents = () => {
        let filtered = students;

        if (searchQuery) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterClass) {
            filtered = filtered.filter(s => s.class_name === filterClass);
        }

        setFilteredStudents(filtered);
    };

    const handleStudentSelect = async (student: Student) => {
        setSelectedStudent(student);
        setError('');

        try {
            const { data, error: fetchError } = await supabase
                .from('rapor')
                .select('*')
                .eq('student_id', student.id)
                .eq('semester', parseInt(semester))
                .eq('tahun_ajaran', tahunAjaran)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            if (data) {
                setRapor(data);
            } else {
                // Create new rapor record
                const { data: newRapor, error: insertError } = await supabase
                    .from('rapor')
                    .insert({
                        student_id: student.id,
                        semester: parseInt(semester),
                        tahun_ajaran: tahunAjaran,
                        status: 'draft',
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                setRapor(newRapor);
            }
        } catch (err) {
            setError('Failed to load rapor');
        }
    };

    const handleFileUpload = async () => {
        if (!file || !rapor || !selectedStudent) {
            setError('Please select a file and student');
            return;
        }

        setLoading(true);
        try {
            const fileName = `${rapor.id}-${Date.now()}`;
            const { error: uploadError } = await supabase.storage
                .from('rapor-files')
                .upload(`rapor/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { error: updateError } = await supabase
                .from('rapor_details')
                .upsert({
                    rapor_id: rapor.id,
                    pdf: fileName,
                });

            if (updateError) throw updateError;

            setFile(null);
            setError('');
            alert('Rapor uploaded successfully');
        } catch (err) {
            setError('Failed to upload rapor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Kelola Rapor Siswa</h1>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Student List */}
                    <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Cari Siswa</h2>

                        <input
                            type="text"
                            placeholder="Nama siswa..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <select
                            value={filterClass}
                            onChange={e => setFilterClass(e.target.value)}
                            className="w-full px-4 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Kelas</option>
                            {classes.map(cls => (
                                <option key={cls} value={cls}>
                                    {cls}
                                </option>
                            ))}
                        </select>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredStudents.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => handleStudentSelect(student)}
                                    className={`w-full text-left p-3 rounded transition-colors ${
                                        selectedStudent?.id === student.id
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    <div className="font-semibold">{student.name}</div>
                                    <div className="text-sm opacity-75">{student.class_name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                        {selectedStudent && rapor ? (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Upload Rapor</h2>

                                <div className="mb-6 p-4 bg-blue-50 rounded">
                                    <p className="font-semibold">{selectedStudent.name}</p>
                                    <p className="text-sm text-gray-600">{selectedStudent.class_name}</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Semester
                                        </label>
                                        <select
                                            value={semester}
                                            onChange={e => setSemester(e.target.value)}
                                            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="1">Semester 1</option>
                                            <option value="2">Semester 2</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Tahun Ajaran
                                        </label>
                                        <input
                                            type="text"
                                            value={tahunAjaran}
                                            onChange={e => setTahunAjaran(e.target.value)}
                                            placeholder="2024-2025"
                                            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Upload File Rapor (PDF)
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={e => setFile(e.files?.[0] || null)}
                                            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {file && (
                                            <p className="text-sm text-green-600 mt-2">
                                                File dipilih: {file.name}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleFileUpload}
                                        disabled={loading || !file}
                                        className="w-full bg-blue-500 text-white py-2 rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                                    >
                                        {loading ? 'Uploading...' : 'Upload Rapor'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <p>Pilih siswa untuk memulai upload rapor</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}