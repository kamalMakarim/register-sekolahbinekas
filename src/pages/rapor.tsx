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
    const [newRapor, setRapor] = useState<Rapor | null>(null);
    const [semester, setSemester] = useState('1');
    const [tahunAjaran, setTahunAjaran] = useState('2024-2025');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [classes, setClasses] = useState<string[]>([]);
    const [mapel, setMapels] = useState<any[]>([]);
    const [selectedMapel, setSelectedMapel] = useState<any>('');
    const [raporDetails, setRaporDetails] = useState<any[]>([]);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchMapel();
        }
    }
        , [selectedStudent]);

    useEffect(() => {
        if (classes.length > 0 && selectedStudent) {
            fetchMapel();
        }
    }, [classes]);

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

    const fetchMapel = async () => {
        try {
            //liat tingkat yg dipake apa aja dari tingkatclasses
            const { data: tingkatData, error: tingkatError } = await supabase
                .from('tingkat_classes')
                .select('tingkat')
                .eq('class_name', selectedStudent?.class_name);

            if (tingkatError) throw tingkatError;

            const tingkatList = tingkatData?.map(t => t.tingkat) || [];

            //liat mapel dalem tingkat itu
            const { data: mapelData, error: mapelError } = await supabase
                .from('mapel')
                .select('*')
                .in('tingkat', tingkatList);

            if (mapelError) throw mapelError;

            setMapels(mapelData || []);
        } catch (err) {
            setError('Failed to fetch mapel');
        }
    }

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

            const { data: detailsData, error: detailsError } = await supabase
                .from('rapor_details')
                .select('*, mapel(*)')
                .eq('rapor_id', data.id)
                .order('mapel(order_priority)', { ascending: true });

            setRaporDetails(detailsData || []);

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            if (data) {
                setRapor(data);
                console.log('Rapor found:', data);
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

    const handleUploadFile = async (file: File | null) => {
        //check file type and size
        if (file) {
            if (file.type !== 'application/pdf') {
                setError('File harus berupa PDF');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError('File terlalu besar, maksimal 10MB');
                return;
            }
            setFile(file);
        }
    }
    const uploadFileToZipline = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_ZIPLINE_URL}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `${process.env.NEXT_PUBLIC_ZIPLINE_API_KEY}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            const jsonResponse = await response.json();

            if (jsonResponse.files && jsonResponse.files.length > 0) {
                const uploadedUrl = jsonResponse.files[0].url;
                return uploadedUrl;
            }
        } catch (err) {
            setError(`Error uploading file: ${err}`);
            throw err;
        }
    };

    const handleDeleteRaporDetail = async (detailId: string) => {
        try {
            // Get the detail to find the file URL
            const detail = raporDetails.find(d => d.id === detailId);

            // Delete file from Zipline if it exists
            if (detail?.pdf) {
                try {
                    const fileName = detail.pdf.split('/').pop();
                    console.log('Deleting file from Zipline:', fileName);
                    const ziplineUrl = process.env.NEXT_PUBLIC_ZIPLINE_URL;

                    const response = await fetch(`${ziplineUrl}/api/user/files/${fileName}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `${process.env.NEXT_PUBLIC_ZIPLINE_API_KEY}`,
                        },
                    });

                    if (response.ok) {
                        console.log(`Deleted file ${fileName} successfully`);
                    } else {
                        console.error(`Failed to delete file ${fileName}: ${response.status}`);
                        // Continue with database deletion even if file deletion fails
                    }
                } catch (err) {
                    console.error('Error deleting file from Zipline:', err);
                    // Continue with database deletion even if file deletion fails
                }
            }

            const { error } = await supabase
                .from('rapor_details')
                .delete()
                .eq('id', detailId);

            if (error) throw error;

            // Refresh rapor details after deletion
            const { data: detailsData, error: detailsError } = await supabase
                .from('rapor_details')
                .select('*, mapel(*)')
                .eq('rapor_id', newRapor?.id)
                .order('mapel(order_priority)', { ascending: true });

            if (detailsError) throw detailsError;
            setRaporDetails(detailsData || []);
        } catch (err) {
            setError('Failed to delete rapor detail');
        }
    };

        const handleUploadRapor = async () => {
        if (!file || !newRapor || !selectedStudent || !selectedMapel) {
            setError('Please select a file, student, and mapel before uploading');
            return;
        }

        setLoading(true);
        try {
            const fileUrl = await uploadFileToZipline(file);

            const { data, error: updateError } = await supabase
                .from('rapor_details')
                .upsert({
                    rapor_id: newRapor.id,
                    mapel_id: selectedMapel,
                    pdf: fileUrl,
                })
                .select();

            if (updateError) throw updateError;

            if (data && data.length > 0) {
                setRaporDetails(prev => [...prev, data[0]]);
            }
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
                                    className={`w-full text-left p-3 rounded transition-colors ${selectedStudent?.id === student.id
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
                        {selectedStudent && newRapor ? (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Manage Rapor</h2>

                                <div className="mb-6 p-4 bg-blue-50 rounded">
                                    <p className="font-semibold">{selectedStudent.name}</p>
                                    <p className="text-sm text-gray-600">{selectedStudent.class_name}</p>
                                </div>

                                <div className="mb-6 p-4 bg-gray-50 rounded">
                                    <h3 className="text-lg font-semibold mb-3">Rapor yang sudah diupload</h3>
                                    {raporDetails.length ?? 0 > 0 ? (
                                        <div className="space-y-2">
                                            {raporDetails.map(detail => (
                                                <div key={detail.id} className="flex items-center justify-between p-3 bg-white border rounded">
                                                    <div>
                                                        <p className="font-medium">{detail.mapel?.name}</p>
                                                        {detail.pdf && (
                                                            <a
                                                                href={detail.pdf}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-500 hover:underline"
                                                            >
                                                                Lihat File →
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteRaporDetail(detail.id)}
                                                            className="ml-4 text-sm text-red-500 hover:underline"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">Belum ada rapor yang diupload</p>
                                    )}
                                </div>

                                <h2 className="text-xl font-semibold mb-4">Upload Rapor</h2>
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
                                        <select
                                            value={tahunAjaran}
                                            onChange={e => setTahunAjaran(e.target.value)}
                                            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {Array.from({ length: 7 }, (_, i) => {
                                                const year = new Date().getFullYear() - 3 + i;
                                                const nextYear = year + 1;
                                                return `${year}-${nextYear}`;
                                            }).map(year => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Mata Pelajaran / Bagian</label>
                                    </div>

                                    <select
                                        value={selectedMapel}
                                        onChange={e => setSelectedMapel(e.target.value)}
                                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Pilih Mata Pelajaran / Bagian</option>
                                        {mapel.map(mp => (
                                            <option key={mp.id} value={mp.id}>
                                                {mp.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Upload File Rapor (PDF)
                                        </label>
                                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50 cursor-pointer hover:border-blue-500 transition-colors">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={e => handleUploadFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="file-input"
                                            />
                                            <label htmlFor="file-input" className="cursor-pointer block">
                                                {file ? (
                                                    <div className="text-blue-600 font-semibold">
                                                        ✓ {file.name}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-gray-600 font-medium">Choose File</p>
                                                        <p className="text-sm text-gray-500">or drag and drop</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleUploadRapor}
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