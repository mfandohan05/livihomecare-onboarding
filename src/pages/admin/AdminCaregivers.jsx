import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Upload, ChevronDown } from 'lucide-react'
import { formatPhone } from '@/lib/formUtils'

const Field = ({ label, id, children, required }) => (
    <div className="space-y-1.5">
        <Label htmlFor={id}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {children}
    </div>
)

function NewCaregiverDialog({ open, onClose, onCreated }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [offerLetterFile, setOfferLetterFile] = useState(null)
    const [jobDutiesDraft, setJobDutiesDraft] = useState('')
    const [adminEmail, setAdminEmail] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminId, setAdminId] = useState('');
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'caregiver',
        position_title: '',
        employment_type: '',
        start_date: '',
        pay_rate: '',
        companion_pay_rate: '',
        job_description: '',
        gender: '',
        employee_id: '',
    })
    useEffect(() => {
        fetchAdminData();
    }, [])

    const fetchAdminData = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            const { data: adminData } = await supabase
                .from('admin_users')
                .select('name, email, id')
                .eq('id', session.user.id)
                .single();
            setAdminEmail(adminData.email);
            setAdminName(adminData.name);
            setAdminId(adminData.id);
        }  

    }


    const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
    const setSelect = (key) => (value) => setForm(prev => ({ ...prev, [key]: value }));

    const canSave = form.name && form.email && form.role && form.gender && form.phone &&
        form.position_title && form.employment_type && form.pay_rate && (form.role !== 'other' || offerLetterFile) && form.job_description

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)
        const { data, error } = await supabase
            .from('caregivers')
            .insert({
                name: form.name,
                email: form.email.toLowerCase(),
                phone: form.phone,
                role: form.role,
                position_title: form.position_title,
                employment_type: form.employment_type,
                start_date: form.start_date || null,
                pay_rate: parseFloat(form.pay_rate),
                companion_pay_rate: form.companion_pay_rate ? parseFloat(form.companion_pay_rate) : null,
                status: 'pending',
                gender: form.gender,
                employee_id: form.employee_id || null,
                job_description: form.job_description,
                job_duties: form.role === 'other' ? jobDutiesDraft : null,
                link_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single()

        if (error) {
            setError('Failed to create caregiver. Please try again.')
            setLoading(false)
            return
        }
        await supabase.from('audit_logs').insert({
            admin_email: adminEmail,
            admin_id: adminId,
            action: 'created_employee',
            caregiver_name: form.name, 
        })
        if (form.role === 'other' && offerLetterFile) {
            const fileExt = offerLetterFile.name.split('.').pop()
            const sanitizedName = form.name.replace(/[^a-zA-Z0-9]/g, '_')
            const filePath = `${data.id}/${sanitizedName}_offer_letter_other.${fileExt}`

            await supabase.storage
                .from('documents')
                .upload(filePath, offerLetterFile, { upsert: true })

            await supabase
                .from('caregiver_documents')
                .upsert({
                    caregiver_id: data.id,
                    document_type: 'offer_letter_other',
                    file_name: offerLetterFile.name,
                    file_path: filePath,
                    file_size: offerLetterFile.size,
                    mime_type: offerLetterFile.type,
                }, { onConflict: 'caregiver_id, document_type' })
        }


        setForm({
            name: '', email: '', phone: '', role: 'caregiver',
            position_title: '', employment_type: '', start_date: '',
            pay_rate: '', companion_pay_rate: '', job_description: ''
        })
        setJobDutiesDraft('')
        setLoading(false)
        onCreated(data)

        if (data) {
            const inviteResult = await supabase.functions.invoke('send-invite-email', {
                body: { caregiverId: data.id }
            })
            onCreated(data)

            if (inviteResult.error) {
                const errorText = await inviteResult.error.context.text();
                console.log('send-invite-email error: ', errorText);
            }
        }

    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide">
                <DialogHeader>
                    <DialogTitle>New Employee</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    <div>
                        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Personal Information</h3>
                        <div className="space-y-4">
                            <Field label="Full name" id="name" required>
                                <Input id="name" value={form.name} onChange={set('name')} placeholder="Maria Santos" />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Email" id="email" required>
                                    <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="maria@email.com" />
                                </Field>
                                <Field label="Phone" id="phone" required>
                                    <Input id="phone" value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }))} placeholder="(704) 555-0123" />
                                </Field>
                                <Field label="Gender" id="gender" required>
                                    <Select id="gender" className="w-full" value={form.gender} onValueChange={setSelect('gender')} placeholder="Female/Male/Other/etc.">
                                        <SelectTrigger id="gender" className="w-full">
                                            <SelectValue placeholder="Select gender..."></SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Non-binary">Non-binary</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Employee ID (Optional)" id="employee_id">
                                    <Input id="employee_id" value={form.employee_id} onChange={set('employee_id')} placeholder="EMP001" />
                                </Field>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Position Details</h3>
                        <div className="space-y-4">
                            <Field label="Role" id="role" required>
                                <Select id="role" className="w-full" value={form.role} onValueChange={setSelect('role')}>
                                    <SelectTrigger id='role' className="w-full">
                                        <SelectValue placeholder="Select role..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                            <SelectItem value="caregiver">Caregiver</SelectItem>
                                            <SelectItem value="nurse_prn">Nurse (PRN)</SelectItem>
                                            <SelectItem value="nurse_director">Nurse (Director)</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Position title" id="position_title" required>
                                <Input id="position_title" value={form.position_title} onChange={set('position_title')} placeholder="PCA-Caregiver" />
                            </Field>
                            <Field label="Job description" id="job_description" required>
                                <Input
                                    id="job_description"
                                    value={form.job_description}
                                    onChange={set('job_description')}
                                    placeholder="In-Home Aide"
                                />
                            </Field>
                            <Field label="Employment type" id="employment_type" required>
                                <Select id="employment_type" value={form.employment_type} onValueChange={setSelect('employment_type')} placeholder="Select type...">
                                    <SelectTrigger id='employment_type' className="w-full">
                                        <SelectValue placeholder="Select type..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Hourly, Part-Time">Hourly, Part-Time</SelectItem>
                                        <SelectItem value="Hourly, Full-Time">Hourly, Full-Time</SelectItem>
                                        <SelectItem value="Independent Contractor">Independent Contractor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Start date" id="start_date">
                                <Input id="start_date" type="date" value={form.start_date} onChange={set('start_date')} />
                            </Field>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Compensation</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Pay rate ($/hr)" id="pay_rate" required>
                                <Input id="pay_rate" type="number" value={form.pay_rate} onChange={set('pay_rate')} placeholder="16.00" onWheel={(e) => e.target.blur()} />
                            </Field>
                            <Field label="Companion pay rate ($/hr)" id="companion_pay_rate">
                                <Input id="companion_pay_rate" type="number" value={form.companion_pay_rate} onChange={set('companion_pay_rate')} placeholder="14.00" onWheel={(e) => e.target.blur()} />
                            </Field>
                        </div>
                    </div>

                    {form.role === 'other' && (
                        <div>
                            <h3 className="text-sm font-medium mb-4 pb-2 border-b">Offer Letter</h3>
                            <Field label="Upload offer letter (PDF)" id="offer_letter" required>
                                <label className="flex items-center gap-3 border border-dashed border-border mb-4 rounded-lg px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={(e) => setOfferLetterFile(e.target.files[0] || null)}
                                    />
                                    <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                                    {offerLetterFile ? (
                                        <span className="text-sm text-[#577C09] font-medium truncate">{offerLetterFile.name}</span>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Choose PDF file...</span>
                                    )}
                                </label>
                            </Field>
                            <Field label="List the job responsibilities for this position." id="job_duties" required>
                            <textarea
                                value={jobDutiesDraft}
                                onChange={(e) => setJobDutiesDraft(e.target.value)}
                                rows={6}
                                className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#577C09]"
                                placeholder="Enter each duty on a new line, like so:
Assist with personal care
Medication reminders
Light housekeeping"
                            />
                            </Field>
                            <p className="text-xs text-muted-foreground">Each line will appear as a bullet point for the employee.</p>
                        </div>

                    )}

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={!canSave || loading}
                            className="bg-[#577C09] hover:bg-[#3D5906] text-white disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Employee'}
                        </Button>
                        <Button variant="outline" onClick={() => {
                            setOfferLetterFile(null)
                            setForm({
                                name: 'email', email: '', phone: '', role: 'caregiver',
                                position_title: '', employment_type: '', start_date: '',
                                pay_rate: '', companion_pay_rate: '', job_description: '', job_duties: ''
                            })
                            onClose();
                        }}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function AdminCaregivers() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [showNewDialog, setShowNewDialog] = useState(searchParams.get('new') === 'true')
    const [caregivers, setCaregivers] = useState([])
    const [filtered, setFiltered] = useState([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [roleFilter, setRoleFilter] = useState('all')
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0)
    const PER_PAGE = 20;
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const SKILL_SECTIONS = [
        { id: 'conditions', title: 'Conditions', items: ['Vision Impaired', 'ALS (Lou Gehrig\'s Disease)', 'Paraplegic', 'Dementia', 'Assisting the Blind', 'Multiple Sclerosis', 'Cerebral Palsy', 'Hearing Impaired', 'Mental Illness', 'Parkinson\'s', 'Traumatic Brain Injury (TBI)', 'Death & Dying', 'Alzheimer\'s', 'Quadriplegic', 'Cancer', 'Diabetes', 'Strokes'] },
        { id: 'personalCare', title: 'Personal Care', items: ['Bed Pan', 'Commode', 'Adult Diapers', 'Colostomy Bag', 'Toileting', 'Peri Care — Women', 'Peri Care — Men'] },
        { id: 'bathingCare', title: 'Bathing Care', items: ['Showering', 'Bed Bath', 'Shower Seat', 'Shaving Face', 'Shaving Legs', 'Nail Care', 'Hair Cuts', 'Skin Care'] },
        { id: 'oralCare', title: 'Oral Care', items: ['Denture Care', 'Tooth Brushing'] },
        { id: 'vitals', title: 'Vitals', items: ['Blood Pressure', 'Pulse', 'Temperature'] },
        { id: 'catheters', title: 'Catheters', items: ['Foley Catheter'] },
        { id: 'otherCare', title: 'Other Care', items: ['Make Occupied Bed', 'Medication Assistance', 'Suppository', 'Med Box', 'Oxygen', 'Massage', 'ADLs'] },
        { id: 'mobility', title: 'Mobility', items: ['Car Transfer', 'Wheelchair', 'Chair', 'Partial Weight-Bearing', 'Full Weight-Bearing', 'Pivot Disc', 'Repositioning', 'Ambulation', 'Slide Board', 'Range of Motion', 'Constraints', 'Exercise', 'Walking with Cane', 'Walking with Walker', 'Placing a Wheelchair in a Car', 'Gait Belt'] },
        { id: 'homemaker', title: 'Homemaker', items: ['Laundry', 'Bed Linen', 'Clean Kitchen', 'Bathroom', 'Vacuum', 'Dust', 'Pet Care', 'Trash', 'Appointments', 'Errands', 'Plant Care', 'Companionship', 'Sports / Park Activities', 'Heavy Cleaning', 'Outings', 'Meal Preparation', 'Vegetarian Diet', 'Balanced Diet', 'Salt-Free Diet', 'Ketogenic Diet'] },
    ];
    const [skillFilters, setSkillFilters] = useState([]);
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);
    const [pendingSkills, setPendingSkills] = useState([]);
    const skillDropdownRef = useRef(null);
    

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        fetchCaregivers()
    }, [page, debouncedSearch, statusFilter, roleFilter, skillFilters])
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (skillDropdownRef.current && !skillDropdownRef.current.contains(e.target)) {
                setShowSkillDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    })

    const fetchCaregivers = async () => {
        setLoading(true)
        const from = (page - 1) * PER_PAGE
        const to = from + PER_PAGE - 1

        let query = supabase
            .from('caregivers')
            .select(`*, caregiver_progress(active_step, completed_steps), caregiver_time_logs(active_seconds, completed)`, { count: 'exact' })
            .order('created_at', { ascending: false })

        if (debouncedSearch) query = query.or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`)
        if (statusFilter === 'all') {
            query = query.neq('status', 'cancelled')
        } else {
            query = query.eq('status', statusFilter)
        }
        if (roleFilter !== 'all') query = query.eq('role', roleFilter)

        if (skillFilters.length > 0) {
            const { data: progressData } = await supabase
                .from('caregiver_progress')
                .select('caregiver_id, form_data')

            const matchingIds = progressData
                ?.filter(p => skillFilters.every(skill => p.form_data?.compentency?.checked?.[skill]))
                .map(p => p.caregiver_id) || []

            if (matchingIds.length === 0) {
                setCaregivers([])
                setFiltered([])
                setTotalCount(0)
                setLoading(false)
                return
            }

            query = query.in('id', matchingIds)
        }

        const { data, count } = await query.range(from, to)

        if (data) {
            setCaregivers(data)
            setFiltered(data)
        }
        setTotalCount(count || 0)
        setLoading(false)
    }

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, statusFilter, roleFilter, skillFilters])

    const statusColor = (status) => {
        if (status === 'completed') return 'text-[#577C09] bg-[#E8F0D0]'
        if (status === 'in_progress') return 'text-amber-700 bg-amber-50'
        if (status === 'cancelled') return 'text-red-700 bg-red-50'
        return 'text-muted-foreground bg-muted'
    }

    const statusLabel = (status) => {
        if (status === 'completed') return 'Completed'
        if (status === 'in_progress') return 'In Progress'
        if (status === 'cancelled') return 'Cancelled'
        return 'Pending'
    }

    const roleLabel = (role) => {
        const labels = {
            caregiver: 'Caregiver',
            nurse_prn: 'Nurse (PRN)',
            nurse_director: 'Nurse (Director)',
            other: 'Other'
        }
        return labels[role] || role;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    return (
        <div>
            <NewCaregiverDialog
                open={showNewDialog}
                onClose={() => setShowNewDialog(false)}
                onCreated={(newCaregiver) => {
                    setShowNewDialog(false)
                    navigate(`/admin/employees/${newCaregiver.id}`)
                }}
            />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Employees</h1>
                    <p className="text-muted-foreground">{totalCount} total employees enrolled</p>
                </div>
                <Button
                    onClick={() => setShowNewDialog(true)}
                    className="bg-[#577C09] hover:bg-[#3D5906] text-white"
                >
                    + New Employee
                </Button>
            </div>

            <div className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
                >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
                >
                    <option value="all">All roles</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="nurse_prn">Nurse (PRN)</option>
                    <option value="nurse_director">Nurse (Director)</option>
                    <option value="other">Other</option>
                </select>
                <div className="relative" ref={skillDropdownRef}>
                    <button
                        onClick={() => setShowSkillDropdown(prev => !prev)}
                        className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm bg-white transition-colors ${skillFilters.length > 0 ? 'border-[#577C09] text-[#577C09]' : 'border-border text-foreground'}`}
                    >
                        Skills
                        {skillFilters.length > 0 && (
                            <span className="bg-[#577C09] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {skillFilters.length}
                            </span>
                        )}
                        <ChevronDown className="w-3 h-3" />
                    </button>

                    {showSkillDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                            <div className="p-3 border-b border-border flex items-center justify-between">
                                <p className="text-xs font-medium text-muted-foreground">Filter by skill</p>
                                {pendingSkills.length > 0 && (
                                    <button
                                        onClick={() => {
                                            setPendingSkills([])
                                            setSkillFilters([])
                                        }}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {SKILL_SECTIONS.map(section => (
                                <div key={section.id} className="p-3 border-b border-border last:border-0">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{section.title}</p>
                                    <div className="space-y-1">
                                        {section.items.map(item => {
                                            const key = `${section.id}__${item}`
                                            const isSelected = pendingSkills.includes(key)
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => {
                                                        setPendingSkills(prev =>
                                                            isSelected
                                                                ? prev.filter(k => k !== key)
                                                                : [...prev, key]
                                                        )
                                                    }}
                                                    className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${isSelected ? 'bg-[#E8F0D0] text-[#577C09]' : 'hover:bg-muted/50'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#577C09] border-[#577C09]' : 'border-muted-foreground'}`}>
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    {item}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            <div className="p-3 border-t border-border sticky bottom-0 bg-white">
                                <button
                                    onClick={() => {
                                        setSkillFilters(pendingSkills)
                                        setShowSkillDropdown(false)
                                        setPage(1)
                                    }}
                                    className="w-full py-2 bg-[#577C09] hover:bg-[#3D5906] text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Apply {pendingSkills.length > 0 ? `(${pendingSkills.length} skills)` : ''}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Employment Type</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</th>

                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Time</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground text-sm">
                                    No caregivers found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((caregiver) => {
                                const progress = caregiver.caregiver_progress?.[0]
                                const timeLog = caregiver.caregiver_time_logs?.[0]
                                const activeSeconds = timeLog?.active_seconds || 0
                                const activeTime = activeSeconds > 0
                                    ? `${Math.floor(activeSeconds / 3600)}h ${Math.floor((activeSeconds % 3600) / 60)}m`
                                    : '—'

                                return (
                                    <tr
                                        key={caregiver.id}
                                        onClick={() => navigate(`/admin/employees/${caregiver.id}`)}
                                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#577C09] flex items-center justify-center text-white text-xs font-medium shrink-0">
                                                    {caregiver.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{caregiver.name}</p>
                                                    <p className="text-xs text-muted-foreground">{caregiver.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm capitalize">{roleLabel(caregiver.role)}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{caregiver.employment_type || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{formatPhone(caregiver.phone) || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {caregiver.start_date ? new Date(caregiver.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{activeTime}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(caregiver.status)}`}>
                                                {statusLabel(caregiver.status)}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                        Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, totalCount)} of {totalCount}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(prev => prev - 1)}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(prev => prev + 1)}
                            disabled={page * PER_PAGE >= totalCount}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}