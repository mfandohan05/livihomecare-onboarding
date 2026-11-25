import { useEffect, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MAX_REPORT_EMPLOYEES, PAGE_SIZE, STATUS_OPTIONS, listEmployees, listMatchingIds } from '@/lib/reportData'
import { roleName, statusText } from '@/lib/reportFormat'
import { statusColor } from '@/lib/statusStyle'

const SEARCH_DELAY_MS = 300
const FIRST_PAGE = { search: '', status: 'active', role: 'all', page: 1 }

const SELECT_CLASS = 'w-full sm:w-auto border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--primary-color)]'

const queryKey = (companyId, query) => JSON.stringify([companyId, query])
const filtersOf = ({ search, status, role }) => ({ search, status, role })

export default function ReportEmployeePicker({ companyId, roleOptions, selected, onChange }) {
    const [query, setQuery] = useState(FIRST_PAGE)
    const [searchInput, setSearchInput] = useState('')
    const [result, setResult] = useState({ key: null, employees: [], total: 0, error: null })
    const [selectingAll, setSelectingAll] = useState(false)
    const [selectAllError, setSelectAllError] = useState(null)
    const searchTimer = useRef(null)

    useEffect(() => {
        let cancelled = false
        const key = queryKey(companyId, query)

        listEmployees(companyId, filtersOf(query), query.page)
            .then(({ employees, total }) => !cancelled && setResult({ key, employees, total, error: null }))
            .catch((err) => !cancelled && setResult({ key, employees: [], total: 0, error: err.message }))

        return () => { cancelled = true }
    }, [companyId, query])

    useEffect(() => () => clearTimeout(searchTimer.current), [])

    const loading = result.key !== queryKey(companyId, query)
    const { employees, total } = result
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const pageFullySelected = employees.length > 0 && employees.every((e) => selected.has(e.id))

    const updateFilters = (patch) => setQuery((current) => ({ ...current, ...patch, page: 1 }))

    const handleSearch = (value) => {
        setSearchInput(value)
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => updateFilters({ search: value }), SEARCH_DELAY_MS)
    }

    const toggleOne = (id) => {
        const next = new Set(selected)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        onChange(next)
    }

    const togglePage = () => {
        const next = new Set(selected)
        for (const employee of employees) {
            if (pageFullySelected) next.delete(employee.id)
            else next.add(employee.id)
        }
        onChange(next)
    }

    const selectAllMatching = async () => {
        setSelectingAll(true)
        setSelectAllError(null)
        try {
            const ids = await listMatchingIds(companyId, filtersOf(query))
            const next = new Set([...selected, ...ids])
            if (next.size > MAX_REPORT_EMPLOYEES) {
                setSelectAllError(`A report can include at most ${MAX_REPORT_EMPLOYEES.toLocaleString()} employees. Narrow the filters and try again.`)
            } else {
                onChange(next)
            }
        } catch (err) {
            setSelectAllError(err.message)
        } finally {
            setSelectingAll(false)
        }
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchInput}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="pl-9 focus-visible:border-[var(--primary-color)] focus-visible:ring-[var(--primary-color)]/30"
                    />
                </div>
                <select value={query.status} onChange={(e) => updateFilters({ status: e.target.value })} className={SELECT_CLASS}>
                    {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <select value={query.role} onChange={(e) => updateFilters({ role: e.target.value })} className={SELECT_CLASS}>
                    <option value="all">All roles</option>
                    {roleOptions.map((role) => (
                        <option key={role.role_key} value={role.role_key}>{role.display_label}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={pageFullySelected}
                        disabled={employees.length === 0}
                        onChange={togglePage}
                        className="h-4 w-4 accent-[var(--primary-color)]"
                    />
                    Select this page
                </label>
                {total > PAGE_SIZE && (
                    <button
                        type="button"
                        onClick={selectAllMatching}
                        disabled={selectingAll}
                        className="inline-flex items-center gap-1.5 text-[var(--primary-color)] hover:underline disabled:opacity-50"
                    >
                        {selectingAll && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Select all {total.toLocaleString()} matching
                    </button>
                )}
                {selected.size > 0 && (
                    <button type="button" onClick={() => onChange(new Set())} className="text-muted-foreground hover:text-foreground hover:underline">
                        Clear selection
                    </button>
                )}
            </div>

            {selectAllError && <p className="text-sm text-red-500 mb-3">{selectAllError}</p>}

            <div className={`border border-border rounded-lg divide-y ${loading ? 'opacity-60' : ''}`}>
                {result.error ? (
                    <p className="px-4 py-6 text-sm text-red-500">{result.error}</p>
                ) : employees.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground">
                        {loading ? 'Loading...' : 'No employees match these filters.'}
                    </p>
                ) : (
                    employees.map((employee) => (
                        <label key={employee.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30">
                            <input
                                type="checkbox"
                                checked={selected.has(employee.id)}
                                onChange={() => toggleOne(employee.id)}
                                className="h-4 w-4 shrink-0 accent-[var(--primary-color)]"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium truncate">{employee.name}</span>
                                <span className="block text-xs text-muted-foreground truncate">{employee.email}</span>
                            </span>
                            <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[10rem]">
                                {roleName(employee.role, roleOptions)}
                            </span>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor(employee.status, employee.source)}`}>
                                {statusText(employee)}
                            </span>
                        </label>
                    ))
                )}
            </div>

            <div className="flex items-center justify-between gap-3 mt-3 text-sm text-muted-foreground">
                <span>{total.toLocaleString()} employee{total === 1 ? '' : 's'}</span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={query.page <= 1 || loading}
                        onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}
                    >
                        Previous
                    </Button>
                    <span>Page {query.page} of {pageCount}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={query.page >= pageCount || loading}
                        onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
