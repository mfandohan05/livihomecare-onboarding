import { supabase } from '@/lib/supabase'
import { TRACKED_DOCUMENT_TYPES } from '@/lib/documentExpiration'
import { mapChunks } from '@/lib/chunks'

export const PAGE_SIZE = 25
export const MAX_REPORT_EMPLOYEES = 5000

// Matches the API's max_rows (supabase/config.toml). A query returns at most this many rows per request.
const ROWS_PER_REQUEST = 1000
const CHUNK_SIZE = 100
const CONCURRENCY = 3

const EMPLOYEE_COLUMNS = [
    'id', 'name', 'email', 'phone', 'role', 'position_title', 'employment_type', 'start_date',
    'status', 'source', 'pay_rate', 'companion_pay_rate', 'gender', 'employee_id', 'ready_for_payroll',
].join(', ')

const LIST_COLUMNS = 'id, name, email, role, status, source'

export const STATUS_OPTIONS = [
    { value: 'active', label: 'All except cancelled' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'imported', label: 'Imported' },
    { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_FILTERS = {
    active: (query) => query.neq('status', 'cancelled'),
    pending: (query) => query.eq('status', 'pending'),
    in_progress: (query) => query.eq('status', 'in_progress'),
    completed: (query) => query.eq('status', 'completed').neq('source', 'imported'),
    imported: (query) => query.eq('status', 'completed').eq('source', 'imported'),
    cancelled: (query) => query.eq('status', 'cancelled'),
}

const unwrap = ({ data, error }) => {
    if (error) throw new Error(error.message || 'Could not load the data.')
    return data || []
}

const searchTerm = (value) => value.replace(/[,()%*\\]/g, ' ').trim()

function filteredEmployees(companyId, { search = '', status = 'active', role = 'all' }, columns, options) {
    let query = supabase.from('caregivers').select(columns, options).eq('company_id', companyId)

    const term = searchTerm(search)
    if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`)
    query = (STATUS_FILTERS[status] || STATUS_FILTERS.active)(query)
    if (role !== 'all') query = query.eq('role', role)

    return query
}

export async function listEmployees(companyId, filters, page) {
    const from = (page - 1) * PAGE_SIZE
    const { data, count, error } = await filteredEmployees(
        companyId,
        filters,
        LIST_COLUMNS,
        { count: 'exact' }
    )
        .order('name', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(error.message || 'Could not load employees.')
    return { employees: data || [], total: count || 0 }
}

// One page of a fixed list of employees (the "selected only" view), in the order given.
export async function listEmployeesByIds(companyId, ids, page) {
    const from = (page - 1) * PAGE_SIZE
    const pageIds = ids.slice(from, from + PAGE_SIZE)
    if (pageIds.length === 0) return { employees: [], total: ids.length }

    const { data, error } = await supabase
        .from('caregivers')
        .select(LIST_COLUMNS)
        .eq('company_id', companyId)
        .in('id', pageIds)
        .order('name', { ascending: true })

    if (error) throw new Error(error.message || 'Could not load employees.')
    return { employees: data || [], total: ids.length }
}

// Reads every row of a query, one request-sized page at a time. `buildQuery` must return a fresh,
// deterministically ordered query; the loop adds the range. Without this, rows past max_rows are dropped silently.
async function fetchAllRows(buildQuery) {
    const rows = []

    for (let from = 0; ; from += ROWS_PER_REQUEST) {
        const page = unwrap(await buildQuery().range(from, from + ROWS_PER_REQUEST - 1))
        rows.push(...page)
        if (page.length < ROWS_PER_REQUEST) return rows
    }
}

export async function listMatchingIds(companyId, filters) {
    const rows = await fetchAllRows(() =>
        filteredEmployees(companyId, filters, 'id').order('id', { ascending: true })
    )
    return rows.map((row) => row.id)
}

async function loadChunk(companyId, reportId, ids) {
    const caregivers = unwrap(
        await supabase.from('caregivers').select(EMPLOYEE_COLUMNS).eq('company_id', companyId).in('id', ids)
    )

    const needsTimeLogs = reportId !== 'compliance'
    const completedIds = caregivers.filter((c) => c.status === 'completed' && c.source !== 'imported').map((c) => c.id)

    const [timeLogs, personalInfo, documents] = await Promise.all([
        needsTimeLogs && completedIds.length
            ? fetchAllRows(() => supabase.from('caregiver_time_logs').select('caregiver_id, session_end')
                .eq('company_id', companyId).in('caregiver_id', completedIds).not('session_end', 'is', null)
                .order('caregiver_id').order('session_end'))
            : [],
        reportId === 'details'
            ? supabase.from('caregiver_progress').select('caregiver_id, personalInfo:form_data->personalInfo')
                .eq('company_id', companyId).in('caregiver_id', ids).then(unwrap)
            : [],
        reportId === 'compliance'
            ? fetchAllRows(() => supabase.from('caregiver_documents').select('caregiver_id, document_type, expiration_date')
                .eq('company_id', companyId).in('caregiver_id', ids).in('document_type', TRACKED_DOCUMENT_TYPES)
                .order('caregiver_id').order('document_type').order('expiration_date'))
            : [],
    ])

    return { caregivers, timeLogs, personalInfo, documents }
}

export async function loadReportData(companyId, reportId, ids, onProgress) {
    const chunks = await mapChunks([...new Set(ids)], {
        size: CHUNK_SIZE,
        concurrency: CONCURRENCY,
        worker: (chunk) => loadChunk(companyId, reportId, chunk),
        onProgress,
    })

    const data = { caregivers: [], documents: [], timeLogsById: {}, personalInfoById: {} }
    for (const chunk of chunks) {
        data.caregivers.push(...chunk.caregivers)
        data.documents.push(...chunk.documents)
        for (const log of chunk.timeLogs) (data.timeLogsById[log.caregiver_id] ||= []).push(log)
        for (const row of chunk.personalInfo) data.personalInfoById[row.caregiver_id] = row.personalInfo || {}
    }
    return data
}
